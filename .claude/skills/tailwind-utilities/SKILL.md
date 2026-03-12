# Skill: tailwind-utilities

## Propósito
Guía exhaustiva para aplicar clases de utilidad de Tailwind CSS en componentes Angular. Esta skill es la **primera opción** ante cualquier decisión de estilo. Solo se debe recurrir a CSS personalizado cuando Tailwind sea insuficiente.

---

## Jerarquía de uso

Sigue este orden antes de escribir una sola línea de CSS propio:

1. **Clases de utilidad estándar** — cubre la gran mayoría de casos.
2. **Variantes responsivas** — adapta el diseño a cada breakpoint.
3. **Variantes de estado** — gestiona interacciones y accesibilidad.
4. **Modo oscuro** — coherencia visual en ambos temas.
5. **Valores arbitrarios** — cuando necesitas un valor exacto puntual.

---

## Clases de utilidad estándar

Combina utilidades directamente en la plantilla HTML. No crees una clase BEM solo para agrupar utilidades de Tailwind.

```html
<!-- ✅ Correcto -->
<div class="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-md">

<!-- ❌ Incorrecto: clase innecesaria que solo agrupa utilidades -->
<div class="movie-card">
```

---

## Variantes responsivas

Usa los prefijos `sm:`, `md:`, `lg:`, `xl:`, `2xl:` para diseño adaptable. Mobile-first: define el estilo base sin prefijo y sobreescribe en breakpoints mayores.

```html
<div class="flex flex-col md:flex-row lg:gap-8">
  <img class="w-full md:w-1/3 lg:w-1/4">
  <section class="mt-4 md:mt-0">
```

---

## Variantes de estado

Gestiona interacciones sin JavaScript cuando el estado es puramente visual.

```html
<!-- Hover, focus, active -->
<button class="bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-400 active:scale-95">

<!-- Disabled -->
<button class="opacity-50 cursor-not-allowed" disabled>

<!-- Focus-visible (accesibilidad) -->
<a class="focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">
```

---

## Modo oscuro

Usa el prefijo `dark:` para todas las variantes de tema oscuro. No dupliques componentes para cada tema.

```html
<div class="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
  <p class="text-gray-600 dark:text-gray-400">Descripción</p>
```

---

## Valores arbitrarios

Úsalos cuando necesites un valor exacto que no existe en la escala de Tailwind, pero que no justifica una clase BEM completa.

```html
<!-- Dimensiones específicas -->
<div class="w-[320px] h-[480px]">

<!-- Colores de marca exactos -->
<div class="bg-[#1a1a2e] text-[#e94560]">

<!-- Z-index fuera de escala -->
<div class="z-[999]">

<!-- Gradientes complejos -->
<div class="bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)]">
```

> **Límite**: si usas el mismo valor arbitrario en más de 2 lugares, considera añadirlo como token en `tailwind.config`.

---

## Consulta del config del proyecto

Antes de usar un valor arbitrario para colores, espaciados o tipografía, revisa `tailwind.config` para aprovechar los tokens ya definidos:

```bash
# Leer la configuración del proyecto
Read tailwind.config.js  # o tailwind.config.ts
```

Si el token que necesitas no existe y se va a usar de forma recurrente, propón añadirlo al config en lugar de repetir valores arbitrarios.

---

## Cuándo pasar a otra skill

| Situación | Skill a invocar |
|---|---|
| Pseudoelementos (`::before`, `::after`) | `bem-naming` |
| Animaciones CSS complejas | `bem-naming` |
| Clases que cambian según estado del componente | `ngclass-patterns` |
| Selectores de hijo o hermano complejos | `bem-naming` |
