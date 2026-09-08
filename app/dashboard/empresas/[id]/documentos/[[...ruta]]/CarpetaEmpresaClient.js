"use client";

import Link from "next/link";
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

export default function CarpetaEmpresaClient({
  empresaId,
  rutaSegmentos,
  subcarpetas,
  archivos,
  canEdit,
  documentosSueltos,
  mostrarSueltos,
}) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();
  const [generandoId, setGenerandoId] = useState(null);
  const [fileName, setFileName] = useState("");

  const rutaActual = rutaSegmentos.join("/");
  const carpetaId = rutaSegmentos.length > 0 ? rutaSegmentos[rutaSegmentos.length - 1] : null;

  function handleGenerar(archivoId) {
    setError(null);
    setGenerandoId(archivoId);
    startTransition(async () => {
      const res = await generarDesdeBiblioteca(archivoId, empresaId, rutaActual);
      if (res?.error) setError(res.error);
      setGenerandoId(null);
    });
  }

  async function handleBorrarGenerado(id, rutaStorage) {
    if (!confirm("¿Borrar este documento generado? Puedes volver a darle 'Generar' cuando quieras.")) return;
    const res = await deleteDocumentoGenerado(id, rutaStorage, empresaId, rutaActual);
    if (res?.error) setError(res.error);
  }

  function handleSubirPropio(formData) {
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

  async function handleBorrarSuelto(id, rutaStorage) {
    if (!confirm("¿Borrar este documento generado?")) return;
    const res = await deleteDocumentoGenerado(id, rutaStorage, empresaId);
    if (res?.error) setError(res.error);
  }

  return (
    <>
      {error && <div className="message error">{error}</div>}

      {subcarpetas.length > 0 && (
        <div className="group-card-grid">
          {subcarpetas.map((sc, i) => (
            <Link
              key={sc.id}
              href={`/dashboard/empresas/${empresaId}/documentos/${[...rutaSegmentos, sc.id].join("/")}`}
              className="group-card"
            >
              <div className="group-card-banner" style={{ background: BANNERS[i % BANNERS.length] }}>
                <LayersIcon size={20} className="group-card-icon" />
              </div>
              <div className="group-card-body">
                <strong>{sc.nombre}</strong>
              </div>
            </Link>
          ))}
        </div>
      )}

      {carpetaId && subcarpetas.length === 0 && (
        <section className="section-card">
          <h2>Archivos aquí</h2>
          {archivos.length > 0 ? (
            <ul className="file-list">
              {archivos.map((a) => (
                <li key={a.id}>
                  📄 {a.nombre_archivo}{" "}
                  {!a.esRellenable && (
                    a.urlOriginal ? (
                      <a href={a.urlOriginal} target="_blank" rel="noreferrer" className="muted small">
                        (ver / descargar)
                      </a>
                    ) : (
                      <span className="muted small">— archivo de referencia</span>
                    )
                  )}
                  {a.esRellenable && a.generado && (
                    <>
                      {" "}
                      <span className="badge badge-cumplido" style={{ fontSize: "0.7rem" }}>
                        Generado
                      </span>{" "}
                      {a.generado.url && (
                        <a href={a.generado.url} target="_blank" rel="noreferrer">
                          Descargar
                        </a>
                      )}
                      <span className="muted small"> — {formatFechaHora(a.generado.created_at)}</span>{" "}
                      {canEdit && (
                        <>
                          <button
                            type="button"
                            className="secondary"
                            style={{ padding: "2px 8px", fontSize: "0.7rem", marginLeft: 4 }}
                            disabled={pending && generandoId === a.id}
                            onClick={() => handleGenerar(a.id)}
                          >
                            {pending && generandoId === a.id ? "Generando..." : "Volver a generar"}
                          </button>
                          <button
                            type="button"
                            className="secondary"
                            style={{ padding: "2px 8px", fontSize: "0.7rem", marginLeft: 4 }}
                            onClick={() => handleBorrarGenerado(a.generado.id, a.generado.ruta_storage)}
                          >
                            Borrar
                          </button>
                        </>
                      )}
                    </>
                  )}
                  {a.esRellenable && !a.generado && (
                    <>
                      {" "}
                      <span className="badge badge-pendiente" style={{ fontSize: "0.7rem" }}>
                        Sin generar
                      </span>{" "}
                      {canEdit && (
                        <button
                          type="button"
                          className="secondary"
                          style={{ padding: "2px 8px", fontSize: "0.7rem", marginLeft: 4 }}
                          disabled={pending && generandoId === a.id}
                          onClick={() => handleGenerar(a.id)}
                        >
                          {pending && generandoId === a.id ? "Generando..." : "Generar"}
                        </button>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">Todavía no hay archivos aquí.</p>
          )}
        </section>
      )}

      {mostrarSueltos && (
        <>
          {canEdit && (
            <section className="section-card">
              <h2>Subir un formato propio</h2>
              <p className="page-intro" style={{ marginTop: 0 }}>
                Para un Word/Excel puntual, aparte de la biblioteca
                compartida — con marcadores entre paréntesis (por
                ejemplo, "(aquí va el nombre de la empresa)" o "(aquí va
                el NIT)").
              </p>
              <form id="subir-formato-form" action={handleSubirPropio} className="inline-form-row">
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
            <h2>Documentos sueltos generados</h2>
            {documentosSueltos && documentosSueltos.length > 0 ? (
              <ul className="file-list">
                {documentosSueltos.map((d) => (
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
                        onClick={() => handleBorrarSuelto(d.id, d.ruta_storage)}
                      >
                        Borrar
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">
                Todavía no has subido ningún formato propio, aparte de los
                de la biblioteca.
              </p>
            )}
          </section>
        </>
      )}
    </>
  );
}
