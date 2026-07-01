import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createBackup, listBackups, restoreBackup } from './_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const backups = await listBackups();
      return res.status(200).json(backups);
    }

    if (req.method === 'POST') {
      const restoreId = req.query.restore;
      if (typeof restoreId === 'string') {
        await restoreBackup(restoreId);
        return res.status(204).end();
      }
      const id = await createBackup();
      return res.status(201).json({ id });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Erro em /api/backups:', error);
    return res.status(500).json({ error: error.message ?? 'Erro interno' });
  }
}
