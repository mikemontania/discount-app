/*
  Warnings:

  - You are about to drop the column `fechaFin` on the `Descuento` table. All the data in the column will be lost.
  - You are about to drop the column `fechaInicio` on the `Descuento` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Descuento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "cantidadDesde" INTEGER NOT NULL,
    "cantidadHasta" INTEGER NOT NULL,
    "valor" REAL NOT NULL,
    "tipo" TEXT NOT NULL,
    "codigoProducto" TEXT,
    "creadoEn" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" DATETIME NOT NULL
);
INSERT INTO "new_Descuento" ("actualizadoEn", "cantidadDesde", "cantidadHasta", "codigoProducto", "creadoEn", "id", "tipo", "valor") SELECT "actualizadoEn", "cantidadDesde", "cantidadHasta", "codigoProducto", "creadoEn", "id", "tipo", "valor" FROM "Descuento";
DROP TABLE "Descuento";
ALTER TABLE "new_Descuento" RENAME TO "Descuento";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
