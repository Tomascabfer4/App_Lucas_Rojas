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
  licitaciones: Licitacion[] = []; // Todas las licitaciones
  licitacionesFiltradas: Licitacion[] = []; // Resultados con filtros “tal cual”
  licitacionesFiltradasAnterior: Licitacion[] = []; // Resultados con filtros pero -1 año

  totalLicitaciones: number = 0;

  // Filtros posibles (lista completa para chequear checkboxes)
  presentadores: string[] = [];
  estadosFinales: string[] = [];

  // Las selecciones activas de filtros se guardan DENTRO del servicio

  // Fechas temporales para el modal
  fechaDesdeTemp: string = '';
  fechaHastaTemp: string = '';

  @ViewChild('desdeModal') desdeModal!: IonModal;
  @ViewChild('hastaModal') hastaModal!: IonModal;

  /** Controla si una superposición está abierta */
  verLicitadoresSuperposicion = false;
  verContratosSuperposicion = false;
  public isClosing = false;
  private CLOSE_ANIM_DURATION = 300; // ms, coincidir con tu CSS

  // Estadísticas para el bloque “año en curso”
  statsResumen: {
    label: string;
    value: number;
    color: string;
    percent: number;
    sumImporte?: number; // Solo para "Adjudicadas"
  }[] = [];

  // Estadísticas para el bloque “año anterior”
  statsResumenAnterior: {
    label: string;
    value: number;
    color: string;
    percent: number;
    sumImporte?: number;
  }[] = [];

  // Propiedades para el gráfico de pastel (solo para “año en curso”)
  statsGrafico: { label: string; value: number; color: string }[] = [];
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  public pieChartOptions: ChartOptions<'pie'> = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' },
      title: {
        display: true,
        text: 'GRAFICO DE LICITACIONES',
        font: { family: 'Montserrat, sans-serif', size: 20 },
      },
      subtitle: {
        display: true,
        text: 'TOTAL: 0',
        font: { family: 'Montserrat, sans-serif', size: 15, style: 'italic' },
      },
      tooltip: { enabled: true },
    },
  };
  public pieChartLabels: string[] = [];
  public pieChartDatasets: ChartDataset<'pie'>[] = [];
  public pieChartLegend: boolean = true;
  public pieChartPlugins: any[] = [];

  // =======================================================================
  // PROPIEDADES PARA CONTROLAR LOS AÑOS EN LOS CARD-SUBTITLE
  // =======================================================================
  anioFiltro: number = new Date().getFullYear();
  anioAnteriorFiltro: number = this.anioFiltro - 1;

  // =======================================================================
  // CONSTRUCTOR Y SERVICIOS
  // =======================================================================
  constructor(
    private servicioTema: TemaService,
    public servicioEstadisticas: EstadisticasService,
    private servicioConstantes: ConstantesService,
    private router: Router
  ) {
    addIcons({});
    // Los filtros y fechas iniciales ya los maneja el servicio
  }

  // =======================================================================
  // MÉTODOS DEL CICLO DE VIDA DE ANGULAR
  // =======================================================================
  async ngOnInit() {
    try {
      // 1) Cargamos todas las licitaciones
      this.licitaciones =
        await this.servicioEstadisticas.getTodasLicitaciones();

      // 2) Cargamos los valores posibles para “presentadores” y “estados finales”
      const config = await this.servicioConstantes.getConstantes();
      this.presentadores = config.PERSONAS_EMPRESA;
      this.estadosFinales = config.ESTADOS_FINALES;

      // 3) Llamamos a aplicarFiltros() para inicializar licitacionesFiltradas y stats
      this.aplicarFiltros();
    } catch (error) {
      console.error('Error al obtener datos:', error);
      this.licitacionesFiltradas = [];
      this.aplicarFiltros();
    }

    // 4) Observamos cambio de tema para el gráfico
    this.servicioTema.isDark$.subscribe((isDark) => {
      const newColor = isDark ? '#fff' : '#000';

      // a) Mutamos título/subtitulo directamente en el chart (si existe)
      if (this.chart?.chart) {
        this.chart.chart.options.plugins!.title!.color = newColor;
        this.chart.chart.options.plugins!.subtitle!.color = newColor;
        this.chart.chart.update();
      }

      // b) Re-asignamos pieChartOptions para que Angular detecte cambios
      this.pieChartOptions = {
        ...this.pieChartOptions,
        plugins: {
          ...this.pieChartOptions.plugins!,
          title: { ...this.pieChartOptions.plugins!.title!, color: newColor },
          subtitle: {
            ...this.pieChartOptions.plugins!.subtitle!,
            color: newColor,
          },
        },
      };
    });
  }

  // =======================================================================
  // MÉTODOS DE FILTROS (INTERACTÚAN CON EL servicioEstadisticas)
  // =======================================================================

  togglePresentadador(valor: string, event: any) {
    const currentSelections = [
      ...this.servicioEstadisticas.presentadoresSeleccionados,
    ];
    if (event.detail.checked) {
      if (!currentSelections.includes(valor)) {
        currentSelections.push(valor);
      }
    } else {
      const idx = currentSelections.indexOf(valor);
      if (idx > -1) {
        currentSelections.splice(idx, 1);
      }
    }
    this.servicioEstadisticas.setPresentadoresSeleccionados(currentSelections);
    this.aplicarFiltros();
  }

  toggleEstadoFinal(valor: string, event: any) {
    const currentSelections = [
      ...this.servicioEstadisticas.estadosFinalesSeleccionados,
    ];
    if (event.detail.checked) {
      if (!currentSelections.includes(valor)) {
        currentSelections.push(valor);
      }
    } else {
      const idx = currentSelections.indexOf(valor);
      if (idx > -1) {
        currentSelections.splice(idx, 1);
      }
    }
    this.servicioEstadisticas.setEstadosFinalesSeleccionados(currentSelections);
    this.aplicarFiltros();
  }

  /**
   * Este método se encarga de:
   * 1) Leer filtros (presentadores, estados, fechaDesde, fechaHasta) desde el servicio
   * 2) Calcular el año principal (extraído de fechaHasta si existe, si no de fechaDesde, o el año actual)
   * 3) Filtrar `this.licitaciones` para generar `licitacionesFiltradas`
   * 4) Filtrar `this.licitaciones` de nuevo, restando 1 año a fechaDesde/fechaHasta para generar `licitacionesFiltradasAnterior`
   * 5) Crear statsResumen (año actual) y statsResumenAnterior (año anterior), y actualizar el gráfico
   */
  public aplicarFiltros() {
    // A) Obtengo los valores de filtros guardados en el servicio
    const {
      presentadoresSeleccionados,
      estadosFinalesSeleccionados,
      fechaDesde,
      fechaHasta,
    } = this.servicioEstadisticas.getFiltros();

    // B) Calcular dinámicamente el año que mostraremos en cada tarjeta
    let yearParaMostrar: number;
    if (fechaHasta) {
      yearParaMostrar = new Date(fechaHasta).getFullYear();
    } else if (fechaDesde) {
      yearParaMostrar = new Date(fechaDesde).getFullYear();
    } else {
      yearParaMostrar = new Date().getFullYear();
    }

    this.anioFiltro = yearParaMostrar;
    this.anioAnteriorFiltro = yearParaMostrar - 1;

    // C) Construyo la lista `licitacionesFiltradas` (período “tal cual”)
    this.licitacionesFiltradas = this.licitaciones.filter((lic) => {
      let coincide = true;

      // 1) FILTRAR POR PRESENTADOR
      if (presentadoresSeleccionados.length > 0) {
        const buscarNulos = presentadoresSeleccionados.includes('(Nadie)');
        const otrosPresentadores = presentadoresSeleccionados.filter(
          (p) => p !== '(Nadie)'
        );

        let cumplePresentador = false;

        if (buscarNulos && lic.presentadapor == null) {
          cumplePresentador = true;
        }
        if (
          otrosPresentadores.length > 0 &&
          otrosPresentadores.includes(lic.presentadapor!)
        ) {
          cumplePresentador = true;
        }
        coincide = coincide && cumplePresentador;
      }

      // 2) FILTRAR POR ESTADO FINAL
      if (estadosFinalesSeleccionados.length > 0) {
        coincide =
          coincide && estadosFinalesSeleccionados.includes(lic.estadofinal!);
      }

      // 3) FILTRAR POR RANGO DE FECHAS “Desde–Hasta”
      const fechaLic = new Date(lic.fechapresentacion!);
      if (fechaDesde) {
        const desde = new Date(fechaDesde);
        if (fechaLic < desde) {
          coincide = false;
        }
      }
      if (fechaHasta) {
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        if (fechaLic > hasta) {
          coincide = false;
        }
      }

      return coincide;
    });

    // D) Construyo fechas “-1 año” para el filtrado anterior
    let fechaDesdeAnt: Date | null = null;
    let fechaHastaAnt: Date | null = null;

    if (fechaDesde) {
      fechaDesdeAnt = new Date(fechaDesde);
      fechaDesdeAnt.setFullYear(fechaDesdeAnt.getFullYear() - 1);
    }
    if (fechaHasta) {
      fechaHastaAnt = new Date(fechaHasta);
      fechaHastaAnt.setFullYear(fechaHastaAnt.getFullYear() - 1);
    }

    // E) Construyo la lista `licitacionesFiltradasAnterior` (período “-1 año”)
    this.licitacionesFiltradasAnterior = this.licitaciones.filter((lic) => {
      let coincideAnt = true;

      // Mismos filtros de presentador
      if (presentadoresSeleccionados.length > 0) {
        const buscarNulos = presentadoresSeleccionados.includes('(Nadie)');
        const otrosPresentadores = presentadoresSeleccionados.filter(
          (p) => p !== '(Nadie)'
        );

        let cumplePresentadorAnt = false;
        if (buscarNulos && lic.presentadapor == null) {
          cumplePresentadorAnt = true;
        }
        if (
          otrosPresentadores.length > 0 &&
          otrosPresentadores.includes(lic.presentadapor!)
        ) {
          cumplePresentadorAnt = true;
        }
        coincideAnt = coincideAnt && cumplePresentadorAnt;
      }

      // Mismos filtros de estado
      if (estadosFinalesSeleccionados.length > 0) {
        coincideAnt =
          coincideAnt && estadosFinalesSeleccionados.includes(lic.estadofinal!);
      }

      // Rango de fechas “-1 año”
      const fechaLicAnt = new Date(lic.fechapresentacion!);
      if (fechaDesdeAnt) {
        if (fechaLicAnt < fechaDesdeAnt) {
          coincideAnt = false;
        }
      }
      if (fechaHastaAnt) {
        const hastaAnt = new Date(fechaHastaAnt);
        hastaAnt.setHours(23, 59, 59, 999);
        if (fechaLicAnt > hastaAnt) {
          coincideAnt = false;
        }
      }

      return coincideAnt;
    });

    // F) A partir de `licitacionesFiltradas`, genero statsResumen + gráfico
    this.filtradoContadoresEstados();
    this.actualizarGraficoEstados();

    // G) A partir de `licitacionesFiltradasAnterior`, genero statsResumenAnterior
    this.filtradoContadoresEstadosAnterior();
  }

  // =======================================================================
  // MÉTODOS PARA ESTADÍSTICAS Y GRÁFICOS (AÑO EN CURSO)
  // =======================================================================
  filtradoContadoresEstados(): void {
    const total = this.licitacionesFiltradas.length;
    const totalSafe = total || 1;

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

    // --- NUEVO: calculamos la suma de importes de las adjudicadas ---
    const sumaAdjudicadas = this.licitacionesFiltradas
      .filter((lic) => lic.estadofinal === 'ADJUDICADA')
      .reduce((acc, lic) => {
        // Si lic.importe no fuera número, lo convertimos:
        const importeNum =
          typeof lic.importe === 'number'
            ? lic.importe
            : parseFloat(String(lic.importe)) || 0;
        return acc + importeNum;
      }, 0);

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
        sumImporte: sumaAdjudicadas, // <-- Aquí asignamos la suma
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
      { label: 'En Resolución', value: enResolucion, color: '#c63f17' },
      { label: 'Desestimada', value: desestimada, color: '#6f42c1' },
      { label: 'No Adjudicada', value: noAdjudicada, color: '#dc3545' },
      { label: 'Anulada', value: anulada, color: '#343a40' },
      { label: 'Adjudicada', value: adjudicada, color: '#28a745' },
      { label: 'Desierta', value: desierta, color: '#ffc107' },
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
  // NUEVO MÉTODO: calcula statsResumenAnterior usando licitacionesFiltradasAnterior
  // =======================================================================
  // --------------------------------------------------------------------------
// MÉTODO PARA CALCULAR LAS ESTADÍSTICAS DEL AÑO ANTERIOR, INCLUIDA LA SUMA
// --------------------------------------------------------------------------
filtradoContadoresEstadosAnterior(): void {
  const totalAnt = this.licitacionesFiltradasAnterior.length;
  const totalSafeAnt = totalAnt || 1; // para evitar división por cero

  // Contar estados para el año anterior
  const presentadasAnt = this.licitacionesFiltradasAnterior.filter(
    (lic) => lic.estadoini === 'PRESENTADA'
  ).length;
  const enEstudioAnt = this.licitacionesFiltradasAnterior.filter(
    (lic) => lic.estadoini === 'EN ESTUDIO'
  ).length;
  const adjudicadasAnt = this.licitacionesFiltradasAnterior.filter(
    (lic) => lic.estadofinal === 'ADJUDICADA'
  ).length;
  const noAdjudicadasAnt = this.licitacionesFiltradasAnterior.filter(
    (lic) => lic.estadofinal === 'NO ADJUDICADA'
  ).length;
  const enResolucionAnt = this.licitacionesFiltradasAnterior.filter(
    (lic) => lic.estadofinal === 'EN ESPERA RESOLUCIÓN'
  ).length;
  const desestimadasAnt = this.licitacionesFiltradasAnterior.filter(
    (lic) => lic.estadofinal === 'DESESTIMADA'
  ).length;

  // --- NUEVO: calcular la suma de importes sólo de las adjudicadas (año anterior) ---
  const sumaAdjudicadasAnt = this.licitacionesFiltradasAnterior
    .filter((lic) => lic.estadofinal === 'ADJUDICADA')
    .reduce((acc, lic) => {
      const importeNum =
        typeof lic.importe === 'number'
          ? lic.importe
          : parseFloat(String(lic.importe)) || 0;
      return acc + importeNum;
    }, 0);

  // Ahora sí armamos el array statsResumenAnterior, incluyendo sumImporte
  this.statsResumenAnterior = [
    {
      label: 'Presentadas',
      value: presentadasAnt,
      color: '#1d84b5',
      percent: Math.round((presentadasAnt / totalSafeAnt) * 100),
    },
    {
      label: 'En Estudio',
      value: enEstudioAnt,
      color: '#ffa500',
      percent: Math.round((enEstudioAnt / totalSafeAnt) * 100),
    },
    {
      label: 'Adjudicadas',
      value: adjudicadasAnt,
      color: '#28a745',
      percent: Math.round((adjudicadasAnt / totalSafeAnt) * 100),
      sumImporte: sumaAdjudicadasAnt, // <-- aquí va la suma del año anterior
    },
    {
      label: 'No Adjudicadas',
      value: noAdjudicadasAnt,
      color: '#dc3545',
      percent: Math.round((noAdjudicadasAnt / totalSafeAnt) * 100),
    },
    {
      label: 'En Resolución',
      value: enResolucionAnt,
      color: '#c63f17',
      percent: Math.round((enResolucionAnt / totalSafeAnt) * 100),
    },
    {
      label: 'Desestimadas',
      value: desestimadasAnt,
      color: '#6f42c1',
      percent: Math.round((desestimadasAnt / totalSafeAnt) * 100),
    },
  ];
}


  // =======================================================================
  // MÉTODOS DE MODALES PARA FECHAS (Interactúan con el servicio)
  // =======================================================================
  openDesdeModal() {
    this.fechaDesdeTemp = this.servicioEstadisticas.fechaDesde;
    this.desdeModal.present();
  }
  cancelDesdeModal() {
    this.desdeModal.dismiss();
  }
  resetDesdeFecha() {
    this.fechaDesdeTemp = '';
  }
  applyDesdeModal() {
    this.servicioEstadisticas.setFechaDesde(this.fechaDesdeTemp);
    this.desdeModal.dismiss();
    this.aplicarFiltros();
  }

  openHastaModal() {
    this.fechaHastaTemp = this.servicioEstadisticas.fechaHasta;
    this.hastaModal.present();
  }
  cancelHastaModal() {
    this.hastaModal.dismiss();
  }
  resetHastaFecha() {
    this.fechaHastaTemp = ''; // quedará vacío si restableces
  }
  applyHastaModal() {
    this.servicioEstadisticas.setFechaHasta(this.fechaHastaTemp);
    this.hastaModal.dismiss();
    this.aplicarFiltros();
  }

  // =======================================================================
  // MÉTODO PARA LIMPIAR LOS FILTROS (Interactúa con el servicio)
  // =======================================================================
  limpiarBusqueda() {
    this.servicioEstadisticas.limpiarFiltros();
    const filtrosReseteados = this.servicioEstadisticas.getFiltros();
    this.fechaDesdeTemp = filtrosReseteados.fechaDesde || '';
    this.fechaHastaTemp = filtrosReseteados.fechaHasta || '';
    this.aplicarFiltros();
  }

  // =======================================================================
  // OTROS MÉTODOS (navegación, superposición de licitadores/contratos)
  // =======================================================================
  mostrarTituloListado(): string {
    const fechaDesde = this.servicioEstadisticas.fechaDesde;
    const fechaHasta = this.servicioEstadisticas.fechaHasta;
    if (fechaDesde && fechaHasta) {
      const fd = new Date(fechaDesde);
      const fh = new Date(fechaHasta);
      const today = new Date();
      const mismodia = (d1: Date, d2: Date) =>
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

      if (mismodia(fd, today) && mismodia(fh, today)) {
        return 'Lista de licitaciones de hoy';
      }
      if (mismodia(fd, fh)) {
        const formatted = new Intl.DateTimeFormat('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(fd);
        return `Lista de licitaciones del ${formatted}`;
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
    return 'Lista de licitaciones';
  }

  abrirLicitadores() {
    this.verLicitadoresSuperposicion = true;
    this.isClosing = false;
  }
  cerrarLicitadores() {
    this.isClosing = true;
    setTimeout(() => {
      this.verLicitadoresSuperposicion = false;
      this.isClosing = false;
    }, this.CLOSE_ANIM_DURATION);
  }

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

  goToTodasLicitaciones(expediente: string, cliente: string) {
    this.router.navigate(['/paginas/todaslicitaciones'], {
      queryParams: { numexpediente: expediente, cliente },
    });
  }
}
