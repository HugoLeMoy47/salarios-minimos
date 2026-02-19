# 🌐 Documentación de Rutas API

Referencia completa de todos los endpoints disponibles en **Días de Salario**.

## 📋 Tabla de Contenidos

- [Autenticación](#autenticaci%C3%B3n)
- [Items](#items)
- [Shadow Profile](#shadow-profile)
- [Eventos](#eventos)
- [Backup](#backup)
- [GDPR](#gdpr)
- [Ejemplos de uso](#ejemplos-de-uso)

---

## 🔐 Autenticación

### NextAuth Endpoints

Los endpoints de autenticación son manejados automáticamente por NextAuth.

```
GET/POST /api/auth/signin[/provider]      # Página de login
GET/POST /api/auth/callback/[provider]    # Callback del OAuth
GET      /api/auth/session                 # Obtener sesión actual
POST     /api/auth/signout                 # Cerrar sesión
```

### Obtener sesión actual

Para saber si el usuario está autenticado:

```typescript
import { useSession } from 'next-auth/react';

export function Component() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <p>Cargando...</p>;
  if (!session) return <p>No autenticado</p>;

  return <p>Bienvenido {session.user.email}</p>;
}
```

---

## 📦 Items

Endpoints para crear, leer, actualizar y eliminar artículos.

### Listar items

```
GET /api/items
```

**Requiere**: Sesión autenticada

**Query params**:

```
?status=pending      # Filtrar por estado
?userId=..           # (Admin only) Ver items de otro usuario
```

**Response (200)**:

```json
{
  "data": [
    {
      "id": "clm1v2k....",
      "description": "Laptop nueva",
      "price": 15000,
      "notes": "Para trabajo",
      "status": "pending",
      "createdAt": "2024-02-18T10:30:00Z",
      "latitude": 19.4326,
      "longitude": -99.1332,
      "geohash": null,
      "postponedUntil": null,
      "userId": "user123"
    }
  ]
}
```

**Errores**:

- `401 Unauthorized` - Sin sesión
- `403 Forbidden` - Intentando ver items de otro usuarios (sin admin)

### Crear item

```
POST /api/items
```

**Requiere**: Sesión autenticada

**Request body**:

```json
{
  "description": "Monitor 4K",
  "price": 8500,
  "notes": "Para setup gaming",
  "status": "pending",
  "latitude": 19.4326,
  "longitude": -99.1332
}
```

**Validación**:

```typescript
const schema = z.object({
  description: z.string().min(1).max(255),
  price: z.number().positive(),
  notes: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  status: z.enum(['pending', 'purchased', 'not_purchased']),
});
```

**Response (201)**:

```json
{
  "id": "clm1v4k....",
  "description": "Monitor 4K",
  "price": 8500,
  "status": "pending",
  "createdAt": "2024-02-18T11:00:00Z"
}
```

**Errores**:

- `400 Bad Request` - Datos inválidos
- `401 Unauthorized` - Sin sesión

### Obtener item

```
GET /api/items/:id
```

**Requiere**: Sesión autenticada + Propiedad del item

**Response (200)**:

```json
{
  "id": "clm1v2k....",
  "description": "Laptop nueva",
  "price": 15000,
  "notes": "Para trabajo",
  "status": "pending",
  "createdAt": "2024-02-18T10:30:00Z"
}
```

**Errores**:

- `401 Unauthorized` - Sin sesión
- `403 Forbidden` - No es propietario
- `404 Not Found` - Item no existe

### Actualizar item

```
PUT /api/items/:id
```

**Requiere**: Sesión autenticada + Propiedad del item

**Request body**:

```json
{
  "status": "purchased",
  "notes": "Comprado en Bestbuy"
}
```

**Response (200)**:

```json
{
  "id": "clm1v2k....",
  "status": "purchased",
  "updatedAt": "2024-02-18T12:00:00Z"
}
```

**Errores**:

- `400 Bad Request` - Datos inválidos
- `401 Unauthorized` - Sin sesión
- `403 Forbidden` - No es propietario
- `404 Not Found` - Item no existe

### Eliminar item

```
DELETE /api/items/:id
```

**Requiere**: Sesión autenticada + Propiedad del item

**Response (204)**: No content

**Errores**:

- `401 Unauthorized` - Sin sesión
- `403 Forbidden` - No es propietario
- `404 Not Found` - Item no existe

---

## 👤 Shadow Profile

Endpoints para manejar el perfil local (shadow) y su fusión con cuenta autenticada.

### Obtener shadow profile

```
GET /api/shadow-profile
```

**Requiere**: UUID del cliente (obtenido de localStorage)

**Query params**:

```
?uuid=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**Response (200)**:

```json
{
  "id": "shadow123",
  "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "items": [
    { "id": "item1", "description": "Teclado", "price": 500 },
    { "id": "item2", "description": "Mouse", "price": 300 }
  ],
  "createdAt": "2024-02-10T08:00:00Z"
}
```

### Fusionar shadow profile

```
POST /api/shadow-profile/merge
```

**Requiere**: Sesión autenticada

**Request body**:

```json
{
  "shadowUUID": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

**Qué hace**:

1. Obtiene todos los items del shadow profile local
2. Migra los items a la BD del usuario autenticado
3. Marca el shadow como fusionado
4. Retorna los items migrados

**Response (200)**:

```json
{
  "merged": true,
  "itemsMigrated": 5,
  "items": [
    { "id": "new-id-1", "description": "Teclado", "price": 500 },
    { "id": "new-id-2", "description": "Mouse", "price": 300 }
  ]
}
```

**Errores**:

- `400 Bad Request` - UUID inválido
- `401 Unauthorized` - Sin sesión
- `404 Not Found` - Shadow profile no existe

---

## 📊 Eventos

Endpoints para registrar eventos anonimizados (analytics).

### Crear evento

```
POST /api/events
```

**NO requiere**: Autenticación (completamente anónimo)

**Request body**:

```json
{
  "eventType": "item_created",
  "salaryDaysBucket": "1-2.9",
  "geohash6": "dvvdnn",
  "timestamp15min": "2024-02-18T10:15:00Z"
}
```

**Campos**:

- `eventType` - Tipo de evento: `item_created`, `item_purchased`, `item_not_purchased`, `item_postponed`
- `salaryDaysBucket` - Rango de días: `0-0.9`, `1-2.9`, `3-6.9`, `7+`
- `geohash6` - Ubicación aproximada (6 caracteres = ~610km)
- `timestamp15min` - Timestamp truncado a 15 minutos

**Validación**:

```typescript
const eventTypes = ['item_created', 'item_purchased', 'item_not_purchased', 'item_postponed'];
const validBuckets = ['0-0.9', '1-2.9', '3-6.9', '7+'];
```

**Response (201)**:

```json
{
  "id": "evt123",
  "eventType": "item_created",
  "createdAt": "2024-02-18T10:15:00Z"
}
```

**Errores**:

- `400 Bad Request` - Tipo de evento o bucket inválido
- `429 Too Many Requests` - Demasiados eventos por IP en poco tiempo

### Obtener estadísticas

```
GET /api/events
```

**NO requiere**: Autenticación (datos públicos anonimizados)

**Query params**:

```
?startDate=2024-01-01
?endDate=2024-02-28
?eventType=item_created
?bucket=1-2.9
```

**Response (200)**:

```json
{
  "totalEvents": 1250,
  "byEventType": {
    "item_created": 800,
    "item_purchased": 350,
    "item_not_purchased": 100
  },
  "byBucket": {
    "0-0.9": 120,
    "1-2.9": 450,
    "3-6.9": 550,
    "7+": 130
  },
  "geohashClusters": {
    "dvvdnn": 250,
    "dvvdnk": 180
  }
}
```

---

## 💾 Backup

Endpoints para crear y restaurar backups cifrados.

### Crear backup

```
POST /api/backup/create
```

**Requiere**: Sesión autenticada

**Response (200)**:

```json
{
  "backup": {
    "id": "backup123",
    "encryptedData": "U2FsdGVkX1...",
    "createdAt": "2024-02-18T12:00:00Z"
  },
  "downloadUrl": "data:application/json;base64,..."
}
```

**El cliente**:

1. Recibe el backup encriptado
2. El navegador lo descarga automáticamente (`dias-salario-backup-2024-02-18.json`)
3. El usuario puede subirlo a Google Drive manualmente

### Restaurar backup

```
POST /api/backup/restore
```

**Requiere**: Sesión autenticada

**Request body**:

```json
{
  "backupData": "U2FsdGVkX1...",
  "encryptionKey": "your-encryption-key"
}
```

**Qué hace**:

1. Desencripta el backup
2. Valida la estructura JSON
3. Inserta los items en la BD
4. Retorna los items restaurados

**Response (200)**:

```json
{
  "restored": true,
  "itemsRestored": 5,
  "items": [{ "id": "restored-1", "description": "Teclado", "price": 500 }]
}
```

**Errores**:

- `400 Bad Request` - Datos inválidos o no se puede desencriptar
- `401 Unauthorized` - Sin sesión
- `422 Unprocessable Entity` - Estructura de backup inválida

---

## 🔒 GDPR

Endpoints para consentimiento y eliminación de datos.

### Registrar consentimiento

```
POST /api/consent
```

**NO requiere**: Autenticación

**Request body**:

```json
{
  "type": "notifications",
  "consent": true,
  "timestamp": "2024-02-18T10:00:00Z"
}
```

**Tipos de consentimiento**:

- `notifications` - Notificaciones web push
- `geolocation` - Acceso a ubicación
- `analytics` - Envío de eventos

**Response (201)**:

```json
{
  "id": "consent123",
  "type": "notifications",
  "consent": true,
  "timestamp": "2024-02-18T10:00:00Z"
}
```

### Eliminar shadow profile

```
DELETE /api/gdpr/delete-shadow
```

**NO requiere**: Autenticación (identificación por UUID)

**Request body**:

```json
{
  "uuid": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "reason": "optional-reason"
}
```

**Response (204)**: No content

**Qué hace**:

1. Busca el shadow profile por UUID
2. Borra todos sus items
3. Borra el registro del shadow

### Eliminar cuenta completa

```
DELETE /api/gdpr/delete-account
```

**Requiere**: Sesión autenticada

**Request body**:

```json
{
  "confirm": true,
  "reason": "optional-reason"
}
```

**Response (204)**: No content

**Qué hace**:

1. Borra todos los items del usuario
2. Borra registros de consentimiento
3. Anonimiza eventos (elimina referencia a usuario)
4. Marca backups como deletados
5. Borra la cuenta del usuario

**Errores**:

- `401 Unauthorized` - Sin sesión
- `400 Bad Request` - confirm no es true

---

## 💥 Códigos de Error

| Código | Significado          | Ejemplo                    |
| ------ | -------------------- | -------------------------- |
| 200    | OK                   | Request exitoso            |
| 201    | Created              | Recurso creado             |
| 204    | No Content           | Exitoso sin respuesta      |
| 400    | Bad Request          | Datos inválidos            |
| 401    | Unauthorized         | Sin autenticación          |
| 403    | Forbidden            | Sin permisos               |
| 404    | Not Found            | Recurso no existe          |
| 409    | Conflict             | Duplicado/Conflicto        |
| 422    | Unprocessable Entity | No se puede procesar datos |
| 429    | Too Many Requests    | Rate limit excedido        |
| 500    | Internal Error       | Error del servidor         |

---

## 📝 Ejemplos de uso

### JavaScript/TypeScript

```typescript
// Obtener items
const response = await fetch('/api/items', {
  headers: { Authorization: `Bearer ${sessionToken}` },
});
const { data: items } = await response.json();

// Crear item
const newItem = await fetch('/api/items', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ description: 'Mouse', price: 500 }),
});

// Registrar evento (anonimizado)
await fetch('/api/events', {
  method: 'POST',
  body: JSON.stringify({
    eventType: 'item_created',
    salaryDaysBucket: '0-0.9',
    geohash6: 'dvvdnn',
    timestamp15min: new Date().toISOString(),
  }),
});
```

### curl

```bash
# Obtener items
curl -X GET http://localhost:3000/api/items \
  -H "Cookie: next-auth.session-token=..."

# Crear item
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"description":"Monitor","price":8500}' \
  -H "Cookie: next-auth.session-token=..."

# Crear evento (sin autenticación)
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventType":"item_created",
    "salaryDaysBucket":"1-2.9",
    "geohash6":"dvvdnn",
    "timestamp15min":"2024-02-18T10:15:00Z"
  }'
```

---

**Actualizado**: Febrero 2026  
**Versión**: 1.0.0-MVP
