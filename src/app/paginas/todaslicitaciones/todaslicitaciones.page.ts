import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonMenuButton, IonHeader, IonToolbar, IonButtons, IonTitle, IonContent } from "@ionic/angular/standalone";
import { ListarlicitacionesComponent } from 'src/app/componentes/listarlicitaciones/listarlicitaciones.component';
import { ContarlicitacionesComponent } from 'src/app/componentes/contarlicitaciones/contarlicitaciones.component';
import { FiltrarlicitacionesComponent } from 'src/app/componentes/filtrarlicitaciones/filtrarlicitaciones.component';

@Component({
  selector: 'app-todaslicitaciones',
  templateUrl: './todaslicitaciones.page.html',
  styleUrls: ['./todaslicitaciones.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ContarlicitacionesComponent, IonMenuButton, IonContent, IonTitle, IonButtons, IonToolbar, IonHeader, ListarlicitacionesComponent, FiltrarlicitacionesComponent]
})
export class TodaslicitacionesPage implements OnInit {

  // Nuevos filtros para buscar por otros campos
  busquedaCliente: string = '';
  numExpediente: string = '';
  desdeFecha: string = '';
  hastaFecha: string = '';

  constructor(private activatedRoute: ActivatedRoute) {}

  ngOnInit() {
     // >>> Lee el parámetro 'cliente' de la URL al inicializar la página
    this.activatedRoute.queryParams.subscribe(params => {
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

       // >>> OJO: Si FiltrarlicitacionesComponent necesita el valor inicial
       //     de busquedaCliente para mostrarlo en su input, debes pasárselo
       //     como un @Input y asegurarte de que ese componente se actualice.
       //     También podrías necesitar llamar a onFiltrosChanged aquí
       //     después de leer el query param para propagar el filtro inicial
       //     a ListarlicitacionesComponent si la comunicación solo es vía onFiltrosChanged.
       //     El enfoque con Inputs a ListarlicitacionesComponent es mejor.

       // Si ya pasas busquedaCliente como Input a ListarlicitacionesComponent,
       // y ListarlicitacionesComponent usa ngOnChanges para reaccionar,
       // entonces no necesitas llamar a onFiltrosChanged aquí.
       // El input binding [(busquedaCliente)] o [busquedaCliente] + ngOnChanges
       // debería ser suficiente.
    });

     // Código de inicialización original (probablemente ya no necesario aquí si lo haces arriba)
    // this.desdeFecha = '';
    // this.hastaFecha = '';
  }

  onFiltrosChanged(filtros: any) {
    this.busquedaCliente = filtros.busquedaCliente;
    this.numExpediente = filtros.numExpediente;
    this.desdeFecha = filtros.desdeFecha;
    this.hastaFecha = filtros.hastaFecha;
    console.log('Filtros recibidos:', filtros);
  }
  
}
