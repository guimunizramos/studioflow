import { neon } from '@neondatabase/serverless';
import type { Client, Project, Task, AppConfig } from '../../types';
import type { DatabaseSchema, BackupInfo } from '../../services/storage/types';

export const sql = neon(process.env.DATABASE_URL!);

function rowToClient(r: any): Client {
  return {
    id: r.id,
    name: r.name,
    brand: r.brand,
    category: r.category,
    color: r.color,
    weeklyHours: Number(r.weekly_hours),
    minDailyHours: Number(r.min_daily_hours),
    priority: r.priority,
    observations: r.observations,
  };
}

function rowToProject(r: any): Project {
  return {
    id: r.id,
    name: r.name,
    clientId: r.client_id,
    status: r.status,
    type: r.type,
    startDate: r.start_date,
    estimatedDeadline: r.estimated_deadline,
    description: r.description,
  };
}

function rowToTask(r: any): Task {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    clientId: r.client_id,
    projectId: r.project_id,
    status: r.status,
    type: r.type,
    priority: r.priority,
    estimatedHours: Number(r.estimated_hours),
    deadline: r.deadline,
    startTime: r.start_time ?? undefined,
    createdAt: r.created_at,
    completedAt: r.completed_at ?? undefined,
    referenceLink: r.reference_link ?? undefined,
    isRecurring: r.is_recurring,
  };
}

function rowToConfig(r: any): AppConfig {
  return {
    totalHoursPerDay: Number(r.total_hours_per_day),
    workWindowStart: r.work_window_start,
    workWindowEnd: r.work_window_end,
    notes: r.notes,
    unavailableDays: r.unavailable_days,
    visual: r.visual,
  };
}

export async function loadSchema(): Promise<DatabaseSchema | null> {
  const [clientRows, projectRows, taskRows, configRows, lastBackupRows] = await Promise.all([
    sql`SELECT * FROM clients ORDER BY name`,
    sql`SELECT * FROM projects ORDER BY name`,
    sql`SELECT * FROM tasks ORDER BY deadline`,
    sql`SELECT * FROM app_config WHERE id = 1`,
    sql`SELECT created_at FROM backups ORDER BY created_at DESC LIMIT 1`,
  ]);

  if (configRows.length === 0) return null;

  return {
    version: 1,
    clients: clientRows.map(rowToClient),
    projects: projectRows.map(rowToProject),
    tasks: taskRows.map(rowToTask),
    config: rowToConfig(configRows[0]),
    metadata: {
      lastSync: new Date().toISOString(),
      lastBackup: lastBackupRows[0]?.created_at ?? '',
      checksum: '',
    },
  };
}

export async function saveSchema(data: DatabaseSchema): Promise<void> {
  const { clients, projects, tasks, config } = data;

  const statements = [
    sql`DELETE FROM tasks`,
    sql`DELETE FROM projects`,
    sql`DELETE FROM clients`,
  ];
  await sql.transaction(statements);

  const inserts: Promise<any>[] = [];

  for (const c of clients) {
    inserts.push(sql`
      INSERT INTO clients (id, name, brand, category, color, weekly_hours, min_daily_hours, priority, observations)
      VALUES (${c.id}, ${c.name}, ${c.brand}, ${c.category}, ${c.color}, ${c.weeklyHours}, ${c.minDailyHours}, ${c.priority}, ${c.observations})
    `);
  }
  for (const p of projects) {
    inserts.push(sql`
      INSERT INTO projects (id, name, client_id, status, type, start_date, estimated_deadline, description)
      VALUES (${p.id}, ${p.name}, ${p.clientId}, ${p.status}, ${p.type}, ${p.startDate}, ${p.estimatedDeadline}, ${p.description})
    `);
  }
  for (const t of tasks) {
    inserts.push(sql`
      INSERT INTO tasks (id, title, description, client_id, project_id, status, type, priority, estimated_hours, deadline, start_time, created_at, completed_at, reference_link, is_recurring)
      VALUES (${t.id}, ${t.title}, ${t.description}, ${t.clientId}, ${t.projectId}, ${t.status}, ${t.type}, ${t.priority}, ${t.estimatedHours}, ${t.deadline}, ${t.startTime ?? null}, ${t.createdAt}, ${t.completedAt ?? null}, ${t.referenceLink ?? null}, ${t.isRecurring})
    `);
  }
  inserts.push(sql`
    INSERT INTO app_config (id, total_hours_per_day, work_window_start, work_window_end, notes, unavailable_days, visual)
    VALUES (1, ${config.totalHoursPerDay}, ${config.workWindowStart}, ${config.workWindowEnd}, ${config.notes}, ${JSON.stringify(config.unavailableDays)}, ${JSON.stringify(config.visual)})
    ON CONFLICT (id) DO UPDATE SET
      total_hours_per_day = EXCLUDED.total_hours_per_day,
      work_window_start = EXCLUDED.work_window_start,
      work_window_end = EXCLUDED.work_window_end,
      notes = EXCLUDED.notes,
      unavailable_days = EXCLUDED.unavailable_days,
      visual = EXCLUDED.visual
  `);

  if (inserts.length > 0) {
    await sql.transaction(inserts as any);
  }
}

export async function clearAll(): Promise<void> {
  await sql.transaction([
    sql`DELETE FROM tasks`,
    sql`DELETE FROM projects`,
    sql`DELETE FROM clients`,
  ]);
}

export async function createBackup(): Promise<string> {
  const data = await loadSchema();
  if (!data) throw new Error('Nenhum dado para fazer backup');
  const id = `backup-${Date.now()}`;
  await sql`INSERT INTO backups (id, snapshot) VALUES (${id}, ${JSON.stringify(data)})`;
  return id;
}

export async function listBackups(): Promise<BackupInfo[]> {
  const rows = await sql`SELECT id, created_at, snapshot FROM backups ORDER BY created_at DESC`;
  return rows.map((r: any) => ({
    id: r.id,
    timestamp: r.created_at,
    size: JSON.stringify(r.snapshot).length,
    checksum: '',
  }));
}

export async function restoreBackup(backupId: string): Promise<void> {
  const rows = await sql`SELECT snapshot FROM backups WHERE id = ${backupId}`;
  if (rows.length === 0) throw new Error(`Backup ${backupId} não encontrado`);
  await saveSchema(rows[0].snapshot as DatabaseSchema);
}
