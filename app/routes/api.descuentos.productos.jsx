// app/routes/api.descuentos.productos.jsx
import { json } from "@remix-run/node";
import prisma from '../db.server';

export const loader = async ({ request }) => {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (token !== process.env.API_TOKEN)
    return json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const skus = url.searchParams.get("skus")?.split(",") || [];

  const descuentos = await prisma.descuento.findMany({
    where: { tipo: "PRODUCTO", codigoProducto: { in: skus } },
    orderBy: { id: "asc" },
  });

  return json(descuentos);
};
