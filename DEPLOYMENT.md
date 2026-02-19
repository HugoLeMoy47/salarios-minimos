# 🚀 Guía de Despliegue

Instrucciones para desplegar **Días de Salario** en producción.

## 📋 Tabla de contenidos

- [Plataformas soportadas](#plataformas-soportadas)
- [Pre-requisitos](#pre-requisitos)
- [Vercel (Recomendado)](#vercel-recomendado)
- [Railway](#railway)
- [Heroku](#heroku)
- [Docker](#docker)
- [Variables de entorno producc](#variables-de-entorno-producción)
- [Checklist pre-deployment](#checklist-pre-deployment)
- [Monitoreo y logs](#monitoreo-y-logs)

---

## 🌥️ Plataformas soportadas

| Plataforma       | Dificultad      | Cost     | Notas                                |
| ---------------- | --------------- | -------- | ------------------------------------ |
| **Vercel**       | ⭐ Muy fácil    | Freemium | Recomendado, optimizado para Next.js |
| **Railway**      | ⭐⭐ Fácil      | Bajo     | Buena alternativa                    |
| **Heroku**       | ⭐⭐ Fácil      | Medio    | Clásico pero más caro                |
| **AWS**          | ⭐⭐⭐ Moderado | Variable | Escalable, complejo                  |
| **Docker**       | ⭐⭐⭐ Moderado | Depende  | Máximo control                       |
| **DigitalOcean** | ⭐⭐⭐ Moderado | Bajo     | Buen balance                         |

---

## 📦 Pre-requisitos

Antes de desplegar, asegúrate de:

```bash
# ✅ Código buildea localmente
npm run build

# ✅ Tests pasan
npm test

# ✅ Linting limpio
npm run lint

# ✅ Migraciones aplicadas
npm run prisma:migrate

# ✅ Variables de entorno correctas
# Verifica .env.local tiene todos los valores necesarios
```

---

## 🟢 Vercel (Recomendado)

Vercel es la plataforma creada por los creadores de Next.js.

### Paso 1: Preparar repositorio

```bash
# Asegúrate que estés en main o master
git status
git log --oneline -1

# Push a GitHub
git push origin main
```

### Paso 2: Conectar a Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "New Project"
3. Selecciona tu repositorio GitHub
4. Haz clic en "Import"

### Paso 3: Configurar variables de entorno

En el dashboard de Vercel:

1. Ve a "Settings" → "Environment Variables"
2. Añade las siguientes variables:

```
NEXTAUTH_URL                    https://tu-dominio.com
NEXTAUTH_SECRET                 (generar con: openssl rand -hex 32)

# OAuth
GOOGLE_CLIENT_ID                ...
GOOGLE_CLIENT_SECRET            ...
MICROSOFT_CLIENT_ID             ...
MICROSOFT_CLIENT_SECRET         ...
APPLE_ID                        ...
APPLE_TEAM_ID                   ...
APPLE_KEY_ID                    ...
APPLE_PRIVATE_KEY              ...

# Database - IMPORTANTE
DATABASE_URL                    postgresql://user:pass@host/db

# App
NEXT_PUBLIC_MIN_SALARY_DAILY    241.56
NEXT_PUBLIC_APP_URL             https://tu-dominio.com
ENCRYPTION_KEY                  (generar con: openssl rand -hex 16)
```

### Paso 4: Configurar base de datos

**Opción A: PostgreSQL en Vercel (Recomendado)**

1. En dashboard de Vercel, ve a "Storage"
2. Haz clic en "Connect Store" → "Create New" → "PostgreSQL"
3. Sigue los pasos y copia la `DATABASE_URL`
4. Pégala en Environment Variables

**Opción B: Base de datos externa**

Si usas una BD externa (AWS RDS, DigitalOcean, etc.):

1. Asegúrate que sea PostgreSQL
2. Obtén la connection string
3. Pégala como `DATABASE_URL`

### Paso 5: Deploy

1. Vercel detectará automáticamente `package.json` y `next.config.ts`
2. Haz clic en "Deploy"
3. Espera a que termine (2-5 minutos típicamente)

### Después del deploy

```bash
# Ejecutar migraciones
# Opción 1: En Vercel CLI
vercel env pull
npx prisma migrate deploy

# Opción 2: Via UI - crea un endpoint de healthcheck que ejecute migraciones
```

**Enlace**: Tu app estará en `https://[project-name].vercel.app`

---

## 🚂 Railway

Alternativa simple a Vercel.

### Paso 1: Crear proyecto

1. Ve a [railway.app](https://railway.app)
2. Haz clic en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Autoriza y selecciona tu repo

### Paso 2: Agregar PostgreSQL

1. Haz clic en "New" → "Database" → "PostgreSQL"
2. Railway crea automáticamente la BD y configura `DATABASE_URL`

### Paso 3: Configurar variables

En "Variables", añade:

```
NEXTAUTH_URL              https://tu-proyecto.up.railway.app
NEXTAUTH_SECRET           (generar)
GOOGLE_CLIENT_ID          ...
GOOGLE_CLIENT_SECRET      ...
# ... (igual que Vercel)
```

### Paso 4: Deploy automático

Railway automáticamente:

1. Detecta cambios en el repo
2. Construye el proyecto
3. Ejecuta migraciones Prisma
4. Despliega

---

## 🟣 Heroku

Heroku está discontinuando sus dynos gratuitos, pero aún funciona.

### Paso 1: Instalar Heroku CLI

```bash
npm install -g heroku
heroku login
```

### Paso 2: Crear aplicación

```bash
heroku create nombre-de-app
```

### Paso 3: Agregar PostgreSQL

```bash
heroku addons:create heroku-postgresql:standard-0
```

### Paso 4: Configurar variables

```bash
heroku config:set NEXTAUTH_URL=https://nombre-de-app.herokuapp.com
heroku config:set NEXTAUTH_SECRET=$(openssl rand -hex 32)
heroku config:set GOOGLE_CLIENT_ID=...
heroku config:set GOOGLE_CLIENT_SECRET=...
# ... etc
```

### Paso 5: Deploy

```bash
git push heroku main
```

Aplicará migraciones automáticamente desde `Procfile`:

```procfile
release: npx prisma migrate deploy
web: npm start
```

---

## 🐳 Docker

Para máximo control y portabilidad.

### Paso 1: Crear Dockerfile

```dockerfile
# Crear Dockerfile en raíz del proyecto
FROM node:20-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar código
COPY . .

# Build
RUN npm run build

# Generar Prisma
RUN npx prisma generate

# Exposar puerto
EXPOSE 3000

# START
CMD ["npm", "start"]
```

### Paso 2: Crear docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://user:password@db:5432/dias_salario
      NEXTAUTH_URL: http://localhost:3000
      NEXTAUTH_SECRET: your-secret
      # ... otras variables
    depends_on:
      - db
    volumes:
      - ./src:/app/src

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: dias_salario
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'

volumes:
  postgres_data:
```

### Paso 3: Construir y ejecutar

```bash
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
```

Accede a `http://localhost:3000`

### Desplegar en servidor con Docker

```bash
# En tu servidor (VPS, AWS EC2, DigitalOcean, etc.)
git clone tu-repo
cd tu-repo

# Crear .env
cat > .env << EOF
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://tu-dominio.com
# ... etc
EOF

# Ejecutar
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🔒 Variables de Entorno Producción

### Críticas (❌ NO compilar sin estas)

```bash
# Autenticación
NEXTAUTH_SECRET=generated-with-openssl-rand-hex-32
NEXTAUTH_URL=https://tu-dominio.vercel.app

# Base de datos
DATABASE_URL=postgresql://user:password@host/database
```

### Importantes (🔴 Configurar en prod)

```bash
# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...

# Encriptación
ENCRYPTION_KEY=generated-with-openssl-rand-hex-16
```

### Recomendadas (🟡 Config app)

```bash
NEXT_PUBLIC_MIN_SALARY_DAILY=241.56
NEXT_PUBLIC_APP_URL=https://tu-dominio.com
```

### Generar secrets seguros

```bash
# SECRET para NextAuth (32 hex chars)
openssl rand -hex 32

# Encryption key (16 hex chars)
openssl rand -hex 16
```

---

## ✅ Checklist Pre-Deployment

Antes de desplegar a producción:

- [ ] Todo buildea localmente: `npm run build` ✅
- [ ] Tests pasan: `npm test` ✅
- [ ] Linting limpio: `npm run lint` ✅
- [ ] Migraciones listas: `npm run prisma:migrate` ✅
- [ ] Variables de entorno configuradas
- [ ] OAuth credenciales válidas y URLs correctas
- [ ] Base de datos configurada y accesible
- [ ] SSL/HTTPS habilitado
- [ ] Domain apuntando correctamente
- [ ] Backups de BD configurados
- [ ] Monitoring/Logging configurado
- [ ] Error tracking (Sentry) configurado
- [ ] Email transaccional (si aplica)
- [ ] Rate limiting configurado
- [ ] CORS configurado correctamente

---

## 📊 Monitoreo y Logs

### Vercel

1. Dashboard → "Logs" → elige tipo
2. Real-time logs aparecen en la terminal con:

```bash
vercel logs
```

### Railway

1. Dashboard → Click proyecto → "Logs"
2. O en CLI:

```bash
railway logs
```

### Sentry (Error tracking recomendado)

```bash
npm install @sentry/nextjs
```

Crear `sentry.client.config.ts`:

```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### CloudFlare (CDN optional)

1. Compra dominio o transfiere existente
2. Apunta nameservers a Cloudflare
3. Configura DNS record A/CNAME a tu deployador
4. Activa analytics e protección

---

## 🔄 CI/CD Pipeline

### GitHub Actions (automático deploy)

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build

      # Vercel deploy (requiere VERCEL_TOKEN)
      - name: Deploy to Vercel
        run: npm i -g vercel && vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

---

## 🆘 Troubleshooting

### Error: "DATABASE_URL is not set"

```
Database está configurada en .env.local pero no en el hosting.
Solución: Agrega DATABASE_URL en variables de entorno del hosting.
```

### Error: "NextAuth session error"

```
NEXTAUTH_SECRET no es válido o URL no coincide.
Solución:
1. Regenera: openssl rand -hex 32
2. Verifica NEXTAUTH_URL sin trailing slash
3. Limpia cookies del navegador
```

### Build tarda mucho / timeout

```
Next.js build lento.
Solución:
1. Aumenta memoria de build en el hosting
2. Agiliza usando: npm ci en lugar de npm install
3. Considera usar pnpm (más rápido)
```

### Base de datos no responde en inicio

```
Migraciones no se ejecutaron.
Solución:
1. Ejecuta manualmente: npm run prisma:migrate
2. Verifica DATABASE_URL está correcta
```

---

## 📈 Scaling futuro

### Cuando crecerza

1. **Cache**: Implementar Redis para sesiones
2. **CDN**: CloudFlare, Bunny, Akamai
3. **BD Replicas**: Read replicas de PostgreSQL
4. **Load Balancing**: Múltiples instancias de Next.js
5. **Serverless**: AWS Lambda, Google Cloud Functions
6. **Analytics**: Datadog, New Relic, Grafana

---

**Actualizado**: Febrero 2026  
**Versión**: 1.0.0-MVP
