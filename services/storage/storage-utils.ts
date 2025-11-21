import { DatabaseSchema } from './types';

/**
 * Calcula o checksum SHA-256 dos dados
 */
export async function calculateChecksum(data: DatabaseSchema): Promise<string> {
  const jsonString = JSON.stringify(data);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(jsonString);
  
  // Usar Web Crypto API se disponível (browser)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('Erro ao calcular hash com crypto.subtle, usando fallback:', error);
      // Fallback para hash simples
    }
  }
  
  // Fallback: hash simples mas determinístico
  // Este é um hash simples mas suficiente para detectar mudanças
  let hash = 0;
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Retorna hash de 64 caracteres para consistência
  const hashStr = Math.abs(hash).toString(16);
  return hashStr.padStart(64, '0').substring(0, 64);
}

/**
 * Valida o checksum dos dados
 */
export async function validateChecksum(data: DatabaseSchema): Promise<boolean> {
  const storedChecksum = data.metadata.checksum;
  const calculatedChecksum = await calculateChecksum({
    ...data,
    metadata: {
      ...data.metadata,
      checksum: '' // Remover checksum antes de calcular
    }
  });
  return storedChecksum === calculatedChecksum;
}

/**
 * Atualiza o checksum nos dados
 */
export async function updateChecksum(data: Omit<DatabaseSchema, 'metadata'> & { metadata: Omit<DatabaseSchema['metadata'], 'checksum'> }): Promise<DatabaseSchema> {
  const dataWithoutChecksum: DatabaseSchema = {
    ...data,
    metadata: {
      ...data.metadata,
      checksum: ''
    }
  };
  const checksum = await calculateChecksum(dataWithoutChecksum);
  return {
    ...dataWithoutChecksum,
    metadata: {
      ...dataWithoutChecksum.metadata,
      checksum
    }
  };
}

/**
 * Valida a estrutura básica dos dados
 */
export function validateSchema(data: any): data is DatabaseSchema {
  if (!data || typeof data !== 'object') return false;
  if (typeof data.version !== 'number') return false;
  if (!Array.isArray(data.clients)) return false;
  if (!Array.isArray(data.projects)) return false;
  if (!Array.isArray(data.tasks)) return false;
  if (!data.config || typeof data.config !== 'object') return false;
  if (!data.metadata || typeof data.metadata !== 'object') return false;
  return true;
}

/**
 * Cria um schema vazio com valores padrão
 */
export function createEmptySchema(): Omit<DatabaseSchema, 'metadata'> {
  return {
    version: 1,
    clients: [],
    projects: [],
    tasks: [],
    config: {
      totalHoursPerDay: 8,
      workWindowStart: '09:00',
      workWindowEnd: '18:00',
      notes: '',
      unavailableDays: [],
      visual: {
        themeMode: 'light',
        primaryColor: '#2563eb',
        density: 'comfortable',
        sidebarColor: '#111827'
      }
    }
  };
}

/**
 * Formata timestamp para nome de arquivo
 */
export function formatTimestampForFilename(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

/**
 * Debounce helper para operações de escrita
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
