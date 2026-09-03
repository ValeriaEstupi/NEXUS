// Genera enlaces de descarga temporales (10 minutos) para todas las
// evidencias de una lista de "cumplimiento_items", en una sola llamada
// a Supabase Storage en vez de una por archivo.
export async function withSignedUrls(supabase, cumplimientoItems) {
  const allPaths = [];
  for (const ci of cumplimientoItems) {
    for (const ev of ci.evidencias || []) allPaths.push(ev.ruta_storage);
  }

  if (allPaths.length === 0) {
    return cumplimientoItems;
  }

  const { data } = await supabase.storage
    .from("evidencias")
    .createSignedUrls(allPaths, 600);

  const urlByPath = {};
  (data || []).forEach((d) => {
    if (d?.signedUrl) urlByPath[d.path] = d.signedUrl;
  });

  return cumplimientoItems.map((ci) => ({
    ...ci,
    evidencias: (ci.evidencias || []).map((ev) => ({
      ...ev,
      url: urlByPath[ev.ruta_storage],
    })),
  }));
}
