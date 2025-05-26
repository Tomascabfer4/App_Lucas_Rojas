import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  Output,
  EventEmitter,
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
  IonList,
  IonContent,
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
    IonList,
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
export class FiltrarlicitacionesComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input() initialClienteFilter: string | null = null; // Puede ser string o null
  @Input() initialExpedienteFilter: string | null = null;
  // Variables de búsqueda y fecha.
  busquedaCliente: string = '';
  numExpediente: string = '';
  desdeFechaControl: string = new Date().toISOString();
  desdeFecha: string = '';
  hastaFechaControl: string = new Date().toISOString();
  hastaFecha: string = '';

  // Propiedades para guardar las sugerencias
  suggestions: any[] = [];
  suggestionsNumExpediente: any[] = [];
  // Estos objetos se usarán para posicionar de forma fija la lista de sugerencias
  sugerenciasEstilo: any = {};
  suggestionsNumExpedienteEstilo: any = {};

  // Output para emitir los filtros.
  @Output() filtrosChanged = new EventEmitter<any>();

  // Referencias a los modales mediante variables de plantilla.
  @ViewChild('desdeModal') desdeModal!: IonModal;
  @ViewChild('hastaModal') hastaModal!: IonModal;

  // Referencia al searchbar del cliente (para obtener el elemento DOM)
  @ViewChild('searchbarEl', { read: ElementRef }) searchbarElement!: ElementRef;
  // Agregamos también una referencia para el searchbar de expediente.
  // Asegúrate de asignar en el HTML la propiedad #searchbarExpediente a dicho ion-searchbar.
  @ViewChild('searchbarExpediente', { read: ElementRef })
  searchbarExpedienteElement!: ElementRef;

  // Propiedades para detectar el scroll en el contenedor padre
  private parentScrollElement: any = null; // Elemento IonContent (la referencia del web component)
  private parentScrollNativeElement: any = null; // Elemento nativo de scroll obtenido a través de getScrollElement()

  // Guardamos las funciones bound para poder remover correctamente los listeners
  private boundHandleParentScroll = this.handleParentScroll.bind(this);
  private boundHandleClickOutside = this.handleClickOutside.bind(this);

  constructor(private algoliaService: AlgoliaService) {
    addIcons({ searchOutline });
  }

  ngOnInit() {
    if (this.initialClienteFilter) {
      this.busquedaCliente = this.initialClienteFilter;
      console.log(
        'FiltrarlicitacionesComponent: Inicializando con cliente:',
        this.busquedaCliente
      );
    }
    if (this.initialExpedienteFilter) {
      this.numExpediente = this.initialExpedienteFilter;
      console.log(
        'FiltrarlicitacionesComponent: Inicializando con expediente:',
        this.numExpediente
      );
    }
    this.emitFilters();
  }

  async ngAfterViewInit() {
    // Buscamos el contenedor scrollable padre (usualmente un <ion-content>)
    this.parentScrollElement =
      this.searchbarElement.nativeElement.closest('ion-content');
    if (this.parentScrollElement && this.parentScrollElement.getScrollElement) {
      // getScrollElement() devuelve una promesa con el elemento nativo de scroll
      this.parentScrollNativeElement =
        await this.parentScrollElement.getScrollElement();
      if (this.parentScrollNativeElement) {
        this.parentScrollNativeElement.addEventListener(
          'scroll',
          this.boundHandleParentScroll
        );
      }
    }
    // Listener para clicks fuera de cada searchbar
    document.addEventListener('click', this.boundHandleClickOutside);
  }

  ngOnDestroy() {
    if (this.parentScrollNativeElement) {
      this.parentScrollNativeElement.removeEventListener(
        'scroll',
        this.boundHandleParentScroll
      );
    }
    document.removeEventListener('click', this.boundHandleClickOutside);
  }

  private handleParentScroll(event: Event): void {
    // Al hacer scroll en el contenedor padre, se cierran ambas listas de sugerencias.
    this.suggestions = [];
    this.suggestionsNumExpediente = [];
  }

  private handleClickOutside(event: MouseEvent): void {
    // Se verifica si se hizo clic fuera de cada uno de los searchbars.
    const clickedInsideCliente = this.searchbarElement.nativeElement.contains(
      event.target
    );
    const clickedInsideExpediente =
      this.searchbarExpedienteElement.nativeElement.contains(event.target);
    if (!clickedInsideCliente) {
      this.suggestions = [];
    }
    if (!clickedInsideExpediente) {
      this.suggestionsNumExpediente = [];
    }
  }

  // Métodos para el modal "Desde Fecha"
  openDesdeModal(): void {
    this.desdeModal.present();
  }

  onDateScrollDesdeChange(event: any) {
    this.desdeFechaControl = event.detail.value;
  }

  onApplyDesdeFecha(): void {
    this.desdeFecha = this.desdeFechaControl;
    this.closeDesdeModal();
    this.emitFilters();
  }

  onResetDesdeFecha(): void {
    this.desdeFechaControl = '';
    this.desdeFecha = '';
    this.closeDesdeModal();
    this.emitFilters();
  }

  onCancelDesde(): void {
    this.closeDesdeModal();
  }

  closeDesdeModal(): void {
    this.desdeModal.dismiss();
  }

  // Métodos para el modal "Hasta Fecha"
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

  // Método para buscar sugerencias de cliente (ya existente)
  async onClienteSearch(event: any) {
    this.busquedaCliente = event.detail.value;
    this.emitFilters();

    // Espera un ciclo para que Angular renderice el DOM y poder posicionar correctamente la lista
    setTimeout(() => {
      const el = this.searchbarElement?.nativeElement;
      if (el) {
        const rect = el.getBoundingClientRect();
        this.sugerenciasEstilo = {
          position: 'fixed',
          top: `${rect.bottom + window.scrollY}px`,
          left: `${rect.left + window.scrollX}px`,
          width: `${rect.width}px`,
          zIndex: 9999,
        };
      }
    }, 0);

    if (this.busquedaCliente && this.busquedaCliente.trim().length > 1) {
      try {
        const sug = await this.algoliaService.getSuggestions(
          this.busquedaCliente
        );
        this.suggestions = sug;
      } catch (error) {
        console.error('Error al obtener sugerencias:', error);
        this.suggestions = [];
      }
    } else {
      this.suggestions = [];
    }
  }

  // Nuevo método para buscar sugerencias de número de expediente
  async onNumExpedienteSearch(event: any) {
    this.numExpediente = event.detail.value;
    this.emitFilters();

    // Se espera un ciclo para que Angular renderice el DOM y se pueda posicionar la lista de sugerencias
    setTimeout(() => {
      const el = this.searchbarExpedienteElement?.nativeElement;
      if (el) {
        const rect = el.getBoundingClientRect();
        this.suggestionsNumExpedienteEstilo = {
          position: 'fixed',
          top: `${rect.bottom + window.scrollY}px`,
          left: `${rect.left + window.scrollX}px`,
          width: `${rect.width}px`,
          zIndex: 9999,
        };
      }
    }, 0);

    if (this.numExpediente && this.numExpediente.trim().length > 1) {
      try {
        // Se asume que en el servicio dispone de un método para obtener sugerencias limitadas al atributo numexpediente.
        const sug = await this.algoliaService.getSuggestions(
          this.numExpediente
        );
        this.suggestionsNumExpediente = sug;
      } catch (error) {
        console.error('Error al obtener sugerencias de numexpediente:', error);
        this.suggestionsNumExpediente = [];
      }
    } else {
      this.suggestionsNumExpediente = [];
    }
  }

  // Método para actualizar el valor del número de expediente sin mostrar sugerencias (si lo necesitas)
  onNumExpedienteChange(event: any) {
    this.numExpediente = event.detail.value;
    this.emitFilters();
  }

  // Método para seleccionar una sugerencia de cliente
  selectSuggestion(suggestion: any) {
    this.busquedaCliente = suggestion.cliente;
    this.suggestions = [];
    this.emitFilters();
  }

  // Método para seleccionar una sugerencia de número de expediente
  selectNumExpedienteSuggestion(suggestion: any) {
    // Se asume que el objeto suggestion tiene la propiedad "numexpediente"
    this.numExpediente = suggestion.numexpediente;
    this.suggestionsNumExpediente = [];
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

  // Método para limpiar todos los filtros
  limpiarFiltros() {
    this.busquedaCliente = '';
    this.numExpediente = '';
    this.desdeFechaControl = '';
    this.desdeFecha = '';
    this.hastaFechaControl = '';
    this.hastaFecha = '';
    this.suggestions = [];
    this.suggestionsNumExpediente = [];
    this.emitFilters();
  }
}
