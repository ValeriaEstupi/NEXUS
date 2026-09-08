"use client";

import { useState, useTransition } from "react";
import {
  subirPlantillaBiblioteca,
  deletePlantillaBiblioteca,
} from "@/app/lib/actions/formatosBiblioteca";
import { formatFechaHora } from "@/app/lib/helpers";

const SUBCARPETAS = [
  { valor: "documentos", label: "Documentos", nota: "Cualquier tipo de archivo — se descarga tal cual." },
  { valor: "formatos", label: "Formatos", nota: "Word (.docx) o Excel (.xlsx) con marcadores entre paréntesis." },
];

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
  return (
    <section className="section-card">
      <h2>{categoria.orden}. {categoria.nombre}</h2>
      {SUBCARPETAS.map((sub) => (
        <SubcarpetaBlock
          key={sub.valor}
          categoria={categoria}
          sub={sub}
          plantillas={plantillas.filter((p) => (p.subcarpeta || "formatos") === sub.valor)}
          isAppAdmin={isAppAdmin}
        />
      ))}
    </section>
  );
}

function SubcarpetaBlock({ categoria, sub, plantillas, isAppAdmin }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();
  const formId = `subir-form-${categoria.id}-${sub.valor}`;

  function handleUpload(formData) {
    setError(null);
    formData.set("categoria_id", categoria.id);
    formData.set("subcarpeta", sub.valor);
    startTransition(async () => {
      const res = await subirPlantillaBiblioteca(formData);
      if (res?.error) setError(res.error);
      else document.getElementById(formId)?.reset();
    });
  }

  async function handleDelete(id, rutaStorage) {
    if (!confirm("¿Borrar este archivo de la biblioteca? Afecta a todas las empresas.")) return;
    const res = await deletePlantillaBiblioteca(id, rutaStorage);
    if (res?.error) setError(res.error);
  }

  return (
    <div style={{ marginTop: 14 }}>
      <strong style={{ fontSize: "0.82rem" }}>{sub.label}</strong>
      <p className="muted small" style={{ margin: "2px 0 8px" }}>{sub.nota}</p>
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
        <form id={formId} action={handleUpload} className="inline-form-row">
          <input type="file" name="archivo" accept={sub.valor === "formatos" ? ".docx,.xlsx" : undefined} required />
          <button type="submit" disabled={pending}>
            {pending ? "Subiendo..." : "Agregar"}
          </button>
        </form>
      )}
    </div>
  );
}
