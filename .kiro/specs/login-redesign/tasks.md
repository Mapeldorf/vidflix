# Implementation Plan: Login Redesign

## Overview

Este plan de implementación transforma la página de login actual a un diseño sobrio y minimalista mediante modificaciones en las clases de Tailwind CSS del template HTML. El enfoque es exclusivamente visual, manteniendo intacta toda la lógica funcional existente (validación, manejo de errores, estados de carga, navegación).

La implementación se realizará en el componente `LoginComponent` ubicado en `apps/client/src/app/auth/login/`, modificando únicamente el archivo HTML y actualizando los tests para reflejar los cambios visuales.

## Tasks

- [x] 1. Implementar esquema de colores neutros
  - [x] 1.1 Reemplazar colores naranjas por tonos neutros en botones y enlaces
    - Cambiar clases `bg-orange-*`, `text-orange-*`, `hover:bg-orange-*` por equivalentes en grises
    - Actualizar clases de enlaces de `text-orange-400 hover:text-orange-300` a tonos neutros
    - _Requirements: 1.1, 1.2_
  
  - [x] 1.2 Actualizar colores de mensajes de error a tonos rojos apagados
    - Cambiar `bg-orange-900/40 border-orange-700 text-orange-300` a `bg-red-900/30 border-red-800 text-red-300`
    - Actualizar border de inputs con error de `border-orange-500` a `border-red-500`
    - Actualizar texto de error de `text-orange-400` a `text-red-400`
    - _Requirements: 1.4_
  
  - [x] 1.3 Verificar contraste de colores para accesibilidad
    - Validar que los nuevos colores cumplan WCAG AA (4.5:1 mínimo)
    - _Requirements: 1.5_

- [x] 2. Reducir efectos visuales decorativos
  - [x] 2.1 Simplificar sombras y bordes del form card
    - Reducir `shadow-2xl` a `shadow-sm` o eliminar
    - Reducir `rounded-2xl` a `rounded-lg` o `rounded-xl`
    - Ajustar `border-gray-800` para contraste sutil
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [x] 2.2 Simplificar efectos de focus en inputs
    - Cambiar `focus:ring-2 focus:ring-orange-500` a `focus:ring-1 focus:border-gray-500` o solo border
    - Agregar `transition-colors duration-200` para transiciones sutiles
    - _Requirements: 2.5_

- [ ] 3. Optimizar espaciado y tipografía
  - [ ] 3.1 Aumentar espaciado vertical entre elementos del formulario
    - Incrementar valores de `mb-*` entre secciones del form
    - Mantener padding generoso en el card (`p-8`)
    - _Requirements: 3.1, 3.2_
  
  - [ ] 3.2 Ajustar pesos de fuente para mayor sutileza
    - Reducir `font-semibold` a `font-medium` en botón de submit
    - Mantener jerarquía tipográfica clara
    - _Requirements: 3.4_

- [ ] 4. Simplificar elementos interactivos
  - [ ] 4.1 Actualizar estilos del botón de submit
    - Cambiar de `bg-orange-600 hover:bg-orange-700` a `bg-gray-700 hover:bg-gray-600`
    - Agregar `transition-colors duration-200`
    - Mantener estados disabled con opacity
    - _Requirements: 4.1, 4.3, 4.4_
  
  - [ ] 4.2 Ajustar estilos de inputs en estado default
    - Mantener `bg-gray-800` o considerar `bg-gray-850`
    - Usar borders sutiles en estado default
    - _Requirements: 4.2_

- [ ] 5. Optimizar logo y branding
  - [ ] 5.1 Reducir tamaño del logo y ajustar colores
    - Cambiar de `h-16` a `h-12` o `h-14`
    - Actualizar color del subtítulo de `gray-400` a `gray-500`
    - Mantener centrado y espaciado adecuado
    - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [ ] 6. Implementar animación de entrada sutil
  - [ ] 6.1 Crear keyframes de animación en styles.css
    - Definir animación fade-in con opcional translate usando `@layer utilities`
    - Configurar duración de 300-500ms con easing natural (ease-out)
    - Incluir media query para `prefers-reduced-motion`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
  
  - [ ] 6.2 Aplicar clase de animación al contenedor del formulario
    - Agregar clase de animación al form card en el template HTML
    - Verificar que la animación no bloquee interacción del usuario
    - _Requirements: 8.1, 8.6_

- [ ] 7. Checkpoint - Verificar implementación visual
  - Ensure all visual changes are applied correctly, ask the user if questions arise.

- [ ]* 8. Actualizar tests unitarios para cambios visuales
  - [ ]* 8.1 Agregar tests para esquema de colores neutros
    - Verificar que clases orange-* no estén presentes
    - Verificar que clases gray-* estén presentes en botones y enlaces
    - Verificar que errores usen clases red-* en lugar de orange-*
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ]* 8.2 Agregar tests para efectos visuales reducidos
    - Verificar que shadow-2xl esté removido o reducido
    - Verificar que rounded-2xl esté reducido
    - Verificar que focus rings sean sutiles
    - _Requirements: 2.1, 2.3, 2.5_
  
  - [ ]* 8.3 Agregar tests para espaciado y tipografía
    - Verificar espaciado vertical aumentado
    - Verificar font-weight reducido en botón
    - _Requirements: 3.1, 3.4_
  
  - [ ]* 8.4 Agregar tests para logo y branding
    - Verificar tamaño de logo reducido (h-12 o h-14)
    - Verificar color de subtítulo neutral
    - _Requirements: 6.1, 6.2_
  
  - [ ]* 8.5 Agregar tests para animación de entrada
    - Verificar que clase de animación esté presente
    - Verificar que prefers-reduced-motion sea respetado
    - _Requirements: 8.1, 8.5_

- [ ]* 9. Escribir property tests para preservación funcional
  - [ ]* 9.1 Property test para preservación de validación de formulario
    - **Property 1: Form Validation Preservation**
    - **Validates: Requirements 5.1**
    - Generar estados aleatorios del formulario (vacío, lleno, parcial)
    - Verificar que validación se comporte idénticamente a implementación original
    - Verificar que touched + empty = error mostrado
    - Verificar que valid = sin error
  
  - [ ]* 9.2 Property test para preservación de display de errores
    - **Property 2: Error Display Preservation**
    - **Validates: Requirements 5.2**
    - Generar mensajes de error aleatorios del servidor
    - Verificar que error se muestre en contenedor de error
    - Verificar que loading state se limpie
    - Verificar que texto de error coincida con respuesta del servidor
  
  - [ ]* 9.3 Property test para preservación de loading state
    - **Property 3: Loading State Preservation**
    - **Validates: Requirements 5.3**
    - Generar estados aleatorios del formulario durante loading
    - Verificar que botón esté disabled cuando loading=true
    - Verificar que spinner sea visible cuando loading=true
    - Verificar que formulario no pueda enviarse cuando loading=true

- [ ] 10. Checkpoint final - Verificar funcionalidad completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los property tests validan propiedades de correctitud universales
- Los unit tests validan ejemplos específicos y casos visuales
- La implementación se enfoca exclusivamente en cambios visuales mediante Tailwind CSS
- No se requieren cambios en el código TypeScript del componente
