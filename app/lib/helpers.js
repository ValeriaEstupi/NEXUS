// Funciones pequeñas que se repiten en varias pantallas: calcular si
// una fecha (SOAT, licencia, examen médico...) ya venció o está por
// vencer, y darle formato legible.

export function estadoVencimiento(fecha, diasAlerta = 30) {
  if (!fecha) return "sin_fecha";
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const f = new Date(`${fecha}T00:00:00`);
  const diffDias = Math.round((f - hoy) / 86400000);
  if (diffDias < 0) return "vencido";
  if (diffDias <= diasAlerta) return "por_vencer";
  return "vigente";
}

export function formatFecha(fecha) {
  if (!fecha) return "—";
  return new Date(`${fecha}T00:00:00`).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatFechaHora(fecha) {
  if (!fecha) return "—";
  return new Date(fecha).toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ESTADO_CUMPLIMIENTO_LABEL = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  cumplido: "Cumplido",
  no_aplica: "No aplica",
};

export const VENCIMIENTO_LABEL = {
  vigente: "Vigente",
  por_vencer: "Por vencer",
  vencido: "Vencido",
  sin_fecha: "Sin fecha",
};

export const INCIDENTE_ESTADO_LABEL = {
  abierto: "Abierto",
  en_investigacion: "En investigación",
  cerrado: "Cerrado",
};

export const VEHICULO_ESTADO_LABEL = {
  activo: "Activo",
  mantenimiento: "En mantenimiento",
  inactivo: "Inactivo",
  retirado: "Retirado",
};

export const CONDUCTOR_ESTADO_LABEL = {
  activo: "Activo",
  inactivo: "Inactivo",
  retirado: "Retirado",
};

export const CLASIFICACION_INCIDENTE_LABEL = {
  incidente: "Incidente (sin consecuencias)",
  solo_danos: "Solo daños materiales",
  accidente_leve: "Accidente leve",
  accidente_grave: "Accidente grave",
  accidente_mortal: "Accidente mortal",
};

export const CAPACITACION_TIPO_LABEL = {
  pesv: "PESV",
  sgsst: "SG-SST",
  otra: "Otra",
};

export const PLAN_ACCION_ORIGEN_LABEL = {
  incidente: "Incidente",
  auditoria: "Auditoría",
  cumplimiento: "Ítem de cumplimiento",
  otro: "Otro",
};

export const PLAN_ACCION_ESTADO_LABEL = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  cumplido: "Cumplido",
  vencido: "Vencido",
};
