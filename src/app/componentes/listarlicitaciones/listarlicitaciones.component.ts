import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentSnapshot } from 'firebase/firestore';
import { IonSelect, IonSelectOption, IonCard, IonRow, IonCol, IonItemGroup, IonItemDivider, IonLabel, IonItem, IonSpinner, IonInfiniteScroll, IonIcon, IonButton, IonInfiniteScrollContent } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { createSharp, folderOpenSharp, trashBinSharp } from 'ionicons/icons';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { LicitacionesService } from 'src/app/servicios/licitaciones.service';
import { EditarlicitacionComponent } from 'src/app/componentes/editarlicitacion/editarlicitacion.component';
import { Opcionespaginacion } from 'src/app/interfaces/opcionespaginacion';
import { ConstantesService } from 'src/app/servicios/constantes.service';

@Component({
  selector: 'app-listarlicitaciones',
  templateUrl: './listarlicitaciones.component.html',
  styleUrls: ['./listarlicitaciones.component.scss'],
  standalone: true,
  imports: [ 
    IonSelect, 
    IonSelectOption, 
    IonInfiniteScrollContent,  
    IonButton, 
    IonIcon, 
    IonInfiniteScroll, 
    IonSpinner,  
    IonItem, 
    IonLabel, 
    IonItemDivider, 
    IonItemGroup, 
    IonCol, 
    IonRow, 
    IonCard, 
    CommonModule, 
    FormsModule
  ]
})
export class ListarlicitacionesComponent implements OnInit {
  
  // En este caso, las constantes dinámicas se cargarán desde el servicio
  estadosIniciales: string[] = [];
  estadosFinales: string[] = [];
  
  // Variables de entrada para filtros
  @Input() busquedaCliente: string = '';
  @Input() numExpediente: string = '';
  @Input() desdeFecha: string = '';
  @Input() hastaFecha: string = '';
  @Input() presentadapor: string = ''; 

  // Variable para filtro de estado (por ejemplo, para filtrar adjudicadas)
  @Input() filtroEstado: string = 'todas';

  licitaciones: any[] = [];
  lastVisibleDoc: DocumentSnapshot | null = null;
  noMoreData: boolean = false;
  isLoading: boolean = false;

  constructor(
    private serviciolicitacion: LicitacionesService, 
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController,
    private constantesService: ConstantesService  // Inyección del servicio de constantes
  ) {
    addIcons({ folderOpenSharp, createSharp, trashBinSharp });
  } 

  async ngOnInit() {
    // Cargar las constantes dinámicamente desde Firestore
    try {
      const config = await this.constantesService.getConstantes();
      // Aquí asignamos los arrays que usaremos en los selects, p. ej. para filtrar estados
      this.estadosIniciales = config.ESTADOS_INICIALES;
      this.estadosFinales = config.ESTADOS_FINALES;
    } catch (error) {
      console.error('Error al cargar las constantes:', error);
    }
    await this.cargarLicitaciones();
  }

  ngOnChanges(changes: SimpleChanges) {
    // Si alguno de los filtros cambia, reinicia la lista y la paginación
    if (changes['busquedaCliente'] || changes['numExpediente'] || changes['desdeFecha'] || changes['hastaFecha'] || changes['presentadapor']) {
      this.licitaciones = [];
      this.lastVisibleDoc = null;
      this.noMoreData = false;
      this.cargarLicitaciones();
    }
  }

  // Utiliza la función del servicio para cargar licitaciones de 10 en 10.
  async cargarLicitaciones(event?: any) {
    if (this.isLoading || this.noMoreData) return;
    
    this.isLoading = true;
  
    try {
      // Construir el objeto de opciones
      const options: Opcionespaginacion = {
        limitNumber: 10,
        lastVisible: this.lastVisibleDoc,
        busquedaCliente: this.busquedaCliente,
        numExpediente: this.numExpediente,
        desdeFecha: this.desdeFecha,
        hastaFecha: this.hastaFecha,
        adjudicadas: this.filtroEstado === 'ADJUDICADA',  // Si se filtra adjudicadas
        presentadapor: this.presentadapor // Se filtra por usuario
      };
  
      // Llamar al método unificado
      const result = await this.serviciolicitacion.getDatosPaginados(options);
      
      if (result.data.length > 0) {
        this.licitaciones = [...this.licitaciones, ...result.data];
        this.lastVisibleDoc = result.lastVisible;
      }
  
      if (result.data.length < 10) {
        this.noMoreData = true;
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      this.isLoading = false;
      if (event) event.target.complete();
    }
  }
  
  // Método para eliminar
  async eliminarLicitacion(firebaseId: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: '¿Estás seguro de eliminar esta licitación?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            try {
              await this.serviciolicitacion.eliminarLicitacion(firebaseId);
              // Actualizar lista local
              this.licitaciones = this.licitaciones.filter(lic => lic.firebaseId !== firebaseId);
  
              // Mostrar confirmación
              const toast = await this.toastController.create({
                message: 'Licitación eliminada correctamente',
                duration: 2000,
                color: 'success'
              });
              await toast.present();
  
            } catch (error) {
              const toast = await this.toastController.create({
                message: 'Error al eliminar la licitación',
                duration: 2000,
                color: 'danger'
              });
              await toast.present();
            }
          }
        }
      ]
    });
  
    await alert.present();
  }

  // Abre modal para edición
  async abrirModalEdicion(licitacion: any) {
    const modal = await this.modalController.create({
      component: EditarlicitacionComponent,
      cssClass: 'custom-modal',
      componentProps: {
        firebaseId: licitacion.firebaseId,
        licitacionCargada: licitacion
      }
    });
  
    await modal.present();
  
    const { data } = await modal.onDidDismiss();
    if (data?.actualizado) {
      const index = this.licitaciones.findIndex(l => l.firebaseId === licitacion.firebaseId);
      if (index > -1) {
        this.licitaciones[index] = { ...this.licitaciones[index], ...data.nuevosDatos };
      }
  
      const toast = await this.toastController.create({
        message: 'Cambios guardados correctamente',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    }
  }

  // Cambiar estado (por select)
  cambiarEstado(licitacion: any, campo: 'estadoini' | 'estadofinal', nuevoValor: string) {
    this.serviciolicitacion.actualizarLicitacion(licitacion.firebaseId, { [campo]: nuevoValor })
      .then(async () => {
        console.log(`Actualización de ${campo} exitosa`);
        const toast = await this.toastController.create({
          message: 'Estado actualizado correctamente',
          duration: 2000,
          color: 'success'
        });
        toast.present();
      })
      .catch(async err => {
        console.error(`Error actualizando ${campo}:`, err);
        const toast = await this.toastController.create({
          message: 'Error al actualizar el estado',
          duration: 2000,
          color: 'danger'
        });
        toast.present();
      });
  }
}
