"use client";

import { useState, useTransition } from "react";
import { updateConductor, deleteConductor } from "@/app/lib/actions/conductores";
import { estadoVencimiento, formatFecha, CONDUCTOR_ESTADO_LABEL } from "@/app/lib/helpers";

export default function ConductorRow({ conductor, empresaId, vehiculos, canEdit, canDelete }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  const licenciaEstado = estadoVencimiento(conductor.fecha_vencimiento_licencia);
  const examenEstado = estadoVencimiento(conductor.fecha_vencimiento_examen_medico);
  const vehiculo = vehiculos.find((v) => v.id === conductor.vehiculo_asignado_id);

  function handleSave(formData) {
    setError(null);
    const data = Object.fromEntries(formData.entries());
    startTransition(async () => {
      const res = await updateConductor(conductor.id, data, empresaId);
      if (res?.error) setError(res.error);
      else setOpen(false);
    });
  }

  async function handleDelete() {
    if (!confirm(`¿Borrar a ${conductor.nombre_completo}?`)) return;
    const res = await deleteConductor(conductor.id, empresaId);
    if (res?.error) setError(res.error);
  }

  return (
    <>
      <tr>
        <td>
          <strong>{conductor.nombre_completo}</strong>
          <div className="muted small">{conductor.numero_documento}</div>
        </td>
        <td>
          <span className={`badge badge-${conductor.estado}`}>
            {CONDUCTOR_ESTADO_LABEL[conductor.estado]}
          </span>
        </td>
        <td>
          <span className={`badge badge-${licenciaEstado}`}>
            {formatFecha(conductor.fecha_vencimiento_licencia)}
          </span>
        </td>
        <td>
          <span className={`badge badge-${examenEstado}`}>
            {formatFecha(conductor.fecha_vencimiento_examen_medico)}
          </span>
        </td>
        <td>{vehiculo?.placa || "—"}</td>
        <td className="actions-row">
          {canEdit && (
            <button type="button" className="secondary" onClick={() => setOpen(!open)}>
              {open ? "Cerrar" : "Editar"}
            </button>
          )}
          {canDelete && (
            <button type="button" className="danger" onClick={handleDelete}>
              Borrar
            </button>
          )}
        </td>
      </tr>
      {open && (
        <tr>
          <td colSpan={6}>
            <div className="section-card" style={{ margin: "6px 0" }}>
              {error && <div className="message error">{error}</div>}
              <form action={handleSave} className="form-grid">
                <div>
                  <label>Nombre completo *</label>
                  <input name="nombreCompleto" defaultValue={conductor.nombre_completo} required />
                </div>
                <div>
                  <label>Documento *</label>
                  <input name="numeroDocumento" defaultValue={conductor.numero_documento} required />
                </div>
                <div>
                  <label>Teléfono</label>
                  <input name="telefono" defaultValue={conductor.telefono || ""} />
                </div>
                <div style={{ maxWidth: 110 }}>
                  <label>Categoría licencia</label>
                  <input name="categoriaLicencia" defaultValue={conductor.categoria_licencia || ""} />
                </div>
                <div>
                  <label>Vence licencia</label>
                  <input
                    name="fechaVencimientoLicencia"
                    type="date"
                    defaultValue={conductor.fecha_vencimiento_licencia || ""}
                  />
                </div>
                <div>
                  <label>Último examen médico</label>
                  <input
                    name="fechaUltimoExamenMedico"
                    type="date"
                    defaultValue={conductor.fecha_ultimo_examen_medico || ""}
                  />
                </div>
                <div>
                  <label>Vence examen médico</label>
                  <input
                    name="fechaVencimientoExamenMedico"
                    type="date"
                    defaultValue={conductor.fecha_vencimiento_examen_medico || ""}
                  />
                </div>
                <div>
                  <label>Curso conducción segura</label>
                  <input
                    name="fechaCursoConduccionSegura"
                    type="date"
                    defaultValue={conductor.fecha_curso_conduccion_segura || ""}
                  />
                </div>
                <div>
                  <label>Vehículo asignado</label>
                  <select name="vehiculoAsignadoId" defaultValue={conductor.vehiculo_asignado_id || ""}>
                    <option value="">Sin asignar</option>
                    {vehiculos.map((v) => (
                      <option key={v.id} value={v.id}>{v.placa}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Estado</label>
                  <select name="estado" defaultValue={conductor.estado}>
                    {Object.entries(CONDUCTOR_ESTADO_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flexBasis: "100%" }}>
                  <label>Observaciones</label>
                  <textarea name="observaciones" rows={2} defaultValue={conductor.observaciones || ""} />
                </div>
                <button type="submit" disabled={pending}>
                  {pending ? "Guardando..." : "Guardar cambios"}
                </button>
              </form>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
