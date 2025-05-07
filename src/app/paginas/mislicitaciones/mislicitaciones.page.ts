import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonMenuButton, IonChip } from '@ionic/angular/standalone';
import { ListarlicitacionesComponent } from 'src/app/componentes/listarlicitaciones/listarlicitaciones.component';
import { FiltrarlicitacionesComponent } from 'src/app/componentes/filtrarlicitaciones/filtrarlicitaciones.component';
import { LicitacionesService } from 'src/app/servicios/licitaciones.service';

@Component({
  selector: 'app-mislicitaciones',
  templateUrl: './mislicitaciones.page.html',
  styleUrls: ['./mislicitaciones.page.scss'],
  standalone: true,
  imports: [IonChip, IonButtons, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonMenuButton, ListarlicitacionesComponent, FiltrarlicitacionesComponent ]
})
export class MislicitacionesPage implements OnInit {

  // Nuevos filtros para buscar por otros campos
  busquedaCliente: string = '';
  numExpediente: string = '';
  desdeFecha: string = '';
  hastaFecha: string = '';
  usuario: string = '';
  misLicitaciones: number = 0;

  constructor(private servicioLicitaciones: LicitacionesService) {}

  async ngOnInit() {
    this.usuario = localStorage.getItem('usuario') || '';
    this.misLicitaciones = await this.servicioLicitaciones.contarMisLicitaciones(this.usuario);
  }

  onFiltrosChanged(filtros: any) {
    this.busquedaCliente = filtros.busquedaCliente;
    this.numExpediente = filtros.numExpediente;
    this.desdeFecha = filtros.desdeFecha;
    this.hastaFecha = filtros.hastaFecha;
    console.log('Filtros recibidos:', filtros);
  }
}
