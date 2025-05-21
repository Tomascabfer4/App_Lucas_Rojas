import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  Input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonDatetime,
  IonAccordionGroup,
  IonModal,
  IonAccordion,
  IonItem,
  IonLabel,
  IonIcon,
  IonSearchbar,
  IonChip,
  IonButton,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { searchOutline } from 'ionicons/icons';
import { AlgoliaService } from 'src/app/servicios/algolia.service';

@Component({
  selector: 'app-filtrarlicitaciones',
  templateUrl: './filtrarlicitaciones.component.html',
  styleUrls: ['./filtrarlicitaciones.component.scss'],
  standalone: true,
  imports: [
    IonButton,
    IonChip,
    CommonModule,
    FormsModule,
    IonSearchbar,
    IonIcon,
    IonLabel,
    IonItem,
    IonAccordion,
    IonModal,
    IonAccordionGroup,
    IonDatetime,
  ],
})
export class FiltrarlicitacionesComponent implements OnInit {
  @Input() initialClienteFilter: string | null = null; // Puede ser string o null

  // Variables de búsqueda y fecha.
  busquedaCliente: string = '';
  numExpediente: string = '';
  desdeFechaControl: string = new Date().toISOString();
  desdeFecha: string = '';
  hastaFechaControl: string = new Date().toISOString();
  hastaFecha: string = '';

  // Output para emitir los filtros.
  @Output() filtrosChanged = new EventEmitter<any>();

  // Referencias a los modales mediante variables de plantilla.
  @ViewChild('desdeModal') desdeModal!: IonModal;
  @ViewChild('hastaModal') hastaModal!: IonModal;

  constructor(private algoliaService: AlgoliaService) {
    addIcons({ searchOutline });
  }

  ngOnInit() {
    // >>> Aquí usamos el valor del Input si existe, ANTES de emitir los filtros iniciales
    if (this.initialClienteFilter) {
      // Si recibimos un filtro inicial, lo asignamos a la variable local
      // que está enlazada al input con ngModel.
      this.busquedaCliente = this.initialClienteFilter;
      console.log(
        'FiltrarlicitacionesComponent: Inicializando con cliente:',
        this.busquedaCliente
      );
    } else {
      // Si no hay filtro inicial, nos aseguramos de que la variable local esté vacía
      this.busquedaCliente = ''; // Ya está por defecto, pero por claridad
    }

    this.emitFilters();
  }

  // Métodos para el modal "Desde Fecha"

  openDesdeModal(): void {
    this.desdeModal.present();
  }

  onDateScrollDesdeChange(event: any) {
    // Solo almacenamos el valor a medida que el usuario hace scroll.
    this.desdeFechaControl = event.detail.value;
  }

  onApplyDesdeFecha(): void {
    // Se asigna el valor final a la variable desdeFecha.
    this.desdeFecha = this.desdeFechaControl;
    this.closeDesdeModal();
    this.emitFilters();
  }

  onResetDesdeFecha(): void {
    // Se vacía el filtro de fecha "Desde" y se emite el evento
    this.desdeFechaControl = '';
    this.desdeFecha = '';
    this.closeDesdeModal();
    this.emitFilters();
  }

  onCancelDesde(): void {
    // Cierra el modal sin aplicar cambios.
    this.closeDesdeModal();
  }

  closeDesdeModal(): void {
    this.desdeModal.dismiss();
  }

  // Métodos para el modal "Hasta Fecha" (ya implementados previamente)
  openHastaModal(): void {
    this.hastaModal.present();
  }

  onDateScrollHastaChange(event: any) {
    this.hastaFechaControl = event.detail.value;
  }

  onApplyHastaFecha(): void {
    this.hastaFecha = this.hastaFechaControl;
    this.closeHastaModal();
    this.emitFilters();
  }

  onResetHastaFecha(): void {
    this.hastaFechaControl = '';
    this.hastaFecha = '';
    this.closeHastaModal();
    this.emitFilters();
  }

  onCancelHasta(): void {
    this.closeHastaModal();
  }

  closeHastaModal(): void {
    this.hastaModal.dismiss();
  }

  // Métodos para los searchbars y emisión de filtros

  onClienteSearch(event: any) {
    this.busquedaCliente = event.detail.value;
    this.emitFilters();
  }

  onNumExpedienteChange(event: any) {
    this.numExpediente = event.detail.value;
    this.emitFilters();
  }

  emitFilters() {
    const filtros = {
      busquedaCliente: this.busquedaCliente,
      numExpediente: this.numExpediente,
      desdeFecha: this.desdeFecha,
      hastaFecha: this.hastaFecha,
    };
    console.log(
      'Emitiendo filtros desde FiltrarlicitacionesComponent:',
      filtros
    );
    this.filtrosChanged.emit(filtros);
  }

  // >>> Método para limpiar todos los filtros y emitir
   limpiarFiltros() {
      this.busquedaCliente = '';
      this.numExpediente = '';
      this.desdeFechaControl = ''; // Limpia el control temporal del picker
      this.desdeFecha = '';      // Limpia el filtro aplicado
      this.hastaFechaControl = ''; // Limpia el control temporal del picker
      this.hastaFecha = '';      // Limpia el filtro aplicado
      this.emitFilters(); // Emite los filtros reseteados
   }
   
}
