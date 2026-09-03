# Cómo está diseñada la base de datos de NEXUS

Piensa en la base de datos como un conjunto de "hojas de cálculo"
(tablas) que se conectan entre sí. NEXUS es **multiempresa**: casi
todas las tablas tienen una columna `empresa_id` que dice a cuál
empresa pertenece cada fila, y las reglas de acceso (más abajo) hacen
que una empresa nunca vea los datos de otra.

## 1. `profiles` — personas
Espejo de `auth.users` (que maneja Supabase) más el nombre de cada
persona y `is_app_admin`: marca a quien administra **toda la
plataforma** (ve y edita todas las empresas, sin ser miembro de cada
una). Se llena sola cuando alguien se registra, con `is_app_admin =
false` por defecto.

## 2. `empresas` y `empresa_members`
`empresas`: una fila por cada empresa cliente (razón social, NIT,
número de vehículos, número de trabajadores, nivel de riesgo ARL —
estos últimos determinan qué tan exigente es su PESV/SG-SST).

`empresa_members`: quién pertenece a cada empresa y con qué rol
(`lector`, `editor` o `admin`). Es la tabla clave de la privacidad
entre empresas — si no estás en `empresa_members` de una empresa (y no
eres `is_app_admin`), esa empresa y todos sus datos son invisibles
para ti, sin excepción.

## 3. `fases_phva` — catálogo global fijo
Las 4 fases del ciclo PHVA (Planear, Hacer, Verificar, Actuar), que
comparten el PESV y el SG-SST de **todas** las empresas — es la única
tabla de catálogo que no se duplica por empresa, porque es un método
fijo, no algo que cada empresa deba personalizar.

## 4. Plantilla base: `pilares_pesv_template`, `requisitos_pesv_template`, `estandares_sgsst_template`
El punto de partida que se copia automáticamente a cada empresa nueva
(ver la función `create_empresa()` en `schema.sql`). No son las tablas
que usa el día a día de ninguna empresa — son la "semilla" que se
carga una sola vez con `seed.sql`. Editar la plantilla después de ese
paso no afecta a las empresas que ya existen, solo a las que se creen
después.

## 5. `pilares_pesv`, `requisitos_pesv` y `estandares_sgsst` — el catálogo de cada empresa
La copia **propia** de cada empresa (creada a partir de las tablas
"_template" de arriba). Totalmente editable desde la pantalla, sin
afectar a otras empresas ni a la plantilla.

## 6. `cumplimiento_items` — el "cómo vamos" (el corazón de NEXUS)
Una fila por cada requisito o estándar **de una empresa**, con el
estado real de avance: `pendiente`, `en_progreso`, `cumplido` o
`no_aplica`, más responsable, fecha límite y observaciones. **Se crea
sola** (con un disparador de base de datos) cada vez que se agrega un
requisito o estándar nuevo al catálogo de esa empresa.

## 7. `evidencias`
Referencia a cada documento de soporte subido (el archivo en sí vive
en Supabase Storage, bucket privado `evidencias`, en la ruta
`<empresa_id>/<cumplimiento_item_id>/archivo`): qué
`cumplimiento_item` sustenta, nombre del archivo, quién lo subió. Su
`empresa_id` se calcula solo, a partir del ítem de cumplimiento — no
depende de lo que mande la pantalla.

## 8. `vehiculos` y `conductores`
Ficha de cada vehículo (placa, SOAT, tecnomecánica, mantenimiento,
estado) y de cada conductor (documento, licencia, exámenes médicos,
curso de conducción segura, vehículo asignado, estado), cada uno
ligado a su empresa. La placa y el número de documento solo tienen que
ser únicos dentro de la misma empresa.

## 9. `capacitaciones` y `capacitacion_asistentes`
Registro de capacitaciones (tema, tipo, fecha, horas) de una empresa y
de qué conductores de esa empresa asistieron.

## 10. `incidentes`
Accidentes e incidentes, viales o laborales, de una empresa: fecha,
lugar, vehículo y conductor involucrados, descripción, causas
probables y estado de la investigación (abierto / en investigación /
cerrado).

## 11. `plan_accion`
Acciones correctivas o preventivas de una empresa, que pueden nacer de
un incidente, una auditoría o un ítem de cumplimiento con hallazgos.

## La privacidad entre empresas, en una frase
Cada tabla tiene activada **Row Level Security** de Supabase: la base
de datos misma filtra los datos según quién pregunta y de qué empresa
son. Dentro de una empresa, cualquier miembro puede **ver** sus datos,
pero solo `editor` o `admin` pueden **crear o modificar** algo, y solo
`admin` (de esa empresa) puede **borrar** o administrar sus miembros.
Quien tiene `is_app_admin = true` en su perfil pasa todas estas reglas
para todas las empresas — es el único rol que cruza esa frontera a
propósito. Nada de esto depende de que la pantalla "se porte bien": la
regla vive en la base de datos.
