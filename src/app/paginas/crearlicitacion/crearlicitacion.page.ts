import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { 
  IonDatetime, IonTextarea, IonInput, IonSelect, IonContent, IonHeader, IonTitle, IonToolbar, 
  IonButtons, IonMenuButton, IonCard, IonLabel, IonItem, IonButton, IonSelectOption, IonRow, IonCol, 
  IonGrid, IonModal, IonDatetimeButton 
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular/standalone';
import { LicitacionesService } from 'src/app/servicios/licitaciones.service';
// Se elimina la importación de constantes estáticas y se importa el servicio
import { ConstantesService } from 'src/app/servicios/constantes.service';

@Component({
  selector: 'app-crearlicitacion',
  templateUrl: './crearlicitacion.page.html',
  styleUrls: ['./crearlicitacion.page.scss'],
  standalone: true,
  imports: [
    IonDatetimeButton, IonModal, IonGrid, IonCol, IonRow, IonDatetime, IonTextarea, IonInput, 
    IonSelect, IonButton, IonItem, IonLabel, IonCard, IonButtons, IonContent, IonHeader, IonTitle, 
    IonToolbar, CommonModule, FormsModule, ReactiveFormsModule, IonMenuButton, IonSelectOption
  ]
})
export class CrearlicitacionPage implements OnInit {

  // Estas propiedades se llenarán desde Firestore mediante ConstantesService
  tipos: string[] = [];
  tiposContrato: string[] = [];
  personasEmpresa: string[] = [];
  estadosIniciales: string[] = [];
  estadosFinales: string[] = [];

  licitacionForm!: FormGroup;

  constructor(
    private fb: FormBuilder, 
    private licitacionesService: LicitacionesService, 
    private toastController: ToastController,
    private constantesService: ConstantesService  // Inyectamos el servicio de constantes
  ) { }

  async ngOnInit() {
    // Primero, cargamos las constantes dinámicamente desde Firestore.
    try {
      const config = await this.constantesService.getConstantes();
      // Asignamos los valores obtenidos a las propiedades del componente
      this.tipos = config.TIPOS;
      this.tiposContrato = config.TIPOS_CONTRATO;
      this.personasEmpresa = config.PERSONAS_EMPRESA;
      this.estadosIniciales = config.ESTADOS_INICIALES;
      this.estadosFinales = config.ESTADOS_FINALES;
    } catch (error) {
      console.error('Error al cargar las constantes desde Firestore:', error);
    }

    // Inicializamos el formulario
    this.licitacionForm = this.fb.group({
      // Campo "item" calculado automáticamente (se deja deshabilitado para evitar su edición)
      item: [{ value: 0, disabled: true }, Validators.required],
      cliente: ['', Validators.required],
      titulo: ['', Validators.required],
      numexpediente: ['', Validators.required],
      fechapresentacion: [null, Validators.required],
      tipo: ['', Validators.required],
      tipocontrato: ['', Validators.required],
      importe: ['', Validators.required],
      captadapor: ['', Validators.required],
      estudiopor: ['', Validators.required],
      presupuestopor: ['', Validators.required],
      presentadapor: ['', Validators.required],
      estadoini: ['', Validators.required],
      estadofinal: ['', Validators.required],
      rutacarpeta: [''],
      observaciones: ['']
    });

    // Cargar el siguiente valor de "item" consultando Firebase
    this.licitacionesService.getMaxItem().then(maxItem => {
      const nuevoItem = maxItem + 1;
      this.licitacionForm.get('item')!.setValue(nuevoItem);
    });
  }
  
  async onSubmit(): Promise<void> {
    if (this.licitacionForm.valid) {
      // Usamos getRawValue para incluir campos deshabilitados como "item"
      const formData = this.licitacionForm.getRawValue();
      // Para formatear la fecha
      if (formData.fechapresentacion) {
        formData.fechapresentacion = formData.fechapresentacion.split('T')[0];
      }
      try {
        const id: string = await this.licitacionesService.crearLicitacion(formData);
        console.log('Licitación creada con ID:', id);
        const toast = await this.toastController.create({
          message: 'Licitación creada correctamente',
          duration: 2000,
          color: 'success'
        });
        await toast.present();
        this.licitacionForm.reset();
        const maxItem = await this.licitacionesService.getMaxItem();
        this.licitacionForm.get('item')!.setValue(maxItem + 1);
        
      } catch (error) {
        console.error('Error al crear la licitación:', error);
      }
    } else {
      console.log('El formulario es inválido');
    }
  }
}
