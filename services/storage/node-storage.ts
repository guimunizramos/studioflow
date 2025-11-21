import * as fs from 'fs/promises';
import * as path from 'path';
import { StorageAdapter, DatabaseSchema, BackupInfo, StorageConfig } from './types';
import { 
  validateSchema, 
  validateChecksum, 
  updateChecksum, 
  formatTimestampForFilename 
} from './storage-utils';

/**
 * Adaptador de armazenamento usando arquivos JSON (Node.js)
 * Implementa escrita atômica e proteção contra corrupção
 */
export class NodeStorage implements StorageAdapter {
  private dataDir: string;
  private dataFile: string;
  private backupDir: string;
  private tempDir: string;
  private config: Required<StorageConfig>;
  private writeQueue: Array<() => Promise<void>> = [];
  private isProcessing = false;

  constructor(dataDir: string = './data', config: StorageConfig = {}) {
    this.dataDir = dataDir;
    this.dataFile = path.join(dataDir, 'studioflow.db.json');
    this.backupDir = path.join(dataDir, 'backups');
    this.tempDir = path.join(dataDir, 'temp');
    
    this.config = {
      debounceMs: config.debounceMs ?? 500,
      maxBackups: config.maxBackups ?? 10,
      backupRetentionDays: config.backupRetentionDays ?? 30,
      enableCompression: config.enableCompression ?? false
    };

    // Inicializa diretórios
    this.initializeDirectories();
  }

  /**
   * Inicializa os diretórios necessários
   */
  private async initializeDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretórios:', error);
      throw error;
    }
  }

  /**
   * Adiciona operação à fila de escrita
   */
  private async enqueueWrite(operation: () => Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.writeQueue.push(async () => {
        try {
          await operation();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      this.processQueue();
    });
  }

  /**
   * Processa a fila de escrita sequencialmente
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.writeQueue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.writeQueue.length > 0) {
      const operation = this.writeQueue.shift();
      if (operation) {
        try {
          await operation();
        } catch (error) {
          console.error('Erro ao processar operação da fila:', error);
        }
      }
    }
    
    this.isProcessing = false;
  }

  /**
   * Salva dados com escrita atômica e debounce
   */
  async save(data: DatabaseSchema): Promise<void> {
    return this.enqueueWrite(async () => {
      // Aguarda debounce
      await new Promise(resolve => setTimeout(resolve, this.config.debounceMs));

      // Atualiza checksum
      const dataWithChecksum = await updateChecksum({
        ...data,
        metadata: {
          ...data.metadata,
          lastSync: new Date().toISOString()
        }
      });

      await this.saveAtomic(dataWithChecksum);
    });
  }

  /**
   * Salva dados usando escrita atômica (Write-Ahead Logging)
   */
  private async saveAtomic(data: DatabaseSchema): Promise<void> {
    const tempFile = path.join(this.tempDir, 'studioflow-write-temp.json');
    const backupFile = path.join(
      this.backupDir,
      `studioflow-${formatTimestampForFilename()}.json`
    );

    try {
      // 1. Valida dados antes de escrever
      if (!validateSchema(data)) {
        throw new Error('Dados inválidos: schema não corresponde');
      }

      // 2. Escreve em arquivo temporário
      const jsonString = JSON.stringify(data, null, 2);
      await fs.writeFile(tempFile, jsonString, 'utf-8');

      // 3. Valida integridade do arquivo temporário
      const tempContent = await fs.readFile(tempFile, 'utf-8');
      const tempData = JSON.parse(tempContent);
      if (!validateSchema(tempData)) {
        throw new Error('Arquivo temporário corrompido após escrita');
      }

      // 4. Faz backup do arquivo atual (se existir)
      try {
        const currentData = await fs.readFile(this.dataFile, 'utf-8');
        await fs.writeFile(backupFile, currentData, 'utf-8');
      } catch (error) {
        // Arquivo atual não existe, tudo bem
      }

      // 5. Renomeia arquivo temporário para principal (operação atômica)
      await fs.rename(tempFile, this.dataFile);

      // 6. Limpa backups antigos (assíncrono, não bloqueia)
      this.cleanOldBackups().catch(err => 
        console.warn('Erro ao limpar backups antigos:', err)
      );

    } catch (error) {
      // Em caso de erro, remove arquivo temporário
      try {
        await fs.unlink(tempFile);
      } catch {
        // Ignora erro se arquivo não existir
      }
      throw error;
    }
  }

  /**
   * Carrega dados do arquivo com recuperação automática
   */
  async load(): Promise<DatabaseSchema | null> {
    try {
      // Tenta carregar arquivo principal
      const content = await fs.readFile(this.dataFile, 'utf-8');
      const data: DatabaseSchema = JSON.parse(content);

      // Valida schema
      if (!validateSchema(data)) {
        throw new Error('Schema inválido');
      }

      // Valida checksum
      const isValid = await validateChecksum(data);
      if (!isValid) {
        console.warn('Checksum inválido, tentando restaurar backup...');
        return await this.tryRestoreFromBackup();
      }

      return data;

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // Arquivo não existe, retorna null
        return null;
      }

      // Outro erro, tenta restaurar do backup
      console.warn('Erro ao carregar dados, tentando restaurar backup...', error);
      return await this.tryRestoreFromBackup();
    }
  }

  /**
   * Tenta restaurar dados do backup mais recente
   */
  private async tryRestoreFromBackup(): Promise<DatabaseSchema | null> {
    const backups = await this.listBackups();
    if (backups.length === 0) return null;

    // Ordena por timestamp (mais recente primeiro)
    backups.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    // Tenta restaurar do backup mais recente
    for (const backup of backups) {
      try {
        const backupPath = path.join(this.backupDir, `${backup.id}.json`);
        const content = await fs.readFile(backupPath, 'utf-8');
        const data: DatabaseSchema = JSON.parse(content);

        if (!validateSchema(data)) continue;

        const isValid = await validateChecksum(data);
        if (isValid) {
          // Restaura o backup
          await fs.writeFile(this.dataFile, content, 'utf-8');
          return data;
        }
      } catch (error) {
        console.warn(`Falha ao restaurar backup ${backup.id}:`, error);
        continue;
      }
    }

    return null;
  }

  /**
   * Cria um backup dos dados atuais
   */
  async createBackup(): Promise<string> {
    const data = await this.load();
    if (!data) {
      throw new Error('Nenhum dado para fazer backup');
    }

    const backupId = `backup-${formatTimestampForFilename()}`;
    const backupFile = path.join(this.backupDir, `${backupId}.json`);

    const backupData: DatabaseSchema = {
      ...data,
      metadata: {
        ...data.metadata,
        lastBackup: new Date().toISOString()
      }
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    await fs.writeFile(backupFile, jsonString, 'utf-8');

    // Limpa backups antigos
    await this.cleanOldBackups();

    return backupId;
  }

  /**
   * Restaura dados de um backup
   */
  async restoreBackup(backupId: string): Promise<void> {
    const backupFile = path.join(this.backupDir, `${backupId}.json`);
    
    try {
      const content = await fs.readFile(backupFile, 'utf-8');
      const data: DatabaseSchema = JSON.parse(content);

      if (!validateSchema(data)) {
        throw new Error('Schema do backup inválido');
      }

      // Salva como arquivo principal usando escrita atômica
      await this.saveAtomic(data);

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Backup ${backupId} não encontrado`);
      }
      throw error;
    }
  }

  /**
   * Lista todos os backups disponíveis
   */
  async listBackups(): Promise<BackupInfo[]> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups: BackupInfo[] = [];

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);

          backups.push({
            id: file.replace('.json', ''),
            timestamp: data.metadata?.lastBackup || stats.mtime.toISOString(),
            size: stats.size,
            checksum: data.metadata?.checksum || ''
          });
        } catch (error) {
          console.warn(`Erro ao ler backup ${file}:`, error);
          continue;
        }
      }

      return backups;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Remove backups antigos
   */
  private async cleanOldBackups(): Promise<void> {
    try {
      const backups = await this.listBackups();
      
      // Ordena por timestamp (mais antigo primeiro)
      backups.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.backupRetentionDays);

      let removed = 0;
      for (let i = 0; i < backups.length; i++) {
        const backup = backups[i];
        const backupDate = new Date(backup.timestamp);
        
        if (
          backupDate < cutoffDate || 
          (i < backups.length - this.config.maxBackups)
        ) {
          const backupFile = path.join(this.backupDir, `${backup.id}.json`);
          await fs.unlink(backupFile);
          removed++;
        }
      }

      if (removed > 0) {
        console.log(`Removidos ${removed} backups antigos`);
      }
    } catch (error) {
      console.warn('Erro ao limpar backups antigos:', error);
    }
  }

  /**
   * Limpa todos os dados
   */
  async clear(): Promise<void> {
    try {
      // Remove arquivo principal
      try {
        await fs.unlink(this.dataFile);
      } catch (error: any) {
        if (error.code !== 'ENOENT') throw error;
      }

      // Remove todos os backups
      const backups = await this.listBackups();
      for (const backup of backups) {
        const backupFile = path.join(this.backupDir, `${backup.id}.json`);
        await fs.unlink(backupFile);
      }
    } catch (error) {
      console.error('Erro ao limpar dados:', error);
      throw error;
    }
  }

  /**
   * Retorna o tamanho aproximado dos dados em bytes
   */
  async getSize(): Promise<number> {
    try {
      const stats = await fs.stat(this.dataFile);
      return stats.size;
    } catch (error: any) {
      if (error.code === 'ENOENT') return 0;
      throw error;
    }
  }

  /**
   * Força salvamento imediato (útil ao fechar aplicação)
   */
  async flush(): Promise<void> {
    // Processa todas as operações pendentes
    while (this.writeQueue.length > 0) {
      await this.processQueue();
    }
  }
}
