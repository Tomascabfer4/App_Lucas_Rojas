import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Licitacion } from 'src/app/interfaces/licitacion';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
  IonChip,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { removeCircleOutline, addCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-licitadores-estadisticas',
  templateUrl: './licitadores-estadisticas.component.html',
  styleUrls: ['./licitadores-estadisticas.component.scss'],
  standalone: true,
  imports: [
    IonChip,
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonIcon,
  ],
})
export class LicitadoresEstadisticasComponent implements OnInit {
  @Input() licitaciones: Licitacion[] = [];
  @Input() presentadores: string[] = [];
  @Output() cerrar = new EventEmitter<void>();

  /** Los que mostramos en la tabla */
  selectedPresentadores: string[] = [];
  /** Los que hemos quitado y mostramos como botones encima */
  removedPresentadores: string[] = [];

  /** Estadísticas a renderizar */
  licitadoresEstadisticas: any[] = [];

  /** Estadísticas totales */
  totalPresentadas = 0;
  totalEnEstudio = 0;
  totalAdjudicadas = 0;
  totalNoAdjudicadas = 0;
  totalDesestimadas = 0;
  totalImporte = 0;

  // --- nuevo: años ---
  /** Todos los años que salen en licitaciones */
  allYears: number[] = [];
  /** Los años que mostramos en la tabla */
  selectedYears: number[] = [];
  /** Los años que hemos quitado y mostramos como chips encima */
  removedYears: number[] = [];

  /** Estadísticas agregadas por año */
  yearEstadisticas: {
    year: number;
    presentadas: number;
    enEstudio: number;
    adjudicadas: number;
    noAdjudicadas: number;
    desestimadas: number;
    importe: number;
    importeFormateado: string;
  }[] = [];

  constructor() {
    addIcons({ addCircleOutline, removeCircleOutline });
  }

  ngOnInit() {
    this.initPresentadores();
    this.initYears();
    this.refreshEstadisticas();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Si cambian las licitaciones o los presentadores, reiniciamos estados y estadísticas
    if (changes["presentadores"]) {
      this.initPresentadores();
    }
    if (changes["licitaciones"]) {
      // si quieres resetear años al cambiar datos, podrías llamar initYears()
      // this.initYears();
    }
    this.refreshEstadisticas();
  }

  /** Extrae el input de presentadores en los arrays internos */
  private initPresentadores() {
    this.selectedPresentadores = [...this.presentadores];
    this.removedPresentadores = [];
  }

  /** (Opcional) extrae años según el nuevo array de licitaciones */
  private initYears() {
    const años = this.licitaciones.map(l => new Date(l.fechapresentacion).getFullYear());
    this.allYears = Array.from(new Set(años)).sort((a, b) => b - a);
    const añoActual = new Date().getFullYear();
    if (this.allYears.includes(añoActual)) {
      this.selectedYears = [añoActual];
      this.removedYears = this.allYears.filter(y => y !== añoActual);
    } else {
      this.selectedYears = [this.allYears[0]];
      this.removedYears = this.allYears.slice(1);
    }
  }

  /** Recalcula los stats para los selectedPresentadores */
  private refreshEstadisticas() {

    const activos = this.selectedPresentadores
    .filter(p => this.licitaciones.some(l => l.presentadapor === p));

    this.licitadoresEstadisticas = activos.map((p) => {
      const filas = this.licitaciones.filter((l) => l.presentadapor === p);
      const total = filas.reduce(
        (acc, l) =>
          acc +
          (typeof l.importe === 'number' ? l.importe : Number(l.importe) || 0),
        0
      );

      return {
        nombre: p,
        presentadas: filas.filter((l) => l.estadoini === 'PRESENTADA').length,
        enEstudio: filas.filter((l) => l.estadoini === 'EN ESTUDIO').length,
        adjudicadas: filas.filter((l) => l.estadofinal === 'ADJUDICADA').length,
        noAdjudicadas: filas.filter((l) => l.estadofinal === 'NO ADJUDICADA')
          .length,
        desestimadas: filas.filter((l) => l.estadofinal === 'DESESTIMADA')
          .length,
        importe: total,
        importeFormateado: total.toLocaleString('es-ES', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      };
    });

    // Ahora recalculamos los totales
    this.totalPresentadas = this.licitadoresEstadisticas.reduce(
      (sum, x) => sum + x.presentadas,
      0
    );
    this.totalEnEstudio = this.licitadoresEstadisticas.reduce(
      (sum, x) => sum + x.enEstudio,
      0
    );
    this.totalAdjudicadas = this.licitadoresEstadisticas.reduce(
      (sum, x) => sum + x.adjudicadas,
      0
    );
    this.totalNoAdjudicadas = this.licitadoresEstadisticas.reduce(
      (sum, x) => sum + x.noAdjudicadas,
      0
    );
    this.totalDesestimadas = this.licitadoresEstadisticas.reduce(
      (sum, x) => sum + x.desestimadas,
      0
    );
    this.totalImporte = this.licitadoresEstadisticas.reduce(
      (sum, x) => sum + x.importe,
      0
    );

    // === NUEVO: estadísticas por año ===
    this.yearEstadisticas = this.selectedYears.map((year) => {
      const filas = this.licitaciones.filter(
        (l) => new Date(l.fechapresentacion).getFullYear() === year
      );

      const presentadas = filas.filter(
        (l) => l.estadoini === 'PRESENTADA'
      ).length;
      const enEstudio = filas.filter(
        (l) => l.estadoini === 'EN ESTUDIO'
      ).length;
      const adjudicadas = filas.filter(
        (l) => l.estadofinal === 'ADJUDICADA'
      ).length;
      const noAdjudicadas = filas.filter(
        (l) => l.estadofinal === 'NO ADJUDICADA'
      ).length;
      const desestimadas = filas.filter(
        (l) => l.estadofinal === 'DESESTIMADA'
      ).length;

      const totalImporte = filas.reduce(
        (sum, l) =>
          sum +
          (typeof l.importe === 'number' ? l.importe : Number(l.importe) || 0),
        0
      );

      return {
        year,
        presentadas,
        enEstudio,
        adjudicadas,
        noAdjudicadas,
        desestimadas,
        importe: totalImporte,
        importeFormateado: totalImporte.toLocaleString('es-ES', {
          style: 'currency',
          currency: 'EUR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      };
    });
  }

  /** Quitar un año de la tabla */
  onQuitarAnio(year: number) {
    this.selectedYears = this.selectedYears.filter((y) => y !== year);
    this.removedYears.push(year);
    this.refreshEstadisticas();
  }

  /** Restaurar un año quitado */
  onRestaurarAnio(year: number) {
    this.removedYears = this.removedYears.filter((y) => y !== year);
    this.selectedYears.push(year);
    this.selectedYears.sort((a, b) => b - a);
    this.refreshEstadisticas();
  }

  /** Quitar un presentador de la tabla */
  onQuitarPresentador(p: string) {
    this.selectedPresentadores = this.selectedPresentadores.filter(
      (x) => x !== p
    );
    this.removedPresentadores.push(p);
    this.refreshEstadisticas();
  }

  /** Reponer un presentador quitado */
  onRestaurarPresentador(p: string) {
    this.removedPresentadores = this.removedPresentadores.filter(
      (x) => x !== p
    );
    this.selectedPresentadores.push(p);
    this.refreshEstadisticas();
  }

  /** Cierra la superposición */
  onCerrar() {
    this.cerrar.emit();
  }
}
