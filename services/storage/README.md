# Sistema de Armazenamento Local - StudioFlow

## Visão Geral

Sistema robusto de persistência local que funciona tanto no browser (IndexedDB) quanto em Node.js (arquivos JSON), com proteção contra corrupção de dados, backups automáticos e recuperação de erros.

## Características

- ✅ **Escrita Atômica**: Proteção contra corrupção durante escritas
- ✅ **Validação de Integridade**: Checksums SHA-256 para verificação
- ✅ **Backups Automáticos**: Criação e limpeza automática de backups
- ✅ **Recuperação Automática**: Restauração de backups em caso de corrupção
- ✅ **Debouncing**: Otimização de performance com salvamento inteligente
- ✅ **Fila de Operações**: Prevenção de race conditions
- ✅ **Multi-ambiente**: Funciona no browser e Node.js automaticamente

## Uso Básico

```typescript
import { getStorageAdapter } from './services/storage';

// Obtém o adaptador apropriado para o ambiente
const storage = getStorageAdapter();

// Carregar dados
const data = await storage.load();

// Salvar dados
await storage.save(data);

// Criar backup manual
const backupId = await storage.createBackup();

// Restaurar backup
await storage.restoreBackup(backupId);

// Listar backups
const backups = await storage.listBackups();
```

## Integração com DataContext

O sistema já está integrado com o `DataContext` e funciona automaticamente:

1. **Carregamento**: Dados são carregados automaticamente na inicialização
2. **Salvamento**: Dados são salvos automaticamente após cada mudança (com debounce)
3. **Backup**: Backups são criados automaticamente antes de cada salvamento
4. **Recuperação**: Em caso de corrupção, o sistema tenta restaurar automaticamente

## Estrutura de Dados

```typescript
interface DatabaseSchema {
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
```

## Configuração

```typescript
import { getStorageAdapter } from './services/storage';

const storage = getStorageAdapter({
  debounceMs: 500,              // Tempo de debounce em ms
  maxBackups: 10,               // Número máximo de backups
  backupRetentionDays: 30,      // Dias para manter backups
  enableCompression: false      // Compressão (futuro)
});
```

## Browser (IndexedDB)

No browser, os dados são armazenados no IndexedDB:
- **Database**: `studioflow-db`
- **Store Principal**: `data`
- **Store de Backups**: `backups`

Você pode inspecionar os dados usando as DevTools do navegador:
1. Abra DevTools (F12)
2. Vá para a aba "Application" (Chrome) ou "Storage" (Firefox)
3. Expanda "IndexedDB" → "studioflow-db"

## Node.js (Arquivos JSON)

No Node.js, os dados são armazenados em arquivos:
```
data/
├── studioflow.db.json          # Arquivo principal
├── backups/
│   ├── backup-2024-01-15-10-30-00.json
│   └── ...
└── temp/
    └── studioflow-write-temp.json
```

Configure o diretório usando a variável de ambiente:
```bash
export STUDIOFLOW_DATA_DIR=/path/to/data
```

## Tratamento de Erros

O sistema trata automaticamente os seguintes cenários:

1. **Arquivo corrompido**: Restaura do backup mais recente
2. **Checksum inválido**: Valida e restaura se necessário
3. **Permissões insuficientes**: Loga erro e mantém dados em memória
4. **Espaço insuficiente**: Limpa backups antigos automaticamente

## Backup e Restauração Manual

### Criar Backup

```typescript
const backupId = await storage.createBackup();
console.log(`Backup criado: ${backupId}`);
```

### Listar Backups

```typescript
const backups = await storage.listBackups();
backups.forEach(backup => {
  console.log(`${backup.id} - ${backup.timestamp} - ${backup.size} bytes`);
});
```

### Restaurar Backup

```typescript
await storage.restoreBackup('backup-2024-01-15-10-30-00');
```

### Exportar Dados (JSON)

```typescript
const data = await storage.load();
const jsonString = JSON.stringify(data, null, 2);
// Salvar ou fazer download do jsonString
```

### Importar Dados (JSON)

```typescript
const jsonString = '...'; // JSON importado
const data = JSON.parse(jsonString);
await storage.save(data);
```

## Performance

- **Debouncing**: Múltiplas mudanças rápidas são agrupadas em uma única escrita
- **Lazy Loading**: Dados são carregados apenas quando necessário
- **Indexação**: IndexedDB usa índices para queries rápidas
- **Fila de Operações**: Operações são serializadas para evitar conflitos

## Limitações

- **Tamanho**: IndexedDB suporta até vários GBs, mas recomenda-se manter dados < 100MB
- **Concorrência**: Múltiplas abas podem causar conflitos (futuro: sincronização)
- **Backup**: Backups são locais apenas (futuro: backup em nuvem)

## Troubleshooting

### Dados não estão sendo salvos

1. Verifique o console para erros
2. Verifique permissões do IndexedDB (browser)
3. Verifique permissões de escrita (Node.js)

### Dados corrompidos

1. O sistema tenta restaurar automaticamente
2. Se falhar, restaure manualmente de um backup
3. Se todos os backups falharem, os dados serão reinicializados

### Performance lenta

1. Verifique o tamanho dos dados (`storage.getSize()`)
2. Limpe backups antigos manualmente
3. Considere aumentar o debounce time

## Próximos Passos

- [ ] Migrações de schema
- [ ] Sincronização entre abas (BroadcastChannel)
- [ ] Compressão de backups
- [ ] Backup em nuvem
- [ ] Métricas de performance
- [ ] Ferramenta de diagnóstico
