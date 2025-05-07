import { Component, OnInit, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonDatetime, IonAccordionGroup, IonModal, IonAccordion, IonItem, IonLabel, IonIcon, IonSearchbar, IonChip, IonButton } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { searchOutline } from 'ionicons/icons';

@Component({
  selector: 'app-filtrarlicitaciones',
  templateUrl: './filtrarlicitaciones.component.html',
  styleUrls: ['./filtrarlicitaciones.component.scss'],
  standalone: true,
  imports: [IonButton, IonChip,  CommonModule, FormsModule, IonSearchbar, IonIcon, IonLabel, IonItem, IonAccordion, IonModal, IonAccordionGroup, IonDatetime, ]
})
export class FiltrarlicitacionesComponent  implements OnInit {

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
 
   constructor() {
     addIcons({ searchOutline });
   }
 
   ngOnInit() {
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
       hastaFecha: this.hastaFecha
     };
     console.log('Emitiendo filtros desde FiltrarlicitacionesComponent:', filtros);
     this.filtrosChanged.emit(filtros);
   }
 }

