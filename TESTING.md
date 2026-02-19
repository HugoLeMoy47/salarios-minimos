# 🧪 Guía de Testing

Estrategia y prácticas de testing para **Días de Salario**.

## 📋 Tabla de contenidos

- [Filosofía de testing](#filosofía-de-testing)
- [Setup y configuración](#setup-y-configuración)
- [Unit tests](#unit-tests)
- [Integration tests](#integration-tests)
- [E2E tests](#e2e-tests)
- [Coverage goals](#coverage-goals)
- [CI/CD testing](#cicd-testing)
- [Debugging tests](#debugging-tests)

---

## 🎯 Filosofía de testing

### Pirámide de testing

```
         E2E (5%)
        /       \
       /         \
      / Integration\
     /    (15%)    \
    /               \
   / Unit Tests      \
  /   (80%)          \
 /_________________\
```

**Distribuir esfuerzos**:

- 🔵 **80%** Unit tests: Rápidos, específicos
- 🟢 **15%** Integration tests: Componentes juntos
- 🔴 **5%** E2E tests: Flujos usuario completos

### Principios

1. **Arrange-Act-Assert**: Setup, ejecutar, verificar
2. **DRY**: No repetir setup
3. **Independencia**: Tests no dependen unos de otros
4. **Rapidez**: Tests deben ejecutarse en segundos
5. **Determinismo**: Mismo resultado siempre
6. **Claridad**: Tests documentan comportamiento

---

## 🔧 Setup y configuración

### Jest configuration (jest.config.js)

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts', '!src/**/*.stories.tsx'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
```

### Jest setup (jest.setup.js)

```javascript
// Configurar polyfills
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock de variables de entorno
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
```

---

## 🔵 Unit Tests

### Estructura de archivos

```
src/lib/
  salary-calculator.ts
  __tests__/
    salary-calculator.test.ts
```

### Ejemplo: Testeando calculadora de salario

Archivo: [src/lib/salary-calculator.ts](src/lib/salary-calculator.ts)

```typescript
export function calculateSalaryDays(price: number): number {
  const MIN_SALARY_DAILY = 241.56; // 2024 Colombia
  return Math.ceil(price / MIN_SALARY_DAILY);
}
```

Test file: `src/lib/__tests__/salary-calculator.test.ts`

```typescript
import { calculateSalaryDays } from '../salary-calculator';

describe('calculateSalaryDays', () => {
  // Arrange - Setup
  const MIN_SALARY = 241.56;

  // ✅ Test caso normal
  test('calcula días correctamente', () => {
    // Arrange
    const price = 500;

    // Act
    const result = calculateSalaryDays(price);

    // Assert
    expect(result).toBe(3); // 500 / 241.56 = 2.07 → ceiling = 3
  });

  // ✅ Test edge case
  test('retorna 1 para precio bajo', () => {
    const price = 100;
    expect(calculateSalaryDays(price)).toBe(1);
  });

  // ✅ Test error handling
  test('maneja valores negativos', () => {
    expect(() => calculateSalaryDays(-100)).toThrow();
  });

  // ✅ Test boundary
  test('exacto a MIN_SALARY retorna 1', () => {
    expect(calculateSalaryDays(MIN_SALARY)).toBe(1);
  });
});
```

### Ejecutar tests

```bash
# Ejecutar todos
npm test

# Watch mode (re-run en cambios)
npm test -- --watch

# Coverage report
npm test -- --coverage

# Test específico
npm test salary-calculator

# Debug
node --inspect-brk node_modules/.bin/jest --runInBand
```

---

## 🟢 Integration Tests

### Testing de funciones que dependen de otras

Ejemplo: `src/lib/shadow-profile.ts` usa IndexedDB

```typescript
// shadow-profile.test.ts
import { getAllShadowItems, saveShadowItem, deleteShadowItem } from '../shadow-profile';

describe('Shadow Profile', () => {
  // Setup antes de cada test
  beforeEach(async () => {
    // Limpiar IndexedDB
    await clearAllData();
  });

  test('guarda y recupera item', async () => {
    // Arrange
    const item = { id: '1', name: 'Test Item', price: 100 };

    // Act
    await saveShadowItem(item);
    const result = await getAllShadowItems();

    // Assert
    expect(result).toContainEqual(
      expect.objectContaining({
        name: 'Test Item',
        price: 100,
      })
    );
  });

  test('elimina item correctamente', async () => {
    // Arrange
    const item = { id: '1', name: 'To Delete', price: 50 };
    await saveShadowItem(item);

    // Act
    await deleteShadowItem('1');
    const result = await getAllShadowItems();

    // Assert
    expect(result).toHaveLength(0);
  });

  // Test datos consistentes
  test('sincroniza entre múltiples operaciones', async () => {
    // Arrange & Act
    const items = [
      { id: '1', name: 'Item 1', price: 100 },
      { id: '2', name: 'Item 2', price: 200 },
      { id: '3', name: 'Item 3', price: 300 },
    ];

    for (const item of items) {
      await saveShadowItem(item);
    }

    // Assert
    const allItems = await getAllShadowItems();
    expect(allItems).toHaveLength(3);
    expect(allItems.reduce((sum, i) => sum + i.price, 0)).toBe(600);
  });
});
```

---

## 🔴 E2E Tests (Playwright)

### Setup Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

### E2E test: Crear item

Archivo: `e2e/create-item.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Item Creation Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock OAuth (o usar test account)
    // Para tests, usar credenciales test
    await page.goto('/');

    // Si requiere autenticación
    // await loginWithTestUser(page);
  });

  test('crear item con validación', async ({ page }) => {
    // Navigate to form
    await page.goto('/');

    // Fill form
    await page.fill('input[name="name"]', 'Café');
    await page.fill('input[name="price"]', '5000');

    // Submit
    await page.click('button[type="submit"]');

    // Verificar feedback
    await expect(page.locator('text=Item creado')).toBeVisible();

    // Verificar que aparece en lista
    await expect(page.locator('text=Café')).toBeVisible();
  });

  test('validación de precio requerido', async ({ page }) => {
    // Intentar sin precio
    await page.fill('input[name="name"]', 'Test');
    await page.click('button[type="submit"]');

    // Error visible
    await expect(page.locator('text=Precio requerido')).toBeVisible();
  });

  test('cálculo de días de salario', async ({ page }) => {
    // Llenar y submit
    await page.fill('input[name="price"]', '241.56');
    await page.click('button[type="submit"]');

    // Verificar cálculo
    await expect(page.locator('text=1 día de salario')).toBeVisible();
  });
});
```

### Ejecutar E2E tests

```bash
# Todos los E2E tests
npx playwright test

# Watch mode
npx playwright test --watch

# Headed (ver navegador)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Específico
npx playwright test create-item.spec.ts
```

---

## 📊 Coverage Goals

### Target

```
Statements   : 80%
Branches     : 75%
Functions    : 80%
Lines        : 80%
```

### Generar reporte

```bash
npm test -- --coverage
```

Abre `coverage/lcov-report/index.html` en navegador.

### Mejorar coverage

```bash
# 1. Identificar archivos sin coverage
npm test -- --coverage --collectCoverageFrom='src/**/*.ts'

# 2. Escribir tests para los uncovered
# 3. Verificar nuevamente
npm test -- --coverage
```

---

## 🚀 CI/CD Testing

### GitHub Actions workflow

Archivo: `.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      # Install & build
      - run: npm ci
      - run: npm run build

      # Setup BD
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

      # Unit & Integration tests
      - run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test

      # Upload coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      # E2E tests (después)
      - run: npm run build
      - run: npx playwright test

      # Upload artifact si falla
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 🐛 Debugging Tests

### Debug mode interactivo

```bash
# En terminal 1: arrancar servidor
npm run dev

# En terminal 2: debug
npx playwright test --debug

# Setup breakpoints en código
debugger;
```

### Inspeccionar elemento con Playwright

```typescript
test('debug test', async ({ page }) => {
  await page.goto('/');

  // Pausa y abre inspector
  await page.pause();

  // Escribir comandos en inspector:
  // await page.locator('button').click()
  // await page.screenshot()
});
```

### Coverage debugging

```bash
# Ver qué líneas no están cubiertas
npm test -- --coverage --verbose

# Abrir reporte HTML
open coverage/lcov-report/index.html
```

### Logs detallados

```typescript
// Agregar debug info
test('test with logs', async ({ page }) => {
  console.log('Starting test');

  page.on('console', (msg) => console.log(msg));

  await page.goto('/');
  console.log('Page loaded');

  await page.click('button');
  console.log('Button clicked');
});
```

---

## 📝 Best Practices

### 1. Nombres descriptivos

```typescript
// ❌ Malo
test('test1', () => {
  // ...
});

// ✅ Bueno
test('calcula días correctamente cuando precio es 500', () => {
  // ...
});
```

### 2. Un assertion por comportamiento

```typescript
// ❌ Múltiples assertions sin relación
test('item', () => {
  expect(result.id).toBeDefined();
  expect(db.calls).toBe(1);
  await someAsyncFunction();
  expect(email).toHaveBeenCalled();
});

// ✅ Una cosa bien
test('guarda item con ID único', () => {
  const result = saveItem(item);
  expect(result.id).toBeDefined();
});

test('notifica por email después de guardar', () => {
  saveItem(item);
  expect(email).toHaveBeenCalled();
});
```

### 3. Mock externos

```typescript
// ✅ Mock de OAuth en tests
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: '1', email: 'test@example.com' } },
    status: 'authenticated',
  }),
}));
```

### 4. Setup y teardown

```typescript
describe('Database tests', () => {
  beforeEach(async () => {
    // Setup: crear BD de prueba
    await db.initialize();
  });

  afterEach(async () => {
    // Cleanup: limpiar
    await db.clear();
  });

  test('operación BD', async () => {
    // Test usa BD limpia
  });
});
```

---

## 🎯 Testing por componente

### LoginButton component

```typescript
// components/__tests__/LoginButton.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginButton } from '../LoginButton';

describe('LoginButton', () => {
  test('muestra botón de login', () => {
    render(<LoginButton />);
    expect(screen.getByText('Sign in')).toBeInTheDocument();
  });

  test('abre diálogo OAuth al clickear', () => {
    render(<LoginButton />);
    fireEvent.click(screen.getByText('Sign in'));
    // Verificar que abre proveedor...
  });
});
```

### ItemForm component

```typescript
// components/__tests__/ItemForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ItemForm } from '../ItemForm';

describe('ItemForm', () => {
  test('valida precio requerido', async () => {
    render(<ItemForm />);

    // Click submit sin llenar precio
    fireEvent.click(screen.getByRole('button', { name: /crear/i }));

    // Mensaje de error
    await waitFor(() => {
      expect(screen.getByText(/precio requerido/i)).toBeInTheDocument();
    });
  });

  test('calcula salarios días en tiempo real', async () => {
    render(<ItemForm />);
    const priceInput = screen.getByLabelText('Precio');

    // User esribe precio
    await userEvent.type(priceInput, '241.56');

    // Debería mostrar cálculo
    await waitFor(() => {
      expect(screen.getByText('1 día de salario')).toBeInTheDocument();
    });
  });
});
```

---

## 📚 Recursos

- [Jest docs](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Playwright docs](https://playwright.dev/)
- [Testing Principles](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Actualizado**: Febrero 2026  
**Versión**: 1.0.0-MVP
