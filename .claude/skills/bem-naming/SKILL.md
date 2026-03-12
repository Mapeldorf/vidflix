# Skill: bem-naming

## Propósito
Guía para escribir CSS personalizado siguiendo la metodología BEM estrictamente. Esta skill se invoca **solo cuando Tailwind CSS es insuficiente** para expresar un estilo con claridad.

---

## Cuándo usar esta skill

Recurre a BEM únicamente para:

- Pseudoelementos (`::before`, `::after`)
- Animaciones con `@keyframes`
- Selectores de hijo o hermano que Tailwind no puede expresar
- Estilos que requieren especificidad controlada y anidamiento semántico

Si Tailwind puede resolverlo, no escribas CSS personalizado.

---

## Estructura BEM

```
.bloque
.bloque__elemento
.bloque--modificador
.bloque__elemento--modificador
```

| Concepto | Descripción | Ejemplo |
|---|---|---|
| **Bloque** | Componente independiente. Usa el nombre del componente Angular. | `.movie-card` |
| **Elemento** | Parte interna del bloque. Doble guión bajo. | `.movie-card__thumbnail` |
| **Modificador** | Variante o estado. Doble guión. | `.movie-card--featured` |

---

## Reglas de nomenclatura

- Todo en **minúsculas**.
- Palabras dentro de un segmento separadas por **guión simple**: `.movie-card__play-button`.
- **Nunca** anides clases BEM con mayor especificidad en CSS.
- **Nunca** uses el nombre del elemento HTML como parte del nombre BEM.

```scss
// ✅ Correcto
.movie-card { }
.movie-card__thumbnail { }
.movie-card__thumbnail--loading { }
.movie-card--featured { }

// ❌ Incorrecto: anidamiento que incrementa especificidad
.movie-card .movie-card__thumbnail { }

// ❌ Incorrecto: nombre de etiqueta HTML en la clase
.movie-card__img { }  // usa __thumbnail, no __img
```

---

## Combinación con Tailwind en plantilla

Las clases BEM y las utilidades Tailwind **conviven** en el mismo elemento. BEM aporta semántica y permite CSS avanzado; Tailwind gestiona el layout y los valores utilitarios.

```html
<!-- ✅ Combinación correcta -->
<div class="movie-card flex flex-col rounded-lg overflow-hidden shadow-md">
  <img class="movie-card__thumbnail w-full object-cover">
  <div class="movie-card__body p-4 flex flex-col gap-2">
    <h3 class="movie-card__title text-lg font-semibold text-gray-900 dark:text-white">
    <span class="movie-card__badge movie-card__badge--new bg-blue-600 text-white text-xs px-2 py-1 rounded">
```

---

## Pseudoelementos

Los pseudoelementos son el caso de uso principal de esta skill, ya que Tailwind no los cubre con la misma flexibilidad.

```scss
// Overlay sobre thumbnail
.movie-card__thumbnail {
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  &:hover::after {
    opacity: 1;
  }
}
```

---

## Animaciones con @keyframes

```scss
// En el archivo .scss del componente
@keyframes card-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.movie-card__thumbnail--loading {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: card-shimmer 1.5s infinite;
}
```

---

## Ubicación del CSS

Escribe los estilos BEM en el archivo `.scss` (o `.css`) del propio componente Angular, nunca en hojas de estilo globales salvo que el bloque sea verdaderamente global.

```
src/app/components/movie-card/
├── movie-card.component.ts
├── movie-card.component.html
└── movie-card.component.scss   ← aquí van los estilos BEM
```

---

## Cuándo pasar a otra skill

| Situación | Skill a invocar |
|---|---|
| El estilo puede expresarse con utilidades Tailwind | `tailwind-utilities` |
| El estilo depende del estado del componente Angular | `ngclass-patterns` |
