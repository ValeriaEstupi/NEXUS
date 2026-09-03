"use client";

import { useState, useTransition } from "react";
import {
  updateCumplimientoItem,
  uploadEvidencia,
  deleteEvidencia,
  updateRequisitoPesv,
  deleteRequisitoPesv,
  updateEstandarSgsst,
  deleteEstandarSgsst,
  updateRequisitoIso,
  deleteRequisitoIso,
} from "@/app/lib/actions/cumplimiento";
import { ESTADO_CUMPLIMIENTO_LABEL, formatFecha, estadoVencimiento } from "@/app/lib/helpers";

// Qué acción de catálogo llamar según el tipo de ítem (PESV, SG-SST o
// ISO), y cómo se llama ese ítem en los botones ("Editar requisito"
// vs "Editar estándar").
const CATALOG_FNS = {
  pesv: { update: updateRequisitoPesv, delete: deleteRequisitoPesv, label: "requisito" },
  sgsst: { update: updateEstandarSgsst, delete: deleteEstandarSgsst, label: "estándar" },
  iso: { update: updateRequisitoIso, delete: deleteRequisitoIso, label: "requisito" },
};

// Una fila de checklist reutilizada por PESV, SG-SST e ISO: muestra el
// requisito/estándar, su estado real de avance, quién responde por él,
// la fecha límite y las evidencias adjuntas. Se puede expandir para
// editar todo eso, subir documentos de soporte, y (si tienes permiso)
// editar el propio texto del requisito/estándar o borrarlo del catálogo.
export default function ChecklistItem({ item, meta, profiles, pilares, fases, normas, canEdit, canDelete, empresaId }) {
  const [open, setOpen] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState(false);
  const [estado, setEstado] = useState(item.estado);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  function handleEstadoChange(e) {
    const value = e.target.value;
    const previous = estado;
    setEstado(value);
    setError(null);
    startTransition(async () => {
      const res = await updateCumplimientoItem(item.id, { estado: value }, empresaId);
      if (res?.error) {
        setEstado(previous);
        setError(res.error);
      }
    });
  }

  async function handleDetailsSubmit(formData) {
    setError(null);
    const res = await updateCumplimientoItem(
      item.id,
      {
        responsableId: formData.get("responsable_id") || null,
        fechaLimite: formData.get("fecha_limite") || null,
        observaciones: formData.get("observaciones") || null,
      },
      empresaId
    );
    if (res?.error) {
      setError(res.error);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleUpload(formData) {
    setError(null);
    formData.set("cumplimiento_item_id", item.id);
    formData.set("empresa_id", empresaId);
    const res = await uploadEvidencia(formData);
    if (res?.error) setError(res.error);
  }

  async function handleDeleteEvidencia(evidenciaId, rutaStorage) {
    if (!confirm("¿Borrar esta evidencia?")) return;
    const res = await deleteEvidencia(evidenciaId, rutaStorage, empresaId);
    if (res?.error) setError(res.error);
  }

  async function handleCatalogSave(formData) {
    setError(null);
    const updates = {
      codigo: formData.get("codigo") || null,
      descripcion: formData.get("descripcion"),
      faseId: formData.get("fase_id") || null,
    };
    if (meta.tipo === "pesv") {
      updates.pilarId = formData.get("pilar_id");
      updates.fuenteNormativa = formData.get("fuente") || null;
    } else if (meta.tipo === "sgsst") {
      updates.componente = formData.get("componente");
      updates.puntaje = formData.get("puntaje");
    } else if (meta.tipo === "iso") {
      updates.normaId = formData.get("norma_id");
    }
    const res = await CATALOG_FNS[meta.tipo].update(meta.id, updates, empresaId);
    if (res?.error) setError(res.error);
    else setEditingCatalog(false);
  }

  async function handleToggleActivo() {
    setError(null);
    const res = await CATALOG_FNS[meta.tipo].update(meta.id, { activo: !meta.activo }, empresaId);
    if (res?.error) setError(res.error);
  }

  async function handleDeleteCatalog() {
    if (!confirm("¿Borrar este ítem del catálogo? También se borra su historial de seguimiento y evidencias.")) return;
    const res = await CATALOG_FNS[meta.tipo].delete(meta.id, empresaId);
    if (res?.error) setError(res.error);
  }

  const vencimiento = estadoVencimiento(item.fecha_limite, 15);
  const responsable = profiles.find((p) => p.id === item.responsable_id);

  return (
    <>
      <tr style={meta.activo === false ? { opacity: 0.55 } : undefined}>
        <td>
          {meta.codigo && <strong>{meta.codigo}. </strong>}
          {meta.descripcion}
          {meta.sub && <div className="muted small">{meta.sub}</div>}
          {meta.activo === false && <span className="badge badge-inactivo">Inactivo</span>}
        </td>
        <td>
          {canEdit ? (
            <select
              value={estado}
              onChange={handleEstadoChange}
              disabled={pending}
              className={`badge badge-${estado}`}
            >
              {Object.entries(ESTADO_CUMPLIMIENTO_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <span className={`badge badge-${estado}`}>
              {ESTADO_CUMPLIMIENTO_LABEL[estado]}
            </span>
          )}
        </td>
        <td>{responsable ? responsable.full_name || responsable.email : "—"}</td>
        <td>
          {item.fecha_limite ? (
            <span className={`badge badge-${vencimiento}`}>
              {formatFecha(item.fecha_limite)}
            </span>
          ) : (
            <span className="muted small">Sin fecha</span>
          )}
        </td>
        <td>
          {item.evidencias?.length > 0 ? `📎 ${item.evidencias.length}` : "—"}
        </td>
        <td>
          <button type="button" className="secondary" onClick={() => setOpen(!open)}>
            {open ? "Cerrar" : "Gestionar"}
          </button>
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6}>
            <div className="section-card" style={{ margin: "6px 0" }}>
              {error && <div className="message error">{error}</div>}

              {canEdit && !editingCatalog && (
                <div className="actions-row" style={{ marginBottom: 12 }}>
                  <button type="button" className="secondary" onClick={() => setEditingCatalog(true)}>
                    ✏️ Editar {CATALOG_FNS[meta.tipo].label}
                  </button>
                  <button type="button" className="secondary" onClick={handleToggleActivo}>
                    {meta.activo === false ? "Reactivar" : "Desactivar"}
                  </button>
                  {canDelete && (
                    <button type="button" className="danger" onClick={handleDeleteCatalog}>
                      Borrar del catálogo
                    </button>
                  )}
                </div>
              )}

              {editingCatalog ? (
                <form action={handleCatalogSave} className="form-grid" style={{ marginBottom: 16 }}>
                  <div style={{ maxWidth: 100 }}>
                    <label>Código</label>
                    <input name="codigo" defaultValue={meta.codigo || ""} />
                  </div>
                  {meta.tipo === "pesv" && (
                    <div>
                      <label>Pilar</label>
                      <select name="pilar_id" defaultValue={meta.pilarId}>
                        {pilares.map((p) => (
                          <option key={p.id} value={p.id}>{p.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {meta.tipo === "sgsst" && (
                    <div>
                      <label>Componente</label>
                      <input name="componente" defaultValue={meta.componente || ""} required />
                    </div>
                  )}
                  {meta.tipo === "iso" && (
                    <div>
                      <label>Norma</label>
                      <select name="norma_id" defaultValue={meta.normaId}>
                        {normas.map((n) => (
                          <option key={n.id} value={n.id}>{n.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div style={{ maxWidth: 160 }}>
                    <label>Fase PHVA</label>
                    <select name="fase_id" defaultValue={meta.faseId || ""}>
                      <option value="">Sin definir</option>
                      {fases.map((f) => (
                        <option key={f.id} value={f.id}>{f.nombre}</option>
                      ))}
                    </select>
                  </div>
                  {meta.tipo === "sgsst" && (
                    <div style={{ maxWidth: 100 }}>
                      <label>Puntaje</label>
                      <input name="puntaje" type="number" step="0.25" min="0" defaultValue={meta.puntaje || 0} />
                    </div>
                  )}
                  <div style={{ flexBasis: "100%" }}>
                    <label>Descripción</label>
                    <textarea name="descripcion" rows={2} defaultValue={meta.descripcion} required />
                  </div>
                  {meta.tipo === "pesv" && (
                    <div style={{ flexBasis: "100%" }}>
                      <label>Fuente normativa</label>
                      <input name="fuente" defaultValue={meta.fuente || ""} />
                    </div>
                  )}
                  <button type="submit">Guardar cambios del ítem</button>
                  <button type="button" className="secondary" onClick={() => setEditingCatalog(false)}>
                    Cancelar
                  </button>
                </form>
              ) : (
                meta.fuente && <p className="muted small">Fuente normativa: {meta.fuente}</p>
              )}

              {canEdit ? (
                <form action={handleDetailsSubmit} className="form-grid">
                  <div>
                    <label>Responsable</label>
                    <select name="responsable_id" defaultValue={item.responsable_id || ""}>
                      <option value="">Sin asignar</option>
                      {profiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.full_name || p.email}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Fecha límite</label>
                    <input
                      type="date"
                      name="fecha_limite"
                      defaultValue={item.fecha_limite || ""}
                    />
                  </div>
                  <div style={{ flexBasis: "100%" }}>
                    <label>Observaciones</label>
                    <textarea
                      name="observaciones"
                      rows={2}
                      defaultValue={item.observaciones || ""}
                    />
                  </div>
                  <button type="submit">{saved ? "Guardado ✓" : "Guardar"}</button>
                </form>
              ) : (
                <p className="muted small">
                  {item.observaciones || "Sin observaciones."}
                </p>
              )}

              <h3 style={{ fontSize: "0.85rem", margin: "16px 0 6px" }}>
                Evidencias
              </h3>
              {item.evidencias?.length > 0 ? (
                <ul className="file-list">
                  {item.evidencias.map((ev) => (
                    <li key={ev.id}>
                      📄{" "}
                      {ev.url ? (
                        <a href={ev.url} target="_blank" rel="noreferrer">
                          {ev.nombre_archivo}
                        </a>
                      ) : (
                        ev.nombre_archivo
                      )}
                      {canEdit && (
                        <button
                          type="button"
                          className="secondary"
                          style={{ padding: "2px 8px", fontSize: "0.7rem" }}
                          onClick={() => handleDeleteEvidencia(ev.id, ev.ruta_storage)}
                        >
                          Borrar
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted small">Todavía no hay evidencias adjuntas.</p>
              )}

              {canEdit && (
                <form action={handleUpload} className="inline-form-row">
                  <input type="file" name="archivo" required />
                  <button type="submit">Subir evidencia</button>
                </form>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
