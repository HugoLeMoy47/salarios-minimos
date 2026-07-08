# 🔎 Auditoría de Seguridad, Resiliencia y Accesibilidad

**Fecha de creación**: Julio 2026
**Alcance**: Seguridad de la aplicación, resiliencia ante fallos, y usabilidad/accesibilidad (incluyendo personas con discapacidad) de **Días de Salario**.
**Naturaleza de este documento**: es un documento **vivo**. Cada hallazgo tiene un campo `Estado` que debe actualizarse conforme se resuelva (`Pendiente` → `En progreso` → `Resuelto` / `Diferido`), y el [Registro histórico](#-registro-histórico--changelog) al final se usa para dejar constancia de cuándo y cómo se atendió cada punto. No se debe borrar información histórica: si un hallazgo se resuelve, se marca como tal y se conserva.

---

## 📋 Tabla de contenidos

- [Resumen ejecutivo](#-resumen-ejecutivo)
- [Metodología y alcance](#-metodología-y-alcance)
- [Hallazgos: Seguridad](#-hallazgos-seguridad)
- [Hallazgos: Resiliencia](#️-hallazgos-resiliencia)
- [Hallazgos: Accesibilidad y usabilidad](#-hallazgos-accesibilidad-y-usabilidad)
- [Análisis de impacto armonizado](#-análisis-de-impacto-armonizado)
- [Matriz de priorización armonizada](#-matriz-de-priorización-armonizada)
- [Rutas posibles: decisiones tomadas](#️-rutas-posibles-decisiones-tomadas)
- [Mejores prácticas recomendadas](#-mejores-prácticas-recomendadas)
- [Roadmap propuesto](#-roadmap-propuesto)
- [Registro histórico / Changelog](#-registro-histórico--changelog)

---

## 🎯 Resumen ejecutivo

| Categoría                   | Hallazgos | Críticos/Altos | Medios | Bajos |
| --------------------------- | --------- | -------------- | ------ | ----- |
| 🔐 Seguridad                | 8         | 4              | 3      | 1     |
| 🛡️ Resiliencia              | 5         | 1              | 3      | 1     |
| ♿ Accesibilidad/Usabilidad | 4         | 1              | 2      | 1     |
| **Total**                   | **17**    | **6**          | **8**  | **3** |

**Lectura rápida**: el proyecto no tiene vulnerabilidades de inyección clásicas (Prisma + Zod ya cubren eso) ni fugas de secretos. El riesgo real está concentrado en tres focos:

1. **Superficie de ataque inflada innecesariamente** — dependencias con CVEs altos que ni siquiera se usan en el código (`axios`, `nodemailer`).
2. **Endpoints públicos sin control de abuso** — cero rate limiting, y un endpoint (`/api/consent`) que confía en un `userId` que el propio cliente le manda.
3. **El modo oscuro, pensado como feature de accesibilidad, no funciona en la mayoría de la app** — contradice su propio propósito.

Nada de esto bloquea el uso normal del MVP hoy, pero **S2 (consent forgery)** y **S4 (sin rate limiting)** sí deberían resolverse antes de cualquier lanzamiento con usuarios reales, dado el modelo de negocio de la app (datos de comportamiento financiero vendidos como leads).

---

## 🔬 Metodología y alcance

**Cómo se generaron estos hallazgos:**

- `npm audit --json` sobre el árbol de dependencias completo (1017 paquetes).
- Revisión manual de todas las rutas API (`src/app/api/**`), `auth.ts`, `prisma.ts`, y ausencia/presencia de `middleware.ts`.
- Cálculo real de contraste WCAG (fórmula de luminancia relativa) sobre los pares de color usados en `theme.tsx` y en componentes con colores hardcodeados.
- Lectura componente por componente (`Header`, `ItemForm`, `MeditationTimer`, `FinancialHealthSummary`, `CreditMarketplace`, `ThemeToggle`, `page.tsx`, `onboarding/page.tsx`) buscando roles ARIA, jerarquía de encabezados, nombres accesibles y manejo de foco.

**Fuera de alcance (no se hizo, para que quede claro qué falta validar):**

- Pentesting activo / explotación real de ninguna vulnerabilidad.
- Pruebas con lector de pantalla real (NVDA/JAWS/VoiceOver) — el análisis de accesibilidad es estático, basado en código.
- Pruebas de carga para validar los límites de concurrencia de SQLite mencionados en R3.
- Auditoría de los proveedores OAuth (Google/Microsoft/Apple) en sí mismos, solo de cómo se configuran.

---

## 🔐 Hallazgos: Seguridad

### S1 — Dependencias directas con CVEs que no se usan en el código

**Severidad**: 🔴 Alta · **Estado**: Resuelto (2026-07-08)

`axios` (~22 CVEs: SSRF vía bypass de `NO_PROXY`, prototype pollution, header injection, ReDoS) y `nodemailer` (inyección de comandos SMTP, bypass de TLS) están en `package.json` como dependencias directas, pero **no hay un solo `import` de ninguna de las dos en `src/`** (verificado con grep en todo el árbol). Son peso muerto que solo aporta riesgo.

**Impacto**: bajo en explotabilidad (no hay código que las invoque), pero alto en "ruido" — infla el conteo de vulnerabilidades reales del proyecto y confunde cualquier auditoría futura (¿es axios explotable o no? hoy la respuesta es "no importa, ni se usa").

**Ruta recomendada**: `npm uninstall axios nodemailer @types/nodemailer`. Si en el futuro se necesita HTTP client, usar `fetch` nativo (ya disponible en Node/Next, cero dependencias nuevas); si se necesita envío de correo, evaluar el proveedor en ese momento con la versión más reciente.

---

### S2 — `/api/consent` acepta un `userId` arbitrario sin autenticación

**Severidad**: 🔴 Alta · **Estado**: Resuelto (2026-07-08)
**Ubicación**: `src/app/api/consent/route.ts`

El endpoint es público (correcto para consentimiento anónimo), pero si el body incluye `userId`, ese valor se graba tal cual en `ConsentLog` sin verificar sesión ni pertenencia. Cualquiera que conozca o adivine un `id` (cuid de Prisma) puede insertar un registro de consentimiento falso a nombre de otro usuario.

**Impacto**: el consentimiento es un registro con peso legal bajo GDPR/LFPDPPP — un registro falsificable no sirve como prueba de nada, y si alguna vez se usa para justificar el uso de datos de un usuario, es una base legal débil.

**Rutas posibles**:

1. **(Recomendada)** Si hay sesión activa, derivar `userId` del `session.user.id` del servidor, ignorando cualquier `userId` que mande el cliente. Si no hay sesión, forzar `userId: null` (consentimiento anónimo real).
2. Quitar `userId` del schema de consentimiento por completo y asociar el consentimiento al `shadowUUID` en su lugar (coherente con el resto del modelo "shadow profile").

---

### S3 — `GET /api/events` (estadísticas agregadas) es público

**Severidad**: 🟠 Media-Alta · **Estado**: Resuelto (2026-07-08 — opción 2: API key)
**Ubicación**: `src/app/api/events/route.ts:51`

El comentario dice `// admin only` pero no hay ningún chequeo de sesión ni rol. Expone conteos agregados de eventos por tipo/bucket de la última semana, más un desglose por geohash de 6 caracteres (~610 km²) — no es información personal identificable, pero sí es inteligencia de negocio y de uso expuesta sin control a cualquiera en internet.

**Rutas posibles**:

1. Requerir sesión + un campo de rol admin (hoy no existe rol en el modelo `User`; habría que añadirlo).
2. Mover a un endpoint interno protegido por un secreto compartido (`ADMIN_API_KEY` en header), más simple si no se quiere modelar roles todavía.

---

### S4 — Cero rate limiting en cualquier endpoint

**Severidad**: 🔴 Alta · **Estado**: Resuelto (2026-07-08 — in-memory)

Ninguna ruta bajo `src/app/api` tiene límite de tasa. `/api/events`, `/api/consent` y `DELETE /api/gdpr/delete-shadow` son públicas y no autenticadas — un script puede escribir miles de filas por segundo en `AnonymizedEvent` o `ConsentLog`, o intentar `DELETE /api/gdpr/delete-shadow` contra UUIDs al azar.

**Impacto**: agotamiento de recursos de BD, costo de hosting descontrolado, contaminación de las métricas de analítica que la app usa para su propio negocio (marketplace de crédito basado en "score de meditación").

**Rutas posibles**: ver sección [Rutas posibles: decisiones tomadas](#️-rutas-posibles-decisiones-tomadas) — se eligió la opción in-memory.

---

### S5 — Sin headers de seguridad HTTP (CSP, HSTS, X-Frame-Options)

**Severidad**: 🟠 Media · **Estado**: Resuelto (2026-07-08)

`SECURITY.md` documenta CSP y HSTS como "✅ Implementado", pero no existe `middleware.ts` ni configuración de headers en `next.config.ts`. Es una brecha entre lo documentado y lo real, no solo un hueco técnico.

**Impacto**: sin CSP, un XSS futuro (por ejemplo vía una librería de terceros comprometida) tiene mucho más margen para ejecutar payloads; sin `X-Frame-Options`/`frame-ancestors`, la app es clickjackeable.

**Ruta recomendada**: usar `headers()` en `next.config.ts` (mecanismo nativo de Next, sin dependencias nuevas) para fijar `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y `X-Frame-Options: DENY`. Luego corregir `SECURITY.md` para que documente lo que realmente existe.

---

### S6 — No existe middleware global de autenticación (contradice `SECURITY.md`)

**Severidad**: 🟡 Media · **Estado**: Resuelto (2026-07-08 — se corrigió la documentación)

`SECURITY.md` documenta un `middleware.ts` con `matcher: ['/dashboard/:path*', '/api/items/:path*']` que protege rutas automáticamente. Ese archivo no existe. Hoy la protección real depende de que **cada** route handler recuerde llamar `getServerSession()` — lo cual, verificado a mano, sí se hace correctamente en todas las rutas que lo requieren, pero no hay una red de seguridad si una ruta nueva se agrega sin ese chequeo.

**Impacto**: bajo hoy (nada está desprotegido en la práctica), pero es deuda de proceso — el riesgo crece con cada ruta nueva que se agregue sin disciplina.

**Ruta recomendada**: o se implementa el middleware real que documenta `SECURITY.md`, o se corrige la documentación para reflejar el patrón real (chequeo por handler) y se compensa con un test que falle si una ruta bajo `/api/items` o `/api/backup` no importa `getServerSession`.

---

### S7 — `next@16.1.6` con múltiples CVEs altos ya parchados

**Severidad**: 🟠 Media-Alta · **Estado**: Resuelto (2026-07-08)

`npm audit` señala 16 avisos altos sobre `next` en el rango `>=16.0.0 <16.2.5/16.2.6`, incluyendo bypass de CSRF en Server Actions, XSS vía CSP nonces, varios DoS, y cache poisoning. Fix disponible: `16.2.10` (no es cambio de major).

**Ruta recomendada**: `npm install next@16.2.10` y correr la suite completa de tests + build antes de aceptar. Bajo riesgo de romper algo porque no es un salto de versión mayor.

---

### S8 — `uuid`/`next-auth` con avisos moderados (fix implica salto de major)

**Severidad**: 🟡 Media · **Estado**: Diferido (2026-07-08 — se hará junto con la migración a Auth.js)

`uuid@9` tiene un aviso moderado (bounds check faltante en v3/v5/v6 — no afecta a `v4`, que es lo único que usa `shadow-profile.ts`, así que el riesgo real es bajo). El fix es `uuid@14` (major bump). `next-auth` arrastra avisos moderados vía sus dependencias de `nodemailer`/`uuid` internas.

**Ruta recomendada**: baja prioridad dado que el código solo usa `uuidv4()` (no afectado). Evaluar el upgrade de `next-auth` cuando se planee la migración a NextAuth v5 (Auth.js), no aisladamente.

---

## 🛡️ Hallazgos: Resiliencia

### R1 — Sin límites de fallos globales en el cliente (React error boundaries)

**Severidad**: 🟠 Media-Alta · **Estado**: Resuelto (2026-07-08)

No existe `error.tsx`, `global-error.tsx` ni `not-found.tsx` en `src/app`. Cualquier error de renderizado no capturado muestra la pantalla de crash genérica de Next.js, y cualquier ruta inexistente muestra el 404 por defecto (sin la identidad visual de la app).

**Ruta recomendada**: agregar `src/app/error.tsx` (boundary de errores con botón "reintentar"), `src/app/not-found.tsx` (404 con la marca de la app) y opcionalmente `loading.tsx` para estados de carga.

---

### R2 — Fusión de shadow profile sin transacción ni idempotencia

**Severidad**: 🔴 Alta · **Estado**: Resuelto (2026-07-08)
**Ubicación**: `src/app/api/shadow-profile/route.ts`

`localItems.map(item => prisma.item.create(...))` se ejecuta dentro de `Promise.all`, sin envolver en una transacción Prisma (`prisma.$transaction`). Si el item 5 de 10 falla (por ejemplo, un valor fuera de rango que pasó la validación pero rompe una constraint de BD), los primeros 4 ya se escribieron y no hay rollback. Además, si el cliente reintenta la fusión tras un fallo parcial, **no hay ninguna clave de idempotencia**, así que los items ya migrados se duplican.

**Impacto**: es el flujo más importante del producto (pasar de usuario anónimo a autenticado sin perder su historial) y es el que menos garantías de atomicidad tiene.

**Ruta recomendada**: envolver la creación de items en `prisma.$transaction(...)`, y usar un campo natural (por ejemplo un hash de `description+price+createdAt` del item local) o simplemente comprobar `shadowProfile.mergedAt` antes de repetir la migración, para que la operación sea idempotente.

---

### R3 — SQLite sin WAL ni `busy_timeout` configurado

**Severidad**: 🟡 Media · **Estado**: Diferido (2026-07-08 — la migración a Postgres/Supabase lo vuelve irrelevante)
**Ubicación**: `src/lib/prisma.ts` (adapter `@prisma/adapter-better-sqlite3`)

El adapter se instancia solo con `{ url: databaseUrl }`. Por defecto, SQLite en modo `journal_mode=DELETE` (el default) permite un solo escritor a la vez; sin `busy_timeout`, escrituras concurrentes fallan inmediatamente con `SQLITE_BUSY` en vez de esperar.

**Ruta recomendada** (solo relevante mientras se siga usando SQLite en producción; si se migra a Postgres/Supabase esto deja de aplicar): pasar `pragma: { journal_mode: 'WAL', busy_timeout: 5000 }` si el adapter lo soporta, o ejecutar `PRAGMA journal_mode=WAL;` una vez al inicializar.

---

### R4 — Cobertura desigual de `retry()` entre rutas

**Severidad**: 🟡 Media · **Estado**: Resuelto (2026-07-08)

Solo `item.service.ts` envuelve sus llamadas Prisma en `retry()` con backoff exponencial. Las rutas de `consent`, `events`, `gdpr`, y `shadow-profile` llaman a Prisma directamente — un error transitorio de conexión (timeout, `SQLITE_BUSY`, blip de red si se migra a Postgres remoto) se propaga como 500 sin ningún reintento.

**Ruta recomendada**: mover la lógica de `retry()` a un wrapper alrededor del cliente Prisma completo (por ejemplo, dentro de `withApiHandler` o como parte del Proxy en `prisma.ts`), en vez de aplicarlo caso por caso.

---

### R5 — Sin endpoint de healthcheck

**Severidad**: 🟢 Baja · **Estado**: Resuelto (2026-07-08)

No existe `/api/health` (o similar). La mayoría de plataformas de despliegue (Railway, Docker/K8s, balanceadores) esperan un endpoint ligero para monitoreo de disponibilidad.

**Ruta recomendada**: `GET /api/health` que haga un `SELECT 1` a la BD y responda `200`/`503`, sin autenticación, sin lógica de negocio.

---

## ♿ Hallazgos: Accesibilidad y usabilidad

### A1 — El modo oscuro no se aplica a la mayoría del contenido real

**Severidad**: 🔴 Alta · **Estado**: Resuelto (2026-07-08)
**Ubicación**: `src/app/page.tsx:92`, `src/components/FinancialHealthSummary.tsx`, `src/components/CreditMarketplace.tsx`

El toggle de tema (`ThemeToggle.tsx`) sí cambia la paleta de MUI, pero el fondo de toda la pantalla principal (`bgcolor: '#f3f2f1'` hardcodeado) y casi todos los textos/fondos de `FinancialHealthSummary` y `CreditMarketplace` (`color: '#323130'`, `color: '#605e5c'`, `border: '#e1dfdd'`, etc.) están escritos como hex literal en vez de usar los tokens del theme (`theme.palette.text.primary`, `theme.palette.background.default`, etc). Resultado: un usuario que activa modo oscuro (por fotosensibilidad, migraña, o preferencia) sigue viendo el lienzo y el contenido en modo claro en casi toda la app.

**Nota importante**: los pares de color en sí **sí pasan WCAG AA** cuando se calculó su contraste (`#605e5c` sobre blanco → 6.46:1; `#856404` sobre `#fff3cd` → 4.96:1). El problema no es de contraste matemático, es que el modo oscuro simplemente no se activa donde más importa.

**Ruta recomendada**: reemplazar los hex hardcodeados por `theme.palette.*` (usando el hook `useTheme()` de MUI o la prop `sx` con callback `(theme) => ...`) en los tres archivos mencionados. Es mecánico pero son bastantes ocurrencias — conviene tratarlo como una tarea dedicada, no un ajuste rápido.

---

### A2 — La página principal no tiene ningún `<h1>`

**Severidad**: 🟠 Media-Alta · **Estado**: Resuelto (2026-07-08)
**Ubicación**: `src/app/page.tsx`, `src/components/Header.tsx`

La pantalla más visitada de la app (`/`) empieza su jerarquía de encabezados en h5/h6 (usados para "¿Qué quieres comprar?" y los títulos de tarjetas). No hay un h1 en ningún lado de esa página. Los usuarios de lector de pantalla usan la navegación por encabezados como primer método para orientarse en una página nueva, y saltar directo a "h1" es un patrón común — aquí no hay nada que encontrar.

Contraste positivo: `src/app/onboarding/page.tsx:70` sí usa `<Typography variant="h4" component="h1">` correctamente — es el patrón a replicar.

**Ruta recomendada**: agregar un `<h1>` visualmente oculto o visible (por ejemplo "Días de Salario" o "Calculadora de días de salario") en `page.tsx`, y bajar el resto de la jerarquía un nivel si hace falta para no saltarse de h1 a h5.

---

### A3 — Botón de ubicación (ícono solo) sin nombre accesible confiable

**Severidad**: 🟡 Media · **Estado**: Resuelto (2026-07-08)
**Ubicación**: `src/components/ItemForm.tsx:252-262`

El botón que solo muestra el emoji 📍 usa `title="Compartir ubicación (opcional)"` pero no `aria-label`. El atributo `title` no se expone de forma confiable en lectores de pantalla ni en dispositivos táctiles (no hay hover). El nombre accesible de este botón termina dependiendo de cómo cada lector de pantalla interprete el glyph del emoji, que es inconsistente entre plataformas.

**Ruta recomendada**: agregar `aria-label="Compartir ubicación (opcional)"` al `<Button>` (puede convivir con el `title` existente para el tooltip visual).

---

### A4 — El cronómetro de meditación no anuncia su progreso a lectores de pantalla

**Severidad**: 🟡 Media · **Estado**: Resuelto (2026-07-08)
**Ubicación**: `src/components/MeditationTimer.tsx`

El texto "Tiempo restante: Xh Ym" se actualiza cada segundo vía `setInterval`, pero no está envuelto en una región `aria-live`. Un usuario de lector de pantalla que navegue hasta ese texto lo escuchará una vez; no recibirá ninguna actualización automática mientras el tiempo avanza, ni cuando la meditación se completa y el botón de compra se desbloquea.

**Ruta recomendada**: envolver el `Typography` del tiempo restante en un contenedor con `aria-live="polite"` y `aria-atomic="true"`, pero **sin actualizar el DOM cada segundo** (eso sería spam de anuncios) — mejor anunciar solo en hitos relevantes (cada hora, o al completarse), controlando manualmente cuándo se actualiza el contenido de la región viva.

---

## 📊 Análisis de impacto armonizado

Este producto tiene una característica que amplifica el peso relativo de los hallazgos de seguridad frente a lo que sería típico en un MVP: **su modelo de negocio depende de vender leads de crédito basados en el comportamiento financiero del usuario** (`CreditMarketplace.tsx`, "Score de Meditación"). Eso cambia el cálculo de impacto en tres formas concretas:

1. **Legal/cumplimiento**: si el consentimiento (S2) puede falsificarse, y ese consentimiento es la base legal para compartir señales de comportamiento con financieras, el riesgo no es solo técnico — es regulatorio (GDPR/LFPDPPP exigen consentimiento verificable, no solo registrado).
2. **Confianza del usuario**: la promesa central de la app es "tus datos son privados, se anonimizan" (ver FAQ del README). Un endpoint de estadísticas público sin auth (S3) o eventos sin rate limit que alguien podría contaminar (S4) son, en la práctica, promesas rotas si se descubren.
3. **Accesibilidad como diferenciador ya anunciado**: el propio README presume "WCAG AA+" y modo oscuro como features ya implementadas. A1 y A2 son casos donde lo anunciado y lo real no coinciden — mismo patrón que S5/S6 en seguridad. Esto sugiere una causa raíz compartida: **features de la capa de plataforma (theme, middleware, headers) se documentan como completas al construir la base, pero no se re-verifican cuando se agregan pantallas/componentes nuevos**. Vale la pena resolverlo como proceso (ver Mejores prácticas), no solo parchar cada síntoma.

**Compounding**: R2 (sin transacción en el merge) y S4 (sin rate limit) interactúan — sin rate limit, es más fácil disparar el endpoint de merge repetidamente y explotar la falta de idempotencia de R2 para inflar el conteo de items de un usuario.

---

## 🎯 Matriz de priorización armonizada

Prioridad combinada considerando severidad, esfuerzo y exposición real (no solo severidad aislada):

| ID  | Hallazgo                              | Severidad     | Esfuerzo                    | Prioridad |
| --- | ------------------------------------- | ------------- | --------------------------- | --------- |
| S1  | Quitar axios/nodemailer sin uso       | 🔴 Alta       | 5 min                       | **P0**    |
| S2  | Consent forgeable (userId de cliente) | 🔴 Alta       | 30 min                      | **P0**    |
| A2  | Sin `<h1>` en home                    | 🟠 Media-Alta | 15 min                      | **P0**    |
| A3  | Botón ubicación sin aria-label        | 🟡 Media      | 5 min                       | **P0**    |
| S7  | Upgrade `next` a 16.2.10              | 🟠 Media-Alta | 1-2h (+ regresión)          | **P1**    |
| S5  | Security headers (CSP/HSTS/etc.)      | 🟠 Media      | 1-2h                        | **P1**    |
| R2  | Transacción + idempotencia en merge   | 🔴 Alta       | 2-3h                        | **P1**    |
| S4  | Rate limiting                         | 🔴 Alta       | 1h (in-memory) / 3h (Redis) | **P1**    |
| A1  | Dark mode real en componentes         | 🔴 Alta       | 3-4h                        | **P1**    |
| R1  | Error boundaries (`error.tsx`, etc.)  | 🟠 Media-Alta | 1-2h                        | **P2**    |
| S3  | Proteger `/api/events` GET            | 🟠 Media-Alta | 1h                          | **P2**    |
| A4  | `aria-live` en meditation timer       | 🟡 Media      | 1h                          | **P2**    |
| S6  | Middleware real o corregir doc        | 🟡 Media      | 1-3h (según ruta)           | **P2**    |
| R4  | `retry()` centralizado                | 🟡 Media      | 1-2h                        | **P3**    |
| R3  | WAL/busy_timeout en SQLite            | 🟡 Media      | 30 min                      | **P3**    |
| S8  | Upgrade `uuid`/`next-auth`            | 🟡 Media      | 2-4h (major bump)           | **P3**    |
| R5  | Endpoint de healthcheck               | 🟢 Baja       | 30 min                      | **P3**    |

**Total estimado**: ~20-27 horas repartidas en 4 tandas (P0 a P3).

---

## 🛤️ Rutas posibles: decisiones tomadas

Decisiones resueltas por el usuario el 2026-07-08 (se conserva el planteamiento original para el histórico):

| Decisión                    | Opción A                                                      | Opción B                                                                                                     | Opción C                                                           | ✔ Elegida                                                                                   |
| --------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| **Rate limiting (S4)**      | In-memory simple, sin dependencias, funciona por instancia    | Upstash Redis, consistente entre instancias serverless, requiere cuenta externa                              | Omitir (ya elegido antes; se reabre aquí por su peso en la matriz) | **A** — implementado en `src/lib/rate-limit.ts`                                             |
| **`/api/events` GET (S3)**  | Requerir sesión + rol admin (implica modelar roles en `User`) | Proteger con API key compartida en header (más simple, menos "correcto")                                     | Eliminar el endpoint si no se usa en producción todavía            | **B** — `ADMIN_API_KEY` vía header `x-admin-key`; sin la variable, el endpoint responde 503 |
| **Middleware (S6)**         | Implementar `middleware.ts` real que documenta `SECURITY.md`  | Corregir la documentación para reflejar el patrón actual (chequeo por handler) + test que lo valide          | —                                                                  | **B** — `SECURITY.md` corregido                                                             |
| **SQLite vs Postgres (R3)** | Configurar WAL/busy_timeout y quedarse en SQLite por ahora    | Adelantar la migración a Postgres/Supabase ya discutida en la sesión anterior, que vuelve moot este hallazgo | —                                                                  | **B** — R3 diferido; se resolverá con la migración a Postgres                               |

---

## ✅ Mejores prácticas recomendadas

### Seguridad

- **La identidad nunca viaja en el body del request.** Si hay sesión, `userId` sale de `getServerSession()`, nunca del JSON que manda el cliente (aplica retroactivamente a S2, y como regla para cualquier endpoint nuevo).
- `npm audit` como _gate_ en CI (fallar el build si aparece una vulnerabilidad crítica/alta en una dependencia de producción), no solo revisión manual ocasional.
- Antes de agregar una dependencia nueva, verificar que realmente se vaya a importar en el mismo PR — evita el caso de S1.
- Cualquier claim de seguridad en `SECURITY.md` debe tener un test o un archivo que lo respalde (si dice "CSP implementado", que exista el header y un test que lo verifique).

### Resiliencia

- Toda operación que escriba más de un registro relacionado va en `prisma.$transaction(...)`.
- Toda operación que un cliente pueda reintentar (merge, restore, submit) necesita una clave de idempotencia o una comprobación de estado previa.
- `error.tsx` / `not-found.tsx` / `loading.tsx` son parte del checklist de "página nueva", no un extra opcional.
- Un endpoint de healthcheck debe existir desde el primer despliegue a producción, no agregarse después de un incidente.

### Accesibilidad

- **Nunca hex hardcodeado en componentes de contenido** — siempre `theme.palette.*` o variables CSS ligadas al theme. Es la única forma de que el modo oscuro (o cualquier futuro modo de alto contraste) funcione de verdad.
- Checklist por página nueva: ¿tiene exactamente un `<h1>`? ¿la jerarquía de encabezados no salta niveles? ¿todo botón de ícono-solo tiene `aria-label`? ¿todo contenido que cambia solo (timers, contadores, validaciones async) tiene una estrategia de `aria-live` decidida a propósito (aunque la decisión sea "no anunciar cada segundo")?
- Automatizar una capa base con `jest-axe` o `@axe-core/react` en los tests de componentes existentes (`src/lib/__tests__`, o nuevos `src/components/__tests__`) para atrapar regresiones de accesibilidad sin depender de revisión manual cada vez.
- Antes de anunciar una feature de accesibilidad como "✅ Implementado" en el README, probarla manualmente con el escenario que dice cubrir (activar dark mode y navegar toda la app, no solo el header).

---

## 🗺️ Roadmap propuesto

### Fase 1 — P0 (día 1, ~1 hora)

- S1: quitar `axios`/`nodemailer`
- S2: `userId` de consentimiento derivado de sesión, no del body
- A2: agregar `<h1>` a la home
- A3: `aria-label` en botón de ubicación

### Fase 2 — P1 (semana 1, ~8-11 horas)

- S7: upgrade `next` a 16.2.10 + regresión completa
- S5: security headers en `next.config.ts`
- R2: transacción + idempotencia en shadow-profile merge
- S4: rate limiting (según la ruta elegida en la tabla de decisiones)
- A1: refactor de colores hardcodeados a tokens del theme

### Fase 3 — P2 (semana 2, ~4-6 horas)

- R1: `error.tsx`/`not-found.tsx`
- S3: proteger `/api/events` GET
- A4: `aria-live` en meditation timer
- S6: middleware real o corrección de `SECURITY.md`

### Fase 4 — P3 (cuando haya espacio, ~4-9 horas)

- R4: `retry()` centralizado
- R3: WAL/busy_timeout (si se sigue en SQLite)
- S8: upgrade `uuid`/`next-auth`
- R5: healthcheck endpoint

---

## 📜 Registro histórico / Changelog

> Cada vez que se resuelva, difiera o reabra un hallazgo, agregar una línea aquí con fecha. No editar entradas pasadas — solo añadir.

- **2026-07-08**: Documento creado a partir de la auditoría inicial de seguridad, resiliencia y accesibilidad. Los 17 hallazgos (S1-S8, R1-R5, A1-A4) quedan en estado `Pendiente`.
- **2026-07-08**: Ejecución del roadmap completo (Fases 1-4) en una sola tanda. **15 hallazgos resueltos**, 2 diferidos con justificación:
  - **S1** ✅ `axios`, `nodemailer` y `@types/nodemailer` desinstalados. `npm audit` de producción pasó de 22+ CVEs directos de runtime a 0; lo restante es cadena de herramientas de desarrollo (markdownlint, prisma CLI).
  - **S2** ✅ `/api/consent` deriva `userId` de `getServerSession()`; el campo se eliminó del schema Zod para que el valor del cliente se ignore por completo.
  - **S3** ✅ `GET /api/events` exige header `x-admin-key` igual a `ADMIN_API_KEY` (documentada en README); sin la variable configurada responde 503 (cerrado por defecto). Rate limit adicional de 10 req/min.
  - **S4** ✅ Rate limiting in-memory (`src/lib/rate-limit.ts`, ventana fija por IP con limpieza periódica) aplicado a `/api/events` (30/min POST, 10/min GET), `/api/consent` (10/min), `DELETE /api/gdpr/delete-shadow` (5/min) y `DELETE /api/shadow-profile` (5/min). Limitación por-instancia documentada en el código y en `SECURITY.md`.
  - **S5** ✅ Headers de seguridad vía `headers()` en `next.config.ts`: CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`. Nota: CSP incluye `'unsafe-inline'` en script-src/style-src por requisitos de Next.js/MUI — endurecer con nonces queda como mejora futura.
  - **S6** ✅ `SECURITY.md` corregido: sección de middleware reemplazada por el patrón real (chequeo por handler + regla para rutas nuevas), sección de rate limiting actualizada a la implementación real, ejemplo de consentimiento actualizado al patrón anti-falsificación.
  - **S7** ✅ `next` 16.1.6 → 16.2.10 (+ `eslint-config-next`). Los 16 avisos altos de Next quedaron resueltos; build, type-check y suite completa de tests en verde. Nota: el build ajustó `moduleResolution: bundler` en tsconfig automáticamente.
  - **S8** ⏸️ Diferido — el propio análisis recomienda hacer el upgrade de `next-auth` junto con la migración a Auth.js (v5), no aisladamente. El aviso de `uuid` no afecta a `v4()`, único uso del proyecto.
  - **R1** ✅ `src/app/error.tsx` (boundary con botón de reintento y `role="alert"`) y `src/app/not-found.tsx` (404 con identidad de la app) creados.
  - **R2** ✅ Merge de shadow profile envuelto en `prisma.$transaction`; idempotencia por `mergedAt`+`mergedWithUserId` (reintento no duplica items; profile fusionado con otra cuenta responde 409).
  - **R3** ⏸️ Diferido — decisión del usuario: la migración planeada a Postgres/Supabase vuelve irrelevante la configuración WAL de SQLite.
  - **R4** ✅ `retry()` centralizado en el Proxy de `src/lib/prisma.ts`: toda operación de modelo y todo `$transaction` (como unidad completa) se reintentan con backoff. Se eliminó el `retry()` redundante de `item.service.ts` para evitar reintentos anidados.
  - **R5** ✅ `GET /api/health` creado: `SELECT 1` a la BD, responde 200/503, sin autenticación.
  - **A1** ✅ Cero hex hardcodeado fuera de `theme.tsx` (verificado con grep). El theme ganó tokens `success`/`error`/`warning`/`divider` conscientes del modo; `page.tsx`, `FinancialHealthSummary`, `CreditMarketplace`, `Header` y `MeditationTimer` migrados a tokens. Bonus: se eliminó lógica muerta del botón de compra en vista "meditando" (el timer regresa el item a pendientes automáticamente), lo que también resolvió 4 errores de lint `react-hooks/purity` preexistentes.
  - **A2** ✅ `<h1>` visible agregado a la home ("Calculadora de días de salario") con subtítulo; tarjetas de resumen y marketplace ahora usan `component="h2"`/`"h3"` para jerarquía coherente.
  - **A3** ✅ `aria-label` en el botón de ubicación; el emoji quedó `aria-hidden`.
  - **A4** ✅ `MeditationTimer` con región `aria-live="polite"` visualmente oculta que anuncia solo en hitos (una vez por hora y al completar), no cada segundo; `LinearProgress` con `aria-label`.
  - **Verificación**: `tsc --noEmit` limpio, 37/37 tests, `eslint` 0 errores/0 warnings, build de producción exitoso con Next 16.2.10.
