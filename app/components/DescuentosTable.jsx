// app/components/DescuentosTable.jsx
// app/components/DescuentosTable.jsx
import { useState, useMemo } from "react";
import { Card, TextField, Select } from "@shopify/polaris";
import { Button } from "@shopify/polaris";

export default function DescuentosTable({
  descuentos,
  selectedResources,
  allResourcesSelected,
  handleSelectionChange,
}) {
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Filtrado
  const filteredDescuentos = useMemo(() => {
    if (!search) return descuentos;
    const lower = search.toLowerCase();
    return descuentos.filter(
      (d) =>
        String(d.id).includes(lower) ||
        (d.codigoProducto && d.codigoProducto.toLowerCase().includes(lower)) ||
        (d.tipo && d.tipo.toLowerCase().includes(lower))
    );
  }, [descuentos, search]);

  // Ordenamiento
  const sortedDescuentos = useMemo(() => {
    return [...filteredDescuentos].sort((a, b) => {
      const valA = a[sortConfig.key] ?? "";
      const valB = b[sortConfig.key] ?? "";

      if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
      if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredDescuentos, sortConfig]);

  // Paginación
  const totalPages = Math.ceil(sortedDescuentos.length / pageSize);
  const paginatedDescuentos = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedDescuentos.slice(start, start + pageSize);
  }, [sortedDescuentos, page, pageSize]);

  return (
    <Card>
      {/* Buscador y selector de tamaño */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center" }}>
        <TextField
          label="Buscar"
          value={search}
          placeholder="ID, SKU o Tipo"
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
        />
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <span>Total: {descuentos.length}</span>
          <span>Filtrados: {filteredDescuentos.length}</span>
          <Select
            label="Mostrar por página"
            options={[5, 10, 15, 20, 50].map((n) => ({ label: String(n), value: String(n) }))}
            value={String(pageSize)}
            onChange={(v) => {
              setPageSize(Number(v));
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Tabla */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #eaeaea", textAlign: "left" }}>
            {["ID", "Cantidad Desde", "Cantidad Hasta", "Valor", "Tipo", "SKU"].map((title, idx) => {
              const keyMap = ["id","cantidadDesde","cantidadHasta","valor","tipo","codigoProducto"];
              return (
                <th
                  key={idx}
                  style={{ padding: "8px", cursor: "pointer" }}
                  onClick={() => handleSort(keyMap[idx])}
                >
                  {title} {sortConfig.key === keyMap[idx] ? (sortConfig.direction === "asc" ? "▲" : "▼") : ""}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {paginatedDescuentos.map((d, i) => (
            <tr
              key={d.id}
              style={{
                backgroundColor: selectedResources.includes(String(d.id)) ? "#e6f0f3" : "transparent",
                borderBottom: "1px solid #f0f0f0",
              }}
              onClick={() => handleSelectionChange(d.id)}
            >
              <td style={{ padding: "8px" }}>{d.id}</td>
              <td style={{ padding: "8px" }}>{d.cantidadDesde}</td>
              <td style={{ padding: "8px" }}>{d.cantidadHasta}</td>
              <td style={{ padding: "8px" }}>{d.valor}</td>
              <td style={{ padding: "8px" }}>{d.tipo}</td>
              <td style={{ padding: "8px" }}>{d.codigoProducto || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Paginación */}
      {totalPages > 1 && (
       <div style={{ display: "flex", justifyContent: "center", marginTop: 16, gap: 8, alignItems: "center" }}>
  <Button
    disabled={page === 1}
    onClick={() => setPage(p => Math.max(1, p - 1))}
  >
    Anterior
  </Button>

  <span style={{ padding: "0 8px" }}>Página {page} de {totalPages}</span>

  <Button
    disabled={page === totalPages}
    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
  >
    Siguiente
  </Button>
</div>
      )}
    </Card>
  );
}
