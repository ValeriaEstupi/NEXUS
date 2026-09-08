"use client";

import { useState, useTransition } from "react";
import { generarDocumento, deleteDocumentoGenerado } from "@/app/lib/actions/plantillas";
import { formatFechaHora } from "@/app/lib/helpers";

export default function DocumentosClient({ empresaId, documentos, canEdit }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();
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

  async function handleDelete(id, rutaStorage) {
    if (!confirm("¿Borrar este documento generado?")) return;
    const res = await deleteDocumentoGenerado(id, rutaStorage, empresaId);
    if (res?.error) setError(res.error);
  }

  return (
    <>
      {canEdit && (
        <section className="section-card">
          <h2>Subir un formato</h2>
          {error && <div className="message error">{error}</div>}
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
