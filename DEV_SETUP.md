# 🔧 Guía de Configuración para Desarrolladores

Todo lo que necesitas para configurar tu ambiente de desarrollo.

## 📋 Requisitos

- **Node.js**: 18.17+ o 20+
- **npm**: 9+ (o pnpm, yarn)
- **Git**: 2.34+
- **Editor**: VS Code recomendado
- **.NET/SQL Server** (opcional, solo si usas SQL Server en lugar de SQLite)

### Verificar versiones

```bash
node --version      # v20.x.x
npm --version       # 10.x.x
git --version       # git version 2.x.x
```

## 🚀 Instalación Inicial

### 1. Clonar repositorio

```bash
git clone https://github.com/TU_USUARIO/salarios-minimos.git
cd salarios-minimos
```

### 2. Instalar dependencias

```bash
npm install
```

Esto instalará todas las dependencias de `package.json`.

### 3. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Luego edita `.env.local` con tus valores:

```dotenv
# ========== REQUERIDO ==========

# Base de datos
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-change-in-production

# ========== OAUTH (opcional) ==========

# Google
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret

# Microsoft Azure AD
MICROSOFT_CLIENT_ID=your-id
MICROSOFT_CLIENT_SECRET=your-secret

# Apple
APPLE_ID=your-id
APPLE_TEAM_ID=your-team-id
APPLE_KEY_ID=your-key-id
APPLE_PRIVATE_KEY=your-private-key

# ========== CONFIGURACIÓN ==========

NEXT_PUBLIC_MIN_SALARY_DAILY=241.56
NEXT_PUBLIC_APP_NAME="Días de Salario"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Inicializar base de datos

```bash
# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# (Opcional) Abrir Prisma Studio para ver la BD
npm run prisma:studio
```

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 🔐 Configurar OAuth (Opcional pero recomendado)

### Google

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto (ej: "Días de Salario Dev")
3. Activa "Google+ API"
4. Ve a "Credenciales" → "Crear credencial" → "OAuth 2.0 ID de cliente"
5. Selecciona "Aplicación web"
6. Bajo "URIs de redirección autorizadas", añade:
   ```
   http://localhost:3000
   http://localhost:3000/api/auth/callback/google
   ```
7. Copia el **Client ID** y **Client Secret** a tu `.env.local`

### Microsoft Azure AD

1. Ve a [Azure Portal](https://portal.azure.com)
2. Busca "Enregistrar una aplicación"
3. Haz clic en "Nueva inscripción"
4. Nombre: "Días de Salario (Dev)"
5. Selecciona "Cuentas en cualquier directorio organizacional y cuentas Microsoft personales"
6. En "URI de redirección", selecciona "Web" y añade:
   ```
   http://localhost:3000/api/auth/callback/azure-ad
   ```
7. Ve a "Certificados y secretos" → "Nuevo secreto de cliente"
8. Copia los valores a tu `.env.local`

### Apple

Es más complejo que Google/Microsoft, por ahora omítelo en desarrollo local.

## 📦 Scripts disponibles

```bash
# ========== DESARROLLO ==========

npm run dev              # Inicia servidor con hot reload

# ========== BUILD & PRODUCTION ==========

npm run build            # Construir para producción
npm start                # Ejecutar build en producción local

# ========== TESTING ==========

npm test                 # Ejecutar tests una vez
npm run test:watch      # Tests en modo watch
npm run test:coverage   # Reporte de cobertura

# ========== LINTING & FORMATO ==========

npm run lint            # ESLint con --fix
npm run format          # Prettier formatting

# ========== PRISMA ==========

npm run prisma:generate # Generar cliente
npm run prisma:migrate  # Ejecutar migraciones
npm run prisma:studio   # Abrir GUI
```

## 🛠️ Herramientas recomendadas

### VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "eamodio.gitlens",
    "vitest.explorer",
    "ms-playwright.playwright"
  ]
}
```

**Instalar rápido:**

```bash
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension prisma.prisma
# ... etc
```

### Settings recomendadas (`.vscode/settings.json`)

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## 🧪 Ejecutar Tests

### Escribir un test

Crea un archivo `src/lib/__tests__/mi-funcion.test.ts`:

```typescript
import { miFunction } from '../mi-funcion';

describe('miFunction', () => {
  it('debería hacer algo', () => {
    const resultado = miFunction();
    expect(resultado).toBe(true);
  });

  it('debería manejar casos edge', () => {
    const resultado = miFunction(null);
    expect(resultado).toThrow();
  });
});
```

### Ejecutar tests

```bash
# Una sola ejecución
npm test

# Modo watch (re-ejecuta al guardar)
npm run test:watch

# Con cobertura
npm run test:coverage
```

## 🔍 Debugging

### VS Code Debugger

Crea `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js",
      "type": "node",
      "request": "launch",
      "skipFiles": ["<node_internals>/**"],
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

Luego presiona `F5` para iniciar el debugger.

### Browser DevTools

- **Chrome**: F12
- **Firefox**: F12
- **Safari**: Cmd+Option+I (en Mac)

### Prisma Studio

Visualiza y edita la BD en una GUI:

```bash
npm run prisma:studio
# Abre http://localhost:5555
```

## 🗄️ Trabajar con la Base de Datos

### SQLite (Desarrollo local)

La BD se crea automáticamente en `dev.db`.

Borrar y reinicializar:

```bash
# Opción 1: Reiniciar migraciones
npm run prisma:migrate reset

# Opción 2: Borrar y recrear manualmente
rm dev.db
npm run prisma:migrate
```

### PostgreSQL (Producción)

En producción, usa PostgreSQL:

```bash
# .env.local o variables de entorno
DATABASE_URL="postgresql://user:password@localhost:5432/dias_salario"

# Las migraciones funcionan igual
npm run prisma:migrate
```

## 🚀 Hacer cambios en el schema

Si cambias `prisma/schema.prisma`:

```bash
# 1. Crear migración
npm run prisma:migrate dev --name descripcion_cambio

# Ejemplo:
npm run prisma:migrate dev --name add_category_to_items

# 2. Se pedirá confirmación si hay cambios destructivos
# 3. Prisma genera automáticamente la migración SQL
# 4. El cliente se regenera automáticamente
```

## 🔄 Flujo de desarrollo típico

```bash
# 1. Crear rama
git checkout -b feature/mi-feature

# 2. Hacer cambios e instalar deps si es necesario
npm install

# 3. Test local
npm run dev
# ... probar manualmente en http://localhost:3000

# 4. Ejecutar tests
npm test

# 5. Lint y format
npm run lint
npm run format

# 6. Build para producción (asegurar que compila)
npm run build

# 7. Commit
git add -A
git commit -m "feat: descripción del cambio"

# 8. Push y abrir PR
git push origin feature/mi-feature
```

## 📊 Estructura de directorios clave

```
src/
├── app/
│   ├── api/              # Routes que editar frecuentemente
│   ├── page.tsx          # Página principal
│   └── layout.tsx        # Root layout
│
├── lib/
│   ├── salary-calculator.ts      # Lógica de negocio
│   ├── shadow-profile.ts         # IndexedDB
│   ├── auth.ts                   # Configuración auth
│   └── __tests__/                # Tests unitarios
│
├── components/           # Componentes React reutilizables
│
└── generated/            # NO EDITAR (código generado)
```

## 🐛 Troubleshooting

### Error: "DATABASE_URL no está definida"

**Solución**: Crea `.env.local` con `DATABASE_URL="file:./dev.db"`

### Error: "PrismaClient initialization error"

**Solución**:

```bash
npm run prisma:generate
npm run prisma:migrate
```

### Port 3000 ya está en uso

**Solución**:

```bash
npm run dev -- -p 3001
# O mata el proceso:
# Windows: netstat -ano | findstr :3000
# Mac/Linux: lsof -i :3000
```

### NextAuth session no funciona

**Solución**:

- Verifica que `NEXTAUTH_SECRET` está en `.env.local`
- Verifica que `NEXTAUTH_URL` es correcto
- Limpia cookies del navegador

### Tests fallan

**Solución**:

```bash
npm test -- --clearCache
npm test
```

### Cambios no se reflejan

**Solución**:

- Reinicia el servidor: `Ctrl+C` y `npm run dev`
- Limpia caché: `rm -rf .next`
- Recarga página completamente: `Ctrl+Shift+R`

## 📚 Más información

- [Documentación de Arquitectura](./ARCHITECTURE.md)
- [Rutas de API](./API_ROUTES.md)
- [Guía de Contribución](./CONTRIBUTING.md)
- [Documentación oficial Next.js](https://nextjs.org)
- [Documentación oficial Prisma](https://www.prisma.io/docs)

---

**¿Problemas?** Abre un issue en GitHub o busca en la documentación existente.

**Actualizado**: Febrero 2026
