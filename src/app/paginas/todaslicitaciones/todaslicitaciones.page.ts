import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  IonMenuButton,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonTitle,
  IonContent,
} from '@ionic/angular/standalone';

import { ListarlicitacionesComponent } from 'src/app/componentes/listarlicitaciones/listarlicitaciones.component';
import { ContarlicitacionesComponent } from 'src/app/componentes/contarlicitaciones/contarlicitaciones.component';
import { FiltrarlicitacionesComponent } from 'src/app/componentes/filtrarlicitaciones/filtrarlicitaciones.component';

@Component({
  selector: 'app-todaslicitaciones',
  templateUrl: './todaslicitaciones.page.html',
  styleUrls: ['./todaslicitaciones.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ContarlicitacionesComponent,
    IonMenuButton,
    IonContent,
    IonTitle,
    IonButtons,
    IonToolbar,
    IonHeader,
    ListarlicitacionesComponent,
    FiltrarlicitacionesComponent,
  ],
})
export class TodaslicitacionesPage implements OnInit {
  // Nuevos filtros para buscar por otros campos
  busquedaCliente: string = '';
  numExpediente: string = '';
  desdeFecha: string = '';
  hastaFecha: string = '';
  currentFilterState: string = 'todas';

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
  this.activatedRoute.queryParams.subscribe(params => {
    this.busquedaCliente = params['cliente']       || '';
    this.numExpediente   = params['numexpediente'] || '';
    this.desdeFecha = '';
    this.hastaFecha = '';
  });
}


  onStateFilterSelected(state: string) {
    console.log(`Estado de filtro recibido en TodaslicitacionesPage: ${state}`); // Actualiza la variable que se pasa como Input a ListarlicitacionesComponent
    this.currentFilterState = state;
  }

  onFiltrosChanged(filtros: any) {
    this.busquedaCliente = filtros.busquedaCliente;
    this.numExpediente = filtros.numExpediente;
    this.desdeFecha = filtros.desdeFecha;
    this.hastaFecha = filtros.hastaFecha;
    console.log('Filtros recibidos:', filtros);
  }
}
