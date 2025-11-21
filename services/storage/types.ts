import { Client, Project, Task, AppConfig } from '../../types';

/**
 * Schema completo do banco de dados local
 */
export interface DatabaseSchema {
  version: number;
  clients: Client[];
  projects: Project[];
  tasks: Task[];
  config: AppConfig;
  metadata: {
    lastSync: string;
    lastBackup: string;
    checksum: string;
  };
}

/**
 * Informações sobre um backup
 */
export interface BackupInfo {
  id: string;
  timestamp: string;
  size: number;
  checksum: string;
}

/**
 * Interface unificada para adaptadores de armazenamento
 */
export interface StorageAdapter {
  /**
   * Salva os dados no armazenamento
   */
  save(data: DatabaseSchema): Promise<void>;

  /**
   * Carrega os dados do armazenamento
   */
  load(): Promise<DatabaseSchema | null>;

  /**
   * Cria um backup dos dados atuais
   */
  createBackup(): Promise<string>;

  /**
   * Restaura dados de um backup
   */
  restoreBackup(backupId: string): Promise<void>;

  /**
   * Lista todos os backups disponíveis
   */
  listBackups(): Promise<BackupInfo[]>;

  /**
   * Remove todos os dados (limpa o armazenamento)
   */
  clear(): Promise<void>;

  /**
   * Retorna o tamanho aproximado dos dados em bytes
   */
  getSize(): Promise<number>;
}

/**
 * Configurações do sistema de armazenamento
 */
export interface StorageConfig {
  debounceMs?: number;
  maxBackups?: number;
  backupRetentionDays?: number;
  enableCompression?: boolean;
}
