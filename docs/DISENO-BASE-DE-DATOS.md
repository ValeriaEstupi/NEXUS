# Cómo está diseñada la base de datos de Nexus

Igual que en la app de tareas: piensa en la base de datos como un
conjunto de "hojas de cálculo" (tablas) que se conectan entre sí.

## 1. `profiles` — personas y su rol
Espejo de `auth.users` (que maneja Supabase) más el nombre y el rol de
cada persona dentro de Nexus: `lector`, `editor` o `super_admin`. Se
llena sola cuando alguien se registra, con rol `lector` por defecto.

## 2. `empresa`
Una sola fila con los datos que determinan qué tan exigente es el PESV
y qué grupo de estándares del SG-SST aplica: razón social, NIT,
número de vehículos, número de trabajadores, nivel de riesgo ARL.

## 3. `pilares_pesv` y `fases_phva` — catálogos
Los 5 pilares del PESV (Res. 40595/2022) y las 4 fases del ciclo PHVA
(Planear, Hacer, Verificar, Actuar), que comparten el PESV y el
SG-SST.

## 4. `requisitos_pesv` y `estandares_sgsst` — el "qué exige la norma"
Catálogo editable de cada requisito del PESV y cada estándar del
SG-SST, con su pilar/componente, su fase PHVA, un código, una
descripción y (en el caso del SG-SST) el puntaje que aporta sobre 100.

## 5. `cumplimiento_items` — el "cómo vamos" (el corazón de Nexus)
Una fila por cada requisito o estándar, con el estado real de avance:
`pendiente`, `en_progreso`, `cumplido` o `no_aplica`, más responsable,
fecha límite y observaciones. **Se crea sola** (con un disparador de
base de datos) cada vez que se agrega un requisito o estándar nuevo al
catálogo — así la pantalla de seguimiento nunca queda desactualizada
frente al catálogo.

## 6. `evidencias`
Referencia a cada documento de soporte subido (el archivo en sí vive
en Supabase Storage, bucket privado `evidencias`): qué
`cumplimiento_item` sustenta, nombre del archivo, quién lo subió.

## 7. `vehiculos` y `conductores`
Ficha de cada vehículo (placa, SOAT, tecnomecánica, mantenimiento,
estado) y de cada conductor (documento, licencia, exámenes médicos,
curso de conducción segura, vehículo asignado, estado).

## 8. `capacitaciones` y `capacitacion_asistentes`
Registro de capacitaciones (tema, tipo, fecha, horas) y de quién
asistió. Las tablas ya existen; la pantalla para usarlas es un
siguiente paso (ver README, "Qué sigue").

## 9. `incidentes`
Accidentes e incidentes, viales o laborales: fecha, lugar, vehículo y
conductor involucrados, descripción, causas probables y estado de la
investigación (abierto / en investigación / cerrado).

## 10. `plan_accion`
Acciones correctivas o preventivas, que pueden nacer de un incidente,
una auditoría o un ítem de cumplimiento con hallazgos. La tabla ya
existe; la pantalla para usarla es un siguiente paso.

## 11. Vistas de indicadores
`v_avance_pesv` (avance por pilar, sin contar los ítems "no aplica") y
`v_avance_sgsst` (calificación ponderada por el puntaje de cada
estándar, como exige la Resolución 0312/2019). Se calculan solas a
partir de `cumplimiento_items` — no hay que actualizarlas a mano.

## La privacidad de los datos, en una frase
Nexus es una herramienta **interna de una sola empresa** (no
multi-cliente): cualquier persona con sesión iniciada y perfil creado
puede **ver** todos los datos, pero solo quien tiene rol `editor` o
`super_admin` puede **crear o modificar** algo, y solo `super_admin`
puede **borrar** o cambiar el rol de otra persona. Esa regla vive en
la base de datos (Row Level Security), no depende de que la pantalla
"se porte bien".
