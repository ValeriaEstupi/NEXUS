"use client";

import { useState, useTransition } from "react";
import {
  generarDocumento,
  generarDesdeBiblioteca,
  deleteDocumentoGenerado,
} from "@/app/lib/actions/plantillas";
import { formatFechaHora } from "@/app/lib/helpers";

export default function DocumentosClient({ empresaId, documentos, canEdit, categorias, plantillasBiblioteca }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();
  const [generandoId, setGenerandoId] = useState(null);
  const [fileName, setFileName] = useState("");

  function handleSubmit(formData) {
    setError(null);
    formData.set("empresa_id", empresaId);
    startTransition(async () => {
      const res = await generarDocumento(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setFileName("");
        document.getElementById("subir-formato-form")?.reset();
      }
    });
  }

  function handleGenerarBiblioteca(plantillaId) {
    setError(null);
    setGenerandoId(plantillaId);
    startTransition(async () => {
      const res = await generarDesdeBiblioteca(plantillaId, empresaId);
      if (res?.error) setError(res.error);
      setGenerandoId(null);
    });
  }

  async function handleDelete(id, rutaStorage) {
    if (!confirm("¿Borrar este documento generado?")) return;
    const res = await deleteDocumentoGenerado(id, rutaStorage, empresaId);
    if (res?.error) setError(res.error);
  }

  return (
    <>
      {error && <div className="message error">{error}</div>}

      {canEdit && categorias && categorias.length > 0 && (
        <section className="section-card">
          <h2>Generar desde la biblioteca</h2>
          {categorias.map((cat) => {
            const items = (plantillasBiblioteca || []).filter((p) => p.categoria_id === cat.id);
            if (items.length === 0) return null;
            return (
              <div key={cat.id} style={{ marginBottom: 14 }}>
                <strong style={{ fontSize: "0.85rem" }}>{cat.orden}. {cat.nombre}</strong>
                <ul className="file-list">
                  {items.map((p) => (
                    <li key={p.id}>
                      📄 {p.nombre_archivo}
                      <button
                        type="button"
                        className="secondary"
                        style={{ padding: "2px 8px", fontSize: "0.7rem", marginLeft: 8 }}
                        disabled={pending && generandoId === p.id}
                        onClick={() => handleGenerarBiblioteca(p.id)}
                      >
                        {pending && generandoId === p.id ? "Generando..." : "Generar para esta empresa"}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
          {(plantillasBiblioteca || []).length === 0 && (
            <p className="empty-state">
              Todavía no hay formatos en la biblioteca compartida.
            </p>
          )}
        </section>
      )}

      {canEdit && (
        <section className="section-card">
          <h2>Subir un formato propio</h2>
          <form id="subir-formato-form" action={handleSubmit} className="inline-form-row">
            <input
              type="file"
              name="archivo"
              accept=".docx,.xlsx"
              required
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
            />
            <button type="submit" disabled={pending}>
              {pending ? "Rellenando..." : "Generar documento"}
            </button>
          </form>
          {fileName && !pending && <p className="muted small">Seleccionado: {fileName}</p>}
        </section>
      )}

      <section className="section-card">
        <h2>Documentos generados</h2>
        {documentos && documentos.length > 0 ? (
          <ul className="file-list">
            {documentos.map((d) => (
              <li key={d.id}>
                📄{" "}
                {d.url ? (
                  <a href={d.url} target="_blank" rel="noreferrer">
                    {d.nombre_archivo}
                  </a>
                ) : (
                  d.nombre_archivo
                )}{" "}
                <span className="muted small">— {formatFechaHora(d.created_at)}</span>
                {canEdit && (
                  <button
                    type="button"
                    className="secondary"
                    style={{ padding: "2px 8px", fontSize: "0.7rem", marginLeft: 8 }}
                    onClick={() => handleDelete(d.id, d.ruta_storage)}
                  >
                    Borrar
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">Todavía no has generado ningún documento.</p>
        )}
      </section>
    </>
  );
}
