# Página pública de solo lectura por viaje

## Objetivo
Cada viaje puede compartirse mediante un link público (sin login, sin contraseña) que muestra **itinerario, mapa y calendario** en modo solo lectura. Nadie con el link puede editar ni borrar nada.

## Modelo de datos
- `trips.shareToken`: `text`, único, no nulo. Se genera con `nanoid()` al crear el viaje (default en el insert, no en el schema, porque drizzle+sqlite no genera valores dinámicos por fila con `.default(sql...)` para texto random).
- Migración: añadir columna, backfill de los viajes existentes con un token generado en un script one-off.

## Acceso a datos
- `getTripByShareToken(token: string)` en `lib/queries/trips.ts`, análogo a `getTripById`.
- Las queries de itinerario/mapa/calendario ya reciben `tripId`, así que se reutilizan tal cual una vez resuelto el trip por token.

## Rutas
- Nuevo route group `app/(public)/t/[token]/` con su propio `layout.tsx`: sin `Sidebar`, sin datos de sesión, cabecera simple con nombre/emoji del viaje y aviso "vista de solo lectura".
- Páginas: `itinerario/page.tsx`, `mapa/page.tsx`, `calendario/page.tsx` (mismo patrón que las páginas actuales, pero resolviendo el trip por token en vez de por cookie). Token inválido → `notFound()`.
- `proxy.ts`: añadir `t/*` al matcher de exclusión (junto a `login`, `api/auth`), para que el guard de sesión no redirija estas rutas a `/login`.

## Componentes de solo lectura
En vez de duplicar componentes, se añade un prop opcional `readOnly?: boolean` a los pocos componentes interactivos implicados (`ActivityCard`, `DayTabs`, `ActivityItem` de calendario, y lo que use `month-grid`/`day-sheet` para editar). Internamente pasan a usar `readOnly ?? isReadOnly` en vez de `isReadOnly` a secas — así el comportamiento actual de la app no cambia (nadie pasa el prop) y la ruta pública fuerza `readOnly={true}` explícitamente en el árbol, ocultando botones de editar/borrar/añadir y sin montar los diálogos de formulario en estado abierto.

`RouteMap`/`MapLoader` ya son puramente de presentación (reciben markers/routes), se reutilizan sin cambios.

## Seguridad: cerrar el hueco de las Server Actions
Las Server Actions de Next.js se resuelven por un ID de acción, no por la ruta que las invoca — abrir `t/[token]` como ruta pública (excluida del guard de sesión en `proxy.ts`) crea una vía teórica para invocar `createActivity`/`deleteActivity`/etc. sin sesión si alguien consigue el ID de acción del bundle autenticado.

Mitigación: `assertMutable()` (en `lib/env.ts`) pasa a ser `async` y, además del check de `isReadOnly`, verifica la sesión de better-auth vía `auth.api.getSession({ headers: await headers() })`, lanzando si no hay sesión. Se actualizan los ~21 call-sites en `lib/actions/*.ts` para hacer `await assertMutable()`.

## Compartir / regenerar
- En Ajustes (viaje activo): botón "Copiar link público" (usa `shareToken` del trip activo) y botón "Regenerar link" que llama a una nueva server action `regenerateShareToken(tripId)` (nanoid nuevo, invalida el link anterior). Esta acción también pasa por `assertMutable()`.

## Fuera de alcance
- Presupuesto, notas, utilidades y maletas no se muestran públicamente (decisión del usuario).
- No hay toggle público/privado independiente del token: si no quieres compartir, no repartes el link; regenerar el token es la forma de revocar acceso.

## Testing
- Manual: visitar `/t/<token>/itinerario` sin sesión (navegador en incógnito) y confirmar que carga, no muestra Sidebar ni botones de edición.
- Confirmar que `/t/<token-invalido>` da 404.
- Confirmar que rutas fuera de `t/*` siguen redirigiendo a `/login` sin sesión (regresión del proxy).
- Confirmar que las server actions rechazan llamadas sin sesión (revisar que `assertMutable` lance antes de tocar la DB).
