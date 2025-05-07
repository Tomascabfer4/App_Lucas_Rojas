import { Component, OnInit } from '@angular/core';
import { LicitacionesService } from 'src/app/servicios/licitaciones.service';
import { IonChip, IonBadge } from "@ionic/angular/standalone";

@Component({
  selector: 'app-contarlicitaciones',
  templateUrl: './contarlicitaciones.component.html',
  styleUrls: ['./contarlicitaciones.component.scss'],
  standalone: true,
  imports: [IonBadge, IonChip ]
})
export class ContarlicitacionesComponent  implements OnInit {

  // Contadores de estado de licitaciones
  total: number = 0;
  enEstudio: number = 0;
  presentadas: number = 0;
  adjudicadas: number = 0;
  noAdjudicadas: number = 0;
  enResolucion: number = 0;
  desestimadas: number = 0;

  constructor(private servicioLicitaciones: LicitacionesService) {}

  async ngOnInit() {
    await this.inicializarContadores();
  }

  async inicializarContadores() {
    try {
      const estados = await this.servicioLicitaciones.contarEstados();
      this.total = estados.total;
      this.enEstudio = estados.enEstudio;
      this.presentadas = estados.presentadas;
      this.adjudicadas = estados.adjudicadas;
      this.noAdjudicadas = estados.noAdjudicadas;
      this.enResolucion = estados.enResolucion;
      this.desestimadas = estados.desestimadas;
    } catch (error) {
      console.error('Error al obtener contadores:', error);
    }
  }

}
