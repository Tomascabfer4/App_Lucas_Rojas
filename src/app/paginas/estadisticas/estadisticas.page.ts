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

  // Filtros: presentadores y estados finales
  presentadores: string[] = [];
  estadosFinales: string[] = [];
  presentadoresSeleccionados: string[] = [];
  estadosFinalesSeleccionados: string[] = [];

  // Variables para las fechas de filtro
  fechaDesde: string = '';
  fechaHasta: string = new Date().toISOString();
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

  // Para mostrar estadísticas resumidas
  statsResumen: {
    label: string;
    value: number;
    color: string;
    percent: number;
  }[] = [];
  statsGrafico: { label: string; value: number; color: string }[] = [];

  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  // Propiedades para el gráfico de sectores (pie chart)
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
    private servicioEstadisticas: EstadisticasService,
    private servicioConstantes: ConstantesService
  ) {
    addIcons({});
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
      this.licitaciones =
        await this.servicioEstadisticas.getTodasLicitaciones();
      this.licitacionesFiltradas = [...this.licitaciones];
      const config = await this.servicioConstantes.getConstantes();

      this.presentadores = config.PERSONAS_EMPRESA;
      this.estadosFinales = config.ESTADOS_FINALES;
      // *** Llama al método de detección aquí ***
      this.detectarLicitacionesConEstadofinalNulo();
      // ****************************************
      this.filtradoContadoresEstados();
      this.actualizarGraficoEstados();
    } catch (error) {
      console.error('Error al obtener datos:', error);
    }
    // Para cambiar el tema del gráfico según el tema de la app
    this.servicioTema.isDark$.subscribe(isDark => {
      const newColor = isDark ? '#fff' : '#000';

      // 1) MUTAMOS la instancia de Chart directamente y redibujamos
      if (this.chart?.chart) {
        this.chart.chart.options.plugins!.title!.color    = newColor;
        this.chart.chart.options.plugins!.subtitle!.color = newColor;
        this.chart.chart.update();
      }

      // 2) REASIGNAMOS pieChartOptions (inmutabilidad) para Angular
      this.pieChartOptions = {
        ...this.pieChartOptions,
        plugins: {
          ...this.pieChartOptions.plugins!,
          title:    { ...this.pieChartOptions.plugins!.title!,    color: newColor },
          subtitle: { ...this.pieChartOptions.plugins!.subtitle!, color: newColor },
        }
      };
    });
  }

  // =======================================================================
  // MÉTODOS DE FILTROS
  // =======================================================================
  // Método que maneja la selección de "Presentado Por" en los filtros
  togglePresentadador(valor: string, event: any) {
    if (event.detail.checked) {
      this.presentadoresSeleccionados.push(valor); // Si se selecciona, se agrega al array de seleccionados
    } else {
      this.presentadoresSeleccionados = this.presentadoresSeleccionados.filter(
        (p) => p !== valor
      ); // Si no se selecciona, se elimina
    }
    this.aplicarFiltros(); // Vuelve a aplicar los filtros después de hacer un cambio
  }

  // Método para manejar la selección de "Estado Final"
  toggleEstadoFinal(valor: string, event: any) {
    if (event.detail.checked) {
      this.estadosFinalesSeleccionados.push(valor); // Si se selecciona, se agrega
    } else {
      this.estadosFinalesSeleccionados =
        this.estadosFinalesSeleccionados.filter((e) => e !== valor); // Si no se selecciona, se elimina
    }
    this.aplicarFiltros(); // Reaplica los filtros
  }

  // Método que aplica los filtros seleccionados
  public aplicarFiltros() {
    this.licitacionesFiltradas = this.licitaciones.filter((lic) => {
      let coincide = true;
      if (this.presentadoresSeleccionados.length > 0) {
        const buscarNulos = this.presentadoresSeleccionados.includes('(Nadie)');
        const otrosPresentadoresSeleccionados =
          this.presentadoresSeleccionados.filter((p) => p !== '(Nadie)');

        let cumpleFiltroPresentador = false;

        // Condición 1: Si "(Nadie)" está seleccionado Y lic.presentadapor es null
        if (buscarNulos && lic.presentadapor == null) {
          // Usamos == null para cubrir null y undefined
          cumpleFiltroPresentador = true;
        }

        // Condición 2: Si el valor de lic.presentadapor está en la lista de otros presentadores seleccionados
        if (
          otrosPresentadoresSeleccionados.length > 0 &&
          otrosPresentadoresSeleccionados.includes(lic.presentadapor)
        ) {
          cumpleFiltroPresentador = true;
        }

        // La licitación coincide con el filtro de presentador si cumple alguna de las condiciones
        coincide = coincide && cumpleFiltroPresentador;
      }
      // Filtro de "Estado Final" (este se mantiene igual)
      if (this.estadosFinalesSeleccionados.length > 0) {
        coincide =
          coincide &&
          this.estadosFinalesSeleccionados.includes(lic.estadofinal);
      }

      // Filtro de fechas (este se mantiene igual)
      const fechaLic = new Date(lic.fechapresentacion);
      if (this.fechaDesde) {
        const desde = new Date(this.fechaDesde);
        if (fechaLic < desde) {
          coincide = false;
        }
      }
      if (this.fechaHasta) {
        const hasta = new Date(this.fechaHasta);
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
  // MÉTODOS PARA ESTADÍSTICAS Y GRÁFICOS
  // =======================================================================
  // Este método recalcula los contadores para mostrar en la interfaz
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

    // Resumen de estadísticas con valores y colores para el gráfico
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

  /**
   * Calcula valores, porcentajes y colores para los 6 estados finales
   * y actualiza pieChartLabels & pieChartDatasets de golpe.
   */
  actualizarGraficoEstados(): void {
    // 1. Total y defensa contra división por 0
    const total = this.licitacionesFiltradas.length;
    // 2. Cuenta cada estado (asegúrate de usar el texto exacto)
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

    // 3. Construye el resumen con label, value, color y percent
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

    // 4. Monta labels y dataset con data y colores
    this.pieChartLabels = this.statsGrafico.map((s) => s.label);
    this.pieChartDatasets = [
      {
        data: this.statsGrafico.map((s) => s.value),
        backgroundColor: this.statsGrafico.map((s) => s.color),
      },
    ];

    this.totalLicitaciones = total; // Actualiza el total de licitaciones
    if (this.pieChartOptions.plugins && this.pieChartOptions.plugins.subtitle) {
      this.pieChartOptions.plugins.subtitle.text = 'TOTAL: ' + total; // Actualiza dinámicamente el subtítulo
    }
  }

  // =======================================================================
  // MÉTODOS DE MODALES PARA FECHAS
  // =======================================================================
  // Métodos para abrir y cerrar los modales de rango de fechas
  openDesdeModal() {
    this.fechaDesdeTemp = this.fechaDesde;
    this.desdeModal.present();
  }
  cancelDesdeModal() {
    this.desdeModal.dismiss();
  }
  resetDesdeFecha() {
    this.fechaDesdeTemp = '';
  }
  applyDesdeModal() {
    this.fechaDesde = this.fechaDesdeTemp;
    this.desdeModal.dismiss();
    this.aplicarFiltros(); // Aplica los filtros después de cambiar la fecha
  }

  // Métodos para el modal de "Hasta Fecha"
  openHastaModal() {
    this.fechaHastaTemp = this.fechaHasta;
    this.hastaModal.present();
  }
  cancelHastaModal() {
    this.hastaModal.dismiss();
  }
  resetHastaFecha() {
    this.fechaHastaTemp = '';
  }
  applyHastaModal() {
    this.fechaHasta = this.fechaHastaTemp;
    this.hastaModal.dismiss();
    this.aplicarFiltros();
  }

  // =======================================================================
  // MÉTODO PARA LIMPIAR LOS FILTROS
  // =======================================================================
  // Método para limpiar todos los filtros aplicados y mostrar todas las licitaciones
  limpiarBusqueda() {
    this.presentadoresSeleccionados = [];
    this.estadosFinalesSeleccionados = [];
    this.fechaDesde = '';
    this.fechaHasta = new Date().toISOString(); // Establece la fecha hasta al día actual
    this.licitacionesFiltradas = [...this.licitaciones]; // Muestra todas las licitaciones nuevamente
    this.filtradoContadoresEstados(); // Recalcula los contadores y gráfico
    this.actualizarGraficoEstados(); // Actualiza el gráfico
  }

  // =======================================================================
  // MÉTODO PARA MOSTRAR EL TÍTULO DE LA LISTA
  // =======================================================================
  // Este método muestra un título dinámico dependiendo de los filtros y las fechas seleccionadas
  mostrarTituloListado(): string {
    if (this.fechaDesde && this.fechaHasta) {
      const fd = new Date(this.fechaDesde);
      const fh = new Date(this.fechaHasta);
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
}
