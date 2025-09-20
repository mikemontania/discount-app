// app/routes/app/index.jsx
import { useLoaderData, useFetcher, useRevalidator } from "@remix-run/react";
import { json } from "@remix-run/node";
import DescuentosTable from "../components/DescuentosTable";

import {
  getAllDescuentos,
  deleteDescuentos,
  createDescuento,
  migrateDescuentos,
} from "../models/descuento.server";
import {
  Page,
  Layout,
  Card,
  IndexTable,
  useIndexResourceState,
  BlockStack,
  Modal,
  TextField,
} from "@shopify/polaris";
import { useState, useEffect } from "react";
import Swal from "sweetalert2";

// 🔹 Loader
export const loader = async () => {
  const descuentos = await getAllDescuentos();
  return json({ descuentos });
};

// 🔹 Action
export const action = async ({ request }) => {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "delete") {
    await deleteDescuentos(JSON.parse(formData.get("ids")));
    return json({ ok: true, message: "Registros eliminados correctamente" });
  }

  if (intent === "add") {
    await createDescuento({
      cantidadDesde: Number(formData.get("cantidadDesde")),
      cantidadHasta: Number(formData.get("cantidadHasta")),
      valor: Number(formData.get("valor")),
      tipo: formData.get("tipo"),
      codigoProducto: formData.get("codigoProducto") || null,
    });
    return json({ ok: true, message: "Descuento agregado correctamente" });
  }

  if (intent === "migrate") {
    await migrateDescuentos();
    return json({ ok: true, message: "Migración completada correctamente" });
  }

  return json({ ok: false, message: "Acción no válida" });
};

// 🔹 Componente principal
export default function DescuentosPage() {
  const { descuentos } = useLoaderData();
  const fetcher = useFetcher();
  const revalidator = useRevalidator();
const [lastIntent, setLastIntent] = useState(null);
  // ✅ Mensajes y revalidación
 useEffect(() => {
  if (fetcher.state === "idle" && fetcher.data?.ok && lastIntent) {
    Swal.fire({
      icon: "success",
      title: "Éxito",
      text: fetcher.data.message || "Operación realizada",
      timer: 1500,
      showConfirmButton: false,
    });

    revalidator.revalidate();
    setLastIntent(null); // ✅ reseteamos para que no se repita
  }
}, [fetcher.state, fetcher.data, revalidator, lastIntent]);

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(descuentos);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    cantidadDesde: "",
    cantidadHasta: "",
    valor: "",
    tipo: "AMOUNT",
    codigoProducto: "",
  });

  // ✅ Handlers
const handleAdd = () => {
  const fd = new FormData();
  fd.append("intent", "add");
  Object.entries(form).forEach(([k, v]) => fd.append(k, v));

  setLastIntent("add");
  Swal.fire({ title: "Guardando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
  fetcher.submit(fd, { method: "post" });
  setModalOpen(false);
};

const handleDelete = () => {
  if (selectedResources.length === 0) {
    Swal.fire("Atención", "Selecciona al menos un registro", "warning");
    return;
  }

  Swal.fire({
    title: "¿Eliminar seleccionados?",
    text: `Se eliminarán ${selectedResources.length} descuentos`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      const fd = new FormData();
      fd.append("intent", "delete");
      fd.append("ids", JSON.stringify(selectedResources));

      setLastIntent("delete"); // ✅ importante
      Swal.fire({ title: "Eliminando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      fetcher.submit(fd, { method: "post" });
    }
  });
};

const handleMigrate = () => {
  Swal.fire({
    title: "Migrar desde ERP",
    text: "¿Seguro que deseas reemplazar los descuentos actuales?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí, migrar",
    cancelButtonText: "Cancelar",
  }).then((result) => {
    if (result.isConfirmed) {
      const fd = new FormData();
      fd.append("intent", "migrate");

      setLastIntent("migrate"); // ✅ importante
      Swal.fire({ title: "Migrando...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      fetcher.submit(fd, { method: "post" });
    }
  });
};

  return (
    <Page
      title="Tabla de Descuentos"
      primaryAction={{ content: "Agregar Descuento", onAction: () => setModalOpen(true) }}
      secondaryActions={[
        { content: "Eliminar Seleccionados", destructive: true, onAction: handleDelete },
        { content: "Migrar desde ERP", onAction: handleMigrate },
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
           <DescuentosTable
  descuentos={descuentos}
  selectedResources={selectedResources}
  allResourcesSelected={allResourcesSelected}
  handleSelectionChange={handleSelectionChange}
/>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Agregar Descuento"
        primaryAction={{ content: "Guardar", onAction: handleAdd }}
        secondaryActions={[{ content: "Cancelar", onAction: () => setModalOpen(false) }]}
      >
        <Modal.Section>
          <BlockStack gap="200">
            <TextField label="Cantidad Desde" value={form.cantidadDesde} onChange={(v) => setForm({ ...form, cantidadDesde: v })} />
            <TextField label="Cantidad Hasta" value={form.cantidadHasta} onChange={(v) => setForm({ ...form, cantidadHasta: v })} />
            <TextField label="Valor" value={form.valor} onChange={(v) => setForm({ ...form, valor: v })} />
            <TextField label="Tipo" value={form.tipo} onChange={(v) => setForm({ ...form, tipo: v })} />
            <TextField label="SKU" value={form.codigoProducto} onChange={(v) => setForm({ ...form, codigoProducto: v })} />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
