import { StorageAdapter, DatabaseSchema, BackupInfo, StorageConfig } from './types';
import { validateSchema, validateChecksum, updateChecksum, formatTimestampForFilename } from './storage-utils';

const DB_NAME = 'studioflow-db';
const DB_VERSION = 1;
const STORE_NAME = 'data';
const BACKUP_STORE_NAME = 'backups';

/**
 * Adaptador de armazenamento usando IndexedDB (Browser)
 */
export class BrowserStorage implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private config: Required<StorageConfig>;
  private saveQueue: DatabaseSchema[] = [];
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: StorageConfig = {}) {
    this.config = {
      debounceMs: config.debounceMs ?? 500,
      maxBackups: config.maxBackups ?? 10,
      backupRetentionDays: config.backupRetentionDays ?? 30,
      enableCompression: config.enableCompression ?? false
    };
  }

  /**
   * Abre conexão com IndexedDB
   */
  private async openDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store principal de dados
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('version', 'version', { unique: false });
        }

        // Store de backups
        if (!db.objectStoreNames.contains(BACKUP_STORE_NAME)) {
          const backupStore = db.createObjectStore(BACKUP_STORE_NAME, { keyPath: 'id' });
          backupStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Salva dados com debounce
   */
  async save(data: DatabaseSchema): Promise<void> {
    // Adiciona à fila
    this.saveQueue.push(data);

    // Limpa timeout anterior
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    // Agenda salvamento após debounce
    return new Promise((resolve, reject) => {
      this.saveTimeout = setTimeout(async () => {
        try {
          const latestData = this.saveQueue[this.saveQueue.length - 1];
          this.saveQueue = [];
          
          // Atualiza checksum antes de salvar
          const dataWithChecksum = await updateChecksum({
            ...latestData,
            metadata: {
              ...latestData.metadata,
              lastSync: new Date().toISOString()
            }
          });

          await this.saveImmediate(dataWithChecksum);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, this.config.debounceMs);
    });
  }

  /**
   * Salva dados imediatamente (sem debounce)
   */
  private async saveImmediate(data: DatabaseSchema): Promise<void> {
    const db = await this.openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({ id: 'main', ...data });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Carrega dados do IndexedDB
   */
  async load(): Promise<DatabaseSchema | null> {
    try {
      const db = await this.openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get('main');

        request.onsuccess = async () => {
          const result = request.result;
          
          if (!result) {
            resolve(null);
            return;
          }

          // Remove o campo 'id' que foi adicionado para o IndexedDB
          const { id, ...data } = result;

          // Valida schema
          if (!validateSchema(data)) {
            reject(new Error('Schema inválido'));
            return;
          }

          // Valida checksum
          const isValid = await validateChecksum(data);
          if (!isValid) {
            console.warn('Checksum inválido, tentando restaurar backup...');
            // Tenta restaurar do backup mais recente
            const restored = await this.tryRestoreFromBackup();
            resolve(restored);
            return;
          }

          resolve(data);
        };

        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      return null;
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
        await this.restoreBackup(backup.id);
        const restored = await this.load();
        if (restored) return restored;
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
    const backup: DatabaseSchema & { id: string; timestamp: string } = {
      ...data,
      id: backupId,
      metadata: {
        ...data.metadata,
        lastBackup: new Date().toISOString()
      }
    };

    const db = await this.openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BACKUP_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(BACKUP_STORE_NAME);
      
      const request = store.put({
        ...backup,
        timestamp: new Date().toISOString()
      });

      request.onsuccess = async () => {
        // Limpa backups antigos
        await this.cleanOldBackups();
        resolve(backupId);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Restaura dados de um backup
   */
  async restoreBackup(backupId: string): Promise<void> {
    const db = await this.openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BACKUP_STORE_NAME], 'readonly');
      const store = transaction.objectStore(BACKUP_STORE_NAME);
      const request = store.get(backupId);

      request.onsuccess = async () => {
        const backup = request.result;
        if (!backup) {
          reject(new Error(`Backup ${backupId} não encontrado`));
          return;
        }

        const { id, timestamp, ...data } = backup;

        if (!validateSchema(data)) {
          reject(new Error('Schema do backup inválido'));
          return;
        }

        // Salva como dados principais
        await this.saveImmediate(data);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Lista todos os backups
   */
  async listBackups(): Promise<BackupInfo[]> {
    const db = await this.openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([BACKUP_STORE_NAME], 'readonly');
      const store = transaction.objectStore(BACKUP_STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const backups: BackupInfo[] = request.result.map((backup: any) => ({
          id: backup.id,
          timestamp: backup.timestamp,
          size: JSON.stringify(backup).length,
          checksum: backup.metadata?.checksum || ''
        }));
        resolve(backups);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove backups antigos
   */
  private async cleanOldBackups(): Promise<void> {
    const backups = await this.listBackups();
    
    // Ordena por timestamp (mais antigo primeiro)
    backups.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.backupRetentionDays);

    const db = await this.openDB();
    const transaction = db.transaction([BACKUP_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(BACKUP_STORE_NAME);

    // Remove backups antigos ou excedentes
    let removed = 0;
    for (let i = 0; i < backups.length; i++) {
      const backup = backups[i];
      const backupDate = new Date(backup.timestamp);
      
      if (
        backupDate < cutoffDate || 
        (i < backups.length - this.config.maxBackups)
      ) {
        store.delete(backup.id);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`Removidos ${removed} backups antigos`);
    }
  }

  /**
   * Limpa todos os dados
   */
  async clear(): Promise<void> {
    const db = await this.openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME, BACKUP_STORE_NAME], 'readwrite');
      
      const dataStore = transaction.objectStore(STORE_NAME);
      const backupStore = transaction.objectStore(BACKUP_STORE_NAME);
      
      const dataRequest = dataStore.clear();
      const backupRequest = backupStore.clear();

      let completed = 0;
      const checkComplete = () => {
        completed++;
        if (completed === 2) resolve();
      };

      dataRequest.onsuccess = checkComplete;
      backupRequest.onsuccess = checkComplete;
      dataRequest.onerror = () => reject(dataRequest.error);
      backupRequest.onerror = () => reject(backupRequest.error);
    });
  }

  /**
   * Retorna o tamanho aproximado dos dados
   */
  async getSize(): Promise<number> {
    const data = await this.load();
    if (!data) return 0;
    return JSON.stringify(data).length;
  }

  /**
   * Força salvamento imediato (útil ao fechar aplicação)
   */
  async flush(): Promise<void> {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    if (this.saveQueue.length > 0) {
      const latestData = this.saveQueue[this.saveQueue.length - 1];
      this.saveQueue = [];
      
      const dataWithChecksum = await updateChecksum({
        ...latestData,
        metadata: {
          ...latestData.metadata,
          lastSync: new Date().toISOString()
        }
      });

      await this.saveImmediate(dataWithChecksum);
    }
  }
}
