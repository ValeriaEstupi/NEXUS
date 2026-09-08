// Supabase Storage no acepta con confianza tildes/eñes ni ciertos
// caracteres especiales en la "ruta" interna donde se guarda un
// archivo (aunque el nombre visible en pantalla sí puede tener
// tildes normalmente). Esta función arma una versión segura del
// nombre SOLO para la ruta de Storage — el nombre original completo
// se guarda aparte, en la columna "nombre_archivo", y es el que se ve
// en la pantalla.
export function sanitizarNombreArchivo(nombre) {
  const limpio = (nombre || "archivo")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes/diéresis
    .replace(/[^a-zA-Z0-9._-]+/g, "_") // todo lo demás (espacios, ñ, símbolos) -> _
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  return limpio || "archivo";
}
