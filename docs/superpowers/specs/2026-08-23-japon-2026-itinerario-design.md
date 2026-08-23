# Diseño: Web de itinerario Japón 2026

**Fecha:** 2026-08-23
**Estado:** Aprobado, pendiente de plan de implementación

## Contexto

Proyecto Next.js recién creado (`create-next-app`, sin código propio aún). Objetivo:
una web personal, solo para uso local (`npm run dev`, sin despliegue), que
digitalice y haga editable el itinerario de un viaje a Japón (27 sep – 16 oct
2026, 20 días, 2 viajeros) actualmente documentado en
`docs/japon-2026-viaje.md`. El estilo visual se inspira en referencias tipo
UKR Club (listados con filtros + mapa + ficha de detalle) y Tripit/TripGuider
(dashboard de itinerario con calendario).

## Alcance

Pantallas incluidas en esta primera versión:
- Calendario mensual con detalle editable por día
- Vista de itinerario en lista continua (día a día)
- Mapa con marcadores y rutas en línea recta entre paradas
- Listado de alojamientos con filtros y ficha de detalle
- Panel de presupuesto (registrado vs pendiente) + checklist pre-viaje

Fuera de alcance (YAGNI para esta versión): multi-usuario, despliegue,
autenticación, geocoding en vivo, importación/parseo automático de markdown,
sincronización entre dispositivos.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind v4 (ya presentes en el repo)
- shadcn/ui como librería de componentes (se instala en este trabajo)
- Drizzle ORM sobre `better-sqlite3` para persistencia local
- Next.js Server Actions para todas las mutaciones (crear/editar/borrar
  actividad, alojamiento, checklist) — sin capa REST separada
- `react-leaflet` + tiles de OpenStreetMap (gratuitos, sin API key) para el mapa
- `date-fns` para cálculo de calendario/fechas

**Por qué Drizzle sobre Prisma:** esquema TypeScript ligero, sin paso de
generación de cliente, encaja de forma directa con Server Actions. Dado el
tamaño del proyecto (un solo usuario, ~20 días de datos), el "batería
incluida" de Prisma no aporta frente a su mayor peso de setup.

**Por qué grid de calendario a medida en vez del `Calendar` de shadcn:** el
componente de shadcn es un date-picker (selección de fecha), no un calendario
de eventos. Se construye un grid mensual propio con `date-fns` + primitivos de
shadcn (`Card`, `Badge`, `Sheet`) que sí soporta mostrar actividades por día.

## Modelo de datos (Drizzle schema, SQLite)

```
days
  id            integer PK
  date          text (ISO date)
  dayNumber     integer
  title         text
  summary       text nullable

activities
  id            integer PK
  dayId         integer FK -> days.id
  time          text (HH:MM) nullable
  type          text enum: transport | place | event | comida | nota | aviso | hotel
  title         text
  description   text nullable
  status        text enum: programado | confirmado | pendiente | null
  cost          real nullable
  currency      text nullable (EUR | JPY)
  durationMin   integer nullable
  origin        text nullable
  destination   text nullable
  originLat     real nullable
  originLng     real nullable
  destLat       real nullable
  destLng       real nullable

accommodations
  id            integer PK
  name          text
  checkIn       text (ISO date)
  checkOut      text (ISO date)
  nights        integer nullable
  cost          real nullable
  currency      text nullable
  status        text enum: programado | confirmado | pendiente
  address       text nullable
  lat           real nullable
  lng           real nullable
  notes         text nullable

checklistItems
  id            integer PK
  label         text
  done          integer (boolean)
```

`accommodations` es independiente de `activities` (aunque cada noche de hotel
también puede reflejarse como una `activity` de tipo `hotel` dentro de su día)
para poder listarla/filtrarla como una vista propia tipo UKR Club.

No existe tabla de presupuesto: el panel `/presupuesto` agrega en consulta los
campos `cost` de `activities` y `accommodations`, agrupando por estado
(confirmado/programado vs pendiente) y por moneda.

## Carga inicial de datos

Script `db/seed.ts` con los 20 días, actividades, alojamientos y checklist
transcritos a mano desde `docs/japon-2026-viaje.md` a estructuras TypeScript
tipadas (no se parsea el markdown en runtime, es frágil ante cambios de
formato). Las coordenadas lat/lng de cada ciudad/parada se incluyen a mano
(valores aproximados de las localidades, sin llamada a un geocoder externo).
Se ejecuta una vez vía `npm run db:seed`, que limpia y repuebla las tablas.

## Páginas y componentes

- **`/calendario`** — grid mensual (cubre septiembre y octubre 2026); cada
  celda de día muestra un resumen (nº de actividades, badge de estado más
  relevante del día). Click en un día abre un `Sheet` lateral con el
  itinerario completo ordenado por hora y un formulario de alta/edición de
  actividad.
- **`/itinerario`** — misma información en lista continua, sin necesidad de
  clicks, pensada para consulta rápida durante el viaje.
- **`/mapa`** — Leaflet con un marcador por cada `place`/`hotel` con
  coordenadas, y una polyline recta entre `originLat/Lng` y `destLat/Lng` de
  cada `transport`. Filtro por rango de días.
- **`/alojamientos`** — listado tipo tarjetas (filtro por estado), ficha de
  detalle por alojamiento con dirección, fechas, coste y notas.
- **`/presupuesto`** — total registrado vs pendiente por moneda, desglose por
  categoría de coste, checklist pre-viaje con checkboxes editables.

## Edición (CRUD)

Server Actions por entidad (`createActivity`, `updateActivity`,
`deleteActivity`, y equivalentes para `accommodations` y `checklistItems`),
invocadas desde formularios shadcn (`Dialog`/`Sheet` + `Form` + `Input` +
`Select`/`Combobox` para el campo `type`/`status`). Cada mutación llama a
`revalidatePath` sobre las rutas afectadas (`/calendario`, `/itinerario`,
`/mapa`, `/alojamientos`, `/presupuesto` según la entidad tocada).

## Testing

Proyecto personal de un solo usuario, sin CI. Verificación manual: `npm run
lint`, `npm run build`, y recorrido visual de cada página tras implementar
(vía el skill `run` si aplica) antes de dar por completo el trabajo. No se
monta suite de tests automatizados para esta primera versión.
