# 🔐 Guía de Seguridad

Mejores prácticas de seguridad para **Días de Salario**.

## 📋 Tabla de contenidos

- [Principios de seguridad](#principios-de-seguridad)
- [Amenazas identificadas](#amenazas-identificadas)
- [Protecciones implementadas](#protecciones-implementadas)
- [GDPR y privacidad](#gdpr-y-privacidad)
- [Prácticas seguras de desarrollo](#prácticas-seguras-de-desarrollo)
- [Secrets management](#secrets-management)
- [Autenticación y autorización](#autenticación-y-autorización)
- [Encriptación](#encriptación)
- [Auditoría](#auditoría)

---

## 🛡️ Principios de seguridad

1. **Privacy by design**: Minimizar recopilación de datos
2. **Least privilege**: Acceso mínimo necesario
3. **Defense in depth**: Múltiples capas de defensa
4. **Secure by default**: Configuraciones seguras por defecto
5. **Transparencia**: Usuario control total de sus datos
6. **Auditable**: Logs de todas las operaciones importantes

---

## ⚠️ Amenazas identificadas

### 1. 🔓 Acceso no autorizado a datos

**Riesgo**: Un usuario vea datos de otro usuario.

**Cómo ocurre**:

- ID predecible de usuario
- Falta de validación de permisos en API
- Tokens robados

**Mitigación** (✅ Implementado):

```typescript
// src/lib/auth.ts - Cada request valida sesión
if (!session?.user?.id) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// src/app/api/items/[id]/route.ts - Validar propiedad
const item = await db.item.findUnique({ where: { id } });
if (item.userId !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

### 2. 🗑️ Derecho al olvido (GDPR)

**Riesgo**: Usuario quiere eliminar todos sus datos.

**Implementación**:

```typescript
// src/app/api/gdpr/delete-account/route.ts
export async function DELETE(req: Request) {
  const { userId } = await req.json();

  // Eliminar todos los datos del usuario
  await Promise.all([
    db.item.deleteMany({ where: { userId } }),
    db.shadowProfile.deleteMany({ where: { userId } }),
    db.consentLog.deleteMany({ where: { userId } }),
    db.anonymizedEvent.deleteMany({ where: { userId } }),
    db.user.delete({ where: { id: userId } }),
  ]);

  return NextResponse.json({ success: true });
}
```

✅ **Implementado**: Ver [GDPR routes](API_ROUTES.md#gdpr)

---

### 3. 🎯 Inyección NoSQL/SQL

**Riesgo**: Entrada maliciosa ejecuta código no deseado.

**Mitigación** (✅ Implementado):

- Prisma ORM previene inyección SQL
- Inputs validados con Zod
- Parametrized queries automáticas

```typescript
// ❌ INSEGURO (no hacer)
const item = await db.item.findRaw({
  filter: `{ userId: "${userId}" }`, // VULNERABLE
});

// ✅ SEGURO (hacer siempre)
const item = await db.item.findMany({
  where: { userId }, // Prisma valida automáticamente
});
```

---

### 4. 🔒 MITM (Man in the Middle)

**Riesgo**: Atacante intercepta datos en tránsito.

**Mitigación** (✅ Implementado):

- HTTPS/TLS obligatorio en producción
- Secure cookies con `HttpOnly` y `Secure` flags
- HSTS headers configurados

```typescript
// src/lib/auth.ts
const authOptions = {
  session: {
    strategy: 'jwt',
  },
  cookies: {
    sessionToken: {
      name: `__Secure.next-auth.session-token`,
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60, // 30 días
      },
    },
  },
};
```

---

### 5. 🧠 XSS (Cross-Site Scripting)

**Riesgo**: Inyección de JavaScript malicioso.

**Mitigación** (✅ Implementado):

- React escapeea automáticamente
- Content Security Policy headers
- Sanitización de inputs

```typescript
// ✅ React auto-escapeea
<div>{userInput}</div>

// ❌ NUNCA hacer (vulnerable)
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

---

### 6. 💾 Exposición de credenciales

**Riesgo**: Secrets en repositorio o logs.

**Mitigación** (✅ Implementado):

- `.env` en `.gitignore`
- Secrets en variables de entorno del hosting
- Logs no contienen sensitive data

```bash
# .gitignore
.env
.env.local
.env.*.local
```

---

## ✅ Protecciones implementadas

### Nivel 1: Entrada (Input validation)

```typescript
import { z } from 'zod';

const CreateItemSchema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive().max(999999),
  description: z.string().max(1000).optional(),
});

// Validar antes de procesar
const validated = CreateItemSchema.parse(req.body);
```

### Nivel 2: Autenticación

```typescript
// NextAuth previene acceso no autorizado
const session = await getServerSession(authOptions);
if (!session) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Nivel 3: Autorización

```typescript
// Verificar que usuario es propietario del recurso
const item = await db.item.findUnique({ where: { id } });
if (item.userId !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### Nivel 4: Encriptación en tránsito

```
HTTP → HTTPS/TLS
```

### Nivel 5: Encriptación en reposo

```typescript
// src/lib/crypto.ts
import CryptoJS from 'crypto-js';

export function encryptData(data: any, key: string): string {
  return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString();
}

export function decryptData(encrypted: string, key: string): any {
  const as256 = CryptoJS.AES.decrypt(encrypted, key);
  return JSON.parse(as256.toString(CryptoJS.enc.Utf8));
}
```

### Nivel 6: Logging y monitoreo

```typescript
// src/app/api/events/route.ts
await db.anonymizedEvent.create({
  data: {
    eventType: 'item_created',
    timestamp: new Date(),
    userId, // Para auditoría
    metadata: { itemId },
  },
});
```

---

## 📋 GDPR y privacidad

### Derechos del usuario (implementados)

| Derecho       | Endpoint                          | Estado |
| ------------- | --------------------------------- | ------ |
| Acceder datos | `GET /api/shadow-profile`         | ✅     |
| Portabilidad  | `GET /api/backup/create`          | ✅     |
| Rectificación | `POST /api/items/[id]`            | ✅     |
| Olvido        | `DELETE /api/gdpr/delete-account` | ✅     |
| Limite uso    | `POST /api/consent`               | ✅     |

### Consentimiento

```typescript
// src/app/api/consent/route.ts
export async function POST(request: Request) {
  const { userId, type, value } = await request.json();

  // Registrar consentimiento
  const consent = await db.consentLog.create({
    data: {
      userId,
      consentType: type,
      value,
      timestamp: new Date(),
      ipAddress: request.headers.get('x-forwarded-for'),
    },
  });

  return NextResponse.json(consent);
}
```

### Datos recopilados

- **Obligatorios**: Email (OAuth), nombre (opcional)
- **Funcionales**: Items creados, ubicación geohashed (consentimiento)
- **Analíticos**: Eventos anónimos (sin ID usuario)
- **Ninguno de terceras partes**: Sin tracking externo

### Retención de datos

| Dato    | Retención         | Notas                       |
| ------- | ----------------- | --------------------------- |
| Items   | Hasta eliminación | Usuario control total       |
| Sesión  | 30 días           | Configurable                |
| Events  | 90 días           | Anónimos después            |
| Logs    | 180 días          | Cumplimiento                |
| Backups | Indefinida        | Usuario descargar y elimina |

---

## 🔐 Prácticas seguras de desarrollo

### 1️⃣ Code review

```
Antes de merge a main:
1. Mínimo 1 code review
2. CI/CD tests pasan
3. Linting limpio
4. No secrets en código
```

### 2️⃣ Dependency scanning

```bash
# Verificar vulnerabilidades en dependencias
npm audit

# Fix automático
npm audit fix

# Update a próxima versión segura
npm update
```

### 3️⃣ Tipos TypeScript

```typescript
// ✅ Seguro - tipos explícitos
function getUserData(userId: string): Promise<User> {
  return db.user.findUnique({ where: { id: userId } });
}

// ❌ Inseguro - tipado como any
function getUserData(userId: any): any {
  return db.user.findUnique({ where: { id: userId } });
}
```

### 4️⃣ Errores genéricos en producción

```typescript
// ✅ SEGURO en producción
if (error) {
  logger.error('Database error', { userId, error });
  return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
}

// ❌ INSEGURO (expone detalles)
return NextResponse.json({ error: error.message }, { status: 500 });
```

### 5️⃣ Rate limiting

```typescript
// Implementar rate limiting en producción
// Recomendado: usar middleware como rate-limit-redis

import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100, // 100 requests
  message: 'Demasiadas solicitudes, intenta después',
});

export default limiter;
```

---

## 🔑 Secrets management

### Generar secrets seguros

```bash
# NEXTAUTH_SECRET (32 hex)
openssl rand -hex 32
# Salida: a1b2c3d4e5f6...

# ENCRYPTION_KEY (16 hex)
openssl rand -hex 16
# Salida: 1a2b3c4d5e6f...
```

### Almacenamiento seguro

- **Desarrollo**: `.env.local` (⚠️ NUNCA commit)
- **Testing**: `.env.test` (valores dummy)
- **Producción**: Variables de entorno del hosting (Vercel, Railway, etc.)

```bash
# ❌ NUNCA hacer
git add .env
git commit -m "Add secrets"

# ✅ SIEMPRE hacer
echo ".env" >> .gitignore
git add .gitignore
```

### Rotar secrets periódicamente

```bash
# Cada 3 meses en producción:
1. Generar nuevo NEXTAUTH_SECRET
2. Actualizar en variables de entorno
3. Antiguos tokens aún funcionan (gracia period)
4. Users redirigidos a login automáticamente después
```

---

## 🔑 Autenticación y autorización

### OAuth 2.0 + OpenID Connect

```
App browser → OAuth Provider (Google/Microsoft/Apple)
              ↓ (redirecciona con código)
          App backend
              ↓ (intercambia código por token)
          Genera JWT
              ↓ (setea cookie)
          Usuario autenticado
```

### NextAuth.js flows

```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // ... otros providers
  ],
  callbacks: {
    // Ejecuta después de JWT válido
    session: async ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub,
        },
      };
    },
  },
};
```

### Validación en cada request

```typescript
// Middleware para verificar sesión
export async function middleware(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/api/auth/signin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/items/:path*'],
};
```

---

## 🔒 Encriptación

### Datos en reposo

Implementación en `src/lib/crypto.ts`:

```typescript
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Para datos sensibles en BD (si aplica)
export function encryptField(data: string): string {
  return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
}

export function decryptField(encrypted: string): string {
  const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
```

### En tránsito

- HTTPS/TLS en producción ✅
- Secure cookies (`Secure` flag)
- HttpOnly cookies (inaccesible a JavaScript)

### Hashing de passwords (si implementamos login local)

```typescript
import bcrypt from 'bcrypt';

// Crear hash
const hashedPassword = await bcrypt.hash(password, 10);

// Verificar
const isValid = await bcrypt.compare(password, hashedPassword);
```

---

## 📊 Auditoría

### Eventos registrados

```typescript
// src/app/api/events/route.ts
// Registra:
// - Login exitoso / fallido
// - Item creado / actualizado / eliminado
// - Consentimiento cambiado
// - Derecho GDPR ejercido
// - Errores importantes

await db.anonymizedEvent.create({
  data: {
    eventType: 'login',
    userId,
    timestamp: new Date(),
    metadata: {
      provider: 'google',
      ipHash: crypto.createHash('sha256').update(ip).digest('hex'),
    },
  },
});
```

### Acceso a logs

```bash
# Vercel
vercel logs

# Railway
railway logs

# Docker
docker logs container-name
```

### Querying auditoría

```typescript
// Listar todos los eventos de un usuario
const events = await db.anonymizedEvent.findMany({
  where: { userId },
  orderBy: { timestamp: 'desc' },
  take: 100,
});
```

---

## 🚨 Incidentes de seguridad

### Procedimiento

1. **Detectar**: Monitoreo continuo, reportes de usuarios
2. **Contener**: Deshabilitar acceso comprometido si es necesario
3. **Investigar**: Revisar logs, determinar scope
4. **Notificar**: Informar a usuarios afectados (GDPR Art. 34)
5. **Remediar**: Registrar causa raíz, prevenir recurrencia
6. **Comunicar**: Publicar post-mortem si es público

### Contacto de seguridad

```
Email: security@diasdesalario.com
```

---

## 🔍 Checklist de seguridad

### Antes de deployment

- [ ] Variables de entorno configuradas (no en código)
- [ ] HTTPS/TLS activo en producción
- [ ] BD no accesible públicamente
- [ ] Rate limiting configurado
- [ ] Logs monitoreados
- [ ] Sentry/monitoring activo
- [ ] Secrets rotados (si aplicable)
- [ ] Tests de seguridad pasados
- [ ] Dependencias sin vulnerabilidades (`npm audit`)
- [ ] Code review completado

### Post-deployment

- [ ] Monitoreo de CPU/memoria
- [ ] Alertas configuradas
- [ ] Logs revisados diariamente
- [ ] Backups verficados
- [ ] Usuarios pueden exercer derechos GDPR
- [ ] Consentimiento funciona correctamente
- [ ] Errores no exponen información sensible

### Mensualmente

- [ ] Review de logs de acceso
- [ ] Verificar dependencias (`npm outdated`)
- [ ] Test de backup/restore
- [ ] Verificar GDPR requests
- [ ] Rotación de secrets (si aplica)

---

## 📚 Recursos

- [OWASP Top 10](https://owasp.org/Top10/)
- [NextAuth.js Security](https://next-auth.js.org/getting-started/example#security)
- [Prisma Security](https://www.prisma.io/docs/orm/more/security)
- [GDPR Compliance](https://gdpr-info.eu/)
- [CWE Common Weakness Enumeration](https://cwe.mitre.org/)

---

**Actualizado**: Febrero 2026  
**Versión**: 1.0.0-MVP
