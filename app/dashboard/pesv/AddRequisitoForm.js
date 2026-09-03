"use client";

import { useState, useTransition } from "react";
import { addRequisitoPesv } from "../../lib/actions/cumplimiento";

export default function AddRequisitoForm({ pilarId, fases }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData) {
    setError(null);
    startTransition(async () => {
      const res = await addRequisitoPesv({
        pilarId,
        faseId: formData.get("fase_id") || null,
        codigo: formData.get("codigo") || null,
        descripcion: formData.get("descripcion"),
      });
      if (res?.error) {
        setError(res.error);
      } else {
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button type="button" className="secondary" onClick={() => setOpen(true)}>
        + Agregar requisito a este pilar
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="form-grid" style={{ marginTop: 10 }}>
      {error && <div className="message error" style={{ flexBasis: "100%" }}>{error}</div>}
      <div style={{ maxWidth: 100 }}>
        <label>Código</label>
        <input name="codigo" placeholder="1.13" />
      </div>
      <div style={{ maxWidth: 160 }}>
        <label>Fase PHVA</label>
        <select name="fase_id">
          <option value="">Sin definir</option>
          {fases.map((f) => (
            <option key={f.id} value={f.id}>
              {f.nombre}
            </option>
          ))}
        </select>
      </div>
      <div style={{ flexBasis: "100%" }}>
        <label>Descripción del requisito</label>
        <input name="descripcion" required />
      </div>
      <button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Agregar"}
      </button>
      <button type="button" className="secondary" onClick={() => setOpen(false)}>
        Cancelar
      </button>
    </form>
  );
}
