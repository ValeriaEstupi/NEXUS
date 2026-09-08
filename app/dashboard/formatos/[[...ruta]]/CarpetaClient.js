"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  crearCarpeta,
  renombrarCarpeta,
  deleteCarpeta,
  subirArchivoBiblioteca,
  deleteArchivoBiblioteca,
} from "@/app/lib/actions/formatosBiblioteca";
import { formatFechaHora } from "@/app/lib/helpers";
import { LayersIcon } from "@/app/dashboard/Icons";

const BANNERS = [
  "linear-gradient(135deg, #0f766e 0%, #134e4a 100%)",
  "linear-gradient(135deg, #0e7490 0%, #164e63 100%)",
  "linear-gradient(135deg, #059669 0%, #065f46 100%)",
  "linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)",
];

export default function CarpetaClient({ carpetaId, nombreActual, rutaSegmentos, subcarpetas, archivos, esFormato, isAppAdmin }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleCrearCarpeta(formData) {
    setError(null);
    formData.set("parent_id", carpetaId || "");
    startTransition(async () => {
      const res = await crearCarpeta(formData);
      if (res?.error) setError(res.error);
      else document.getElementById("crear-carpeta-form")?.reset();
    });
  }

  function handleSubirArchivo(formData) {
    setError(null);
    formData.set("carpeta_id", carpetaId);
    startTransition(async () => {
      const res = await subirArchivoBiblioteca(formData);
      if (res?.error) setError(res.error);
      else document.getElementById("subir-archivo-form")?.reset();
    });
  }

  async function handleBorrarArchivo(id, rutaStorage) {
    if (!confirm("¿Borrar este archivo de la biblioteca? Afecta a todas las empresas.")) return;
    const res = await deleteArchivoBiblioteca(id, rutaStorage, carpetaId);
    if (res?.error) setError(res.error);
  }

  return (
    <>
      {error && <div className="message error">{error}</div>}

      {isAppAdmin && carpetaId && (
        <RenombrarControl id={carpetaId} nombreActual={nombreActual} parentId={rutaSegmentos[rutaSegmentos.length - 2] || null} label="Renombrar esta carpeta" setError={setError} />
      )}

      {subcarpetas.length > 0 && (
        <div className="group-card-grid">
          {subcarpetas.map((sc, i) => (
            <SubcarpetaCard
              key={sc.id}
              carpeta={sc}
              href={`/dashboard/formatos/${[...rutaSegmentos, sc.id].join("/")}`}
              banner={BANNERS[i % BANNERS.length]}
              isAppAdmin={isAppAdmin}
              parentId={carpetaId}
              setError={setError}
            />
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
                  📄{" "}
                  {a.url ? (
                    <a href={a.url} target="_blank" rel="noreferrer">
                      {a.nombre_archivo}
                    </a>
                  ) : (
                    a.nombre_archivo
                  )}{" "}
                  <span className="muted small">— {formatFechaHora(a.created_at)}</span>
                  {isAppAdmin && (
                    <button
                      type="button"
                      className="secondary"
                      style={{ padding: "2px 8px", fontSize: "0.7rem", marginLeft: 8 }}
                      onClick={() => handleBorrarArchivo(a.id, a.ruta_storage)}
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
            <form id="subir-archivo-form" action={handleSubirArchivo} className="inline-form-row">
              <input type="file" name="archivo" accept={esFormato ? ".docx,.xlsx" : undefined} required />
              <button type="submit" disabled={pending}>
                {pending ? "Subiendo..." : "Agregar archivo"}
              </button>
            </form>
          )}
        </section>
      )}

      {isAppAdmin && (
        <section className="section-card">
          <h2>Crear subcarpeta aquí</h2>
          <form id="crear-carpeta-form" action={handleCrearCarpeta} className="form-grid">
            <div>
              <label>Nombre</label>
              <input type="text" name="nombre" placeholder="ej. Marco Estratégico" required />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
              <input type="checkbox" name="es_formato" id="es_formato" style={{ width: "auto", margin: 0 }} />
              <label htmlFor="es_formato" style={{ margin: 0 }}>
                Es de Formatos (solo Word/Excel con marcadores)
              </label>
            </div>
            <button type="submit" disabled={pending}>
              {pending ? "Creando..." : "Crear subcarpeta"}
            </button>
          </form>
        </section>
      )}
    </>
  );
}

function SubcarpetaCard({ carpeta, href, banner, isAppAdmin, parentId, setError }) {
  const [renombrando, setRenombrando] = useState(false);

  async function handleBorrar() {
    if (!confirm("¿Borrar esta subcarpeta? Se borra también todo lo que tenga dentro.")) return;
    const res = await deleteCarpeta(carpeta.id, parentId);
    if (res?.error) setError(res.error);
  }

  return (
    <div>
      {renombrando ? (
        <div className="card inline-card" style={{ padding: 12 }}>
          <RenombrarInlineForm
            id={carpeta.id}
            nombreActual={carpeta.nombre}
            parentId={parentId}
            setError={setError}
            onDone={() => setRenombrando(false)}
          />
        </div>
      ) : (
        <Link href={href} className="group-card">
          <div className="group-card-banner" style={{ background: banner }}>
            <LayersIcon size={20} className="group-card-icon" />
          </div>
          <div className="group-card-body">
            <strong>{carpeta.nombre}</strong>
            {carpeta.es_formato && <span className="muted small">Word/Excel con marcadores</span>}
          </div>
        </Link>
      )}
      {isAppAdmin && !renombrando && (
        <div className="actions-row" style={{ marginTop: 4 }}>
          <button
            type="button"
            className="secondary"
            style={{ padding: "2px 8px", fontSize: "0.7rem" }}
            onClick={() => setRenombrando(true)}
          >
            Renombrar
          </button>
          <button
            type="button"
            className="secondary"
            style={{ padding: "2px 8px", fontSize: "0.7rem" }}
            onClick={handleBorrar}
          >
            Borrar subcarpeta
          </button>
        </div>
      )}
    </div>
  );
}

function RenombrarControl({ id, nombreActual, parentId, label, setError }) {
  const [renombrando, setRenombrando] = useState(false);

  if (renombrando) {
    return (
      <div className="card inline-card" style={{ padding: 12, marginBottom: 16 }}>
        <RenombrarInlineForm id={id} nombreActual={nombreActual} parentId={parentId} setError={setError} onDone={() => setRenombrando(false)} />
      </div>
    );
  }

  return (
    <button type="button" className="secondary" style={{ marginBottom: 16 }} onClick={() => setRenombrando(true)}>
      {label}
    </button>
  );
}

function RenombrarInlineForm({ id, nombreActual, parentId, setError, onDone }) {
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData) {
    setError(null);
    const nombre = formData.get("nombre");
    startTransition(async () => {
      const res = await renombrarCarpeta(id, nombre, parentId);
      if (res?.error) setError(res.error);
      else onDone();
    });
  }

  return (
    <form action={handleSubmit} className="inline-form-row">
      <input type="text" name="nombre" defaultValue={nombreActual} required autoFocus />
      <button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Guardar"}
      </button>
      <button type="button" className="secondary" onClick={onDone}>
        Cancelar
      </button>
    </form>
  );
}
