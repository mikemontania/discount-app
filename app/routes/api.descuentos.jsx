// app/routes/api.descuentos.jsx
import { json } from '@remix-run/node';
import prisma from '../db.server';

/* export const loader = async ({ request }) => {
  return json({ ok: true, message: "Ruta encontrada correctamente" });
}; */

export const loader = async ({ request }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (token !== process.env.API_TOKEN) return json({ error: 'Unauthorized' }, { status: 401 });
   const descuentos = await prisma.descuento.findMany({ orderBy: { id: "asc" } });

  return json(descuentos);
};

