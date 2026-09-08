"use client";

import { useState, useTransition } from "react";
import {
  subirPlantillaBiblioteca,
  deletePlantillaBiblioteca,
} from "@/app/lib/actions/formatosBiblioteca";
import { formatFechaHora } from "@/app/lib/helpers";

export default function BibliotecaClient({ categorias, plantillas, isAppAdmin }) {
  return (
    <>
      {categorias.map((cat) => (
        <CategoriaSection
          key={cat.id}
          categoria={cat}
          plantillas={plantillas.filter((p) => p.categoria_id === cat.id)}
          isAppAdmin={isAppAdmin}
        />
      ))}
    </>
  );
}

function CategoriaSection({ categoria, plantillas, isAppAdmin }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleUpload(formData) {
    setError(null);
    formData.set("categoria_id", categoria.id);
    startTransition(async () => {
      const res = await subirPlantillaBiblioteca(formData);
      if (res?.error) setError(res.error);
      else document.getElementById(`subir-form-${categoria.id}`)?.reset();
    });
  }

  async function handleDelete(id, rutaStorage) {
    if (!confirm("¿Borrar este formato de la biblioteca? Afecta a todas las empresas.")) return;
    const res = await deletePlantillaBiblioteca(id, rutaStorage);
    if (res?.error) setError(res.error);
  }

  return (
    <section className="section-card">
      <h2>{categoria.orden}. {categoria.nombre}</h2>
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
        <p className="empty-state">Todavía no hay formatos en esta categoría.</p>
      )}

      {isAppAdmin && (
        <form id={`subir-form-${categoria.id}`} action={handleUpload} className="inline-form-row" style={{ marginTop: 10 }}>
          <input type="file" name="archivo" accept=".docx,.xlsx" required />
          <button type="submit" disabled={pending}>
            {pending ? "Subiendo..." : "Agregar a esta categoría"}
          </button>
        </form>
      )}
    </section>
  );
}
