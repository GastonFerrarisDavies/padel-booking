# CLAUDE.md — Frontend Padel Booking

Documentación técnica y reglas de arquitectura del frontend. Leer antes de tocar código.

## 1. Stack

| Tema | Decisión |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| Lenguaje | JavaScript (`.js` / `.jsx`) con JSDoc. Sin TypeScript |
| Estilos | Tailwind CSS v4 (tokens en `src/app/globals.css` vía `@theme`) |
| Iconos | `lucide-react` (único set permitido) |
| Build | `output: 'export'` → **sitio 100 % estático** servido por nginx (ver `Dockerfile`) |
| Datos | `fetch` nativo encapsulado en `api/utils.jsx` |

### Consecuencias de `output: 'export'`

- Los Server Components corren **en build time**. Nunca los uses para datos que cambian (disponibilidad, reservas, estadísticas): esos datos se piden en Client Components.
- No hay `proxy`/middleware, cookies de servidor, Server Actions, `rewrites` ni `next/image` con loader por defecto (usar `<svg>`/gradientes o un loader custom).
- La protección de rutas del dashboard es **solo UX** (`AuthGuard`). La seguridad real la impone el backend (401/403).
- Rutas dinámicas requieren `generateStaticParams`. Preferir query params o pantallas con estado.
- Las variables `NEXT_PUBLIC_*` se inyectan al **build** (el `Dockerfile` debe recibirlas como `ARG`/`ENV`).

## 2. Reglas de arquitectura (INNEGOCIABLES)

```
frontend/
├─ api/
│  ├─ utils.jsx        # cliente HTTP: base URL, token, interceptores, ApiError, timeout
│  └─ mock.js          # backend en memoria (NEXT_PUBLIC_API_MOCK=true)
├─ entity/             # servicios por dominio: court.js, booking.js, user.js, auth.js, stats.js
└─ src/
   ├─ app/             # rutas (thin: componen componentes, no contienen lógica)
   ├─ components/
   │  ├─ ui/           # primitivas reutilizables sin conocimiento del dominio
   │  ├─ layout/       # Header, Footer, Sidebar, Shell
   │  ├─ home/         # secciones de la landing
   │  ├─ court/        # componentes de dominio "cancha"
   │  └─ dashboard/    # vistas del panel admin
   ├─ hooks/           # useQuery, useMutation, useToday
   ├─ providers/       # AuthProvider
   ├─ lib/             # cn, format, constants (funciones puras)
   └─ config/          # site, navigation
```

1. **REGLA DE ORO — ningún componente hace `fetch`.** Los componentes/hook/páginas solo importan funciones de `@entity/*`. Solo `api/utils.jsx` llama a `fetch`.
2. `entity/*.js` **solo** importa `@api/utils`. No importa React, ni componentes, ni `src/`.
3. Cada función de `entity/` recibe `(params, { signal } = {})`, devuelve datos ya normalizados y lanza `ApiError` en fallos.
4. Flujo de datos: `Componente → useQuery/useMutation → @entity/* → @api/utils → backend`.
5. **Reutilización primero:** antes de crear un componente, buscar en `components/ui`. Si un patrón aparece 2 veces, se extrae.
6. **Composición sobre booleanos:** variantes explícitas (`variant="primary"`), slots (`children`, `leadingIcon`) y componentes compuestos (`Card.Header`). Evitar props booleanas que cambian el layout.
7. Componentes de `ui/` no importan de `entity/` ni de `components/<dominio>/`.
8. Aliases: `@/` → `src/`, `@api/` → `api/`, `@entity/` → `entity/`.
9. Sin `useEffect` para derivar estado ni para hacer `setState` sincrónico (regla de lint `react-hooks`). Usar `useQuery`, `useSyncExternalStore` o derivar durante el render.

### Server vs Client Components

- **Server por defecto.** Agregar `'use client'` solo si hay estado, efectos, eventos o APIs del navegador.
- Server (estáticos): `app/**/page.js`, `layout.js`, `Hero`, `Features`, `Footer`, `SiteHeader`, `ui/Card`, `ui/Badge`, `ui/StarRating`, `ui/StatCard`, `ui/DataTable`, `ui/BarChart`, `CourtCard`.
- Client: todo lo que usa `useQuery`/`useMutation`/estado — `BookingExplorer`, `AvailabilitySearch`, `BookingDialog`, `AuthProvider`, `AuthGuard`, `DashboardShell`, `LoginForm`, `ui/Modal`, `ui/ConfirmDialog` y todas las vistas de `components/dashboard/*`.
- Sin directiva (sirven en ambos entornos): `ui/Button`, `ui/Field`, `ui/Alert`, `ui/QueryBoundary`, `SlotList`, `CourtArt`.
- No pasar funciones desde un Server Component a un Client Component.

## 3. Contrato asumido del backend

Base: `NEXT_PUBLIC_API_URL` (default `/api`). Auth por `Authorization: Bearer <token>`.

| Método | Ruta | Uso |
| --- | --- | --- |
| POST | `/auth/login` | `{ email, password }` → `{ token, user }` |
| GET | `/auth/me` | usuario de la sesión |
| GET | `/courts` | `?status=` lista de canchas |
| POST / PUT / DELETE | `/courts[/:id]` | CRUD canchas |
| GET | `/courts/availability` | `?date&time&duration&surface` → canchas con `availableSlots: [{ start, end, price }]` |
| GET / POST | `/bookings` | `?date&courtId` / crear reserva |
| PATCH | `/bookings/:id` | `{ status }` |
| GET | `/users` | `?role&search` |
| PATCH | `/users/:id` | `{ role?, active? }` |
| GET | `/dashboard/stats` | KPIs + serie de ingresos |

Modelos: `Court { id, name, surface, indoor, pricePerHour, status, rating, reviewsCount }`, `Booking { id, courtId, courtName, playerName, date, startTime, endTime, status, price }`, `User { id, name, email, role, active, createdAt }`. Si el backend real difiere, adaptar **solo** `entity/*` (mapear a estos modelos).

Modo demo sin backend: `NEXT_PUBLIC_API_MOCK=true` (login `admin@padel.com` / `admin123`).

## 4. Roles

`OWNER` (todo, incluido cambiar roles) · `ADMIN` (canchas, horarios, reservas, ver usuarios) · `PLAYER` (sin acceso al dashboard). Constantes en `src/lib/constants.js`.

## 5. Sistema de diseño "PULPAD"

Dark mode nativo (no hay tema claro). Estética tecnológica/deportiva: fondo espacial, brillos azules, líneas de cancha.

### Colores

| Token | Tailwind | HEX | Uso |
| --- | --- | --- | --- |
| Fondo base | `slate-950` | `#020617` | inicio del gradiente |
| Fondo profundo | `blue-950` | `#172554` | fin del gradiente (`bg-space`) |
| **Brand** | `brand-500` | `#4F86F7` | acento, palabras clave, botón primario |
| Brand hover | `brand-400` / `brand-600` | `#6F9BF9` / `#3A6FE0` | hover / active |
| Brand suave | `brand-300` | `#93B4FB` | texto sobre fondos oscuros |
| Superficie | `slate-900/60` | — | tarjetas (`Card variant="glass"`) |
| Borde | `slate-700` / `slate-800` | `#334155` / `#1E293B` | bordes sutiles |
| Texto | `white` / `slate-300` / `slate-400` | — | título / cuerpo / secundario |
| Estrellas | `yellow-400` | `#FACC15` | rating |
| Éxito / Aviso / Error | `emerald-400` / `amber-400` / `rose-400` | — | estados |

Fondo de página: utility `bg-space` (`slate-950 → blue-950`). Nunca usar blanco como fondo de superficie.

### Tipografía

- Display (títulos, cifras): **Sora** → `font-display`.
- Cuerpo: **Geist Sans** → `font-sans`.
- Títulos grandes (`text-4xl`–`text-7xl`, `font-bold`, `tracking-tight`) en blanco con las palabras clave en `text-brand-500` (componente `<Highlight>` o `span.text-brand-500`).

### Componentes base (`components/ui`)

- **Button** — `variant`: `primary` (azul sólido, `rounded-xl`, texto blanco, ícono) · `secondary` (transparente, `border-slate-700`, ícono) · `ghost` · `danger`. `size`: `sm|md|lg`. Slots: `leadingIcon`, `trailingIcon`. `href` → renderiza `Link`.
- **Card** — compuesto: `Card`, `Card.Header`, `Card.Title`, `Card.Description`, `Card.Content`, `Card.Footer`. `variant`: `glass|solid|interactive`.
- **Badge** (`tone`), **StarRating**, **StatCard**, **DataTable**, **BarChart**, **Modal**, **Field/Input/Select**, **Spinner**, **Skeleton**, **EmptyState**, **ErrorState**, **PageHeader**.
- **Trust indicators:** `StarRating` + texto ("Más de 100 clubes ya lo utilizan") en el hero.

### Idioma

Interfaz en español (es-AR). Fechas ISO `YYYY-MM-DD` en la API, formateadas con `src/lib/format.js` (usa fecha **local**, nunca `toISOString()` para fechas de calendario).

## 6. Comandos

```bash
npm run dev      # desarrollo (usar .env.local, ver .env.example)
npm run build    # genera ./out (estático)
npm run lint
```

Demo sin backend (PowerShell): `$env:NEXT_PUBLIC_API_MOCK='true'; npm run dev`.

## 7. Checklist para nuevas features

1. ¿El dato viene de un backend? → función nueva en `entity/<dominio>.js`.
2. ¿Existe una primitiva en `components/ui`? Reutilizar/extender por `variant`, no duplicar.
3. ¿Necesita estado o eventos? → Client Component, lo más bajo posible en el árbol.
4. Estados obligatorios en toda vista con datos: loading (`Skeleton`), error (`ErrorState` con reintento), vacío (`EmptyState`).
5. Accesibilidad: `label` asociado, `aria-label` en botones de solo ícono, foco visible, contraste AA.
6. Ejecutar `npm run lint` y `npm run build` antes de cerrar.
