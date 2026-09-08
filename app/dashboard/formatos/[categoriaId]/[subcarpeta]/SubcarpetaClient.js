"use client";

import { useState, useTransition } from "react";
import {
  subirPlantillaBiblioteca,
  deletePlantillaBiblioteca,
} from "@/app/lib/actions/formatosBiblioteca";
import { formatFechaHora } from "@/app/lib/helpers";

export default function SubcarpetaClient({ categoriaId, subcarpeta, plantillas, isAppAdmin }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleUpload(formData) {
    setError(null);
    formData.set("categoria_id", categoriaId);
    formData.set("subcarpeta", subcarpeta);
    startTransition(async () => {
      const res = await subirPlantillaBiblioteca(formData);
      if (res?.error) setError(res.error);
      else document.getElementById("subir-form")?.reset();
    });
  }

  async function handleDelete(id, rutaStorage) {
    if (!confirm("¿Borrar este archivo de la biblioteca? Afecta a todas las empresas.")) return;
    const res = await deletePlantillaBiblioteca(id, rutaStorage, categoriaId, subcarpeta);
    if (res?.error) setError(res.error);
  }

  return (
    <section className="section-card">
      {error && <div className="message error">{error}</div>}

      {plantillas.length > 0 ? (
        <ul className="file-list">
          {plantillas.map((p) => (
            <li key={p.id}>
              📄{" "}
              {p.url ? (
                <a href={p.url} target="_blank" rel="noreferrer">
                  {p.nombre_archivo}
                </a>
              ) : (
                p.nombre_archivo
              )}{" "}
              <span className="muted small">— {formatFechaHora(p.created_at)}</span>
              {isAppAdmin && (
                <button
                  type="button"
                  className="secondary"
                  style={{ padding: "2px 8px", fontSize: "0.7rem", marginLeft: 8 }}
                  onClick={() => handleDelete(p.id, p.ruta_storage)}
                >
                  Borrar
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">Todavía no hay archivos aquí.</p>
      )}

      {isAppAdmin && (
        <form id="subir-form" action={handleUpload} className="inline-form-row">
          <input type="file" name="archivo" accept={subcarpeta === "formatos" ? ".docx,.xlsx" : undefined} required />
          <button type="submit" disabled={pending}>
            {pending ? "Subiendo..." : "Agregar"}
          </button>
        </form>
      )}
    </section>
  );
}
