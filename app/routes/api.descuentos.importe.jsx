// app/routes/api.descuentos.importe.jsx
import { json } from "@remix-run/node";
import prisma from '../db.server';

export const loader = async ({ request }) => {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (token !== process.env.API_TOKEN)
    return json({ error: "Unauthorized" }, { status: 401 });

  const descuentos = await prisma.descuento.findMany({
    where: { tipo: "IMPORTE" },
    orderBy: { id: "asc" },
  });

  return json(descuentos);
};
