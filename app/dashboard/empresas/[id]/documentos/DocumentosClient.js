"use client";

import { useState, useTransition } from "react";
import {
  generarDocumento,
  generarDesdeBiblioteca,
  deleteDocumentoGenerado,
} from "@/app/lib/actions/plantillas";
import { formatFechaHora } from "@/app/lib/helpers";
import { LayersIcon } from "@/app/dashboard/Icons";

const BANNERS = [
  "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
  "linear-gradient(135deg, #0e7490 0%, #164e63 100%)",
  "linear-gradient(135deg, #059669 0%, #065f46 100%)",
  "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)",
];

export default function DocumentosClient({ empresaId, documentos, canEdit, carpetasFormato }) {
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

      {canEdit && (
        <section className="section-card">
          <h2>Generar desde la biblioteca</h2>
          {carpetasFormato && carpetasFormato.length > 0 ? (
            <div className="group-card-grid">
              {carpetasFormato.map((carpeta, i) => (
                <div key={carpeta.id} className="group-card" style={{ cursor: "default" }}>
                  <div className="group-card-banner" style={{ background: BANNERS[i % BANNERS.length] }}>
                    <LayersIcon size={20} className="group-card-icon" />
                  </div>
                  <div className="group-card-body">
                    <strong>{carpeta.nombre}</strong>
                    <ul className="file-list" style={{ marginTop: 8 }}>
                      {carpeta.archivos.map((a) => (
                        <li key={a.id}>
                          📄 {a.nombre_archivo}
                          <button
                            type="button"
                            className="secondary"
                            style={{ padding: "2px 8px", fontSize: "0.7rem", marginLeft: 8 }}
                            disabled={pending && generandoId === a.id}
                            onClick={() => handleGenerarBiblioteca(a.id)}
                          >
                            {pending && generandoId === a.id ? "Generando..." : "Generar"}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
