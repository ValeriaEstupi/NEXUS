// Ayudante compartido por los archivos de acciones ("use server"). No
// lleva "use server" propio porque no es una acción en sí — solo lo
// usan internamente los demás archivos de esta carpeta.
export async function requireUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Debes iniciar sesión.");
  }
  return user;
}
