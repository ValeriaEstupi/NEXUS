"use client";

import { useState, useTransition } from "react";
import { setUserRole } from "../../lib/actions/configuracion";

const ROLES = [
  { value: "lector", label: "Lectura" },
  { value: "editor", label: "Editor" },
  { value: "super_admin", label: "Super admin" },
];

export default function UsuariosTable({ usuarios, myId, canManage }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleChange(userId, role) {
    setError(null);
    startTransition(async () => {
      const res = await setUserRole(userId, role);
      if (res?.error) setError(res.error);
    });
  }

  return (
    <section className="section-card">
      <h2>👥 Usuarios y roles</h2>
      <p className="muted small">
        Toda persona que se registra queda con rol de solo lectura. Solo un
        super admin puede subirle el rol.
      </p>
      {error && <div className="message error">{error}</div>}
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name || "—"}{u.id === myId && <span className="muted small"> (tú)</span>}</td>
                <td>{u.email}</td>
                <td>
                  {canManage ? (
                    <select
                      defaultValue={u.role}
                      disabled={pending}
                      onChange={(e) => handleChange(u.id, e.target.value)}
                    >
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`badge`}>{ROLES.find((r) => r.value === u.role)?.label || u.role}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
