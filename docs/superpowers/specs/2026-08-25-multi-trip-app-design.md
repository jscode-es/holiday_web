# Diseño: App multi-viaje (dejar de estar hardcodeada a Japón)

**Fecha:** 2026-08-25
**Estado:** Aprobado, pendiente de plan de implementación

## Contexto

La app (`docs/superpowers/specs/2026-08-23-japon-2026-itinerario-design.md`)
se construyó para un único viaje y todo el contenido real vive en
`db/seed-data.ts` → `sqlite.db`. No existe concepto de "viaje": las tablas
`days`, `accommodations`, `checklist_items` y `bags` son globales, la barra
lateral tiene "JAPÓN 2026" fijo en el marcado, y el dashboard imprime
`"Japón 2026 🇯🇵"` como texto literal.

Objetivo de este trabajo: convertir la app en una herramienta genérica de
viajes que soporte varios viajes en la misma instalación, con un selector en
la navegación, un flujo para crear un viaje nuevo, y estados vacíos reales
(cero viajes, viaje sin días, viaje sin alojamientos) en vez de asumir
siempre los datos de Japón. Todo persiste en el mismo `sqlite.db` vía Drizzle.

## Alcance

Incluido:
- Tabla `trips` + `tripId` en `days`, `accommodations`, `checklist_items`, `bags`
- Migración de datos: el viaje Japón 2026 ya existente se convierte en el
  primer `trip` sin pérdida de datos
- Mecanismo de "viaje activo" vía cookie, con fallback al viaje más reciente
- Selector de viajes en el sidebar (sustituye el bloque "JAPÓN 2026" fijo) +
  diálogo mínimo para crear un viaje (nombre + emoji)
- Estados vacíos: cero viajes en la app, viaje activo sin días, viaje activo
  sin alojamientos
- Actions nuevas: `createDay`, `createAccommodation` (hoy no existen)
- Quitar referencias a "Japón 2026" fuera del propio contenido del viaje
  (metadata del layout raíz, página de login, footer del sidebar)

Fuera de alcance (YAGNI):
- Viajes por usuario / multi-tenant (siguen siendo globales, como hoy)
- Borrado de viajes, edición de fechas/viajeros en el propio diálogo de
  creación (eso queda para la página `Ajustes` ya existente, sin cambios en
  este trabajo)
- Tocar `db/seed.ts` / `seed-data.ts` como generador de fixtures de
  desarrollo — sigue existiendo, pero deja de ser el único camino para tener
  datos
- Reordenar/renombrar rutas (`/`, `/itinerario`, etc. no cambian)

## Modelo de datos (cambios sobre el schema Drizzle existente)

```
trips                                    (nueva)
  id            integer PK
  name          text
  emoji         text nullable            -- p.ej. "🇯🇵" o "田"
  startDate     text nullable (ISO date)
  endDate       text nullable (ISO date)
  travelers     integer nullable
  createdAt     integer (timestamp_ms), default now

days
  + tripId      integer NOT NULL, references trips.id, onDelete cascade

accommodations
  + tripId      integer NOT NULL, references trips.id, onDelete cascade

checklist_items
  + tripId      integer NOT NULL, references trips.id, onDelete cascade

bags
  + tripId      integer NOT NULL, references trips.id, onDelete cascade
```

`activities` (cuelga de `days`) y `bag_items` (cuelga de `bags`) no cambian:
heredan el viaje a través de su padre.

**Migración de datos existentes:** el paso de migración de Drizzle que añade
`tripId` como NOT NULL no puede aplicarse en caliente sobre filas ya
existentes sin backfill. La migración se escribe en dos fases dentro del
mismo script de migración SQL generado:
1. Crear tabla `trips` e insertar una fila `('Japón 2026', '🇯🇵', '2026-09-27', '2026-10-16', 2)`.
2. Añadir `tripId` a las cuatro tablas como columna nullable, hacer
   `UPDATE ... SET tripId = <id del trip insertado>` sobre las filas
   existentes, y luego (SQLite no soporta `ALTER COLUMN ... NOT NULL`
   directo) recrear la columna como NOT NULL vía el patrón estándar de
   Drizzle/SQLite de tabla nueva + copia + swap, que `drizzle-kit generate`
   ya produce automáticamente al detectar el cambio.

Esto se verifica corriendo la migración contra una copia de `sqlite.db` antes
de aplicarla a la real (ver sección Testing).

## Viaje activo

- Cookie `active_trip_id` (httpOnly, sin expiración corta — dura hasta que se
  cambie de viaje o se borre la cookie).
- Helper `getActiveTrip()` en `lib/trips.ts`: lee la cookie con
  `next/headers`, valida que ese `id` exista en `trips`; si no hay cookie o
  no es válida, usa el trip con `createdAt` más reciente; si no hay ningún
  trip, devuelve `null`.
- `setActiveTrip(tripId)` (server action): fija la cookie y hace
  `revalidatePath("/", "layout")` para refrescar toda la navegación.
- Todas las queries de `lib/queries/*` que hoy hacen `db.select().from(days)`
  etc. sin filtro pasan a recibir `tripId` y añadir `.where(eq(days.tripId, tripId))`
  (mismo patrón para `accommodations`, `checklistItems`, `bags`). Las páginas
  (`app/(app)/**/page.tsx`) llaman primero a `getActiveTrip()` y pasan su id
  a las queries.
- Las actions de creación (`createDay`, `createAccommodation`,
  `createChecklistItem`, `createBag`) reciben `tripId` explícito desde el
  cliente (obtenido de una prop `activeTripId` pasada desde el server
  component padre) en vez de leer la cookie ellas mismas — mantiene las
  actions puras y testables.

## Selector de viajes y creación

**`TripSwitcher`** (client component), sustituye el bloque fijo del
sidebar (`components/sidebar.tsx`, líneas del logo + "JAPÓN 2026" + fechas):
- Botón con emoji + nombre del viaje activo (+ rango de fechas si
  `startDate`/`endDate` están definidos).
- Al pulsar, despliega un dropdown (reutilizando el primitivo de menú ya
  presente en `components/ui`, si existe `DropdownMenu`; si no, un `Dialog`
  simple con la lista) con cada viaje (emoji + nombre + fechas) y una entrada
  final "＋ Crear viaje".
- Elegir un viaje llama a `setActiveTrip(id)` y refresca.
- "＋ Crear viaje" abre `CreateTripDialog`: formulario con `name` (texto,
  requerido) y `emoji` (texto corto, opcional, placeholder "🏖️"), mismo patrón
  que `AddBagButton` (`components/bags/add-bag-button.tsx`). Al enviar:
  `createTrip({ name, emoji })` → inserta, llama `setActiveTrip` con el id
  nuevo, cierra el diálogo y refresca. El nuevo viaje nace sin días ni
  alojamientos (estado vacío real, sección siguiente).

## Estados vacíos

1. **Cero viajes en la app** (`getActiveTrip()` devuelve `null`): el layout
   de `app/(app)/layout.tsx` no renderiza el sidebar completo con enlaces;
   muestra una pantalla centrada única: icono + "Aún no tienes ningún viaje"
   + botón que abre `CreateTripDialog`. Ninguna query de días/alojamientos se
   ejecuta en este caso.
2. **Viaje activo sin días**: `app/(app)/page.tsx`, `itinerario/page.tsx` y
   `calendario/page.tsx` comprueban `days.length === 0` y muestran
   "Este viaje todavía no tiene días" + botón que abre un diálogo
   `AddDayButton` (nuevo, mismo patrón que `AddBagButton`) que llama a la
   action nueva `createDay({ tripId, date, dayNumber, title })`.
3. **Viaje activo sin alojamientos**: hoy los alojamientos solo se listan
   dentro de `app/(app)/page.tsx` (dashboard), no hay página dedicada. Ese
   bloque muestra "Sin alojamientos todavía" + botón `AddAccommodationButton`
   (nuevo) que llama a la action nueva `createAccommodation`.
4. Checklist y maletas: ya tienen `createChecklistItem`/`createBag`, así que
   su estado vacío ya es funcional hoy; solo se les añade el filtro por
   `tripId`.
5. Mapa: si no hay actividades con coordenadas, ya debería no pintar
   marcadores; se revisa que no rompa con cero días (no se espera trabajo
   adicional aquí salvo que la comprobación lo requiera).

## Actions nuevas

```ts
// lib/actions/days.ts
export async function createDay(input: { tripId: number; date: string; dayNumber: number; title: string }): Promise<Day>

// lib/actions/accommodations.ts
export async function createAccommodation(input: AccommodationInput): Promise<Accommodation>

// lib/actions/trips.ts (nuevo archivo)
export async function createTrip(input: { name: string; emoji: string | null }): Promise<Trip>
export async function setActiveTrip(tripId: number): Promise<void>
```

Todas respetan `assertMutable()` (guard de solo-lectura ya existente en
`lib/env.ts`), igual que el resto de actions de escritura.

## Limpieza de referencias fijas a "Japón 2026"

- `app/layout.tsx`: metadata pasa de `"Japón 2026"` / descripción con fechas
  fijas a algo genérico, p.ej. `title: "Vacaciones"`,
  `description: "Organiza y consulta tus viajes"`.
- `app/login/page.tsx`: el título "Japón 2026" bajo el logo pasa a un nombre
  genérico de producto (p.ej. "Vacaciones"); es una pantalla previa al login,
  no depende del viaje activo.
- `app/(app)/page.tsx`: el `<h1>` fijo `"Japón 2026 🇯🇵"` y el `<p>` con fechas
  fijas pasan a usar `trip.name` / `trip.emoji` y las fechas reales
  (min/max de `days`, o `trip.startDate`/`endDate` si no hay días).
- `components/sidebar.tsx`: el footer `"Sergio · 2 adultos · 20 días"`
  mantiene "Sergio" (persona real, sin cambio), pero "2 adultos · N días"
  pasa a derivarse de `trip.travelers` (si está definido; si no, se omite esa
  parte) y del número real de días del viaje activo.

## Testing

- Antes de aplicar la migración a `sqlite.db` real: copiarlo, correr
  `npm run db:push`/la migración generada sobre la copia, y verificar con una
  query manual que las 20 días / 3 accommodations / 10 checklist / bags
  existentes tienen el `tripId` del trip "Japón 2026" y que no se perdió
  ninguna fila (`SELECT count(*)` antes/después por tabla).
- `npx tsc --noEmit` y `npm run lint` tras cada fase.
- Manual en `npm run dev`: crear un segundo viaje vacío desde el switcher,
  confirmar que el dashboard/itinerario/calendario de ese viaje muestran los
  estados vacíos y no datos de Japón; añadir un día y una actividad al nuevo
  viaje y confirmar que no aparecen en el viaje de Japón al cambiar de vuelta.
- Confirmar que `isReadOnly` (modo solo lectura del despliegue público) sigue
  ocultando el switcher/creación de viajes igual que hoy oculta el resto de
  botones de escritura.
