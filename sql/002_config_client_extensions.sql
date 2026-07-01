-- 002: identidade da agência, intervalos bloqueados, tipo de contrato e
-- janelas de trabalho preferenciais por cliente. Aditivo, seguro de rodar
-- contra o banco em produção (ALTER TABLE ... IF NOT EXISTS).

ALTER TABLE app_config ADD COLUMN IF NOT EXISTS agency_name TEXT NOT NULL DEFAULT 'StudioFlow';
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS user_name TEXT NOT NULL DEFAULT '';
ALTER TABLE app_config ADD COLUMN IF NOT EXISTS breaks JSONB NOT NULL DEFAULT '[]';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS contract_type TEXT NOT NULL DEFAULT 'Recorrente';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS work_blocks JSONB NOT NULL DEFAULT '[]';
