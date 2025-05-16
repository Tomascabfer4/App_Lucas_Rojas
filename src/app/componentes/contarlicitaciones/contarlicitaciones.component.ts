import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LicitacionesService } from 'src/app/servicios/licitaciones.service';
import { IonChip, IonBadge, IonIcon } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-contarlicitaciones',
  templateUrl: './contarlicitaciones.component.html',
  styleUrls: ['./contarlicitaciones.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonBadge, IonChip ]
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

  @Output() stateSelected = new EventEmitter<string>();
  @Input() activeFilterState: string = 'todas';

  constructor(private servicioLicitaciones: LicitacionesService) {
    addIcons({ checkmarkCircleOutline });
  }

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

  selectState(state: string) {
    console.log(`Estado seleccionado en ContarlicitacionesComponent: ${state}`);
    this.stateSelected.emit(state);
  }

}
