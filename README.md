# 💰 Días de Salario - MVP

### Descubre cuántos días de trabajo cuesta lo que deseas comprar

Una aplicación web moderna que te ayuda a visualizar el costo real de las cosas en términos de tu salario mínimo diario. Con funciones de seguimiento local, sincronización en la nube, y análisis de gastos anónimos.

## 🎯 Características principales

- **Cálculo de días de salario**: Ingresa el precio de un producto y descubre cuántos días de salario mínimo necesitas
- **Seguimiento local**: Todos tus datos se guardan localmente en tu navegador (IndexedDB) - sin servidor requerido
- **Sincronización sin fricciones**: Inicia sesión con Google, Microsoft o Apple para sincronizar tu historial
- **Respaldo seguro**: Exporta tus datos en JSON cifrado y respaldalos en Google Drive
- **Privacidad garantizada**: Los datos se anoniman antes de enviarse para análisis
- **Multiplataforma**: Funciona en desktop, tablet y móvil

## 🚀 Inicio rápido

### Requisitos previos

### Instalación local

```bash
# Clonar el repositorio
git clone <repository-url>
cd salarios-minimos

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Inicializar base de datos (desarrollo: SQLite)
npx prisma migrate dev
npx prisma generate

# Iniciar servidor de desarrollo
npm run dev
```

## UI: Material Design, Dark Mode & Accessibility Update

### Visual Design & Accessibility Improvements

This update integrates Material UI (MUI) with MS365-inspired design and comprehensive accessibility improvements:

#### 🎨 Color Palette (MS365-inspired)

- **Neutral tones**: `#f3f2f1`, `#edebe9`, `#e1dfdd` (light backgrounds)
- **Text colors**: `#323130` (primary), `#605e5c` (secondary) – **WCAG AAA contrast** (≥7:1)
- **Accent blue**: `#0078d4` (primary), `#2b88d8` (secondary) – verified for WCAG AA
- **Dark theme**: High-contrast modes auto-detect system preference; stored in `localStorage`

#### ♿ Accessibility (WCAG AA+)

- **Contrast ratios**: All text meets WCAG AA minimum (4.5:1); primary text exceeds AAA (7:1)
- **Focus states**: 3px blue outline + shadow for keyboard navigation
- **Semantic components**: MUI TextField, Button, AppBar use ARIA labels natively
- **Responsive typography**: Scales proportionally using `responsiveFontSizes()` MUI helper
- **Touch targets**: Buttons/inputs minimum 44px height (mobile accessible)

#### 📱 Responsive Design

- **Breakpoints**: xs (<640px), sm (641–1024px), md (≥1025px)
- **Layouts**: Flexbox + CSS Grid; stacked buttons on mobile, inline on tablet+
- **Container padding**: Dynamic `--container-padding` variable scales with viewport
- **Typography**: Responsive font sizes auto-scale between devices
- **Form fields**: `ItemForm` centered max-width with responsive spacing

#### 🔧 Implementation Details

- **Theme provider**: `src/lib/theme.tsx` — centralized color & typography (MUI `createTheme` + `responsiveFontSizes`)
- **Header component**: `src/components/Header.tsx` — MUI AppBar/Toolbar with theme toggle
- **CSS variables**: `src/app/globals.css` — MS365 colors + dark mode support
- **Form improvements**: MUI TextField/Button ensure consistent spacing & contrast
- **Refactored**: Removed inline styles; centralized in MUI `sx` prop (responsive-ready)

After pulling changes, install new dependencies:

```bash
npm install
```

**No functional changes**: All improvements are UI-only. Theme preference stored in `localStorage` under `theme-mode`.

La aplicación estará disponible en `http://localhost:3000`

## 📋 Configuración de variables de entorno

> 🛑 **Validación automática**: el proyecto valida las variables de entorno al arrancar. Si falta alguna requerida, fallará inmediatamente en desarrollo/producción. En modo `test` la validación se omite para facilitar las pruebas.

Crea un archivo `.env.local` basado en `.env.example`: 

```dotenv
# Base de datos
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-generate-with-openssl-rand-hex-32

# OAuth - Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth - Microsoft (Azure AD)
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret

# OAuth - Apple
APPLE_ID=your-apple-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY=your-apple-private-key

# Configuración de aplicación
NEXT_PUBLIC_MIN_SALARY_DAILY=241.56
NEXT_PUBLIC_APP_NAME="Días de Salario"
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Seguridad
ENCRYPTION_KEY=your-encryption-key-change-in-production
```

### Generar secrets

```bash
# Generar NEXTAUTH_SECRET
openssl rand -hex 32

# Generar ENCRYPTION_KEY
openssl rand -hex 16
```

## 🔐 Configurar OAuth

### Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto
3. Activa "Google+ API"
4. Ve a "Credenciales" → "Crear credencial" → "OAuth 2.0 ID de cliente"
5. Selecciona "Aplicación web"
6. Añade `http://localhost:3000/api/auth/callback/google` como "URI de redirección autorizada"
7. Copia `Client ID` y `Client Secret`

### Microsoft (Azure AD)

1. Ve a [Azure Portal](https://portal.azure.com)
2. Selecciona "Enregistrar una aplicación"
3. Completa el registro
4. Ve a "Certificados y secretos" → "Nuevo secreto de cliente"
5. En "Permisos de API", añade "User.Read"
6. Ve a "Redirecciones de URI" y añade `http://localhost:3000/api/auth/callback/azure-ad`

### Apple

1. Ve a [Apple Developer](https://developer.apple.com)
2. Crea un "App ID"
3. Activa "Sign In with Apple"
4. Crea una "Service ID"
5. Configura "Return URLs": `http://localhost:3000/api/auth/callback/apple`
6. Crea una "Private Key"

## 📦 Scripts disponibles

> **Nota**: se ha reforzado la calidad de código. Antes de commitear se ejecuta husky + lint-staged
> que corre ESLint, Prettier, Chequeo de tipos y Markdown lint en los archivos modificados.

```bash
# Desarrollo
npm run dev                # Iniciar servidor de desarrollo

# Production
npm run build             # Construir para producción
npm start                 # Iniciar servidor producción

# Testing
npm test                  # Ejecutar tests
npm run test:watch        # Modo watch
npm run test:coverage     # Cobertura de tests

# Linting & calidad
npm run lint              # ESLint + fijo y comprobación de tipos
npm run lint:md           # Revisar Markdown (markdownlint)
npm run format            # Prettier format

# Prisma
npm run prisma:migrate    # Ejecutar migraciones
npm run prisma:studio     # Abrir Prisma Studio (GUI)
npm run prisma:generate   # Generar cliente Prisma
```

## �️ Resiliencia y cacheo

El backend incluye utilidades para mejorar la tolerancia a fallos y reducir
latencia:

- **`retry()`** helper con back-off exponencial utilizada en `item.service` y
  otros servicios para reintentar operaciones Prisma o HTTP.
- **Cache en memoria** de 60 segundos para consultas frecuentes (p.ej. los
  items del usuario) con invalidación automática.
- **`withApiHandler` middleware** para centralizar captura de excepciones y
  devolver un 500 genérico, además de loguear con `pino`.
- **Logging estructurado** en servidor (pino) y eventos importantes.

Continúa la documentación detallada en `DOCS/RESILIENCE.md` (próximamente).

## 📚 Estructura del proyecto

```bash
src/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Página principal
│   ├── layout.tsx           # Layout general
│   ├── globals.css          # Estilos globales
│   ├── api/                 # Rutas API
│   │   ├── items/           # CRUD de artículos
│   │   ├── events/          # Eventos anonimizados
│   │   ├── shadow-profile/  # Fusión de shadow profiles
│   │   ├── consent/         # Registro de consentimientos
│   │   ├── backup/          # Backup/Restore
│   │   ├── gdpr/            # Eliminación de datos
│   │   └── auth/            # NextAuth.js
│   └── auth/                # Páginas de autenticación
├── components/              # Componentes React
│   └── ItemForm.tsx        # Formulario de creación
├── lib/                     # Funciones utilitarias
│   ├── auth.ts            # Configuración NextAuth
│   ├── prisma.ts          # Cliente Prisma
│   ├── salary-calculator.ts # Cálculo de días
│   ├── shadow-profile.ts   # Perfil local (IndexedDB)
│   ├── geolocation.ts      # Geolocalización
│   ├── crypto.ts           # Cifrado de backups
│   └── __tests__/          # Tests unitarios
└── generated/              # Código generado
    └── prisma/            # Modelos de Prisma

prisma/
├── schema.prisma          # Esquema de BD
└── migrations/            # Historial de migraciones
```

## 🔄 Flujo de datos

### 1. Crear item sin cuenta (Shadow Profile)

```bash
Usuario sin sesión
    ↓
Rellena formulario (precio, descripción)
    ↓
IndexedDB: guarda localmente
    ↓
POST /api/events: envía evento anonimizado
    ↓
Pantalla: muestra en lista "Pendientes"
```

### 2. Iniciar sesión y sincronizar

```bash
Usuario autenticado
    ↓
POST /api/shadow-profile/merge
    ↓
Backend: migra items locales a BD
    ↓
Usuario ve historial completo
```

### 3. Crear backup

```bash
POST /api/backup/create
    ↓
Backend: cifra datos JSON
    ↓
Cliente: descarga archivo JSON
    ↓
Usuario: sube manualmente a Google Drive
```

### 4. Restaurar desde backup

```bash
Usuario carga archivo JSON
    ↓
POST /api/backup/restore
    ↓
Backend: desencripta y valida
    ↓
Backend: inserta items en BD
    ↓
Usuario ve items restaurados
```

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en watch mode (cambios detectados automáticamente)
npm run test:watch

# Cobertura de tests
npm run test:coverage
```

### Escribir tests

Los tests se encuentran en `src/**/__tests__/*.test.ts`:

```typescript
describe('Feature', () => {
  it('debería hacer algo', () => {
    expect(result).toBe(expected);
  });
});
```

## 🔗 Endpoints de API

### Items

| Método | Ruta             | Descripción              | Auth |
| ------ | ---------------- | ------------------------ | ---- |
| GET    | `/api/items`     | Listar items del usuario | ✅   |
| POST   | `/api/items`     | Crear item               | ✅   |
| GET    | `/api/items/:id` | Obtener item             | ✅   |
| PUT    | `/api/items/:id` | Actualizar item          | ✅   |
| DELETE | `/api/items/:id` | Eliminar item            | ✅   |

### Shadow Profile

| Método | Ruta                        | Descripción                 | Auth |
| ------ | --------------------------- | --------------------------- | ---- |
| POST   | `/api/shadow-profile/merge` | Fusionar shadow con usuario | ✅   |

### Eventos & Analytics

| Método | Ruta          | Descripción                  | Auth |
| ------ | ------------- | ---------------------------- | ---- |
| POST   | `/api/events` | Registrar evento anonimizado | ❌   |
| GET    | `/api/events` | Obtener estadísticas         | ❌   |

### Backup

| Método | Ruta                  | Descripción            | Auth |
| ------ | --------------------- | ---------------------- | ---- |
| POST   | `/api/backup/create`  | Crear backup cifrado   | ✅   |
| POST   | `/api/backup/restore` | Restaurar desde backup | ✅   |

### GDPR

| Método | Ruta                       | Descripción              | Auth |
| ------ | -------------------------- | ------------------------ | ---- |
| POST   | `/api/consent`             | Registrar consentimiento | ❌   |
| DELETE | `/api/gdpr/delete-shadow`  | Eliminar shadow profile  | ❌   |
| DELETE | `/api/gdpr/delete-account` | Eliminar cuenta completa | ✅   |

## 🔐 Seguridad y privacidad

### Anonimización de eventos

Los eventos se envían con los siguientes campos anonymados:

```javascript
{
  eventType: 'item_created',           // Tipo de evento
  salaryDaysBucket: '1-2.9',           // Rango (no valor exacto)
  geohash6: 'dvvdnn',                  // Geohash de 6 chars (~610km)
  timestamp15min: '2024-02-18T10:15:00Z' // Truncado a 15 min
}
```

**NO se envía:**

- ID de usuario
- Ubicación exacta
- Foto ni descripción
- Información personal

### Encriptación de backups

Los backups se cifran con AES-256 antes de ser descargados. El cliente mantiene el control total de la clave.

### Consentimientos

Todos los datos sensibles requieren consentimiento explícito:

- Notificaciones web
- Geolocalización
- Envío de eventos

## 🚀 Despliegue

### Vercel (recomendado)

```bash
# Conectar el repositorio en vercel.com
# Configurar variables de entorno en el panel
# Desplegar automáticamente en cada push a main
```

### Docker

```bash
docker build -t dias-salario .
docker run -p 3000:3000 -e DATABASE_URL="postgresql://..." dias-salario
```

### Producción - Variables de entorno críticas

```bash
# Base de datos: usar PostgreSQL
DATABASE_URL="postgresql://user:password@host/database"

# NextAuth
NEXTAUTH_SECRET=generated-securely-with-openssl
NEXTAUTH_URL=https://tu-dominio.com

# Cifrado
ENCRYPTION_KEY=generated-securely-with-openssl
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Changelog

### v0.1.0 (MVP)

- ✅ Cálculo de días de salario
- ✅ Shadow profile con IndexedDB
- ✅ Autenticación OAuth (Google, Microsoft, Apple)
- ✅ Backup/Restore cifrado
- ✅ Eventos anonimizados
- ✅ Geolocalización con geohash
- ✅ GDPR compliance básico
- ✅ Tests unitarios
- ✅ GitHub Actions CI

### Roadmap futuro

- [ ] Notificaciones web push
- [ ] Recordatorios programados
- [ ] Sincronización con Google Drive automática
- [ ] Gráficos y estadísticas personales
- [ ] Categorías de gastos
- [ ] Aplicación nativa (React Native)
- [ ] Soporte multi-moneda

## ⚖️ Licencia

MIT - Ver LICENSE para más detalles

## ❓ FAQ

### ¿Mis datos son privados?

Sí. Los datos se guardan localmente en tu navegador. Si inicias sesión, se guardan en nuestra BD con encriptación en reposo. Los eventos enviados a analytics son completamente anonimizados.

### ¿Qué pasa si pierdo mi dispositivo?

Si iniciaste sesión, tus datos están en el servidor. Si no, puedes usar la función de backup para exportar. En ambos casos, puedes restaurar desde un backup descargado.

### ¿Puedo usar esto sin iniciar sesión?

Completamente. Todo funciona sin cuenta. El inicio de sesión es solo para sincronizar entre dispositivos.

### ¿Qué costo tiene?

Es gratis. El MVP es de código abierto.

## 📧 Contacto

- GitHub: [@usuario](https://github.com/usuario)
- Email: contacto@diasdesalario.com

---

Hecho con ❤️ en 2026
