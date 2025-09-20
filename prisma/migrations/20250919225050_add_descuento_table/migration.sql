-- CreateTable
CREATE TABLE "Descuento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cantidadDesde" INTEGER NOT NULL,
    "cantidadHasta" INTEGER NOT NULL,
    "valor" REAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "codigoProducto" TEXT,
    "fechaInicio" DATETIME NOT NULL,
    "fechaFin" DATETIME NOT NULL,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);
