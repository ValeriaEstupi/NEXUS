"use client";

import { useState, useTransition } from "react";
import { addRequisitoSarlaft } from "@/app/lib/actions/cumplimiento";

export default function AddRequisitoSarlaftForm({ empresaId, faseId }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData) {
    setError(null);
    startTransition(async () => {
      const res = await addRequisitoSarlaft({
        empresaId,
        faseId,
        componente: formData.get("componente"),
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
        + Agregar requisito en esta fase
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="form-grid" style={{ marginTop: 10 }}>
      {error && <div className="message error" style={{ flexBasis: "100%" }}>{error}</div>}
      <div style={{ maxWidth: 100 }}>
        <label>Código</label>
        <input name="codigo" placeholder="P.1" />
      </div>
      <div style={{ maxWidth: 220 }}>
        <label>Componente</label>
        <input name="componente" required />
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
