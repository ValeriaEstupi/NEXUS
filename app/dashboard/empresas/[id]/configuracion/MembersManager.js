"use client";

import { useState, useTransition } from "react";
import { inviteMember, updateMemberRole, removeMember } from "@/app/lib/actions/empresas";
import { EMPRESA_ROLE_LABEL } from "@/app/lib/helpers";

export default function MembersManager({ empresaId, members, myId, canManage }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleInvite(formData) {
    setError(null);
    const email = formData.get("email");
    const role = formData.get("role");
    startTransition(async () => {
      const res = await inviteMember(empresaId, email, role);
      if (res?.error) setError(res.error);
      else document.getElementById("invitar-form")?.reset();
    });
  }

  async function handleRoleChange(userId, role) {
    setError(null);
    const res = await updateMemberRole(empresaId, userId, role);
    if (res?.error) setError(res.error);
  }

  async function handleRemove(userId) {
    if (!confirm("¿Quitar a esta persona de la empresa?")) return;
    const res = await removeMember(empresaId, userId);
    if (res?.error) setError(res.error);
  }

  return (
    <section className="section-card">
      <h2>👥 Miembros de esta empresa</h2>
      <p className="muted small">
        Toda persona que se registra en NEXUS existe como cuenta, pero solo
        ve esta empresa si la invitas aquí. El rol se administra por
        empresa: puede ser admin de una y solo lectura en otra.
      </p>
      {error && <div className="message error">{error}</div>}

      <div className="member-chips">
        {members.map((m) => (
          <div key={m.user_id} className="member-chip">
            <div className="avatar">
              {(m.profiles?.full_name || m.profiles?.email || "?").trim().charAt(0).toUpperCase()}
            </div>
            <span>
              {m.profiles?.full_name || m.profiles?.email}
              {m.user_id === myId && " (tú)"}
            </span>
            {canManage ? (
              <select
                defaultValue={m.role}
                disabled={pending}
                onChange={(e) => handleRoleChange(m.user_id, e.target.value)}
              >
                {Object.entries(EMPRESA_ROLE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            ) : (
              <span className="role-tag">{EMPRESA_ROLE_LABEL[m.role] || m.role}</span>
            )}
            {canManage && m.user_id !== myId && (
              <button type="button" className="remove-btn" onClick={() => handleRemove(m.user_id)}>
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {canManage && (
        <form id="invitar-form" action={handleInvite} className="inline-form-row">
          <input name="email" type="email" placeholder="correo@empresa.com" required />
          <select name="role" defaultValue="lector" style={{ maxWidth: 160 }}>
            {Object.entries(EMPRESA_ROLE_LABEL).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button type="submit">Invitar</button>
        </form>
      )}
    </section>
  );
}
