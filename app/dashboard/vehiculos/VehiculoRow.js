"use client";

import { useState, useTransition } from "react";
import { updateVehiculo, deleteVehiculo } from "../../lib/actions/vehiculos";
import { estadoVencimiento, formatFecha, VEHICULO_ESTADO_LABEL } from "../../lib/helpers";

export default function VehiculoRow({ vehiculo, canEdit, canDelete }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  const soatEstado = estadoVencimiento(vehiculo.fecha_vencimiento_soat);
  const tecnoEstado = estadoVencimiento(vehiculo.fecha_vencimiento_tecnomecanica);

  function handleSave(formData) {
    setError(null);
    const data = Object.fromEntries(formData.entries());
    startTransition(async () => {
      const res = await updateVehiculo(vehiculo.id, data);
      if (res?.error) setError(res.error);
      else setOpen(false);
    });
  }

  async function handleDelete() {
    if (!confirm(`¿Borrar el vehículo ${vehiculo.placa}?`)) return;
    const res = await deleteVehiculo(vehiculo.id);
    if (res?.error) setError(res.error);
  }

  return (
    <>
      <tr>
        <td>
          <strong>{vehiculo.placa}</strong>
          <div className="muted small">{vehiculo.tipo_vehiculo || "—"}</div>
        </td>
        <td>
          <span className={`badge badge-${vehiculo.estado}`}>
            {VEHICULO_ESTADO_LABEL[vehiculo.estado]}
          </span>
        </td>
        <td>
          <span className={`badge badge-${soatEstado}`}>
            {formatFecha(vehiculo.fecha_vencimiento_soat)}
          </span>
        </td>
        <td>
          <span className={`badge badge-${tecnoEstado}`}>
            {formatFecha(vehiculo.fecha_vencimiento_tecnomecanica)}
          </span>
        </td>
        <td>{formatFecha(vehiculo.fecha_proximo_mantenimiento)}</td>
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
                  <label>Placa *</label>
                  <input name="placa" defaultValue={vehiculo.placa} required />
                </div>
                <div>
                  <label>Tipo</label>
                  <input name="tipoVehiculo" defaultValue={vehiculo.tipo_vehiculo || ""} />
                </div>
                <div>
                  <label>Marca</label>
                  <input name="marca" defaultValue={vehiculo.marca || ""} />
                </div>
                <div style={{ maxWidth: 110 }}>
                  <label>Año</label>
                  <input name="modeloAnio" type="number" defaultValue={vehiculo.modelo_anio || ""} />
                </div>
                <div style={{ maxWidth: 110 }}>
                  <label>Capacidad</label>
                  <input
                    name="capacidadPasajeros"
                    type="number"
                    defaultValue={vehiculo.capacidad_pasajeros || ""}
                  />
                </div>
                <div>
                  <label>Propietario</label>
                  <input name="propietario" defaultValue={vehiculo.propietario || ""} />
                </div>
                <div>
                  <label>Estado</label>
                  <select name="estado" defaultValue={vehiculo.estado}>
                    {Object.entries(VEHICULO_ESTADO_LABEL).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Vence SOAT</label>
                  <input
                    name="fechaVencimientoSoat"
                    type="date"
                    defaultValue={vehiculo.fecha_vencimiento_soat || ""}
                  />
                </div>
                <div>
                  <label>Vence tecnomecánica</label>
                  <input
                    name="fechaVencimientoTecnomecanica"
                    type="date"
                    defaultValue={vehiculo.fecha_vencimiento_tecnomecanica || ""}
                  />
                </div>
                <div>
                  <label>Próximo mantenimiento</label>
                  <input
                    name="fechaProximoMantenimiento"
                    type="date"
                    defaultValue={vehiculo.fecha_proximo_mantenimiento || ""}
                  />
                </div>
                <div style={{ flexBasis: "100%" }}>
                  <label>Observaciones</label>
                  <textarea name="observaciones" rows={2} defaultValue={vehiculo.observaciones || ""} />
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
