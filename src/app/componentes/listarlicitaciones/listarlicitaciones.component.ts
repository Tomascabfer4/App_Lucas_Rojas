import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentSnapshot } from 'firebase/firestore';
import {
  IonSelect,
  IonSelectOption,
  IonCard,
  IonRow,
  IonCol,
  IonItemGroup,
  IonItemDivider,
  IonLabel,
  IonItem,
  IonSpinner,
  IonInfiniteScroll,
  IonIcon,
  IonButton,
  IonInfiniteScrollContent,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { createSharp, folderOpenSharp, trashBinSharp } from 'ionicons/icons';
import { AlertController, ToastController } from '@ionic/angular/standalone';
import { ModalController } from '@ionic/angular/standalone';
import { LicitacionesService } from 'src/app/servicios/licitaciones.service';
import { AlgoliaService } from 'src/app/servicios/algolia.service';
import { EditarlicitacionComponent } from 'src/app/componentes/editarlicitacion/editarlicitacion.component';
import { Opcionespaginacion } from 'src/app/interfaces/opcionespaginacion';
import { ConstantesService } from 'src/app/servicios/constantes.service';

@Component({
  selector: 'app-listarlicitaciones',
  templateUrl: './listarlicitaciones.component.html',
  styleUrls: ['./listarlicitaciones.component.scss'],
  standalone: true,
  imports: [
    IonSelect, IonSelectOption, IonInfiniteScrollContent, IonButton,
    IonIcon, IonInfiniteScroll, IonSpinner, IonItem, IonLabel,
    IonItemDivider, IonItemGroup, IonCol, IonRow, IonCard,
    CommonModule, FormsModule
  ],
})
export class ListarlicitacionesComponent implements OnInit {
  estadosIniciales: string[] = [];
  estadosFinales: string[] = [];

  @Input() busquedaCliente = '';
  @Input() numExpediente = '';
  @Input() desdeFecha = '';
  @Input() hastaFecha = '';
  @Input() presentadapor = '';
  @Input() filtroEstado = 'todas';

  licitaciones: any[] = [];
  lastVisibleDoc: DocumentSnapshot | null = null;
  noMoreData = false;
  isLoading = false;

  allAlgoliaHits: any[] = []; 
  algoliaPage = 0;
  readonly pageSize = 10;

  constructor(
    private serviciolicitacion: LicitacionesService,
    private algoliaService: AlgoliaService,
    private alertController: AlertController,
    private toastController: ToastController,
    private modalController: ModalController,
    private constantesService: ConstantesService
  ) {
    addIcons({ folderOpenSharp, createSharp, trashBinSharp });
  }

  async ngOnInit() {
    try {
      const cfg = await this.constantesService.getConstantes();
      this.estadosIniciales = cfg.ESTADOS_INICIALES;
      this.estadosFinales = cfg.ESTADOS_FINALES;
    } catch (e) {
      console.error('Error cargando constantes', e);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['busquedaCliente'] || changes['numExpediente'] ||
        changes['desdeFecha'] || changes['hastaFecha'] ||
        changes['presentadapor'] || changes['filtroEstado']) {
      this.resetPagination();
      this.cargarLicitaciones();
    }
  }

  private resetPagination() {
    this.licitaciones = [];
    this.allAlgoliaHits = [];
    this.lastVisibleDoc = null;
    this.noMoreData = false;
    this.algoliaPage = 0;
  }

  /**
   * Ajusta service.searchCombinado para recibir page y pageSize:
   * async searchCombinado(cliente, expediente, desde, hasta, estado, presentadapor, page = 0, hitsPerPage = 10)
   */
  async cargarLicitaciones(event?: any) {
    if (this.isLoading || this.noMoreData) return;
    this.isLoading = true;
    try {
      const hasTextFilter = this.busquedaCliente.trim() !== '' ||
                            this.numExpediente.trim() !== '';

      if (hasTextFilter) {
        // Paginación vía Algolia
        const hits = await this.algoliaService.searchCombinado(
          this.busquedaCliente.trim(),
          this.numExpediente.trim(),
          this.desdeFecha.trim(),
          this.hastaFecha.trim(),
          this.filtroEstado,
          this.presentadapor,
          this.algoliaPage,
          this.pageSize
        );
        this.licitaciones.push(...hits);
        if (hits.length < this.pageSize) this.noMoreData = true;
        this.algoliaPage++;
      } else {
        // Paginación vía Firestore para filtros sin texto
        const opts: Opcionespaginacion = {
          limitNumber: this.pageSize,
          lastVisible: this.lastVisibleDoc,
          busquedaCliente: this.busquedaCliente.trim(),
          numExpediente: this.numExpediente.trim(),
          desdeFecha: this.desdeFecha.trim(),
          hastaFecha: this.hastaFecha.trim(),
          adjudicadas: this.filtroEstado === 'ADJUDICADA',
          presentadapor: this.presentadapor.trim(),
          filterState: this.filtroEstado,
        };
        const res = await this.serviciolicitacion.getDatosPaginados(opts);
        this.licitaciones.push(...res.data);
        this.lastVisibleDoc = res.lastVisible;
        if (res.data.length < this.pageSize) this.noMoreData = true;
      }
    } catch (err) {
      console.error('❌ Error cargando licitaciones:', err);
    } finally {
      this.isLoading = false;
      if (event) event.target.complete();
    }
  }
 
  async eliminarLicitacion(firebaseId: string) {
    console.log('Valor recibido para eliminar:', firebaseId);
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
              // Actualiza la lista, usando firebaseId o objectID según corresponda
              this.licitaciones = this.licitaciones.filter((lic) => {
                const id = lic.firebaseId || lic.objectID || '';
                return id !== firebaseId;
              });
              const toast = await this.toastController.create({
                message: 'Licitación eliminada correctamente',
                duration: 2000,
                color: 'success',
              });
              await toast.present();
            } catch (error) {
              console.error('Error en el componente al eliminar:', error);
              const toast = await this.toastController.create({
                message: 'Error al eliminar la licitación',
                duration: 2000,
                color: 'danger',
              });
              await toast.present();
            }
          },
        },
      ],
    });
    await alert.present();
  }
  // Abre modal para edición

  async abrirModalEdicion(licitacion: any) {
    // Se determina el identificador utilizando solo firebaseId y objectID
    const idParaEditar = licitacion.firebaseId || licitacion.objectID;

    const modal = await this.modalController.create({
      component: EditarlicitacionComponent,
      cssClass: 'custom-modal',
      componentProps: {
        firebaseId: idParaEditar,
        licitacionCargada: licitacion,
      },
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data?.actualizado) {
      const index = this.licitaciones.findIndex(
        (l) => (l.firebaseId || l.objectID) === idParaEditar
      );
      if (index > -1) {
        this.licitaciones[index] = {
          ...this.licitaciones[index],
          ...data.nuevosDatos,
        };
      }
      const toast = await this.toastController.create({
        message: 'Cambios guardados correctamente',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
    }
  }

  cambiarEstado(
    licitacion: any,
    campo: 'estadoini' | 'estadofinal',
    nuevoValor: string
  ) {
    // Detectar el identificador correcto: usar firebaseId si existe; si no, usar objectID
    const licitacionId = licitacion.firebaseId ?? licitacion.objectID;
    if (!licitacionId) {
      console.error(
        '❌ No se puede actualizar sin un ID válido en la licitación.'
      );
      // Si se desea, se puede mostrar un toast informando del error
      this.toastController
        .create({
          message: 'Error al actualizar el estado: ID inválido',
          duration: 2000,
          color: 'danger',
        })
        .then((toast) => toast.present());
      return;
    }

    this.serviciolicitacion
      .actualizarLicitacion({ firebaseid: licitacionId, [campo]: nuevoValor })
      .then(async () => {
        console.log(`Actualización de ${campo} exitosa`);
        const toast = await this.toastController.create({
          message: 'Estado actualizado correctamente',
          duration: 2000,
          color: 'success',
        });
        toast.present();
      })
      .catch(async (err) => {
        console.error(`Error actualizando ${campo}:`, err);
        const toast = await this.toastController.create({
          message: 'Error al actualizar el estado',
          duration: 2000,
          color: 'danger',
        });
        toast.present();
      });
  } /**

   * Intenta abrir la ruta de la carpeta en el explorador de archivos del sistema operativo
   * si la aplicación se ejecuta en un entorno Electron con la API 'electronAPI' expuesta.
   * En un navegador web, mostrará una alerta indicando que no es posible.
   * @param folderPath La ruta de la carpeta a abrir (ej: \\NASLUCASROJAS\licitaciones\...).
   */
  async openFolder(folderPath: string | null | undefined) {
    // Verificar si la ruta existe y no está vacía

    if (!folderPath || folderPath.trim() === '') {
      const toast = await this.toastController.create({
        message:
          'La ruta de la carpeta no está disponible para esta licitación.',
        duration: 3000,
        color: 'warning',
      });
      await toast.present();
      console.warn('Intento de abrir carpeta con ruta vacía o nula.');
      return; // Salir si no hay ruta
    } // >>> Lógica para usar la API expuesta por el preload script <<< // Verificar si la API 'electronAPI' existe en el objeto global 'window'. // Esta API solo existirá si el preload script se ha ejecutado correctamente (en Electron).

    if (window.electronAPI && window.electronAPI.openFolder) {
      console.log(`Llamando a electronAPI.openFolder con ruta: ${folderPath}`); // Llamar a la función expuesta por el preload script
      window.electronAPI.openFolder(folderPath); // La respuesta (éxito/error) se manejará en el listener configurado en ngOnInit // No necesitamos lógica de éxito/error aquí directamente después de la llamada.
    } else {
      // --- Lógica para Navegador Web (o Electron sin preload/API) ---
      console.warn(
        `La API electronAPI no está disponible. Ejecutando lógica para navegador web. Ruta: ${folderPath}`
      ); // En un navegador web, no se puede abrir directamente. Informa al usuario.

      const alert = await this.alertController.create({
        header: 'No se puede abrir la carpeta',
        message: `Por razones de seguridad, no es posible abrir rutas de archivo locales directamente desde el navegador. Puedes copiar la ruta manualmente:<br><br><code>${folderPath}</code>`,
        buttons: [
          {
            text: 'Copiar Ruta',
            handler: async () => {
              try {
                await navigator.clipboard.writeText(folderPath);
                const toast = await this.toastController.create({
                  message: 'Ruta copiada al portapapeles.',
                  duration: 2000,
                  color: 'success',
                });

                await toast.present();
              } catch (err) {
                console.error('Error al copiar la ruta:', err);
                const toast = await this.toastController.create({
                  message: 'Error al copiar la ruta.',
                  duration: 2000,
                  color: 'danger',
                });
                await toast.present();
              }
            },
          },
          { text: 'Cerrar', role: 'cancel' },
        ],
      });
      await alert.present();
    }
  }
}