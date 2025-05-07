import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
  IonContent, IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/angular/standalone';
import { Licitacion } from 'src/app/interfaces/licitacion';

interface FianzaEstadistica {
  cliente: string;
  fianzaFormateada: string;
  fechaFormalizacion: Date | null;
  fechaFinContrato: Date;
  tiempoRestante: { years: number; months: number; days: number };
}

@Component({
  selector: 'app-fianzas-estadisticas',
  templateUrl: './fianzas-estadisticas.component.html',
  styleUrls: ['./fianzas-estadisticas.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonButtons, IonButton,
    IonContent, IonGrid, IonRow, IonCol,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent
  ]
})
export class FianzasEstadisticasComponent implements OnInit, OnChanges {
  @Input() licitaciones: Licitacion[] = [];
  @Output() cerrar = new EventEmitter<void>();

  fianzasEstadisticas: FianzaEstadistica[] = [];
  totalFianzasFormateada = '€ 0,00';
  fianzasPorAnio: Array<{
    year: number;
    total: string;
    items: FianzaEstadistica[];
  }> = [];

  ngOnInit() {
    this.refreshEstadisticas();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['licitaciones']) {
      this.refreshEstadisticas();
    }
  }

  private refreshEstadisticas() {
    const ahora = new Date();
  
    // 1) Filtrar sin exigir fechaformalizacion
    const activas = this.licitaciones.filter(l => {
      const fNum = this.parseFianza(l.fianza);
      const fechaFin = l.fechafincontrato ? new Date(l.fechafincontrato) : null;
      return !!l.cliente
          && fNum > 0
          && fechaFin! > ahora;
    });
  
    // 2) Total general
    const total = activas.reduce((sum, l) => sum + this.parseFianza(l.fianza), 0);
    this.totalFianzasFormateada = total.toLocaleString('es-ES', {
      style: 'currency', currency: 'EUR',
      minimumFractionDigits: 2, maximumFractionDigits: 2
    });
  
    // 3) Agrupar activas por año de fechaFinContrato
    const gruposRaw = activas.reduce((acc, l) => {
      const y = new Date(l.fechafincontrato!).getFullYear();
      (acc[y] ??= []).push(l);
      return acc;
    }, {} as Record<number, Licitacion[]>);
  
    // 4) Construir fianzasPorAnio con items y total formateado
    this.fianzasPorAnio = Object.entries(gruposRaw)
      .map(([year, arr]) => {
        // mapeo de cada Licitacion a tu FianzaEstadistica
        const items: FianzaEstadistica[] = arr.map(l => {
          const fNum = this.parseFianza(l.fianza);
          const fechaFormal = l.fechaformalizacion
            ? new Date(l.fechaformalizacion)
            : null;
          const fechaFin = new Date(l.fechafincontrato!);
          const restante = this.calculateRemaining(ahora, fechaFin);
          return {
            cliente: l.cliente!,
            fianzaFormateada: fNum.toLocaleString('es-ES', {
              style: 'currency', currency: 'EUR',
              minimumFractionDigits: 2, maximumFractionDigits: 2
            }),
            fechaFormalizacion: fechaFormal,
            fechaFinContrato: fechaFin,
            tiempoRestante: restante
          };
        });
  
        // suma numérica absoluta de fianzas de ese año
        const sumaAnio = arr.reduce((s, l) => s + this.parseFianza(l.fianza), 0);
        const totalFormateado = sumaAnio.toLocaleString('es-ES', {
          style: 'currency', currency: 'EUR',
          minimumFractionDigits: 2, maximumFractionDigits: 2
        });
  
        return {
          year: Number(year),
          total: totalFormateado,
          items
        };
      })
      .sort((a, b) => b.year - a.year);
  }

  private parseFianza(raw: string | number | undefined): number {
    if (typeof raw === 'string') {
      return parseFloat(raw.replace(',', '.')) || 0;
    }
    return typeof raw === 'number' ? raw : 0;
  }

  private calculateRemaining(start: Date, end: Date) {
    let years  = end.getFullYear()  - start.getFullYear();
    let months = end.getMonth()     - start.getMonth();
    let days   = end.getDate()      - start.getDate();

    if (days < 0) {
      months--;
      const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years--;
      months += 12;
    }
    return { years, months, days };
  }

  onCerrar() {
    this.cerrar.emit();
  }
}
