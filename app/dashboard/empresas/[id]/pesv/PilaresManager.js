"use client";

import { useState, useTransition } from "react";
import { createPilar, updatePilar, deletePilar } from "@/app/lib/actions/pilares";

export default function PilaresManager({ empresaId, pilares, canDelete }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleAdd(formData) {
    setError(null);
    startTransition(async () => {
      const res = await createPilar(empresaId, {
        nombre: formData.get("nombre"),
        descripcion: formData.get("descripcion"),
        orden: formData.get("orden") || pilares.length + 1,
      });
      if (res?.error) setError(res.error);
      else document.getElementById("nuevo-pilar-form")?.reset();
    });
  }

  return (
    <section className="section-card">
      <h2>
        🧱 Pilares del PESV
        <button
          type="button"
          className="secondary"
          style={{ marginLeft: "auto", padding: "4px 10px", fontSize: "0.8rem" }}
          onClick={() => setOpen(!open)}
        >
          {open ? "Cerrar" : "Gestionar pilares"}
        </button>
      </h2>

      {open && (
        <>
          {error && <div className="message error">{error}</div>}
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {pilares.map((p) => (
                  <PilarRow key={p.id} pilar={p} empresaId={empresaId} canDelete={canDelete} setError={setError} />
                ))}
              </tbody>
            </table>
          </div>

          <form id="nuevo-pilar-form" action={handleAdd} className="form-grid" style={{ marginTop: 12 }}>
            <div style={{ maxWidth: 90 }}>
              <label>Orden</label>
              <input name="orden" type="number" min="1" defaultValue={pilares.length + 1} />
            </div>
            <div>
              <label>Nombre del pilar</label>
              <input name="nombre" required />
            </div>
            <div style={{ flexBasis: "100%" }}>
              <label>Descripción</label>
              <input name="descripcion" />
            </div>
            <button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "+ Agregar pilar"}
            </button>
          </form>
        </>
      )}
    </section>
  );
}

function PilarRow({ pilar, empresaId, canDelete, setError }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave(formData) {
    setError(null);
    startTransition(async () => {
      const res = await updatePilar(
        pilar.id,
        {
          nombre: formData.get("nombre"),
          descripcion: formData.get("descripcion"),
          orden: formData.get("orden"),
        },
        empresaId
      );
      if (res?.error) setError(res.error);
      else setEditing(false);
    });
  }

  async function handleToggleActivo() {
    setError(null);
    const res = await updatePilar(pilar.id, { activo: !pilar.activo }, empresaId);
    if (res?.error) setError(res.error);
  }

  async function handleDelete() {
    if (!confirm(`¿Borrar el pilar "${pilar.nombre}"?`)) return;
    const res = await deletePilar(pilar.id, empresaId);
    if (res?.error) setError(res.error);
  }

  if (editing) {
    return (
      <tr>
        <td colSpan={4}>
          <form action={handleSave} className="form-grid">
            <div style={{ maxWidth: 90 }}>
              <label>Orden</label>
              <input name="orden" type="number" defaultValue={pilar.orden} />
            </div>
            <div>
              <label>Nombre</label>
              <input name="nombre" defaultValue={pilar.nombre} required />
            </div>
            <div style={{ flexBasis: "100%" }}>
              <label>Descripción</label>
              <input name="descripcion" defaultValue={pilar.descripcion || ""} />
            </div>
            <button type="submit" disabled={pending}>Guardar</button>
            <button type="button" className="secondary" onClick={() => setEditing(false)}>Cancelar</button>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr style={pilar.activo === false ? { opacity: 0.55 } : undefined}>
      <td>{pilar.orden}</td>
      <td>
        {pilar.nombre}
        {pilar.activo === false && <span className="badge badge-inactivo">Inactivo</span>}
      </td>
      <td className="muted small">{pilar.descripcion || "—"}</td>
      <td className="actions-row">
        <button type="button" className="secondary" onClick={() => setEditing(true)}>Editar</button>
        <button type="button" className="secondary" onClick={handleToggleActivo}>
          {pilar.activo === false ? "Reactivar" : "Desactivar"}
        </button>
        {canDelete && (
          <button type="button" className="danger" onClick={handleDelete}>Borrar</button>
        )}
      </td>
    </tr>
  );
}
