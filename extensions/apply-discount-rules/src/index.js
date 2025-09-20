/**
 * index.js
 *
 * Esta Shopify Function aplica descuentos en el checkout según la tabla
 * de descuentos definida en tu app.
 *
 * La función sigue estos pasos:
 * 1. Traer descuentos desde tu API.
 * 2. Aplicar descuentos de tipo PRODUCTO directamente a las líneas del carrito.
 * 3. Aplicar descuentos de tipo IMPORTE sobre el subtotal restante.
 * 4. Devolver todos los descuentos a Shopify para que se apliquen en el checkout.
 */

import { createDiscountFunction } from '@shopify/discounts';

// Creamos la función de descuento
export default createDiscountFunction(async ({ cart }) => {
  // --- 1. Traer los descuentos desde la app ---
  // Hacemos un fetch al endpoint de la app para obtener los descuentos configurados
  // Se utiliza el SHOPIFY_APP_URL y API_TOKEN definidos en el .env
  const response = await fetch(`${process.env.SHOPIFY_APP_URL}/api/descuentos`, {
    headers: { 'Authorization': `Bearer ${process.env.API_TOKEN}` }
  });

  // Parseamos la respuesta JSON que contiene los descuentos
  const descuentos = await response.json();

  // Array donde guardaremos los descuentos que se aplicarán
  const discountsToApply = [];

  // --- 2. Aplicar descuentos de tipo PRODUCTO ---
  // Recorremos cada línea del carrito
  for (const line of cart.lines) {
    // Buscamos si existe un descuento que coincida con el SKU de la línea y sea tipo PRODUCTO
    const productDiscount = descuentos.find(d =>
      d.tipo.toUpperCase() === 'PRODUCTO' &&
      d.codigoProducto === line.merchandise.sku
    );

    if (productDiscount) {
      // Si encontramos un descuento PRODUCTO, lo agregamos al array
      discountsToApply.push({
        type: 'percentage',       // tipo de descuento: porcentaje
        value: productDiscount.valor, // valor del porcentaje
        targetType: 'line',       // se aplica a la línea específica
        targetSelector: line.id   // ID de la línea a la que se aplica
      });

      continue; // PRODUCT tiene prioridad sobre otros descuentos, saltamos al siguiente item
    }
  }

  // --- 3. Aplicar descuentos de tipo IMPORTE ---
  // Filtramos las líneas que no recibieron descuento PRODUCTO
  const remainingLines = cart.lines.filter(line =>
    !discountsToApply.some(d => d.targetSelector === line.id)
  );

  // Calculamos el subtotal de estas líneas restantes
  const subtotal = remainingLines.reduce(
    (sum, line) => sum + Number(line.price) * line.quantity,
    0
  );

  // Buscamos un descuento de tipo IMPORTE que se aplique a este subtotal
  const amountDiscount = descuentos.find(d =>
    d.tipo.toUpperCase() === 'IMPORTE' &&
    subtotal >= d.cantidadDesde &&
    subtotal <= d.cantidadHasta
  );

  if (amountDiscount) {
    // Si existe un descuento IMPORTE, lo agregamos al array
    discountsToApply.push({
      type: 'percentage',   // tipo de descuento: porcentaje sobre el total del pedido
      value: amountDiscount.valor,
      targetType: 'order'   // se aplica al total del pedido
    });
  }

  // --- 4. Devolver los descuentos a Shopify ---
  // Shopify aplicará automáticamente estos descuentos en el checkout
  return discountsToApply;
});
