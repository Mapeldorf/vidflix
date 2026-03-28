# Design Document: Login Redesign

## Overview

Este diseño técnico especifica la implementación del rediseño de la página de login con un enfoque visual más sobrio y minimalista. El objetivo es transformar la interfaz actual, que utiliza colores naranjas vibrantes y efectos visuales pronunciados, en una experiencia más refinada y profesional mediante el uso de una paleta neutral, efectos sutiles y espaciado generoso.

El rediseño se enfoca exclusivamente en cambios visuales y de presentación, manteniendo intacta toda la lógica funcional existente (validación de formularios, manejo de errores, estados de carga, navegación). La implementación se realizará mediante modificaciones en las clases de Tailwind CSS del template HTML, sin requerir cambios en el código TypeScript del componente.

### Design Goals

- Transformar la paleta de colores de naranja vibrante a tonos neutros (grises, blancos)
- Reducir efectos visuales decorativos (sombras, bordes redondeados, rings)
- Aumentar el espaciado vertical para crear una sensación más aireada
- Simplificar elementos interactivos con transiciones sutiles
- Agregar animación de entrada sutil y profesional
- Mantener 100% de la funcionalidad existente
- Preservar accesibilidad (WCAG AA) y responsive design

## Architecture

### Component Structure

El rediseño mantiene la arquitectura actual del componente `LoginComponent`:

```
LoginComponent (apps/client/src/app/auth/login/)
├── login.component.ts (sin cambios)
├── login.component.html (modificaciones visuales)
└── login.component.spec.ts (actualización de tests visuales)
```

### Styling Approach

La implementación utiliza Tailwind CSS v4 con el sistema de utilidades inline. No se requieren archivos CSS personalizados adicionales. El proyecto ya tiene configurado:

- Tailwind CSS v4 con PostCSS
- Font: Inter Variable
- Directivas @layer para componentes reutilizables

### Animation Strategy

Para la animación de entrada, se utilizará una de estas dos estrategias:

**Opción A: CSS Animations (Recomendada)**
- Definir keyframes en `styles.css` usando `@layer utilities`
- Aplicar clases de animación directamente en el template
- Respetar `prefers-reduced-motion` mediante media query

**Opción B: Angular Animations**
- Usar `@angular/animations` para control programático
- Mayor flexibilidad pero más código TypeScript

Se recomienda Opción A por simplicidad y consistencia con el enfoque de Tailwind.

## Components and Interfaces

### Visual Components Affected

#### 1. Page Container
**Current:** `min-h-screen bg-gray-950 flex items-center justify-center px-4`
**Changes:**
- Mantener estructura de layout
- Considerar fondo ligeramente más claro (gray-900 o gray-950)
- Agregar clase de animación al contenedor principal

#### 2. Logo Section
**Current:** Logo de 16 unidades (h-16) con subtítulo en gray-400
**Changes:**
- Reducir tamaño del logo (h-12 o h-14)
- Ajustar color del subtítulo a tono más neutral (gray-500)
- Mantener centrado y espaciado

#### 3. Form Card
**Current:** `bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl`
**Changes:**
- Eliminar o reducir shadow-2xl a shadow-sm o sin sombra
- Reducir border-radius de rounded-2xl a rounded-lg o rounded-xl
- Ajustar border color para contraste sutil
- Mantener padding generoso (p-8)

#### 4. Input Fields
**Current:** 
- Base: `bg-gray-800 border border-gray-700 rounded-lg px-4 py-3`
- Focus: `focus:ring-2 focus:ring-orange-500`
- Error: `border-orange-500`

**Changes:**
- Mantener bg-gray-800 o considerar gray-850
- Reducir focus ring: `focus:ring-1` o solo `focus:border-gray-500`
- Cambiar error border de orange-500 a red-500 o red-400
- Mantener rounded-lg
- Transiciones sutiles: `transition-colors duration-200`

#### 5. Submit Button
**Current:** `bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg`
**Changes:**
- Cambiar a colores neutros: `bg-gray-700 hover:bg-gray-600`
- Reducir font-weight de semibold a medium
- Mantener disabled states con opacity
- Transición suave: `transition-colors duration-200`

#### 6. Error Messages
**Current:** `bg-orange-900/40 border border-orange-700 text-orange-300`
**Changes:**
- Cambiar a tonos rojos apagados: `bg-red-900/30 border border-red-800 text-red-300`
- Mantener rounded-lg y padding

#### 7. Links
**Current:** `text-orange-400 hover:text-orange-300`
**Changes:**
- Cambiar a tonos neutros: `text-gray-400 hover:text-gray-300`
- O usar azul sutil: `text-blue-400 hover:text-blue-300`

### Interface Contracts

El componente mantiene sus interfaces públicas sin cambios:

```typescript
// Inputs: ninguno
// Outputs: ninguno
// Public Methods: ninguno (todo es interno)

// Signals (sin cambios)
loading: WritableSignal<boolean>
error: WritableSignal<string | null>

// Form (sin cambios)
form: FormGroup<{
  login: FormControl<string>
  password: FormControl<string>
}>

// Methods (sin cambios)
fieldInvalid(name: 'login' | 'password'): boolean
onSubmit(): void
```

## Data Models

No se requieren cambios en los modelos de datos. El componente utiliza:

### Form Model
```typescript
{
  login: string    // Required, username or email
  password: string // Required
}
```

### State Model
```typescript
{
  loading: boolean        // Loading state during authentication
  error: string | null    // Error message from server or null
}
```

### External Dependencies
- `AuthService.login(credentials)`: Observable<void> - Sin cambios
- `Router.navigate(['/biblioteca'])`: void - Sin cambios

Todos los modelos y contratos de datos permanecen idénticos a la implementación actual.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, most requirements in this feature are visual/styling validations that are best tested as specific examples rather than universal properties. The functional requirements (5.1-5.3) are the primary candidates for property-based testing as they describe behaviors that should hold across all inputs.

**Consolidation decisions:**
- Visual styling criteria (1.1-4.5, 6.1-6.5, 8.1-8.5): These are specific CSS class validations, best tested as unit test examples
- Functional behaviors (5.1-5.3): These describe universal behaviors across all form inputs and states
- Responsive design (7.2, 7.5): Specific layout validations, tested as examples
- Animation (8.1-8.5): Specific implementation details, tested as examples

### Property 1: Form Validation Preservation

*For any* form input state (valid or invalid), the validation logic should behave identically to the original implementation, showing errors for empty fields when touched and preventing submission of invalid forms.

**Validates: Requirements 5.1**

### Property 2: Error Display Preservation

*For any* authentication error response from the server, the error message should be displayed to the user in the error container, and the loading state should be cleared.

**Validates: Requirements 5.2**

### Property 3: Loading State Preservation

*For any* form submission attempt, when loading is true, the submit button should be disabled and the loading spinner should be visible, preventing duplicate submissions.

**Validates: Requirements 5.3**

### Visual Validation Examples

The following requirements are validated through unit test examples rather than property-based tests, as they verify specific CSS class implementations:

**Color Scheme (Req 1.1, 1.2, 1.4):**
- Verify neutral color classes (gray-*) are used throughout
- Verify orange-* classes are removed from buttons and accents
- Verify error messages use red-* classes instead of orange-*

**Visual Effects (Req 2.1-2.5):**
- Verify shadow-2xl is removed or reduced
- Verify rounded-2xl is reduced to rounded-lg or rounded-xl
- Verify focus rings are subtle (ring-1 or border-only)

**Spacing & Typography (Req 3.1-3.5):**
- Verify increased vertical spacing (mb-* values)
- Verify consistent padding across form elements
- Verify font-semibold is reduced to font-medium

**Interactive Elements (Req 4.1-4.5):**
- Verify button uses neutral colors
- Verify transition classes are present
- Verify disabled states use opacity

**Logo & Branding (Req 6.1, 6.2, 6.4, 6.5):**
- Verify logo size is reduced (h-12 or h-14)
- Verify subtitle uses neutral color
- Verify center alignment is maintained

**Accessibility (Req 5.4, 5.5):**
- Verify registration link is present with correct route
- Verify autocomplete attributes are preserved
- Verify label associations are maintained

**Responsive Design (Req 7.2, 7.5):**
- Verify touch targets have adequate size (py-3 minimum)
- Verify responsive classes remain unchanged

**Animation (Req 8.1-8.5):**
- Verify animation class is applied to form container
- Verify animation duration is 300-500ms
- Verify prefers-reduced-motion is respected
- Verify opacity and optional transform are included

## Error Handling

El rediseño no introduce nuevos casos de error ni modifica el manejo de errores existente. Se mantiene la estrategia actual:

### Existing Error Handling (Preserved)

**Form Validation Errors:**
- Trigger: Campo vacío cuando el usuario toca el input
- Display: Mensaje "Campo obligatorio" en texto rojo debajo del input
- Visual: Border del input cambia a color de error
- Recovery: El error desaparece cuando el usuario ingresa texto válido

**Authentication Errors:**
- Trigger: Respuesta de error del servidor (credenciales inválidas, servidor no disponible, etc.)
- Display: Mensaje de error en contenedor destacado arriba del botón de submit
- Visual: Contenedor con fondo rojo apagado y borde rojo
- Recovery: El error se limpia cuando el usuario intenta un nuevo submit

**Network Errors:**
- Trigger: Fallo de conexión o timeout
- Display: Mensaje genérico "Error al iniciar sesión" en el contenedor de error
- Visual: Mismo estilo que authentication errors
- Recovery: Usuario puede reintentar el submit

### Visual Changes to Error Display

Los únicos cambios relacionados con errores son visuales:

**Before:**
```html
<!-- Error border -->
[class.border-orange-500]="fieldInvalid('login')"

<!-- Error text -->
<p class="text-orange-400 text-xs mt-1">Campo obligatorio</p>

<!-- Error container -->
<div class="bg-orange-900/40 border border-orange-700 text-orange-300">
```

**After:**
```html
<!-- Error border -->
[class.border-red-500]="fieldInvalid('login')"

<!-- Error text -->
<p class="text-red-400 text-xs mt-1">Campo obligatorio</p>

<!-- Error container -->
<div class="bg-red-900/30 border border-red-800 text-red-300">
```

No se modifican:
- Lógica de validación (Validators.required)
- Método fieldInvalid()
- Signal de error
- Manejo de respuestas HTTP
- Timing de limpieza de errores

## Testing Strategy

### Dual Testing Approach

Esta feature requiere una combinación de unit tests y property-based tests:

**Unit Tests:** Verifican implementaciones visuales específicas (clases CSS, estructura del template)
**Property Tests:** Verifican comportamientos funcionales que deben mantenerse (validación, errores, loading)

### Unit Testing Focus

Los unit tests se enfocarán en:

1. **Visual Regression Prevention:**
   - Verificar que clases de colores naranjas no estén presentes
   - Verificar que clases de colores neutros estén presentes
   - Verificar que efectos visuales se hayan reducido (shadows, borders)

2. **Specific Examples:**
   - Logo tiene tamaño correcto (h-12 o h-14)
   - Botón usa colores neutros (bg-gray-700)
   - Inputs tienen borders sutiles
   - Error messages usan colores rojos

3. **Accessibility Preservation:**
   - Labels están asociados correctamente
   - Autocomplete attributes están presentes
   - Touch targets tienen tamaño adecuado

4. **Animation Implementation:**
   - Clase de animación está presente
   - Duración está en rango correcto
   - Prefers-reduced-motion es respetado

### Property-Based Testing Configuration

**Library:** `fast-check` (JavaScript/TypeScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tests located in `login.component.spec.ts`

**Property Test Implementations:**

#### Property 1: Form Validation Preservation
```typescript
// Tag: Feature: login-redesign, Property 1: Form validation preservation
// Generate random form states (empty, filled, partially filled)
// Verify validation behavior matches original implementation
// Check that touched + empty = error shown
// Check that valid = no error shown
```

#### Property 2: Error Display Preservation
```typescript
// Tag: Feature: login-redesign, Property 2: Error display preservation
// Generate random error messages from server
// Verify error is displayed in error container
// Verify loading state is cleared
// Verify error text matches server response
```

#### Property 3: Loading State Preservation
```typescript
// Tag: Feature: login-redesign, Property 3: Loading state preservation
// Generate random form states during loading
// Verify button is disabled when loading=true
// Verify spinner is visible when loading=true
// Verify form cannot be submitted when loading=true
```

### Test Organization

```
login.component.spec.ts
├── Unit Tests (Visual)
│   ├── Color scheme tests
│   ├── Visual effects tests
│   ├── Spacing tests
│   ├── Interactive elements tests
│   ├── Logo tests
│   ├── Accessibility tests
│   ├── Responsive tests
│   └── Animation tests
└── Property Tests (Functional)
    ├── Property 1: Form validation
    ├── Property 2: Error display
    └── Property 3: Loading state
```

### Testing Tools

- **Angular Testing Library:** Para renderizar componente y verificar DOM
- **Jest:** Test runner y assertions
- **fast-check:** Property-based testing
- **@testing-library/user-event:** Para simular interacciones de usuario
- **@axe-core/playwright:** Para validación de accesibilidad (opcional, CI)

### Coverage Goals

- **Line Coverage:** 100% del template HTML (todas las ramas condicionales)
- **Branch Coverage:** 100% de los @if statements
- **Property Coverage:** 100% de las propiedades funcionales (3/3)
- **Visual Coverage:** Muestreo representativo de cambios visuales (no exhaustivo)

### Test Execution

```bash
# Run all tests
nx test client

# Run with coverage
nx test client --coverage

# Run property tests only
nx test client --testNamePattern="Property"

# Run visual tests only
nx test client --testNamePattern="Visual"
```

### Regression Prevention

Los tests deben prevenir:
- Reintroducción de colores naranjas
- Reintroducción de efectos visuales pronunciados
- Pérdida de funcionalidad de validación
- Pérdida de manejo de errores
- Pérdida de estados de loading
- Pérdida de accesibilidad

