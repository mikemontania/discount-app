// app/routes/api/descuentos.js
import { json } from '@remix-run/node';
import prisma from '../../db.server';

export const loader = async ({ request }) => {
  return json({ ok: true, message: "Ruta encontrada correctamente" });
};
/*
export const loader = async ({ request }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (token !== process.env.API_TOKEN) return json({ error: 'Unauthorized' }, { status: 401 });

  const descuentos = await prisma.discount.findMany();
  return json(descuentos);
};
 */
