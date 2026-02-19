# 🏗️ Arquitectura del Proyecto

Documentación técnica de la arquitectura de **Días de Salario**.

## 📊 Diagrama de arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                     CAPA DE PRESENTACIÓN                     │
│                      (Next.js Client)                        │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Home Page   │  │ Auth Pages    │  │   Components │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│         │                 │                   │               │
│         └─────────────────┼───────────────────┘               │
│                           │                                   │
├───────────────────────────┼───────────────────────────────────┤
│                           │                                   │
│               ┌───────────▼──────────┐                       │
│               │   SessionProvider    │                       │
│               │   (NextAuth/React)   │                       │
│               └──────────────────────┘                       │
│                                                               │
│                 CAPA DE CLIENTE LOCAL                        │
│                                                               │
│  ┌────────────────────────────────────────────────┐         │
│  │  IndexedDB (Shadow Profile)                    │         │
│  │  - Items locales                              │         │
│  │  - Datos sin sincronizar                      │         │
│  └────────────────────────────────────────────────┘         │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│                   API ROUTES (Next.js API)                   │
│                                                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │  /items  │ │ /shadow  │ │ /events  │ │  /gdpr   │        │
│  │ /auth    │ │ /backup  │ │ /consent │ │          │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│            CAPA DE SERVICIOS Y LÓGICA EMPRESARIAL            │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌────────────┐   │
│  │ Salary Calc     │  │ Shadow Profile  │  │ Encryption │   │
│  │                 │  │                 │  │            │   │
│  │ - calculateDays │  │ - getOrCreate   │  │ - encrypt  │   │
│  │ - getBuckets    │  │ - mergeProfile  │  │ - decrypt  │   │
│  └─────────────────┘  └─────────────────┘  └────────────┘   │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│                   CAPA DE PERSISTENCIA                        │
│                                                               │
│  ┌────────────────────────┐  ┌─────────────────────────┐    │
│  │   SQL Database         │  │  Cloud Storage          │    │
│  │   (Prisma ORM)         │  │  (Google Drive)         │    │
│  │                        │  │                         │    │
│  │ - Users                │  │ - Backups cifrados      │    │
│  │ - Items                │  │ - Contratos            │    │
│  │ - Backups              │  │                         │    │
│  │ - Events               │  │                         │    │
│  │ - Consent              │  │                         │    │
│  └────────────────────────┘  └─────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Flujos Principales

### 1. Crear Item (Shadow Profile - Sin autenticación)

```
Usuario → UI (ItemForm) → Guardar en IndexedDB
                      ↓
                 POST /api/events
                      ↓
            Analytics (anonimizado)
```

**Archivos involucrados:**

- `src/components/ItemForm.tsx` - Componente del formulario
- `src/lib/shadow-profile.ts` - Lógica de IndexedDB
- `src/app/api/events/route.ts` - Eventos anonimizados

### 2. Autenticación y Sincronización

```
Usuario → OAuth Provider → NextAuth
                      ↓
            Crear sesión JWT
                      ↓
         POST /api/shadow-profile/merge
                      ↓
        Fusionar items locales a BD
                      ↓
        Actualizar UI (ver historial)
```

**Archivos involucrados:**

- `src/lib/auth.ts` - Configuración NextAuth
- `src/app/api/auth/[...nextauth]/route.ts` - Rutas auth
- `src/app/api/shadow-profile/route.ts` - Merge de perfiles

### 3. Backup y Restauración

```
Usuario → POST /api/backup/create
              ↓
    Serializar items a JSON
              ↓
    Cifrar con AES-256
              ↓
    Cliente descarga archivo
              ↓
    Usuario sube a Google Drive
```

**Restauración:**

```
Usuario → POST /api/backup/restore
              ↓
    Desencriptar JSON
              ↓
    Validar estructura
              ↓
    INSERT en base de datos
              ↓
    Actualizar UI
```

**Archivos involucrados:**

- `src/lib/crypto.ts` - Cifrado/Desencriptación
- `src/app/api/backup/[create|restore]/route.ts`

## 💾 Modelo de Datos

### Usuarios

```typescript
model User {
  id                    String                 // ID único
  email                 String                 // Email único
  name                  String?
  image                 String?
  provider              String                 // google, microsoft, apple
  providerId            String
  createdAt             DateTime               // Timestamp creación
  updatedAt             DateTime               // Última modificación
  consentGiven          Boolean                // Consentimiento recopilación
  consentTimestamp      DateTime?

  // Relaciones
  items                 Item[]
  shadowProfile         ShadowProfile?
  backups               Backup[]
  deletionRequests      DeletionRequest[]
}
```

### Items

```typescript
model Item {
  id                    String
  userId                String?
  price                 Float                  // Precio en moneda local
  description           String                 // ¿Qué es?
  notes                 String?                // Notas adicionales
  photoUrl              String?                // URL de foto
  latitude              Float?
  longitude             Float?
  geohash               String?                // Para analytics

  status                String                 // pending|purchased|not_purchased
  postponedUntil        DateTime?              // Si está pospuesto
  notificationSent      Boolean

  createdAt             DateTime
  updatedAt             DateTime

  user                  User?                  // Relación a usuario
}
```

### Shadow Profile (Perfil Local)

```typescript
model ShadowProfile {
  id                    String
  uuid                  String                 // UUID para cliente
  mergedWithUserId      String?                // ID si fue fusionado
  mergedAt              DateTime?
  localDataJSON         String                 // Items serializados

  user                  User?                  // Usuario fusionado
  createdAt             DateTime
  updatedAt             DateTime
}
```

### Análisis (Anónimo)

```typescript
model AnonymizedEvent {
  id                    String
  eventType             String                 // item_created|purchased|etc
  salaryDaysBucket      String?                // 0-0.9|1-2.9|3-6.9|7+
  geohash6              String?                // Ubicación de 6 caracteres
  timestamp15min        DateTime               // Truncado a 15 minutos
  createdAt             DateTime
}
```

## 🔐 Capas de Seguridad

### Autenticación

```typescript
// NextAuth con múltiples proveedores OAuth
- Google OAuth 2.0
- Microsoft Azure AD
- Apple Sign In

// JWT Stateless
- Token almacenado en cookie httpOnly
- Renovación automática
- Expiración en 30 días
```

### Autorización

```typescript
// Middleware en rutas protegidas
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Validación de propiedad
const item = await prisma.item.findUnique({ where: { id } });
if (item.userId !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Anonimización de datos

```typescript
// Eventos enviados sin información personal
{
  eventType: 'item_created',        // Qué pasó
  salaryDaysBucket: '1-2.9',        // Rango, no valor
  geohash6: 'dvvdnn',               // ~610km², no ubicación exacta
  timestamp15min: '2024-02-18T10:15Z' // 15 min, no segundo exacto
}

// NO se envía:
// - userId
// - Descripción real
// - Coordenadas exactas
// - Timestamp exacto
```

### Encriptación

```typescript
// AES-256-CBC para backups
import CryptoJS from 'crypto-js';

const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), encryptionKey).toString();

const decrypted = JSON.parse(
  CryptoJS.AES.decrypt(encrypted, encryptionKey).toString(CryptoJS.enc.Utf8)
);
```

## 📦 Estructura de carpetas

```
src/
├── app/
│   ├── api/                          # API Routes
│   │   ├── auth/
│   │   │   └── [...nextauth]/route.ts     # NextAuth handler
│   │   ├── items/
│   │   │   ├── route.ts              # GET all, POST create
│   │   │   └── [id]/route.ts         # GET, PUT, DELETE individual
│   │   ├── shadow-profile/
│   │   │   └── route.ts              # Merge de perfiles
│   │   ├── events/
│   │   │   └── route.ts              # Analytics anonimizados
│   │   ├── backup/
│   │   │   ├── create/route.ts
│   │   │   └── restore/route.ts
│   │   ├── consent/route.ts          # Registro de consentimientos
│   │   └── gdpr/
│   │       ├── delete-account/route.ts
│   │       └── delete-shadow/route.ts
│   ├── auth/                         # Páginas de autenticación
│   │   ├── signin/page.tsx
│   │   ├── error/page.tsx
│   │   ├── callback/page.tsx
│   │   └── unauthorized/page.tsx
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Página principal
│   ├── globals.css                   # Estilos globales
│   └── providers.tsx                 # Proveedores (SessionProvider)
│
├── components/                       # Componentes React reutilizables
│   ├── ItemForm.tsx
│   ├── ItemList.tsx
│   ├── UserProfile.tsx
│   └── ...
│
├── lib/                              # Lógica de negocio
│   ├── auth.ts                       # Configuración NextAuth
│   ├── prisma.ts                     # Cliente Prisma (Singleton)
│   ├── salary-calculator.ts          # Cálculos de salario
│   ├── shadow-profile.ts             # IndexedDB operations
│   ├── geolocation.ts                # Geohash, ubicación
│   ├── crypto.ts                     # Cifrado/Desencriptación
│   ├── index.ts                      # Exports
│   └── __tests__/
│       ├── salary-calculator.test.ts
│       ├── shadow-profile.test.ts
│       └── geolocation.test.ts
│
├── types/                            # TypeScript types globales
│   └── geohash.d.ts
│
└── generated/                        # Código generado (no editar)
    └── prisma/
        ├── client.ts                 # PrismaClient generado
        ├── models/
        ├── enums.ts
        └── ...
```

## 🔄 Ciclo de vida de request

### 1. Request: GET /api/items

```
Browser
  ↓ Fetch con cookie de sesión
Next.js Route Handler (/api/items/route.ts)
  ↓
Validar sesión (NextAuth)
  ↓ (❌ Sin sesión → 401)
  ↓ (✅ Con sesión → siguiente)
Query Prisma:
  prisma.item.findMany({ where: { userId: session.user.id } })
  ↓ (Consulta SQL a BD)
SQL Response
  ↓
Map a Response JSON
  ↓
NextResponse.json()
  ↓
Browser recibe: { data: [...items] }
  ↓
React re-render UI
```

### 2. Request: POST /api/items

```
Browser
  ↓ Fetch con body JSON
Validar autenticación
  ↓
Validar body (Zod schema)
  ↓ (❌ Invalid → 400)
  ↓ (✅ Valid → siguiente)
Procesamiento:
  - calculateSalaryDays(price)
  - getGeolocation() [opcional]
  - truncateTimestamp() para privacy
  ↓
prisma.item.create({...})
  ↓
Enviar evento anonimizado:
  POST /api/events
  ↓
Response con item creado
```

## 🚀 Optimizaciones

### Client-side

1. **Shadow Profile (IndexedDB)**
   - Almacenamiento local sin servidor
   - Carga instantánea
   - Funciona offline

2. **Lazy loading**
   - Componentes se cargan bajo demanda
   - Imágenes lazy load

3. **Caching**
   - SessionProvider cachea sesión
   - React Query para API calls (futuro)

### Server-side

1. **Prisma**
   - Connection pooling
   - Query optimization
   - Índices en BD

2. **API Response**
   - Serialización simple
   - ISR (Incremental Static Regeneration) para datos públicos

3. **Database**
   - Índices en userId, status, createdAt
   - Relaciones normalizadas

## 🧪 Testing

### Estrategia de testing

```
                    Unit Tests          Integration Tests
                         │                     │
Salary Calc Lib ─────────┤                     │
Shadow Profile ─────────┤                      │
Crypto Lib ─────────────┤                      │
                         │                     │
                         │     E2E Tests       │
                         └────────────────────┤
                                              │
                         Full flow testing    │
                         Browser simulation   ├→ Final validation
                         Real DB              │
```

**Cobertura objetivo: 80%**

### Ejemplo test

```typescript
describe('Salary Calculator', () => {
  describe('calculateSalaryDays', () => {
    it('debería calcular días correctamente', () => {
      const days = calculateSalaryDays(241.56); // Salario diario
      expect(days).toBe(1);
    });

    it('debería redondear hacia arriba', () => {
      const days = calculateSalaryDays(350); // > 241.56
      expect(days).toBe(2); // Math.ceil
    });

    it('debería manejar valores decimales', () => {
      const days = calculateSalaryDays(120.78);
      expect(days).toBeLessThan(1);
    });
  });
});
```

## 🔧 Dependencias principales

| Dependencia    | Versión | Uso           |
| -------------- | ------- | ------------- |
| Next.js        | 16.1.6  | Framework     |
| React          | 19.2.3  | UI Library    |
| next-auth      | 4.24.13 | Autenticación |
| @prisma/client | 7.4.0   | ORM           |
| TypeScript     | 5.9.3   | Tipado        |
| Tailwind       | 4       | Estilos       |
| zod            | 4.3.6   | Validación    |
| idb-keyval     | 6.2.2   | IndexedDB     |
| geohash        | 0.0.1   | Geohashing    |
| crypto-js      | 4.2.0   | Cifrado       |

## 📈 Escalabilidad futura

### Horizontal

- Separar BD (PostgreSQL con replicas)
- CDN para assets estáticos
- Load balancing de servidores Next.js

### Vertical

- Caché Redis para sesiones
- Webhooks para eventos en tiempo real
- Workers para backups en background

### Features

- Notificaciones push
- Sincronización en tiempo real (WebSockets)
- Múltiples monedas
- Aplicación nativa (React Native)

---

**Actualizado**: Febrero 2026
**Versión**: 1.0.0-MVP
