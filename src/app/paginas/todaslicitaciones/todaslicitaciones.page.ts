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
    // >>> Lee el parámetro 'cliente' de la URL al inicializar la página
    this.activatedRoute.queryParams.subscribe((params) => {
      const clienteDesdeStats = params['cliente'];
      if (clienteDesdeStats) {
        this.busquedaCliente = clienteDesdeStats;
        // Opcional: Limpia el query param después de usarlo si no quieres que se quede en la URL
        // this.router.navigate([], { queryParams: { cliente: null }, queryParamsHandling: 'merge' });
      } else {
        // Si no hay parámetro de cliente, inicializa busquedaCliente como vacío
        this.busquedaCliente = '';
      }

      // Inicializa otros filtros aquí si es necesario
      // (aunque tu código original los inicializaba en onFiltrosChanged o al declarar)
      this.numExpediente = ''; // Asegúrate de inicializar otros filtros si no vienen de otro lado
      this.desdeFecha = '';
      this.hastaFecha = '';
    });
  }

  // >>> Método para recibir el estado seleccionado desde ContarlicitacionesComponent <<<
  onStateFilterSelected(state: string) {
    console.log(`Estado de filtro recibido en TodaslicitacionesPage: ${state}`);
    // Actualiza la variable que se pasa como Input a ListarlicitacionesComponent
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
