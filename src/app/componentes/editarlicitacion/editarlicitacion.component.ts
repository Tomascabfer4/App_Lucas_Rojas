import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonSelectOption, IonSelect, IonChip, IonPopover, IonDatetime, ModalController, IonTextarea, IonContent, IonItem, IonLabel, IonHeader, IonToolbar, IonTitle, IonButton, IonButtons, IonInput } from "@ionic/angular/standalone";
import { LicitacionesService } from 'src/app/servicios/licitaciones.service';
import { ConstantesService } from 'src/app/servicios/constantes.service';

@Component({
  selector: 'app-editarlicitacion',
  templateUrl: './editarlicitacion.component.html',
  styleUrls: ['./editarlicitacion.component.scss'],
  standalone: true,
  imports: [ IonSelectOption, IonSelect, IonChip, IonPopover, IonDatetime, IonTextarea, FormsModule, CommonModule, ReactiveFormsModule, IonItem, IonLabel, IonContent, IonHeader, IonToolbar, IonTitle, IonButton, IonButtons, IonInput ]
})
export class EditarlicitacionComponent implements OnInit, OnChanges {

  // Se usará el servicio para cargar estos valores dinámicamente
  tipos: string[] = [];
  tiposContrato: string[] = [];
  personas: string[] = [];

  @Input() firebaseId!: string;
  @Input() licitacionCargada!: any;

  // Inicializa el formulario con un grupo vacío para evitar que sea undefined en el template
  formulario!: FormGroup;

  fechaPresentacionSelec: string = '';
  fechaFormalizacionSelec: string = '';
  fechaFinContratoSelec: string = '';
  Prorroga1Selec: string = '';
  Prorroga2Selec: string = '';
  Prorroga3Selec: string = '';

  constructor(
    private modalCtrl: ModalController,
    private fb: FormBuilder,
    private servicio: LicitacionesService,
    private constantesService: ConstantesService  // Inyecta el servicio de constantes
  ) { }

  ngOnInit() {
    // Cargar constantes desde Firestore mediante el servicio
    this.constantesService.getConstantes()
      .then(config => {
        this.tipos = config.TIPOS;
        this.tiposContrato = config.TIPOS_CONTRATO;
        this.personas = config.PERSONAS_EMPRESA;
      })
      .catch(error => console.error('Error cargando constantes dinámicas:', error));
    
    // Si ya tenemos licitacionCargada, inicializamos el formulario
    if (this.licitacionCargada) {
      this.inicializarFormulario();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['licitacionCargada'] && changes['licitacionCargada'].currentValue) {
      this.inicializarFormulario();
    }
  }

  private inicializarFormulario() {
    // Se formatean todas las fechas del formulario de edición
    const fechaPresCargada = this.licitacionCargada.fechapresentacion
      ? new Date(this.licitacionCargada.fechapresentacion).toISOString().split('T')[0]
      : '';
    const fechaFormCargada = this.licitacionCargada.fechaformalizacion
      ? new Date(this.licitacionCargada.fechaformalizacion).toISOString().split('T')[0]
      : '';
    const fechaFinContratoCargada = this.licitacionCargada.fechafincontrato
      ? new Date(this.licitacionCargada.fechafincontrato).toISOString().split('T')[0]
      : '';  
    const Prorroga1Cargada = this.licitacionCargada.prorroga1
      ? new Date(this.licitacionCargada.prorroga1).toISOString().split('T')[0]
      : '';  
    const Prorroga2Cargada = this.licitacionCargada.prorroga2
      ? new Date(this.licitacionCargada.prorroga2).toISOString().split('T')[0]
      : '';    
    const Prorroga3Cargada = this.licitacionCargada.prorroga3
      ? new Date(this.licitacionCargada.prorroga3).toISOString().split('T')[0]
      : '';    

    // Configura el FormGroup con todos los controles necesarios
    this.formulario = this.fb.group({
      cliente: [this.licitacionCargada.cliente, Validators.required],
      numexpediente: [this.licitacionCargada.numexpediente, Validators.required],
      titulo: [this.licitacionCargada.titulo, Validators.required],
      fechapresentacion: [fechaPresCargada, Validators.required],
      tipo: [this.licitacionCargada.tipo, Validators.required],
      tipocontrato: [this.licitacionCargada.tipocontrato, Validators.required],
      importe: [this.licitacionCargada.importe, Validators.required],
      fechaformalizacion: [fechaFormCargada],
      duracioncontratoanyo: [this.licitacionCargada.duracioncontratoanyo],
      fechafincontrato: [fechaFinContratoCargada],
      prorrogas: [this.licitacionCargada.prorrogas],
      prorroga1: [Prorroga1Cargada],
      prorroga2: [Prorroga2Cargada],
      prorroga3: [Prorroga3Cargada],
      fianza: [this.licitacionCargada.fianza],
      garantia: [this.licitacionCargada.garantia],
      observaciones: [this.licitacionCargada.observaciones],
      captadapor: [this.licitacionCargada.captadapor],
      estudiopor: [this.licitacionCargada.estudiopor],
      presupuestopor: [this.licitacionCargada.presupuestopor],
      presentadapor: [this.licitacionCargada.presentadapor],
      responsable: [this.licitacionCargada.responsable],
      rutacarpeta: [this.licitacionCargada.rutacarpeta],
      eventos: [this.licitacionCargada.eventos]
    });

    // Asigna las fechas cargadas a las variables correspondientes
    this.fechaPresentacionSelec = fechaPresCargada;
    this.fechaFormalizacionSelec = fechaFormCargada;
    this.fechaFinContratoSelec = fechaFinContratoCargada;
    this.Prorroga1Selec = Prorroga1Cargada;
    this.Prorroga2Selec = Prorroga2Cargada;
    this.Prorroga3Selec = Prorroga3Cargada;
  }

  actualizarFecha(
    value: string | string[] | null | undefined,
    controlName: string,
    asignarA: string
  ) {
    const newValue = typeof value === 'string' ? value : '';
    const dateOnly = newValue ? new Date(newValue).toISOString().split('T')[0] : '';
    this.formulario.get(controlName)?.setValue(dateOnly);
    
    if (asignarA === 'fechaPresentacionSelec') {
      this.fechaPresentacionSelec = dateOnly;
    } else if (asignarA === 'fechaFormalizacionSelec') {
      this.fechaFormalizacionSelec = dateOnly;
    } else if (asignarA === 'fechaFinContratoSelec') {
      this.fechaFinContratoSelec = dateOnly;
    } else if (asignarA === 'Prorroga1Selec') {
      this.Prorroga1Selec = dateOnly;
    } else if (asignarA === 'Prorroga2Selec') {
      this.Prorroga2Selec = dateOnly;
    } else if (asignarA === 'Prorroga3Selec') {
      this.Prorroga3Selec = dateOnly;
    }
  }
  
  async guardar() {
    if (this.formulario.valid) {
      try {
        await this.servicio.actualizarLicitacion(
          this.firebaseId,
          this.formulario.value
        );
        this.modalCtrl.dismiss({ 
          actualizado: true,
          nuevosDatos: this.formulario.value 
        });
      } catch (error) {
        console.error('Error guardando cambios:', error);
      }
    }
  }

  cancelar() {
    this.modalCtrl.dismiss();
  }
}
