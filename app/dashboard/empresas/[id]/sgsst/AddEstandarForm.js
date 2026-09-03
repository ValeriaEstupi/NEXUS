"use client";

import { useState, useTransition } from "react";
import { addEstandarSgsst } from "@/app/lib/actions/cumplimiento";

export default function AddEstandarForm({ empresaId, faseId }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData) {
    setError(null);
    startTransition(async () => {
      const res = await addEstandarSgsst({
        empresaId,
        faseId,
        componente: formData.get("componente"),
        codigo: formData.get("codigo") || null,
        descripcion: formData.get("descripcion"),
        puntaje: formData.get("puntaje") || 0,
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
        + Agregar estándar en esta fase
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="form-grid" style={{ marginTop: 10 }}>
      {error && <div className="message error" style={{ flexBasis: "100%" }}>{error}</div>}
      <div style={{ maxWidth: 100 }}>
        <label>Código</label>
        <input name="codigo" placeholder="2.12.1" />
      </div>
      <div style={{ maxWidth: 200 }}>
        <label>Componente</label>
        <input name="componente" required />
      </div>
      <div style={{ maxWidth: 100 }}>
        <label>Puntaje</label>
        <input name="puntaje" type="number" step="0.25" min="0" max="100" />
      </div>
      <div style={{ flexBasis: "100%" }}>
        <label>Descripción del estándar</label>
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
