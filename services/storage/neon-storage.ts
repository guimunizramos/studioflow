import { StorageAdapter, DatabaseSchema, BackupInfo, StorageConfig } from './types';

/**
 * Adaptador de armazenamento que fala com o Postgres (Neon) via
 * as rotas serverless em /api/data e /api/backups.
 */
export class NeonStorage implements StorageAdapter {
  private config: Required<Pick<StorageConfig, 'debounceMs'>>;
  private saveQueue: DatabaseSchema[] = [];
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(config: StorageConfig = {}) {
    this.config = {
      debounceMs: config.debounceMs ?? 500,
    };
  }

  async save(data: DatabaseSchema): Promise<void> {
    this.saveQueue.push(data);

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    return new Promise((resolve, reject) => {
      this.saveTimeout = setTimeout(() => {
        this.flush().then(resolve).catch(reject);
      }, this.config.debounceMs);
    });
  }

  private async saveImmediate(data: DatabaseSchema): Promise<void> {
    const response = await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Falha ao salvar dados: ${response.status}`);
    }
  }

  async load(): Promise<DatabaseSchema | null> {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`Falha ao carregar dados: ${response.status}`);
    }
    const data = await response.json();
    return data ?? null;
  }

  async createBackup(): Promise<string> {
    const response = await fetch('/api/backups', { method: 'POST' });
    if (!response.ok) {
      throw new Error(`Falha ao criar backup: ${response.status}`);
    }
    const { id } = await response.json();
    return id;
  }

  async restoreBackup(backupId: string): Promise<void> {
    const response = await fetch(`/api/backups?restore=${encodeURIComponent(backupId)}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error(`Falha ao restaurar backup: ${response.status}`);
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    const response = await fetch('/api/backups');
    if (!response.ok) {
      throw new Error(`Falha ao listar backups: ${response.status}`);
    }
    return response.json();
  }

  async clear(): Promise<void> {
    const response = await fetch('/api/data', { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`Falha ao limpar dados: ${response.status}`);
    }
  }

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
      await this.saveImmediate(latestData);
    }
  }
}
