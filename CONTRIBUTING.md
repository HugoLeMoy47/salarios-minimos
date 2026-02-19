# 🤝 Guía de Contribución

Gracias por tu interés en contribuir a **Días de Salario**. Este documento explica cómo participar en el proyecto.

## 📋 Tabla de contenidos

- [Código de conducta](#código-de-conducta)
- [¿Cómo contribuir?](#cómo-contribuir)
- [Guía de desarrollo](#guía-de-desarrollo)
- [Estándares de código](#estándares-de-código)
- [Proceso de Pull Request](#proceso-de-pull-request)
- [Reporte de bugs](#reporte-de-bugs)
- [Solicitud de features](#solicitud-de-features)

## 🎯 Código de conducta

Este proyecto se rige por nuestro Código de Conducta. Por participar, aceptas cumplirlo.

**En resumen:**

- Sé respetuoso con los demás
- Acepta crítica constructiva
- Enfócate en lo mejor para la comunidad
- Reporta comportamiento inapropiado

## 🚀 ¿Cómo contribuir?

### Formas de contribuir

1. **Reportar bugs** - Encontraste algo que no funciona
2. **Sugerir features** - Tienes una idea por proponer
3. **Mejorar documentación** - Documentación incompleta o confusa
4. **Escrutar código** - Revisar PRs de otros
5. **Escribir código** - Implementar features o arreglar bugs
6. **Traducir** - Llevar la app a otros idiomas

## 📖 Guía de desarrollo

### Configuración del ambiente

```bash
# 1. Fork el repositorio
# Ve a https://github.com/HugoLeMoy47/salarios-minimos y haz fork

# 2. Clona tu fork
git clone https://github.com/TU_USUARIO/salarios-minimos.git
cd salarios-minimos

# 3. Añade upstream para mantenerlo sincronizado
git remote add upstream https://github.com/HugoLeMoy47/salarios-minimos.git

# 4. Actualiza main
git fetch upstream
git checkout master
git merge upstream/master

# 5. Instala dependencias
npm install

# 6. Crea tu rama
git checkout -b fix/nombre-del-bug
# o
git checkout -b feature/nombre-de-feature
```

### Rama de trabajo

**Nombres de ramas recomendados:**

```
fix/descripcion-del-fix           # Arreglo de bug
feature/descripcion-de-feature    # Nueva funcionalidad
docs/descripcion-de-cambio        # Documentación
test/descripcion-de-test          # Tests
perf/descripcion-de-optimizacion  # Optimización
```

### Desarrollo local

```bash
# Inicia servidor de desarrollo
npm run dev

# En otra terminal, watch para tests
npm run test:watch

# Formato y linting
npm run format
npm run lint

# Build para producción (testea que todo funcione)
npm run build
npm start
```

## 🎨 Estándares de código

### TypeScript

- **Tipos explícitos** - Siempre especifica tipos
- **No usar `any`** - Usa tipos específicos
- **Interfaces para objetos** - Define la estructura

```typescript
// ❌ Malo
function handleData(data: any) {
  return data.value;
}

// ✅ Bien
interface DataObject {
  value: string;
  timestamp: Date;
}

function handleData(data: DataObject): string {
  return data.value;
}
```

### React

- **Componentes funcionales** - Usa `function` o `const`
- **Hooks correctamente** - Respeta las reglas de hooks
- **Componentes pequeños** - Divide en componentes reutilizables

```typescript
// ✅ Bien
interface UserProps {
  name: string;
  email: string;
}

export function UserCard({ name, email }: UserProps) {
  return (
    <div>
      <h1>{name}</h1>
      <p>{email}</p>
    </div>
  );
}
```

### Nombres

- **Variables**: camelCase
- **Constantes**: UPPER_SNAKE_CASE (solo para valores reales)
- **Archivos**: kebab-case (excepto componentes)
- **Componentes**: PascalCase

### Comentarios

```typescript
// Usa comentarios para EL POR QUÉ, no el QUÉ

// ❌ Innecesario
const result = calculate(price); // Calcula el resultado

// ✅ Útil
// Usamos Math.ceil porque necesitamos redondear hacia arriba
// (no podemos vender fracciones de día)
const days = Math.ceil(price / dailySalary);
```

### Imports

```typescript
// Ordena: Built-in → Third-party → Local
import { useState } from 'react';
import { prisma } from '@/lib/prisma';
import { UserCard } from '@/components/UserCard';
```

## 🔄 Proceso de Pull Request

### Antes de hacer el PR

1. **Actualiza tu rama**:

   ```bash
   git fetch upstream
   git rebase upstream/master
   ```

2. **Tests**:

   ```bash
   npm test
   ```

3. **Lint**:

   ```bash
   npm run lint
   npm run format
   ```

4. **Build**:
   ```bash
   npm run build
   ```

### Crear el PR

1. Push a tu fork: `git push origin fix/mi-fix`
2. Abre PR en GitHub
3. Completa la plantilla del PR
4. Describe el cambio claramente

**Plantilla de PR:**

```markdown
## Descripción

Explica breve qué cambias y por qué.

## Tipo de cambio

- [ ] Bug fix
- [ ] Feature nueva
- [ ] Breaking change
- [ ] Cambio de documentación

## Cómo testear

Pasos para verificar el cambio:

1. ...
2. ...

## Checklist

- [ ] Código sigue los estándares
- [ ] Documentación actualizada
- [ ] Tests pasando
- [ ] Build exitoso
- [ ] Sin conflictos con main
```

### Revisión del PR

- Los maintainers revisarán en 1-2 días hábiles
- Responde a los comentarios o solicita cambios
- Cuando sea aprobado, será merged

## 🐛 Reporte de bugs

**Antes de reportar:**

- Verifica que el bug reproduzca en la última versión
- Busca si ya fue reportado
- Ten información clara sobre cómo reproducir

**Usa esta plantilla:**

```markdown
## Descripción del bug

Descripción clara y concisa.

## Pasos para reproducir

1. ...
2. ...
3. ...

## Comportamiento esperado

Qué debería pasar.

## Comportamiento actual

Qué pasa realmente.

## Ambiente

- Browser: Chrome 120
- OS: Windows 11
- Versión: v0.1.0

## Logs/Errores
```

Pega aquí los errores de consola

```

## Capturas de pantalla
Si aplica, añade screenshots.
```

## 💡 Solicitud de features

**Plantilla:**

```markdown
## Descripción

Qué feature propones y por qué.

## Caso de uso

¿Quién se beneficia? ¿Cuándo la necesitan?

## Solución propuesta

Tu idea de cómo implementarla.

## Alternativas consideradas

Otras formas de resolver esto.

## Contexto adicional

Información extra relevante.
```

## 📚 Recursos útiles

- [Documentación arquitectura](./ARCHITECTURE.md)
- [Documentación de APIs](./API_ROUTES.md)
- [Configuración de desarrollo](./DEV_SETUP.md)
- [Seguridad](./SECURITY.md)

## ✅ Checklist para buenas contribuciones

Antes de enviar tu PR:

- [ ] Código sigue guía de estilo
- [ ] Comentarios claros en código complejo
- [ ] Tests para cambios nuevos
- [ ] Tests existentes aún pasan
- [ ] Documentación actualizada
- [ ] Commit messages claros y en inglés
- [ ] No hay cambios sin relacionar

## 🎓 Tips para contribuciones exitosas

1. **Empieza pequeño** - PRs pequeños son más fáciles de revisar
2. **Comunica temprano** - Menciona en issues qué planeas hacer
3. **Tests primero** - Considera escribir tests antes del código
4. **Documenta cambios** - Mantén docs sincronizadas con código
5. **Sé paciente** - Los mantainers son voluntarios

## ❓ Preguntas

¿Dudas?

- Abre una discussion en GitHub
- Ponte en contacto en issues
- Lee la documentación existente

---

**¡Gracias por contribuir!** 🙏
