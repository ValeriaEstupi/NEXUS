"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { crearSubcategoria, deleteSubcategoria } from "@/app/lib/actions/formatosBiblioteca";
import { LayersIcon } from "@/app/dashboard/Icons";

const BANNER = "linear-gradient(135deg, #b45309 0%, #78350f 100%)";

export default function SubcategoriasClient({ categoriaId, subcategorias, isAppAdmin, soloFormulario }) {
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  function handleCrear(formData) {
    setError(null);
    formData.set("categoria_id", categoriaId);
    startTransition(async () => {
      const res = await crearSubcategoria(formData);
      if (res?.error) setError(res.error);
      else document.getElementById("crear-subcategoria-form")?.reset();
    });
  }

  async function handleBorrar(id) {
    if (!confirm("¿Borrar esta subcarpeta? Se borran también los archivos que tenga dentro.")) return;
    const res = await deleteSubcategoria(id, categoriaId);
    if (res?.error) setError(res.error);
  }

  return (
    <>
      {error && <div className="message error">{error}</div>}

      {!soloFormulario && (
        <div className="group-card-grid">
          {subcategorias.map((sc) => (
            <div key={sc.id} style={{ position: "relative" }}>
              <Link href={`/dashboard/formatos/${categoriaId}/${sc.id}`} className="group-card">
                <div className="group-card-banner" style={{ background: BANNER }}>
                  <LayersIcon size={20} className="group-card-icon" />
                </div>
                <div className="group-card-body">
                  <strong>{sc.nombre}</strong>
                </div>
              </Link>
              {isAppAdmin && (
                <button
                  type="button"
                  className="secondary"
                  style={{ padding: "2px 8px", fontSize: "0.7rem", marginTop: 4 }}
                  onClick={() => handleBorrar(sc.id)}
                >
                  Borrar subcarpeta
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isAppAdmin && (
        <form id="crear-subcategoria-form" action={handleCrear} className="inline-form-row" style={{ marginTop: soloFormulario ? 0 : 16 }}>
          <input type="text" name="nombre" placeholder="Nombre de la subcarpeta (ej. Planeación)" required />
          <button type="submit" disabled={pending}>
            {pending ? "Creando..." : "Crear subcarpeta"}
          </button>
        </form>
      )}
    </>
  );
}
