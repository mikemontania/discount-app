import fetch from "node-fetch";

export default async function discountFunction(input, { session }) {
  const cart = input.cart;
  console.log(cart)
  const token = process.env.API_TOKEN;

  // 1. Armar lista de SKUs del carrito
  const skus = cart.lines.map(l => l.merchandise.sku).filter(Boolean);
  const skuParam = skus.join(",");

  // 2. Consultar descuentos PRODUCTO
  const productoRes = await fetch(
    `${process.env.APP_URL}/api/descuentos/productos?skus=${skuParam}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const descuentosProducto = await productoRes.json();

  // 3. Consultar descuentos IMPORTE
  const importeRes = await fetch(
    `${process.env.APP_URL}/api/descuentos/importe`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const descuentosImporte = await importeRes.json();

  // Mapeo rápido para buscar descuentos PRODUCTO por SKU
  const mapProducto = {};
  descuentosProducto.forEach(d => {
    mapProducto[d.codigoProducto] = d;
  });

  let totalSinProducto = 0;
  const result = [];

  // 4. Recorrer líneas y aplicar descuento PRODUCTO
  for (const line of cart.lines) {
    const sku = line.merchandise.sku;
    const qty = line.quantity;
    const price = parseFloat(line.cost.amountPerQuantity.amount);
    const subtotal = qty * price;

    if (mapProducto[sku]) {
      const d = mapProducto[sku];
      const discountValue = (subtotal * d.valor) / 100;

      result.push({
        message: `Descuento ${d.valor}% PRODUCTO`,
        targets: [{ cartLine: { id: line.id } }],
        value: {
          percentage: { value: d.valor.toString() },
        },
      });
    } else {
      totalSinProducto += subtotal;
    }
  }

  // 5. Aplicar descuento IMPORTE sobre el subtotal restante
  if (totalSinProducto > 0) {
    let descuentoAplicado = null;
    for (const d of descuentosImporte) {
      if (
        totalSinProducto >= d.cantidadDesde &&
        totalSinProducto <= d.cantidadHasta
      ) {
        descuentoAplicado = d;
        break;
      }
    }

    if (descuentoAplicado) {
      result.push({
        message: `Descuento ${descuentoAplicado.valor}% IMPORTE`,
        targets: cart.lines
          .filter(l => !mapProducto[l.merchandise.sku])
          .map(l => ({ cartLine: { id: l.id } })),
        value: {
          percentage: { value: descuentoAplicado.valor.toString() },
        },
      });
    }
  }

  return { discounts: result };
}
