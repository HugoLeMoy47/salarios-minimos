# ⚡ Guía de Performance y Optimización

Estrategias para optimizar **Días de Salario** para producción.

## 📋 Tabla de contenidos

- [Análisis de performance](#análisis-de-performance)
- [Optimizaciones frontend](#optimizaciones-frontend)
- [Optimizaciones backend](#optimizaciones-backend)
- [Optimización de BD](#optimizaciones-de-base-de-datos)
- [Caching strategies](#caching-strategies)
- [Monitoreo](#monitoreo)
- [Benchmarks](#benchmarks)

---

## 🔍 Análisis de performance

### Core Web Vitals (CWV)

Google mide performance con 3 métricas:

| Métrica                            | Excelente | Bueno     | Mejorar |
| ---------------------------------- | --------- | --------- | ------- |
| **LCP** (Largest Contentful Paint) | <2.5s     | 2.5-4s    | >4s     |
| **FID** (First Input Delay)        | <100ms    | 100-300ms | >300ms  |
| **CLS** (Cumulative Layout Shift)  | <0.1      | 0.1-0.25  | >0.25   |

### Herramientas de medición

```bash
# 1. Lighthouse (en Chrome DevTools)
# - Abre DevTools (F12)
# - Ve a "Lighthouse"
# - Click "Analyze page load"

# 2. PageSpeed Insights
# https://pagespeed.web.dev

# 3. WebPageTest
# https://www.webpagetest.org

# 4. npm package
npm install -g lighthouse
lighthouse https://tu-app.com
```

---

## 🚀 Optimizaciones Frontend

### 1️⃣ Next.js Image Optimization

```typescript
// ✅ BUENO - Next.js Image
import Image from "next/image";

export function Avatar({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={64}
      height={64}
      priority={false} // Lazy load
    />
  );
}

// ❌ MALO - HTML img
export function Avatar({ src, alt }) {
  return <img src={src} alt={alt} />; // Sin optimizar
}
```

### 2️⃣ Code Splitting automático

Next.js splitea código por ruta automáticamente.

```typescript
// ❌ MALO - Importar todo al inicio
import { HeavyComponent } from "@/components/Heavy";
import { AnotherHeavy } from "@/components/Another";

// ✅ BUENO - Dynamic import (code splitting)
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(
  () => import("@/components/Heavy"),
  { loading: () => <div>Loading...</div> }
);

export function Page() {
  return <HeavyComponent />;
}
```

### 3️⃣ Optimizar bundles de JavaScript

```bash
# Ver tamaño de bundles
npm run build

# Output:
# ○ /                                                  7.5 kB
# ○ /auth/signin                                       5.2 kB
# ○ /dashboard                                         8.1 kB

# Si bundle es muy grande:
# 1. Code splitting con dynamic()
# 2. Tree-shaking en tsconfig.json
# 3. Remover librerías no usadas
```

### 4️⃣ Lazy loading de componentes

```typescript
import { Suspense, lazy } from "react";

// Lazy load dashboard
const Dashboard = lazy(() => import("@/pages/dashboard"));

export function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Dashboard />
    </Suspense>
  );
}
```

### 5️⃣ Optimize CSS

```typescript
// tailwind.config.ts
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  // Purge CSS no usado
  // Tailwind elimina automáticamente CSS no usado en producción
};
```

### 6️⃣ Prefetching de links

```typescript
// ✅ Next.js Link prefetcha automáticamente (prod)
import Link from "next/link";

export function Navigation() {
  return (
    <Link href="/dashboard" prefetch={true}>
      Dashboard
    </Link>
  );
}
```

---

## 🔧 Optimizaciones Backend

### 1️⃣ Cachear respuestas API

```typescript
// src/app/api/items/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Cache por 60 segundos
  const response = NextResponse.json(items);
  response.headers.set('Cache-Control', 'public, max-age=60');
  return response;
}
```

Headers de cache:

| Valor        | Descripción              |
| ------------ | ------------------------ |
| `max-age=60` | Cachear 60 segundos      |
| `public`     | Cualquiera puede cachear |
| `private`    | Solo el navegador        |
| `no-cache`   | Validar antes de usar    |
| `no-store`   | No cachear               |

### 2️⃣ Compresión GZIP

```typescript
// next.config.ts
export default {
  compress: true, // GZIP automático
  // Reduce tamaño en 70% típicamente
};
```

### 3️⃣ Ejecutar tareas en background

```typescript
// ✅ BUENO - Responde rápido
export async function POST(request: Request) {
  const data = await request.json();

  // Guardar en BD
  await db.item.create({ data });

  // Email en background (no esperar)
  queueJob('sendNotificationEmail', { userId: data.userId });

  return NextResponse.json({ success: true });
}

// ❌ MALO - Espera el email
export async function POST(request: Request) {
  const data = await request.json();
  await db.item.create({ data });

  // Bloquea la respuesta
  await sendNotificationEmail(data.userId);

  return NextResponse.json({ success: true });
}
```

Usar librerías como:

- Bull (Redis queue)
- Inngest (serverless tasks)
- Axiom (event logging)

### 4️⃣ Database query optimization

```typescript
// ❌ MALO - N+1 queries
const users = await db.user.findMany();
for (const user of users) {
  // Ejecuta 1 query por usuario
  const items = await db.item.findMany({ where: { userId: user.id } });
}

// ✅ BUENO - Join en una query
const usersWithItems = await db.user.findMany({
  include: { items: true },
});

// Count without fetching
const itemCount = await db.item.count({
  where: { userId },
});
```

### 5️⃣ Pagination para grandes datasets

```typescript
// ✅ BUENO
export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = 20;

  const items = await db.item.findMany({
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  const total = await db.item.count();

  return NextResponse.json({
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}
```

Frontend:

```typescript
// Lazy load más items
const [items, setItems] = useState<Item[]>([]);
const [page, setPage] = useState(1);

function loadMore() {
  fetch(`/api/items?page=${page + 1}`)
    .then((r) => r.json())
    .then((data) => {
      setItems([...items, ...data.items]);
      setPage(page + 1);
    });
}
```

---

## 💾 Optimizaciones de Base de Datos

### 1️⃣ Indexing

```prisma
// prisma/schema.prisma

model Item {
  id    String  @id @default(cuid())
  name  String
  price Float
  userId String
  createdAt DateTime @default(now())

  // Query por userId muy frecuente
  @@index([userId])

  // Búsquedas por nombre
  @@index([name])

  // Filtros por fecha
  @@index([createdAt])

  // Búsqueda combinada
  @@index([userId, createdAt])
}
```

```bash
# Aplicar cambios
npm run prisma:migrate

# Ver indice creados
npx prisma studio
```

### 2️⃣ Selective fields

```typescript
// ❌ MALO - Fetch todo
const items = await db.item.findMany();

// ✅ BUENO - Solo lo necesario
const items = await db.item.findMany({
  select: {
    id: true,
    name: true,
    price: true,
    // No fetch de campos pesados
  },
});
```

### 3️⃣ Denormalization para reads frecuentes

```prisma
// Guardar información calculada
model User {
  id String @id
  email String

  // En lugar de COUNT(*) cada vez
  itemCount Int @default(0)
  totalSpent Float @default(0)
}
```

Actualizar cuando se crea item:

```typescript
await db.user.update({
  where: { id: userId },
  data: {
    itemCount: { increment: 1 },
    totalSpent: { increment: price },
  },
});
```

### 4️⃣ Partitioning para tablas grandes

```sql
-- Para 1M+ de filas
-- PostgreSQL automático por rango de dates
CREATE TABLE events (
  id SERIAL,
  timestamp TIMESTAMP,
  data JSON
) PARTITION BY RANGE (YEAR(timestamp));

CREATE TABLE events_2026 PARTITION OF events
  FOR VALUES FROM (2026-01-01) TO (2027-01-01);
```

---

## 🗂️ Caching Strategies

### Browser cache (Cliente)

```typescript
// Solicitar solo datos nuevos
const response = await fetch('/api/items', {
  headers: {
    'If-Modified-Since': lastFetch.toUTCString(),
  },
});

if (response.status === 304) {
  // No ha cambiado, usar cache local
  return cachedData;
}

const newData = await response.json();
```

### Server cache (Middleware)

```typescript
// next.config.ts
const withCache = (fn) => {
  const cache = new Map();

  return async (...args) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = await fn(...args);
    cache.set(key, result);

    // Limpiar después de 60s
    setTimeout(() => cache.delete(key), 60000);

    return result;
  };
};
```

### Redis cache (Recomendado producción)

```bash
npm install redis
```

```typescript
// src/lib/cache.ts
import { Redis } from 'redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
});

export async function getOrCache(key: string, cb: () => Promise<any>) {
  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached);
  }

  const result = await cb();

  // Cache por 300 segundos
  await redis.setex(key, 300, JSON.stringify(result));

  return result;
}
```

Uso:

```typescript
export async function GET() {
  const items = await getOrCache('user:1:items', () =>
    db.item.findMany({ where: { userId: '1' } })
  );

  return NextResponse.json(items);
}
```

---

## 📊 Monitoreo

### Lighthouse CI

```bash
npm install -g @lhci/cli@latest
```

Crear `lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": ["http://localhost:3000"]
    },
    "assert": {
      "assertMatrix": [
        {
          "matchingUrlPattern": "^http://localhost:3000/$",
          "assertions": {
            "categories:performance": ["error", { "minScore": 0.9 }],
            "categories:accessibility": ["error", { "minScore": 0.9 }],
            "categories:best-practices": ["error", { "minScore": 0.9 }],
            "categories:seo": ["error", { "minScore": 0.9 }]
          }
        }
      ]
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

Ejecutar:

```bash
lhci autorun
```

### Real User Monitoring (RUM)

Usar librerías como:

- Segment
- Mixpanel
- Datadog
- New Relic

```typescript
import * as Datadog from '@datadog/browser-rum';

Datadog.init({
  applicationId: 'xxx',
  clientToken: 'xxx',
  site: 'datadoghq.com',
  service: 'dias-salario',
  version: '1.0.0',
});

Datadog.startSessionReplayRecording();
```

---

## 📈 Benchmarks

### Métricas objetivo (MVP)

```
Métrica              Target    Actual
─────────────────────────────────────
First Contentful Paint      < 1.5s
Largest Contentful Paint    < 2.5s
Cumulative Layout Shift     < 0.1
First Input Delay           < 100ms
Time to Interactive         < 3s
Total Page Size             < 200KB
Time to First Byte          < 500ms
```

### Medir actuales

```bash
# 1. Local
npm run dev
lighthouse http://localhost:3000

# 2. Staging
lighthouse https://staging.app.com

# 3. Production
lighthouse https://diasdesalario.com
```

### Comparar antes/después

```bash
# Baseline (antes de cambios)
lighthouse https://app.com --output=json > baseline.json

# [Aplicar optimizaciones]

# Nuevo (después)
lighthouse https://app.com --output=json > new.json

# Comparar
npm install -g lighthouse-badge
lighthouse-badge --baseline baseline.json --output new.json
```

---

## 🔄 Performance Checklist

### Development

- [ ] Usar React.memo para componentes puros
- [ ] Lazy load componentes pesados
- [ ] Optimizar re-renders con useMemo/useCallback
- [ ] Remover console.log en prod

### Build

- [ ] npm run build ejecuta sin warnings
- [ ] Bundle size < 200KB (gzip)
- [ ] No hay uncovered branches
- [ ] Lighthouse score > 90

### Production

- [ ] GZIP activo
- [ ] Cache headers configurados
- [ ] Images optimizadas
- [ ] Redis/caching implementado
- [ ] CDN en lugar (Cloudflare, Vercel Edge)
- [ ] Database índices optimizados
- [ ] Monitoring activo

### Post-deployment

- [ ] Core Web Vitals monitoreados
- [ ] Alertas para degradación
- [ ] Review semanal de métricas
- [ ] A/B test cambios grandes

---

## 🧪 Load Testing

### Autocannon (simple)

```bash
npm install -g autocannon
autocannon -c 100 -d 30 http://localhost:3000
```

### K6 (avanzado)

```bash
npm install -g k6
```

Crear `k6-load-test.js`:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
};

export default function () {
  const res = http.get('http://localhost:3000/api/items');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

Ejecutar:

```bash
k6 run k6-load-test.js
```

---

## 📚 Recursos

- [Web Vitals Guide](https://web.dev/vitals/)
- [Lighthouse Performance](https://web.dev/lighthouse-performance/)
- [Next.js Optimization](https://nextjs.org/learn/foundations/how-nextjs-works/optimizing)
- [PostgreSQL Optimization](https://www.postgresql.org/docs/current/performance.html)
- [Redis Guide](https://redis.io/docs/about/about-redis/)

---

**Actualizado**: Febrero 2026  
**Versión**: 1.0.0-MVP
