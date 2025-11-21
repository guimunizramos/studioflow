import { StorageAdapter, StorageConfig } from './types';
import { BrowserStorage } from './browser-storage';

/**
 * Detecta o ambiente e retorna o adaptador apropriado
 */
export async function createStorageAdapter(config?: StorageConfig): Promise<StorageAdapter> {
  // Detecta se está rodando no browser ou Node.js
  if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
    // Browser - usa IndexedDB
    return new BrowserStorage(config);
  } else if (typeof process !== 'undefined' && process.versions?.node) {
    // Node.js - usa arquivos JSON (importação dinâmica para evitar problemas no browser)
    try {
      const { NodeStorage } = await import('./node-storage');
      const dataDir = process.env.STUDIOFLOW_DATA_DIR || './data';
      return new NodeStorage(dataDir, config);
    } catch (error) {
      console.warn('Erro ao carregar NodeStorage, usando BrowserStorage como fallback:', error);
      return new BrowserStorage(config);
    }
  } else {
    // Fallback para browser
    return new BrowserStorage(config);
  }
}

/**
 * Versão síncrona que retorna BrowserStorage no browser (mais comum)
 */
export function createStorageAdapterSync(config?: StorageConfig): StorageAdapter {
  if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
    return new BrowserStorage(config);
  }
  // Para Node.js, use createStorageAdapter() assíncrono
  throw new Error('Para Node.js, use createStorageAdapter() assíncrono');
}

/**
 * Instância singleton do adaptador de armazenamento
 */
let storageInstance: StorageAdapter | null = null;
let storagePromise: Promise<StorageAdapter> | null = null;

/**
 * Obtém ou cria a instância do adaptador de armazenamento
 * No browser, retorna imediatamente. No Node.js, pode ser assíncrono.
 */
export function getStorageAdapter(config?: StorageConfig): StorageAdapter {
  if (!storageInstance) {
    // No browser, cria síncrono
    if (typeof window !== 'undefined' && typeof indexedDB !== 'undefined') {
      storageInstance = new BrowserStorage(config);
    } else {
      // No Node.js, precisa ser assíncrono, mas para compatibilidade
      // retornamos uma instância que será inicializada na primeira chamada
      throw new Error('Para Node.js, use getStorageAdapterAsync() ou aguarde a inicialização');
    }
  }
  return storageInstance;
}

/**
 * Versão assíncrona para Node.js
 */
export async function getStorageAdapterAsync(config?: StorageConfig): Promise<StorageAdapter> {
  if (storageInstance) {
    return storageInstance;
  }
  
  if (!storagePromise) {
    storagePromise = createStorageAdapter(config);
    storageInstance = await storagePromise;
  }
  
  return storageInstance;
}

// Exporta tipos e classes
export * from './types';
export { BrowserStorage } from './browser-storage';
// NodeStorage exportado condicionalmente (apenas Node.js)
export * from './storage-utils';
