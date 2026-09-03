# NEXUS — Plataforma de PESV y Sistema de Gestión Integrado

Plataforma para hacer seguimiento del **Plan Estratégico de Seguridad
Vial (PESV)** y del **Sistema de Gestión de Seguridad y Salud en el
Trabajo (SG-SST)** de una o varias empresas de transporte especial en
Colombia, bajo la reglamentación vigente (Resolución 40595 de 2022
para el PESV, Resolución 0312 de 2019 para los Estándares Mínimos del
SG-SST, y Decreto 348 de 2015 para transporte especial).

Es un proyecto **aparte e independiente** — su propio repositorio,
su propia base de datos, su propio despliegue. No depende de ninguna
otra app.

Esta guía está escrita para alguien que **no programa**. Sigue los
pasos en orden.

---

## Multiempresa: cómo funciona

NEXUS está pensado para que **una sola cuenta administre el
cumplimiento de varias empresas cliente distintas**, cada una con sus
propios vehículos, conductores, checklist de PESV/SG-SST, incidentes,
etc. — totalmente separados entre sí, igual que si cada una tuviera su
propia app.

- **App admin**: el rol más alto de toda la plataforma (el de quien la
  administra en general, por ejemplo tú). Ve y administra **todas**
  las empresas, sin necesidad de que la agreguen como miembro.
- **Cada empresa tiene sus propios miembros y roles**: una persona
  puede ser **admin** de la empresa A y solo **lectura** en la empresa
  B — el rol no es global, es por empresa (ver "Roles" más abajo).
- **Cada empresa tiene su propia copia del catálogo del PESV y del
  SG-SST**, así que dos empresas pueden tener requisitos o estándares
  distintos (por ejemplo, si una es más grande que la otra) sin que
  editar una afecte a la otra. Al crear una empresa, se le copia
  automáticamente la plantilla base (ver `seed.sql`).

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
9. **Varias empresas por cuenta**, cada una con sus propios miembros,
   roles y catálogo (ver "Multiempresa" arriba).

> ⚖️ **Importante para el equipo legal/HSEQ**: el catálogo de
> requisitos del PESV y de estándares del SG-SST que trae la
> plataforma de fábrica (`supabase/seed.sql`) es una **plantilla de
> partida**, redactada a partir de la estructura general de ambas
> resoluciones — no es un texto legal certificado. Antes de usarla
> para una auditoría o una inspección, contrástala contra el texto
> vigente y ajusta lo que haga falta en la copia de cada empresa.
> Editar, agregar o desactivar un ítem es una pantalla dentro de
> NEXUS, no requiere volver a tocar SQL. Más detalle en
> [`docs/MARCO-NORMATIVO.md`](docs/MARCO-NORMATIVO.md).

---

## Paso 1 — Crear un proyecto de Supabase para NEXUS

1. Entra a [supabase.com](https://supabase.com) y crea un proyecto
   nuevo (gratis). Si ya tienes 2 proyectos gratis en tu organización
   y no te deja crear uno más, crea una **organización nueva** (cada
   una tiene su propio cupo de 2 proyectos gratis).
2. Ve a **SQL Editor** -> **New query**.
3. Abre [`supabase/schema.sql`](supabase/schema.sql), copia **todo**
   su contenido, pégalo y dale **Run**.
4. Repite el paso anterior con [`supabase/seed.sql`](supabase/seed.sql)
   (carga la plantilla base de pilares del PESV y estándares del
   SG-SST que se copia a cada empresa nueva).
5. Deberías ver "Success. No rows returned" en ambos casos.

> ¿Ya habías corrido una versión anterior de este esquema (de una sola
> empresa)? Corre primero
> [`supabase/reset_v1.sql`](supabase/reset_v1.sql) para borrar esas
> tablas viejas, y luego sigue con `schema.sql` y `seed.sql` como si
> empezaras de cero.

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

1. **Project Settings -> API Keys**: copia el **Project URL**
   (Project Settings -> General) y la **Publishable key**.
2. En este proyecto, copia `.env.local.example` a `.env.local`
   y pega esos dos valores. También copia la **Secret key** (misma
   pantalla, sección "Secret keys") en `SUPABASE_SERVICE_ROLE_KEY` —
   nunca la compartas ni la subas a GitHub.

---

## Paso 5 — Ver la app funcionando

### Camino A — Publicarla en Vercel

1. En [vercel.com](https://vercel.com), **Add New -> Project**, elige
   este repositorio de GitHub.
2. Confirma que el "Application Preset" diga **Next.js**.
3. Agrega las variables de entorno del Paso 4.
4. **Deploy**. Vuelve al Paso 2 en Supabase y agrega la dirección real
   (`https://tu-app.vercel.app` y `.../auth/callback`) en Site URL y
   Redirect URLs.

### Camino B — Correrla en tu computadora

```
npm install
npm run dev
```

Abre `http://localhost:3000`.

---

## Paso 6 — Registrarte y convertirte en app admin

1. Entra a la app y regístrate.
2. En Supabase, SQL Editor, abre
   [`supabase/migrations/001_primer_super_admin.sql`](supabase/migrations/001_primer_super_admin.sql),
   cambia el correo de ejemplo por el tuyo y dale **Run**.
3. Vuelve a entrar a la app (o recarga) — ya tienes rol de **app
   admin** y ves todas las empresas que existan (aunque todavía no
   haya ninguna).
4. Crea tu primera empresa desde el botón "Crear una empresa nueva"
   en `/dashboard`.

---

## Roles dentro de NEXUS

- **App admin** (rol de toda la plataforma, no de una empresa en
  particular): ve y administra todas las empresas que existan, sin
  necesidad de ser miembro de cada una. Se activa a mano por SQL (Paso
  6) — pensado para quien administra NEXUS en general.

Dentro de cada empresa, el rol de cada miembro es independiente:

- **Lectura**: ve todo el checklist, vehículos, conductores e
  indicadores de esa empresa, pero no puede editar nada. Sí puede
  reportar un incidente (cualquier miembro puede).
- **Editor**: administra el día a día de esa empresa — marca el
  avance del PESV/SG-SST, sube evidencias, y **agrega y edita**
  vehículos, conductores, incidentes, capacitaciones, planes de
  acción, pilares del PESV, requisitos del PESV y estándares del
  SG-SST **de esa empresa**.
- **Admin** (de la empresa): además de lo anterior, **borra**
  cualquier registro de esa empresa e **invita o quita miembros** y
  les cambia el rol, desde Configuración -> Miembros de esa empresa.

Una misma persona puede tener roles distintos en cada empresa a la
que pertenezca.

### Cómo invitar a alguien a una empresa

La persona debe **registrarse primero** en NEXUS (con su correo). Ya
registrada, un admin de la empresa va a **Configuración -> Miembros de
esta empresa**, escribe su correo, elige el rol y le da "Invitar".

### Qué puede hacer el administrador con el catálogo normativo

Todo el catálogo del PESV y del SG-SST de una empresa — no solo el
seguimiento, sino el texto mismo de la norma que carga NEXUS para esa
empresa — se administra desde la pantalla, sin volver a tocar SQL:

- **Pilares del PESV**: en la pantalla de PESV de esa empresa, botón
  "Gestionar pilares" — agregar, renombrar, reordenar, desactivar o
  (si ya no tiene requisitos) borrar un pilar.
- **Requisitos del PESV y estándares del SG-SST**: cada ítem del
  checklist tiene, dentro de "Gestionar", un botón "Editar
  requisito/estándar" para cambiar su código, descripción, fuente
  normativa, pilar/componente, fase PHVA o puntaje; "Desactivar" para
  ocultarlo sin perder su historial; y "Borrar del catálogo" (solo
  admin de la empresa) para eliminarlo junto con su seguimiento y
  evidencias. Un ítem desactivado se sigue viendo (atenuado, con la
  etiqueta "Inactivo") por si hay que reactivarlo.

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

- Notificaciones automáticas por correo de documentos por vencer.
- Exportar el checklist o los indicadores a PDF/Excel para radicar
  ante una autoridad.
- Vincular un plan de acción directamente a un ítem de cumplimiento
  con hallazgos (hoy se liga a un incidente o queda libre; la columna
  `cumplimiento_item_id` ya existe en la tabla `plan_accion`, falta la
  pantalla).
