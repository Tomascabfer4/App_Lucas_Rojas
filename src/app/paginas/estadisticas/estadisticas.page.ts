// src/app/paginas/estadisticas/estadisticas.page.ts
import { Component, OnInit, ViewChild } from '@angular/core';
import {
  IonModal,
  IonAccordionGroup,
  IonAccordion,
  IonCheckbox,
  IonItem,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardContent,
  IonButton,
  IonList,
  IonMenuButton,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonDatetime,
  IonChip,
  IonButtons,
  IonCardTitle,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChartOptions, ChartDataset } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Licitacion } from 'src/app/interfaces/licitacion';
import { Router } from '@angular/router';
import { EstadisticasService } from 'src/app/servicios/estadisticas.service';
import { ConstantesService } from 'src/app/servicios/constantes.service';
import { LicitadoresEstadisticasComponent } from 'src/app/componentes/licitadores-estadisticas/licitadores-estadisticas.component';
import { FianzasEstadisticasComponent } from 'src/app/componentes/fianzas-estadisticas/fianzas-estadisticas.component';
import { TemaService } from 'src/app/servicios/tema.service';


@Component({
  selector: 'app-estadisticas',
  templateUrl: './estadisticas.page.html',
  styleUrls: ['./estadisticas.page.scss'],
  standalone: true,
  imports: [
    FianzasEstadisticasComponent,
    IonCardTitle,
    IonButtons,
    IonChip,
    IonModal,
    IonAccordionGroup,
    IonAccordion,
    IonCheckbox,
    IonItem,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardContent,
    IonButton,
    IonList,
    IonMenuButton,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonDatetime,
    CommonModule,
    FormsModule,
    BaseChartDirective,
    LicitadoresEstadisticasComponent,
  ],
})
export class EstadisticasPage implements OnInit {
  // =======================================================================
  // VARIABLES Y ARREGLOS
  // =======================================================================
  licitaciones: Licitacion[] = []; // Contiene todas las licitaciones
  licitacionesFiltradas: Licitacion[] = []; // Contiene las licitaciones filtradas según los criterios
  totalLicitaciones: number = 0; // Total de licitaciones

  // Filtros: presentadores y estados finales (posibles valores)
  presentadores: string[] = [];
  estadosFinales: string[] = [];
  // >>> ELIMINAMOS estas propiedades, ¡ahora están en el servicio!
  // presentadoresSeleccionados: string[] = [];
  // estadosFinalesSeleccionados: string[] = [];

  // Variables para las fechas de filtro (SOLO TEMPORALES PARA LOS MODALES)
  // >>> Mantenemos estas, ya que son estado temporal del UI del modal
  fechaDesdeTemp: string = '';
  fechaHastaTemp: string = '';

  @ViewChild('desdeModal') desdeModal!: IonModal;
  @ViewChild('hastaModal') hastaModal!: IonModal;

  /** Controla si la superposicion está visible */
  verLicitadoresSuperposicion = false;
  verContratosSuperposicion = false;
  /** Bandera para aplicar la clase `.closing` */
  public isClosing = false;
  private CLOSE_ANIM_DURATION = 300; // ms, debe coincidir con tu CSS

  // Para mostrar estadísticas resumidas (calculadas a partir de licitacionesFiltradas)
  statsResumen: {
    label: string;
    value: number;
    color: string;
    percent: number;
  }[] = [];
  statsGrafico: { label: string; value: number; color: string }[] = [];

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  // Propiedades para el gráfico (se actualizan basadas en licitacionesFiltradas)
  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'GRAFICO DE LICITACIONES', // Título principal
        font: {
          family: 'Montserrat, sans-serif',
          size: 20,
        },
      },
      subtitle: {
        display: true,
        text: 'TOTAL: 0', // Subtítulo (valor inicial; se actualizará dinámicamente)
        font: {
          family: 'Montserrat, sans-serif',
          size: 15,
          style: 'italic',
        },
      },
      tooltip: {
        enabled: true,
      },
    },
  };
  public pieChartLabels: string[] = [];
  public pieChartDatasets: ChartDataset<'pie'>[] = [];
  public pieChartLegend: boolean = true;
  public pieChartPlugins: any[] = [];

  // =======================================================================
  // CONSTRUCTOR Y SERVICIOS
  // =======================================================================
  constructor(
    private servicioTema: TemaService,
    // >>> Inyectamos el servicio que ahora maneja datos Y filtros
    public servicioEstadisticas: EstadisticasService, // Lo hacemos public para usarlo en el template
    private servicioConstantes: ConstantesService,
    private router: Router 
  ) {
    addIcons({});
    // >>> NO necesitas inicializar los filtros aquí, el servicio los inicializa
  }

  // Método temporal para encontrar licitaciones con estadofinal nulo
  detectarLicitacionesConEstadofinalNulo() {
    const licitacionesNulas = this.licitaciones.filter(
      (lic) => lic.estadofinal == null
    );

    console.log('--- Detección de Licitaciones con estadofinal null ---');
    console.log('Cantidad encontrada:', licitacionesNulas.length);
    console.log('Detalle de las licitaciones encontradas:', licitacionesNulas);
    console.log('----------------------------------------------------');
  }


  // =======================================================================
  // MÉTODOS DEL CICLO DE VIDA DE ANGULAR
  // =======================================================================
  // Este método se ejecuta cuando el componente se inicializa
  async ngOnInit() {
    try {
      // Obtenemos todas las licitaciones (esto sigue siendo responsabilidad del servicio)
      this.licitaciones =
        await this.servicioEstadisticas.getTodasLicitaciones();

      const config = await this.servicioConstantes.getConstantes();
      this.presentadores = config.PERSONAS_EMPRESA;
      this.estadosFinales = config.ESTADOS_FINALES;

      // *** Llama al método de detección aquí ***
      this.detectarLicitacionesConEstadofinalNulo();
      // ****************************************

      // >>> Aplicamos los filtros que están guardados en el servicio
      // Esto asegura que al regresar a la página, se aplique el último estado de filtro
      this.aplicarFiltros();


    } catch (error) {
      console.error('Error al obtener datos:', error);
      // Si hay un error, inicializa licitacionesFiltradas a vacío y aplica los filtros (vacíos)
      this.licitacionesFiltradas = [];
      this.aplicarFiltros(); // Llama a aplicar filtros incluso con error para resetear gráfico etc.
    }


    // Para cambiar el tema del gráfico según el tema de la app
    this.servicioTema.isDark$.subscribe(isDark => {
      const newColor = isDark ? '#fff' : '#000';

      // 1) MUTAMOS la instancia de Chart directamente y redibujamos
      if (this.chart?.chart) {
        this.chart.chart.options.plugins!.title!.color    = newColor;
        this.chart.chart.options.plugins!.subtitle!.color = newColor;
        this.chart.chart.update();
      }

      // 2) REASIGNAMOS pieChartOptions (inmutabilidad) para Angular
      // Aunque mutamos arriba, reasignar Options aquí asegura que Angular lo detecte
      this.pieChartOptions = {
        ...this.pieChartOptions,
        plugins: {
          ...this.pieChartOptions.plugins!,
          title:    { ...this.pieChartOptions.plugins!.title!,    color: newColor },
          subtitle: { ...this.pieChartOptions.plugins!.subtitle!, color: newColor },
        }
      };
    });
  }


  // =======================================================================
  // MÉTODOS DE FILTROS (Interactúan con el servicio EstadisticasService)
  // =======================================================================
  // Método que maneja la selección de "Presentado Por" en los filtros
  togglePresentadador(valor: string, event: any) {
    // >>> Obtenemos la lista actual desde el servicio
    const currentSelections = [...this.servicioEstadisticas.presentadoresSeleccionados];
    if (event.detail.checked) {
      if (!currentSelections.includes(valor)) {
         currentSelections.push(valor); // Si se selecciona y no está, se agrega
      }
    } else {
      const index = currentSelections.indexOf(valor);
      if (index > -1) {
        currentSelections.splice(index, 1); // Si no se selecciona y está, se elimina
      }
    }
    // >>> Actualizamos el estado en el servicio
    this.servicioEstadisticas.setPresentadoresSeleccionados(currentSelections);
    this.aplicarFiltros(); // Volvemos a aplicar los filtros después de hacer un cambio
  }


  // Método para manejar la selección de "Estado Final"
  toggleEstadoFinal(valor: string, event: any) {
     // >>> Obtenemos la lista actual desde el servicio
    const currentSelections = [...this.servicioEstadisticas.estadosFinalesSeleccionados];
    if (event.detail.checked) {
       if (!currentSelections.includes(valor)) {
          currentSelections.push(valor); // Si se selecciona y no está, se agrega
       }
    } else {
      const index = currentSelections.indexOf(valor);
      if (index > -1) {
         currentSelections.splice(index, 1); // Si no se selecciona y está, se elimina
      }
    }
    // >>> Actualizamos el estado en el servicio
    this.servicioEstadisticas.setEstadosFinalesSeleccionados(currentSelections);
    this.aplicarFiltros(); // Reaplica los filtros
  }


  // Método que aplica los filtros seleccionados (Lee del servicio)
  public aplicarFiltros() {
    // >>> Leemos el estado de los filtros directamente desde el servicio
    const { presentadoresSeleccionados, estadosFinalesSeleccionados, fechaDesde, fechaHasta } = this.servicioEstadisticas.getFiltros();

    // El filtrado se realiza sobre la lista completa de licitaciones
    this.licitacionesFiltradas = this.licitaciones.filter((lic) => {
      let coincide = true;

      // >>> Usamos los valores obtenidos del servicio para los filtros
      if (presentadoresSeleccionados.length > 0) {
        const buscarNulos = presentadoresSeleccionados.includes('(Nadie)');
        const otrosPresentadoresSeleccionados =
          presentadoresSeleccionados.filter((p) => p !== '(Nadie)');

        let cumpleFiltroPresentador = false;

        // Condición 1: Si "(Nadie)" está seleccionado Y lic.presentadapor es null
        if (buscarNulos && lic.presentadapor == null) {
          cumpleFiltroPresentador = true;
        }

        // Condición 2: Si el valor de lic.presentadapor está en la lista de otros presentadores seleccionados
        if (
          otrosPresentadoresSeleccionados.length > 0 &&
          otrosPresentadoresSeleccionados.includes(lic.presentadapor)
        ) {
          cumpleFiltroPresentador = true;
        }

        coincide = coincide && cumpleFiltroPresentador;
      }

      // >>> Usamos los valores obtenidos del servicio para los filtros
      if (estadosFinalesSeleccionados.length > 0) {
        coincide =
          coincide &&
          estadosFinalesSeleccionados.includes(lic.estadofinal);
      }

      // >>> Usamos los valores obtenidos del servicio para los filtros de fecha
      const fechaLic = new Date(lic.fechapresentacion);
      if (fechaDesde) {
        const desde = new Date(fechaDesde);
        if (fechaLic < desde) {
          coincide = false;
        }
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
         // Ajuste para incluir el día "hasta" completo
        hasta.setHours(23, 59, 59, 999);
        if (fechaLic > hasta) {
          coincide = false;
        }
      }

      return coincide; // Devuelve true si cumple con todos los filtros
    });

    // Actualiza los contadores y el gráfico según los filtros aplicados
    this.filtradoContadoresEstados();
    this.actualizarGraficoEstados();
  }

  // =======================================================================
  // MÉTODOS PARA ESTADÍSTICAS Y GRÁFICOS (Estos leen de licitacionesFiltradas)
  // ... Estos métodos NO necesitan cambios, ya que operan sobre licitacionesFiltradas
  // que ya ha sido actualizada por aplicarFiltros()
  // =======================================================================
   filtradoContadoresEstados(): void {
     const total = this.licitacionesFiltradas.length;
    const totalSafe = total || 1; // Para evitar división por cero

    const presentadas = this.licitacionesFiltradas.filter(
      (lic) => lic.estadoini === 'PRESENTADA'
    ).length;
    const enEstudio = this.licitacionesFiltradas.filter(
      (lic) => lic.estadoini === 'EN ESTUDIO'
    ).length;
    const adjudicadas = this.licitacionesFiltradas.filter(
      (lic) => lic.estadofinal === 'ADJUDICADA'
    ).length;
    const noAdjudicadas = this.licitacionesFiltradas.filter(
      (lic) => lic.estadofinal === 'NO ADJUDICADA'
    ).length;
    const enResolucion = this.licitacionesFiltradas.filter(
      (lic) => lic.estadofinal === 'EN ESPERA RESOLUCIÓN'
    ).length;
    const desestimadas = this.licitacionesFiltradas.filter(
      (lic) => lic.estadofinal === 'DESESTIMADA'
    ).length;

    this.statsResumen = [
      {
        label: 'Presentadas',
        value: presentadas,
        color: '#1d84b5',
        percent: Math.round((presentadas / totalSafe) * 100),
      },
      {
        label: 'En Estudio',
        value: enEstudio,
        color: '#ffa500',
        percent: Math.round((enEstudio / totalSafe) * 100),
      },
      {
        label: 'Adjudicadas',
        value: adjudicadas,
        color: '#28a745',
        percent: Math.round((adjudicadas / totalSafe) * 100),
      },
      {
        label: 'No Adjudicadas',
        value: noAdjudicadas,
        color: '#dc3545',
        percent: Math.round((noAdjudicadas / totalSafe) * 100),
      },
      {
        label: 'En Resolución',
        value: enResolucion,
        color: '#c63f17',
        percent: Math.round((enResolucion / totalSafe) * 100),
      },
      {
        label: 'Desestimadas',
        value: desestimadas,
        color: '#6f42c1',
        percent: Math.round((desestimadas / totalSafe) * 100),
      },
    ];
  }

  actualizarGraficoEstados(): void {
     const total = this.licitacionesFiltradas.length;

    const enResolucion = this.licitacionesFiltradas.filter(
      (l) => l.estadofinal === 'EN ESPERA RESOLUCIÓN'
    ).length;
    const desestimada = this.licitacionesFiltradas.filter(
      (l) => l.estadofinal === 'DESESTIMADA'
    ).length;
    const noAdjudicada = this.licitacionesFiltradas.filter(
      (l) => l.estadofinal === 'NO ADJUDICADA'
    ).length;
    const anulada = this.licitacionesFiltradas.filter(
      (l) => l.estadofinal === 'ANULADA'
    ).length;
    const adjudicada = this.licitacionesFiltradas.filter(
      (l) => l.estadofinal === 'ADJUDICADA'
    ).length;
    const desierta = this.licitacionesFiltradas.filter(
      (l) => l.estadofinal === 'DESIERTA'
    ).length;

    this.statsGrafico = [
      {
        label: 'En Resolución',
        value: enResolucion,
        color: '#c63f17',
      },
      {
        label: 'Desestimada',
        value: desestimada,
        color: '#6f42c1',
      },
      {
        label: 'No Adjudicada',
        value: noAdjudicada,
        color: '#dc3545',
      },
      {
        label: 'Anulada',
        value: anulada,
        color: '#343a40',
      },
      {
        label: 'Adjudicada',
        value: adjudicada,
        color: '#28a745',
      },
      {
        label: 'Desierta',
        value: desierta,
        color: '#ffc107',
      },
    ];

    this.pieChartLabels = this.statsGrafico.map((s) => s.label);
    this.pieChartDatasets = [
      {
        data: this.statsGrafico.map((s) => s.value),
        backgroundColor: this.statsGrafico.map((s) => s.color),
      },
    ];

    this.totalLicitaciones = total;
    if (this.pieChartOptions.plugins && this.pieChartOptions.plugins.subtitle) {
      this.pieChartOptions.plugins.subtitle.text = 'TOTAL: ' + total;
    }
  }

  // =======================================================================
  // MÉTODOS DE MODALES PARA FECHAS (Interactúan con el servicio)
  // =======================================================================
  // Métodos para abrir y cerrar los modales de rango de fechas
  openDesdeModal() {
    // >>> Inicializamos la variable temporal del modal con el valor del servicio
    this.fechaDesdeTemp = this.servicioEstadisticas.fechaDesde;
    this.desdeModal.present();
  }
  cancelDesdeModal() {
    this.desdeModal.dismiss();
  }
  resetDesdeFecha() {
    this.fechaDesdeTemp = ''; // Resetea solo la variable temporal del modal
  }
  applyDesdeModal() {
    // >>> Actualizamos el valor en el servicio
    this.servicioEstadisticas.setFechaDesde(this.fechaDesdeTemp);
    this.desdeModal.dismiss();
    this.aplicarFiltros(); // Aplica los filtros después de cambiar la fecha
  }


  // Métodos para el modal de "Hasta Fecha"
  openHastaModal() {
    // >>> Inicializamos la variable temporal del modal con el valor del servicio
    this.fechaHastaTemp = this.servicioEstadisticas.fechaHasta;
    this.hastaModal.present();
  }
  cancelHastaModal() {
    this.hastaModal.dismiss();
  }
  resetHastaFecha() {
     this.fechaHastaTemp = new Date().toISOString(); // Resetea solo la variable temporal del modal (al día de hoy)
  }
  applyHastaModal() {
    // >>> Actualizamos el valor en el servicio
    this.servicioEstadisticas.setFechaHasta(this.fechaHastaTemp);
    this.hastaModal.dismiss();
    this.aplicarFiltros();
  }


  // =======================================================================
  // MÉTODO PARA LIMPIAR LOS FILTROS (Interactúa con el servicio)
  // =======================================================================
  limpiarBusqueda() {
    // >>> Llamamos al método del servicio para resetear los filtros
    this.servicioEstadisticas.limpiarFiltros();
    // Opcional: Actualizamos las variables temporales del modal si es necesario visualmente
    const filtrosReseteados = this.servicioEstadisticas.getFiltros();
    this.fechaDesdeTemp = filtrosReseteados.fechaDesde;
    this.fechaHastaTemp = filtrosReseteados.fechaHasta;

    // Re-aplicamos los filtros (que ahora están reseteados en el servicio)
    this.aplicarFiltros();
  }


  // =======================================================================
  // MÉTODO PARA MOSTRAR EL TÍTULO DE LA LISTA (Lee del servicio)
  // =======================================================================
  // Este método muestra un título dinámico dependiendo de los filtros y las fechas seleccionadas
  mostrarTituloListado(): string {
     // >>> Leemos las fechas desde el servicio
    const fechaDesde = this.servicioEstadisticas.fechaDesde;
    const fechaHasta = this.servicioEstadisticas.fechaHasta;

    if (fechaDesde && fechaHasta) {
      const fd = new Date(fechaDesde);
      const fh = new Date(fechaHasta);
      const today = new Date();

      const mismodia = (d1: Date, d2: Date): boolean =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

      if (mismodia(fd, today) && mismodia(fh, today)) {
        return 'Lista de licitaciones de hoy';
      }

      if (mismodia(fd, fh)) {
        const formattedDate = new Intl.DateTimeFormat('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(fd);
        return `Lista de licitaciones del ${formattedDate}`;
      }

      const formattedDesde = new Intl.DateTimeFormat('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(fd);
      if (mismodia(fh, today)) {
        return `Lista de licitaciones desde el ${formattedDesde} hasta el día de hoy`;
      } else {
        const formattedHasta = new Intl.DateTimeFormat('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(fh);
        return `Lista de licitaciones desde el ${formattedDesde} hasta el ${formattedHasta}`;
      }
    }
    return 'Lista de licitaciones'; // Título por defecto
  }

  // =======================================================================
  // GESTIÓN DE LA SUPERPOSICION DE LICITADORES
  // ... Estos métodos no necesitan cambios, ya que usan this.licitacionesFiltradas
  // que es un estado local del componente (una copia de los datos filtrados)
  // =======================================================================
    /** Abre el overlay */
  abrirLicitadores() {
    this.verLicitadoresSuperposicion = true;
    this.isClosing = false;
  }

  /** Lanza la animación de cierre */
  cerrarLicitadores() {
    this.isClosing = true;
    setTimeout(() => {
      this.verLicitadoresSuperposicion = false;
      this.isClosing = false;
    }, this.CLOSE_ANIM_DURATION);
  }


  // =======================================================================
  // GESTIÓN DE LA SUPERPOSICION DE CONTRATOS
  // ... Estos métodos no necesitan cambios
  // =======================================================================

  /** Abre el overlay */
  abrirContratos() {
    this.verContratosSuperposicion = true;
    this.isClosing = false;
  }

  cerrarContratos() {
    this.isClosing = true;
    setTimeout(() => {
      this.verContratosSuperposicion = false;
      this.isClosing = false;
    }, this.CLOSE_ANIM_DURATION);
  }

   // >>> NUEVO MÉTODO para navegar a TodaslicitacionesPage con filtro de cliente
  goToTodasLicitaciones(clientName: string) {
    // Navegamos a la ruta de todaslicitaciones y pasamos el cliente como query parameter
    this.router.navigate(['/paginas/todaslicitaciones'], {
      queryParams: { cliente: clientName }
    });
  }

}