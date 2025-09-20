// app/models/descuento.server.js
import   prisma   from "../db.server";

export async function getAllDescuentos() {
  return prisma.descuento.findMany({ orderBy: { id: "asc" } });
}

export async function deleteDescuentos(ids) {
  const numericIds = ids.map((id) => Number(id));
  return prisma.descuento.deleteMany({
    where: { id: { in: numericIds } },
  });
}

export async function createDescuento(data) {
  return prisma.descuento.create({ data });
}

export async function migrateDescuentos() {
  const res = await fetch(
    "https://pos.cavallaro.com.py/mpos/rest/ecommerce/pos/descuentos?token=9vTmA7jWAL"
  );
  const data = await res.json();

  await prisma.descuento.deleteMany();

  for (const d of data) {
    await prisma.descuento.create({
      data: {
        cantidadDesde: d.cantDesde,
        cantidadHasta: d.cantHasta,
        valor: d.descuento,
        tipo: d.tipoDescuento,
        codigoProducto: d.codProductoErp || null,
      },
    });
  }
}
