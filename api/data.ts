import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadSchema, saveSchema, clearAll } from './_lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const data = await loadSchema();
      return res.status(200).json(data);
    }

    if (req.method === 'PUT') {
      await saveSchema(req.body);
      return res.status(204).end();
    }

    if (req.method === 'DELETE') {
      await clearAll();
      return res.status(204).end();
    }

    res.setHeader('Allow', 'GET, PUT, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Erro em /api/data:', error);
    return res.status(500).json({ error: error.message ?? 'Erro interno' });
  }
}
