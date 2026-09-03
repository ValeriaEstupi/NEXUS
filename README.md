# Nexus — Plataforma de PESV y Sistema de Gestión Integrado

Plataforma para hacer seguimiento del **Plan Estratégico de Seguridad
Vial (PESV)** y del **Sistema de Gestión de Seguridad y Salud en el
Trabajo (SG-SST)** de una empresa de transporte especial en Colombia,
bajo la reglamentación vigente (Resolución 40595 de 2022 para el PESV,
Resolución 0312 de 2019 para los Estándares Mínimos del SG-SST, y
Decreto 348 de 2015 para transporte especial).

Es un proyecto **aparte e independiente** — su propio repositorio,
su propia base de datos, su propio despliegue. No depende de ninguna
otra app.

Esta guía está escrita para alguien que **no programa**. Sigue los
pasos en orden.

---

## ¿Qué incluye esta primera entrega?

1. **Checklist normativo del PESV**, organizado por los 5 pilares
   (gestión institucional, comportamiento humano, vehículos seguros,
   infraestructura segura, atención a víctimas) y el ciclo PHVA
   (Planear, Hacer, Verificar, Actuar). Cada requisito tiene estado,
   responsable, fecha límite, observaciones y evidencia adjunta —
   y el catálogo mismo (pilares, requisitos, estándares SG-SST) se
   agrega, edita, desactiva o borra desde la propia pantalla, sin
   tocar la base de datos. Ver "Qué puede hacer el administrador"
   más abajo.
2. **Checklist de los Estándares Mínimos del SG-SST** (Resolución
   0312/2019), con el mismo seguimiento y una calificación global
   ponderada por puntaje, como exige la norma.
3. **Registro de vehículos**: placa, SOAT, tecnomecánica,
   mantenimiento, con alertas de documentos vencidos o por vencer.
4. **Registro de conductores**: licencia, exámenes médicos, curso de
   conducción segura (Ley 1503/2011), con las mismas alertas.
5. **Capacitaciones**: tema, tipo (PESV/SG-SST/otra), fecha, horas y
   lista de conductores que asistieron.
6. **Reporte de incidentes y accidentes**, viales y laborales, con
   clasificación, causas y estado de la investigación.
7. **Planes de acción**: acciones correctivas/preventivas, ligadas o
   no a un incidente, con responsable, fecha límite y estado.
8. **Indicadores**: avance del PESV por pilar, calificación del
   SG-SST, alertas de vencimiento y accidentalidad de los últimos 6
   meses.
9. **Roles de usuario**: lectura, editor y super admin (además de
   Configuración -> Empresa y Configuración -> Usuarios).

> ⚖️ **Importante para el equipo legal/HSEQ**: el catálogo de
> requisitos del PESV y de estándares del SG-SST que trae la
> plataforma de fábrica (`supabase/seed.sql`) es una **plantilla de
> partida**, redactada a partir de la estructura general de ambas
> resoluciones — no es un texto legal certificado. Antes de usarla
> para una auditoría o una inspección, contrástala contra el texto
> vigente y ajusta lo que haga falta. Editar, agregar o desactivar un
> ítem es una pantalla dentro de Nexus, no requiere volver a tocar SQL.
> Más detalle en [`docs/MARCO-NORMATIVO.md`](docs/MARCO-NORMATIVO.md).

---

## Paso 1 — Crear un proyecto de Supabase para Nexus

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto
   nuevo (gratis).
2. Ve a **SQL Editor** -> **New query**.
3. Abre [`supabase/schema.sql`](supabase/schema.sql), copia **todo**
   su contenido, pégalo y dale **Run**.
4. Repite el paso anterior con [`supabase/seed.sql`](supabase/seed.sql)
   (carga el catálogo de pilares del PESV y estándares del SG-SST).
5. Deberías ver "Success. No rows returned" en ambos casos.

---

## Paso 2 — Activar el login por correo

1. **Authentication -> Providers**: confirma que **Email** esté
   habilitado.
2. **Authentication -> URL Configuration**:
   - **Site URL**: `http://localhost:3000` por ahora.
   - **Redirect URLs**: agrega también `http://localhost:3000/auth/callback`.

---

## Paso 3 — Crear el bucket de evidencias

1. **Storage -> New bucket**.
2. Nómbralo exactamente `evidencias` (minúsculas).
3. **Déjalo privado** (no actives "Public bucket") — son documentos de
   cumplimiento, no deben quedar accesibles por un enlace público.
4. Crea el bucket y luego corre
   [`supabase/migrations/002_storage_evidencias.sql`](supabase/migrations/002_storage_evidencias.sql)
   en el SQL Editor.

---

## Paso 4 — Conectar la app con tu proyecto de Supabase

1. **Project Settings -> API**: copia **Project URL** y **anon public
   key**.
2. En este proyecto, copia `.env.local.example` a `.env.local`
   y pega esos dos valores. También copia la **Secret key** (misma
   pantalla, sección "Secret keys") en `SUPABASE_SERVICE_ROLE_KEY` —
   nunca la compartas ni la subas a GitHub.

---

## Paso 5 — Ver la app funcionando

### Camino A — Publicarla en Vercel

1. En [vercel.com](https://vercel.com), **Add New -> Project**, elige
   este repositorio de GitHub (`nexus`).
2. Agrega las variables de entorno del Paso 4.
3. **Deploy**. Vuelve al Paso 2 en Supabase y agrega la dirección real
   (`https://tu-nexus.vercel.app` y `.../auth/callback`) en Site URL y
   Redirect URLs.

### Camino B — Correrla en tu computadora

```
npm install
npm run dev
```

Abre `http://localhost:3000`.

---

## Paso 6 — Registrarte y convertirte en super admin

1. Entra a la app y regístrate (queda con rol de solo lectura).
2. En Supabase, SQL Editor, abre
   [`supabase/migrations/001_primer_super_admin.sql`](supabase/migrations/001_primer_super_admin.sql),
   cambia el correo de ejemplo por el tuyo y dale **Run**.
3. Vuelve a entrar a la app (o recarga) — ya tienes rol de super admin
   y puedes subir el rol de las demás personas desde **Configuración
   -> Usuarios**.

---

## Roles dentro de Nexus

- **Lectura**: ve todo el checklist, vehículos, conductores e
  indicadores, pero no puede editar nada. Sí puede reportar un
  incidente (cualquier persona registrada puede).
- **Editor**: administra todo el día a día — marca el avance del
  PESV/SG-SST, sube evidencias, y **agrega y edita** vehículos,
  conductores, incidentes, capacitaciones, planes de acción, pilares
  del PESV, requisitos del PESV y estándares del SG-SST.
- **Super admin**: además de lo anterior, **borra** cualquier
  registro (pilares, requisitos, estándares, vehículos, conductores,
  incidentes, capacitaciones, planes de acción) y cambia el rol de
  otras personas.

### Qué puede hacer el administrador con el catálogo normativo

Todo el catálogo del PESV y del SG-SST — no solo el seguimiento, sino
el texto mismo de la norma que carga Nexus — se administra desde la
pantalla, sin volver a tocar SQL:

- **Pilares del PESV**: en la pantalla de PESV, botón "Gestionar
  pilares" — agregar, renombrar, reordenar, desactivar o (si ya no
  tiene requisitos) borrar un pilar.
- **Requisitos del PESV y estándares del SG-SST**: cada ítem del
  checklist tiene, dentro de "Gestionar", un botón "Editar
  requisito/estándar" para cambiar su código, descripción, fuente
  normativa, pilar/componente, fase PHVA o puntaje; "Desactivar" para
  ocultarlo sin perder su historial; y "Borrar del catálogo" (solo
  super admin) para eliminarlo junto con su seguimiento y evidencias.
  Un ítem desactivado se sigue viendo (atenuado, con la etiqueta
  "Inactivo") por si hay que reactivarlo.

---

## Cómo está pensado el checklist de cumplimiento

Cada requisito del PESV y cada estándar del SG-SST tiene, aparte de su
texto, una fila de seguimiento (`cumplimiento_items`) con estado
(pendiente / en progreso / cumplido / no aplica), responsable, fecha
límite, observaciones y evidencias adjuntas. Esa fila se crea **sola**
cuando se agrega un requisito o estándar nuevo — así nunca falta el
seguimiento de un ítem nuevo que el equipo legal agregue desde la
pantalla. Más detalle técnico en
[`docs/DISENO-BASE-DE-DATOS.md`](docs/DISENO-BASE-DE-DATOS.md).

## Qué sigue (no incluido todavía)

- Notificaciones automáticas por correo de documentos por vencer
  (mismo patrón que ya usa la app de tareas, se puede portar).
- Exportar el checklist o los indicadores a PDF/Excel para radicar
  ante una autoridad.
- Vincular un plan de acción directamente a un ítem de cumplimiento
  con hallazgos (hoy se liga a un incidente o queda libre; la columna
  `cumplimiento_item_id` ya existe en la tabla `plan_accion`, falta la
  pantalla).

---

## ¿Ya tenías un proyecto de Supabase para Nexus antes de este cambio?

Si ya habías corrido `schema.sql` y `seed.sql` antes de que se
agregara la edición completa del catálogo, solo te falta correr
[`supabase/migrations/003_editar_catalogos.sql`](supabase/migrations/003_editar_catalogos.sql)
en el SQL Editor (una sola vez). Si estás empezando de cero, no hace
falta: ya viene incluido en `schema.sql`.
