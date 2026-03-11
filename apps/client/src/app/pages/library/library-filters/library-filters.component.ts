import { CommonModule } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';

export interface FiltrosBiblioteca {
  tituloBusqueda: string;
  generosSeleccionados: Set<string>;
  filtroEstado: 'todas' | 'en-progreso' | 'ya-vistas' | 'no-vistas';
  orden: 'recientes' | 'valoracion' | 'titulo';
}

@Component({
  selector: 'app-library-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './library-filters.component.html',
})
export class LibraryFiltersComponent {
  todosGeneros = input<string[]>([]);

  filtrosChange = output<FiltrosBiblioteca>();

  tituloBusqueda = signal('');

  generosSeleccionados = signal<Set<string>>(new Set());

  filtroEstado = signal<FiltrosBiblioteca['filtroEstado']>('todas');

  orden = signal<FiltrosBiblioteca['orden']>('recientes');

  readonly estadoOpciones: {
    value: FiltrosBiblioteca['filtroEstado'];
    label: string;
  }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'en-progreso', label: 'En progreso' },
    { value: 'ya-vistas', label: 'Ya vistas' },
    { value: 'no-vistas', label: 'No vistas' },
  ];

  readonly ordenOpciones: {
    value: FiltrosBiblioteca['orden'];
    label: string;
  }[] = [
    { value: 'recientes', label: 'Recientes' },
    { value: 'valoracion', label: 'Valoración' },
    { value: 'titulo', label: 'Alfabético' },
  ];

  hayFiltros = computed(
    () =>
      this.tituloBusqueda().trim().length > 0 ||
      this.generosSeleccionados().size > 0 ||
      this.filtroEstado() !== 'todas'
  );

  private emit(): void {
    this.filtrosChange.emit({
      tituloBusqueda: this.tituloBusqueda(),
      generosSeleccionados: this.generosSeleccionados(),
      filtroEstado: this.filtroEstado(),
      orden: this.orden(),
    });
  }

  setTitulo(value: string): void {
    this.tituloBusqueda.set(value);
    this.emit();
  }

  setEstado(value: FiltrosBiblioteca['filtroEstado']): void {
    this.filtroEstado.set(value);
    this.emit();
  }

  setOrden(value: FiltrosBiblioteca['orden']): void {
    this.orden.set(value);
    this.emit();
  }

  toggleGenero(genero: string): void {
    this.generosSeleccionados.update((set) => {
      const next = new Set(set);
      if (next.has(genero)) next.delete(genero);
      else next.add(genero);
      return next;
    });
    this.emit();
  }

  limpiarFiltros(): void {
    this.tituloBusqueda.set('');
    this.generosSeleccionados.set(new Set());
    this.filtroEstado.set('todas');
    this.emit();
  }
}
