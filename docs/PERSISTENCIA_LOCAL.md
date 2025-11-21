# Estratégia de Persistência Local - StudioFlow

## 📋 Visão Geral

Este documento descreve a estratégia completa de persistência de dados local para o StudioFlow, garantindo segurança, organização, performance e integridade dos dados.

## 🎯 Decisões de Arquitetura

### Escolha da Tecnologia: **IndexedDB (Browser) + JSON Files (Node.js)**

**Para aplicações web (browser):**
- **IndexedDB**: Banco de dados NoSQL assíncrono nativo do browser
  - ✅ Suporta grandes volumes de dados (GBs)
  - ✅ Transações ACID para integridade
  - ✅ Queries indexadas para performance
  - ✅ Assíncrono por natureza
  - ✅ Não bloqueia a UI thread

**Para aplicações Node.js (desktop/backend):**
- **Arquivos JSON com estratégias de segurança**:
  - ✅ Simplicidade e portabilidade
  - ✅ Fácil backup e versionamento
  - ✅ Legível por humanos
  - ✅ Sem dependências externas

### Por que não SQLite?
- SQLite requer dependências nativas (better-sqlite3) que complicam builds
- Para dados estruturados simples, JSON + IndexedDB é suficiente
- Melhor integração com aplicações web modernas

### Por que não LowDB?
- LowDB usa arquivos JSON simples sem proteção contra corrupção
- Não oferece transações reais
- Performance limitada para grandes volumes

## 🏗️ Estrutura de Dados

### Schema do Banco de Dados

```typescript
interface DatabaseSchema {
  version: number;           // Versão do schema para migrações
  clients: Client[];         // Coleção de clientes
  projects: Project[];       // Coleção de projetos
  tasks: Task[];             // Coleção de tarefas
  config: AppConfig;         // Configurações da aplicação
  metadata: {
    lastSync: string;        // Última sincronização
    lastBackup: string;      // Último backup
    checksum: string;        // Hash para verificação de integridade
  };
}
```

### Organização de Arquivos (Node.js)

```
data/
├── studioflow.db.json          # Arquivo principal de dados
├── backups/
│   ├── studioflow-2024-01-15-10-30-00.json
│   ├── studioflow-2024-01-15-14-45-00.json
│   └── ...
└── temp/
    └── studioflow-write-temp.json  # Arquivo temporário para escrita atômica
```

## 🔒 Estratégias de Segurança e Integridade

### 1. Escrita Atômica (Write-Ahead Logging)

**Problema**: Se a aplicação crashar durante uma escrita, o arquivo pode ficar corrompido.

**Solução**: Padrão "Write-Ahead Logging" (WAL):

```
1. Escrever dados em arquivo temporário (.tmp)
2. Validar integridade do arquivo temporário
3. Fazer backup do arquivo atual
4. Renomear arquivo temporário para arquivo principal (operação atômica no filesystem)
5. Remover backup antigo (após sucesso)
```

### 2. Validação de Schema

- Validar estrutura dos dados antes de salvar
- Usar TypeScript types + runtime validation (Zod)
- Rejeitar dados inválidos e manter versão anterior

### 3. Checksums e Verificação de Integridade

- Calcular hash (SHA-256) dos dados antes de salvar
- Armazenar checksum junto com os dados
- Verificar checksum ao carregar dados
- Se checksum inválido, restaurar do backup mais recente

### 4. Transações e Isolamento

**IndexedDB (Browser):**
- Usar transações para operações múltiplas
- Modo `readwrite` para escritas
- Modo `readonly` para leituras

**Node.js (JSON):**
- Usar file locking (opcional, via biblioteca)
- Fila de operações para evitar concorrência
- Debounce para múltiplas escritas rápidas

## ⚡ Estratégias de Performance

### 1. Debouncing de Escritas

**Problema**: Múltiplas atualizações rápidas causam muitas escritas em disco.

**Solução**: Debounce de 500ms
- Acumular mudanças em memória
- Salvar apenas após 500ms de inatividade
- Salvar imediatamente ao fechar aplicação

### 2. Lazy Loading

- Carregar apenas dados necessários inicialmente
- Carregar tarefas por período (ex: últimos 30 dias)
- Carregar projetos e clientes sob demanda

### 3. Indexação (IndexedDB)

- Índices em campos frequentemente consultados:
  - `tasks.deadline` → para queries por data
  - `tasks.clientId` → para filtrar por cliente
  - `tasks.status` → para filtrar por status
  - `projects.clientId` → para relacionamentos

### 4. Compressão (Opcional)

- Comprimir dados grandes antes de salvar
- Usar gzip para backups
- Descomprimir ao carregar

## 🔄 Tratamento de Concorrência

### Browser (IndexedDB)
- IndexedDB gerencia concorrência automaticamente
- Transações isoladas por padrão
- Versionamento do schema para migrações

### Node.js (JSON Files)

**Estratégia: Fila de Operações**

```typescript
class WriteQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;

  async enqueue(operation: () => Promise<void>) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await operation();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    
    while (this.queue.length > 0) {
      const operation = this.queue.shift();
      if (operation) await operation();
    }
    
    this.processing = false;
  }
}
```

## 🛡️ Tratamento de Erros

### Cenários de Erro e Recuperação

1. **Arquivo corrompido**
   - Detectar checksum inválido
   - Tentar restaurar do backup mais recente
   - Se backup também corrompido, restaurar backup anterior
   - Se todos corrompidos, inicializar com dados padrão

2. **Permissões insuficientes**
   - Verificar permissões antes de escrever
   - Mostrar erro claro ao usuário
   - Sugerir local alternativo (se possível)

3. **Espaço em disco insuficiente**
   - Verificar espaço antes de escrever
   - Limpar backups antigos automaticamente
   - Manter apenas últimos N backups

4. **Falha durante escrita**
   - Rollback para versão anterior
   - Log do erro para diagnóstico
   - Notificar usuário (opcional)

### Código de Recuperação

```typescript
async function loadDataWithRecovery(): Promise<DatabaseSchema> {
  try {
    const data = await loadData();
    if (validateChecksum(data)) {
      return data;
    }
    throw new Error('Checksum inválido');
  } catch (error) {
    console.warn('Erro ao carregar dados, tentando backup...', error);
    
    const backups = await listBackups();
    for (const backup of backups.sort().reverse()) {
      try {
        const backupData = await loadBackup(backup);
        if (validateChecksum(backupData)) {
          await restoreFromBackup(backup);
          return backupData;
        }
      } catch (e) {
        continue; // Tentar próximo backup
      }
    }
    
    // Se todos os backups falharam, inicializar com dados padrão
    return getDefaultData();
  }
}
```

## 💾 Sistema de Backup

### Backup Automático

- **Frequência**: A cada salvamento bem-sucedido
- **Retenção**: Manter últimos 10 backups
- **Limpeza**: Remover backups com mais de 30 dias
- **Compressão**: Comprimir backups antigos (opcional)

### Backup Manual

- Permitir backup manual via UI
- Exportar para JSON (download)
- Importar de JSON (upload)

### Estrutura de Backup

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": 1,
  "data": { /* DatabaseSchema */ },
  "checksum": "sha256:abc123...",
  "metadata": {
    "appVersion": "1.0.0",
    "recordCount": {
      "clients": 4,
      "projects": 3,
      "tasks": 15
    }
  }
}
```

## 📦 Implementação no Projeto

### Estrutura de Arquivos

```
services/
├── storage/
│   ├── index.ts                 # Interface unificada
│   ├── browser-storage.ts       # Implementação IndexedDB
│   ├── node-storage.ts          # Implementação JSON files
│   ├── storage-utils.ts         # Utilitários compartilhados
│   └── types.ts                 # Tipos e interfaces
├── dataContext.tsx              # Context atualizado
└── ...
```

### Interface Unificada

```typescript
interface StorageAdapter {
  // Operações CRUD
  save(data: DatabaseSchema): Promise<void>;
  load(): Promise<DatabaseSchema>;
  
  // Backup
  createBackup(): Promise<string>;
  restoreBackup(backupId: string): Promise<void>;
  listBackups(): Promise<BackupInfo[]>;
  
  // Utilitários
  clear(): Promise<void>;
  getSize(): Promise<number>;
}
```

### Integração com DataContext

1. **Carregar dados na inicialização**
2. **Salvar automaticamente após mudanças** (com debounce)
3. **Salvar ao fechar aplicação** (beforeunload)
4. **Mostrar indicador de salvamento** na UI

## ✅ Boas Práticas Implementadas

1. ✅ **Escrita atômica** - Evita corrupção parcial
2. ✅ **Validação de schema** - Garante integridade estrutural
3. ✅ **Checksums** - Detecta corrupção
4. ✅ **Backups automáticos** - Recuperação em caso de falha
5. ✅ **Debouncing** - Performance otimizada
6. ✅ **Fila de operações** - Evita race conditions
7. ✅ **Tratamento robusto de erros** - Recuperação automática
8. ✅ **Logging** - Diagnóstico de problemas
9. ✅ **Versionamento de schema** - Migrações futuras
10. ✅ **Limpeza automática** - Gerencia espaço em disco

## 🚀 Próximos Passos

1. Implementar migrações de schema
2. Adicionar sincronização com servidor (opcional)
3. Implementar compressão de backups
4. Adicionar métricas de performance
5. Criar ferramenta de diagnóstico de dados
