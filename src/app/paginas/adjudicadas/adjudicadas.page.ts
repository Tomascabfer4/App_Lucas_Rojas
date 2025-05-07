import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonChip } from '@ionic/angular/standalone';
import { ListarlicitacionesComponent } from 'src/app/componentes/listarlicitaciones/listarlicitaciones.component';
import { LicitacionesService } from 'src/app/servicios/licitaciones.service';
import { FiltrarlicitacionesComponent } from 'src/app/componentes/filtrarlicitaciones/filtrarlicitaciones.component';

@Component({
  selector: 'app-adjudicadas',
  templateUrl: './adjudicadas.page.html',
  styleUrls: ['./adjudicadas.page.scss'],
  standalone: true,
  imports: [ FiltrarlicitacionesComponent, IonChip, ListarlicitacionesComponent, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonMenuButton ]
})
export class AdjudicadasPage implements OnInit {

  adjudicadas: number = 0;
  busquedaCliente: string = '';
  numExpediente: string = '';
  desdeFecha: string = '';
  hastaFecha: string = '';
  
  constructor(private servicioLicitaciones: LicitacionesService) {}

  async ngOnInit() {
    const estados = await this.servicioLicitaciones.contarEstados();
    this.adjudicadas = estados.adjudicadas;
    this.desdeFecha = '';
    this.hastaFecha = '';
  }

  onFiltrosChanged(filtros: any) {
    this.busquedaCliente = filtros.busquedaCliente;
    this.numExpediente = filtros.numExpediente;
    this.desdeFecha = filtros.desdeFecha;
    this.hastaFecha = filtros.hastaFecha;
    console.log('Filtros recibidos:', filtros);
  }

}
