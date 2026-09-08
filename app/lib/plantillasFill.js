// Motor de "rellenar formatos": busca frases entre paréntesis (los
// marcadores que la persona escribe a mano en su documento, por
// ejemplo "(aquí va el nombre de la empresa)") y las reemplaza por el
// dato real de la empresa, según palabras clave. Cualquier paréntesis
// que no reconozca lo deja intacto (para no dañar texto legítimo del
// documento, como "(ver anexo 1)").
//
// El color en el que la persona haya escrito el marcador (por ejemplo
// rojo) no importa acá — Word/Excel lo guardan como texto normal, el
// color es solo un recordatorio visual para quien redacta.

function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // quita tildes
}

// Devuelve el valor a usar (o null si el paréntesis no coincide con
// ningún dato conocido de la empresa).
function resolverMarcador(fraseNormalizada, datos) {
  const tiene = (...palabras) => palabras.every((p) => fraseNormalizada.includes(p));

  if (tiene("nombre", "empresa") || tiene("razon", "social")) {
    return datos.razon_social || "";
  }
  if (fraseNormalizada.includes("nit")) {
    return datos.nit || "Sin NIT registrado";
  }
  if (tiene("vehiculo")) {
    return datos.numero_vehiculos != null ? String(datos.numero_vehiculos) : "Sin definir";
  }
  if (tiene("trabajador")) {
    return datos.numero_trabajadores != null ? String(datos.numero_trabajadores) : "Sin definir";
  }
  if (tiene("riesgo") && fraseNormalizada.includes("arl")) {
    return datos.nivel_riesgo_arl || "Sin definir";
  }
  if (fraseNormalizada.includes("fecha")) {
    return new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" });
  }
  return null;
}

// Reemplaza los marcadores dentro de un bloque de texto/XML. Solo
// toca paréntesis de largo razonable (3-90 caracteres) que contengan
// al menos una letra, para no meterse con sintaxis del archivo.
export function rellenarPlaceholders(contenido, datosEmpresa) {
  return contenido.replace(/\(([^()]{3,90})\)/g, (match, frase) => {
    if (!/[a-zA-Záéíóúñ]/i.test(frase)) return match;
    const valor = resolverMarcador(normalizar(frase), datosEmpresa);
    return valor === null ? match : valor;
  });
}
