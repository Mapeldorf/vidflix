# Skill: ngclass-patterns

## Propósito
Guía para aplicar estilos condicionales y dinámicos en componentes Angular usando `NgClass`. Esta skill es **obligatoria** siempre que un estilo deba cambiar según el estado del componente.

---

## Regla fundamental

> Nunca uses interpolación de cadenas ni binding de `style` en línea para alternar clases. Usa siempre `NgClass`.

```html
<!-- ❌ Incorrecto: interpolación de cadena -->
<div class="movie-card {{ isFeatured ? 'movie-card--featured' : '' }}">

<!-- ❌ Incorrecto: style en línea para algo que debería ser una clase -->
<div [style.opacity]="isLoading ? '0.5' : '1'">

<!-- ✅ Correcto -->
<div [ngClass]="{ 'movie-card--featured': isFeatured, 'opacity-50': isLoading }">
```

---

## Los tres patrones de NgClass

### Patrón 1 — Objeto (preferido para múltiples condiciones)

Usa este patrón cuando hay dos o más condiciones independientes entre sí.

```html
<div [ngClass]="{
  'movie-card--featured':          isFeatured,
  'movie-card--loading':           isLoading,
  'opacity-50 cursor-not-allowed': isDisabled,
  'ring-2 ring-blue-500':          isSelected
}">
```

> Cada clave es una clase (o varias separadas por espacio) y el valor es la condición booleana.

---

### Patrón 2 — Array (para combinar clases estáticas y dinámicas)

Usa este patrón cuando necesitas mezclar clases fijas con clases calculadas o condicionales.

```html
<div [ngClass]="[
  'movie-card',
  sizeClass,
  isVisible ? 'opacity-100' : 'opacity-0'
]">
```

```ts
// En el componente
get sizeClass(): string {
  return this.isCompact ? 'movie-card--compact' : 'movie-card--full';
}
```

---

### Patrón 3 — String (para una única condición simple)

Usa este patrón solo cuando hay exactamente dos estados mutuamente excluyentes.

```html
<div [ngClass]="isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'">
```

---

## Clases calculadas en el componente

Cuando la lógica de clases es compleja, muévela al componente TypeScript y expónla como getter. Mantén las plantillas limpias.

```ts
// movie-card.component.ts
get cardClasses(): Record<string, boolean> {
  return {
    'movie-card--featured':  this.isFeatured,
    'movie-card--loading':   this.isLoading,
    'movie-card--selected':  this.isSelected,
    'opacity-50':            this.isDisabled,
    'cursor-not-allowed':    this.isDisabled,
  };
}

get thumbnailClasses(): string[] {
  return [
    'movie-card__thumbnail',
    this.aspectRatio === '16:9' ? 'aspect-video' : 'aspect-square',
    this.isLoading ? 'movie-card__thumbnail--loading' : '',
  ].filter(Boolean);
}
```

```html
<!-- Plantilla limpia -->
<div [ngClass]="cardClasses">
  <img [ngClass]="thumbnailClasses">
```

---

## NgClass con señales (Angular 17+)

Si el proyecto usa signals, expón las clases como `computed`:

```ts
// movie-card.component.ts
isFeatured = input<boolean>(false);
isLoading  = input<boolean>(false);

cardClasses = computed(() => ({
  'movie-card--featured': this.isFeatured(),
  'movie-card--loading':  this.isLoading(),
  'opacity-50':           this.isLoading(),
}));
```

```html
<div [ngClass]="cardClasses()">
```

---

## Combinación con clases estáticas

`NgClass` y `class` estática conviven en el mismo elemento sin problema.

```html
<!-- Las clases estáticas van en class, las dinámicas en ngClass -->
<div
  class="movie-card flex flex-col rounded-lg"
  [ngClass]="cardClasses">
```

---

## Antipatrones a evitar

| Antipatrón | Alternativa |
|---|---|
| `[class.foo]="cond"` para múltiples clases | `[ngClass]` con objeto |
| Ternario en `class=""` con interpolación | Patrón string de NgClass |
| Lógica compleja inline en la plantilla | Getter en el componente |
| `[style.color]` para algo controlable por clase | Clase Tailwind o BEM + NgClass |

---

## Cuándo pasar a otra skill

| Situación | Skill a invocar |
|---|---|
| El estilo no depende de ningún estado | `tailwind-utilities` |
| Necesitas pseudoelementos o animaciones | `bem-naming` |
