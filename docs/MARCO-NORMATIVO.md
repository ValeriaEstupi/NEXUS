# Marco normativo de referencia (y sus límites)

NEXUS se construyó pensando en la reglamentación colombiana que aplica
a una empresa de transporte especial. Este documento explica en qué se
basó cada módulo y, sobre todo, **qué debe validar el equipo
legal/HSEQ** antes de confiar en él para una auditoría o inspección.

## PESV — Plan Estratégico de Seguridad Vial

- **Norma base**: Ley 1503 de 2011, Decreto 2851 de 2013 y, vigente
  hoy, la **Resolución 40595 de 2022** del Ministerio de Transporte
  (que reemplazó a la Resolución 1231 de 2016).
- **Estructura que usa NEXUS**: 5 pilares (gestión institucional,
  comportamiento humano, vehículos seguros, infraestructura segura,
  atención a víctimas) sobre el ciclo PHVA (Planear, Hacer, Verificar,
  Actuar) — la misma estructura que exige la resolución.
- **Qué NO es el seed de NEXUS**: los ~35 requisitos precargados
  (`supabase/seed.sql`) son una redacción propia, a partir de la
  estructura general de la resolución — **no una transcripción
  literal del texto vigente**, y no incluyen artículos, plazos exactos
  ni exigencias que varíen según el tamaño de la flota (la resolución
  gradúa las exigencias por número de vehículos). Se marcaron con la
  fuente `Res. 40595/2022` como referencia, no como cita textual.
- **Qué hacer antes de auditar con esto**: contrastar cada requisito
  contra el texto vigente, ajustar redacción y agregar los que falten
  (o borrar los que no apliquen al tamaño/actividad de la empresa)
  desde la pantalla de PESV en NEXUS.

## SG-SST — Sistema de Gestión de Seguridad y Salud en el Trabajo

- **Norma base**: Decreto 1072 de 2015 (Libro 2, Parte 2, Título 4,
  Capítulo 6) y **Resolución 0312 de 2019** (Estándares Mínimos).
- **Grupo de estándares que usa NEXUS**: el set completo de 60 ítems
  (empresas de 50+ trabajadores, o riesgo IV/V sin importar el
  tamaño) — el más exigente, según el perfil "grande" que se
  configuró al crear la plataforma. Si tu empresa tiene menos
  trabajadores y riesgo I-III, el grupo que te aplica realmente es más
  corto (21 ítems para 11-50 trabajadores, 7 ítems para 10 o menos) —
  desactiva los estándares que no correspondan desde la pantalla de
  SG-SST, o pide que se ajuste el seed.
- **Qué NO es el seed de NEXUS**: la redacción de cada estándar y su
  puntaje se reconstruyeron a partir de la estructura pública y
  ampliamente conocida de la Resolución 0312/2019 — **no es una
  transcripción literal certificada**. El puntaje total debe sumar
  100 sobre los estándares que sí apliquen (los marcados "no aplica"
  no cuentan, tal como exige la norma).
- **Qué hacer antes de auditar con esto**: contrastar cada estándar y
  su puntaje contra el Anexo Técnico vigente de la resolución.

## Transporte especial

- **Norma base**: Decreto 348 de 2015 (habilitación y prestación del
  servicio de transporte especial), que es el que determina, entre
  otros, la obligatoriedad de SOAT y revisión técnico-mecánica
  vigentes para la flota.

## Por qué NEXUS se construyó así (y no con el texto "cerrado")

El catálogo de requisitos y estándares es **editable desde la
pantalla** (agregar, editar, desactivar) precisamente porque un texto
legal fijo, escrito una sola vez en el código, se desactualiza y no se
puede corregir sin volver a tocar la base de datos. La responsabilidad
de que el contenido normativo sea exacto y esté vigente es del equipo
legal/HSEQ de la empresa — NEXUS es la herramienta de seguimiento, no
un sustituto del criterio jurídico.
