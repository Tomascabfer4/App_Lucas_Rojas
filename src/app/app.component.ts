import { Component, OnInit, NgZone } from '@angular/core'; // Añadido NgZone
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp,
  IonSplitPane,
  IonMenu,
  IonContent,
  IonList,
  IonMenuToggle,
  IonItem,
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonRouterLink,
  IonImg,
  IonToggle,
  Platform,
} from '@ionic/angular/standalone'; // Añadido Platform
import { addIcons } from 'ionicons';
import {
  duplicateSharp,
  fileTrayFullSharp,
  statsChartSharp,
  personSharp,
  trophySharp,
  exitOutline,
  refreshOutline,
} from 'ionicons/icons';
import { AutenticacionService } from './servicios/autenticacion.service';
import { Subscription } from 'rxjs';
import { NotificacionesService } from './servicios/notificaciones.service';
import { TemaService } from './servicios/tema.service';

// Declara la interfaz para la API de Electron que expondremos
declare global {
  interface Window {
    electronAPI?: {
      openFolder: (folderPath: string) => void;
      onOpenFolderReply: (
        callback: (args: {
          success: boolean;
          error?: string | undefined;
        }) => void
      ) => void;
      send: (channel: string, data?: any) => void;
    };
  }
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [
    IonToggle,
    FormsModule,
    CommonModule,
    IonImg,
    RouterLink,
    RouterLinkActive,
    IonApp,
    IonSplitPane,
    IonMenu,
    IonContent,
    IonList,
    IonMenuToggle,
    IonItem,
    IonIcon,
    IonLabel,
    IonRouterLink,
    IonRouterOutlet,
  ],
})
export class AppComponent implements OnInit {
  public appPages = [
    {
      title: 'Todas Las Licitaciones',
      url: '/paginas/todaslicitaciones',
      icon: 'file-tray-full',
    },
    {
      title: 'Licitaciones Adjudicadas',
      url: '/paginas/adjudicadas',
      icon: 'trophy',
    },
    {
      title: 'Mis Licitaciones',
      url: '/paginas/mislicitaciones',
      icon: 'person',
    },
    {
      title: 'Crear Licitacion',
      url: '/paginas/crearlicitacion',
      icon: 'duplicate',
    },
    {
      title: 'Estadísticas',
      url: '/paginas/estadisticas',
      icon: 'stats-chart',
    },
  ];

  public isDark = false;
  public userName: string = '';
  private userSub!: Subscription;

  constructor(
    private serviciotema: TemaService,
    private servicionotificaciones: NotificacionesService,
    private servicioautenticacion: AutenticacionService,
    private router: Router,
    private platform: Platform, // Inyecta Platform
    private ngZone: NgZone // Inyecta NgZone
  ) {
    addIcons({
      duplicateSharp,
      fileTrayFullSharp,
      statsChartSharp,
      personSharp,
      trophySharp,
      exitOutline,
      refreshOutline,
    });
  }

  ngOnInit(): void {
    this.userSub = this.servicioautenticacion
      .getCurrentUser()
      .subscribe((user) => {
        this.ngZone.run(() => {
          // Asegúrate de que las actualizaciones de la UI ocurran dentro de la zona de Angular
          if (user) {
            this.userName = user.displayName ? user.displayName : user.email;
          } else {
            this.userName = '';
          }
        });
      });
    this.servicionotificaciones.notifyDaysRemaining();
    this.serviciotema.isDark$.subscribe((d) => (this.isDark = d));
  }

  ngOnDestroy(): void {
    if (this.userSub) {
      this.userSub.unsubscribe();
    }
  }

  toggleTheme() {
    this.serviciotema.toggle(!this.isDark);
  }

  logout(): void {
    this.servicioautenticacion
      .logout()
      .then(() => {
        this.router.navigateByUrl('/login', { replaceUrl: true });
      })
      .catch((error) => {
        console.error('Error al cerrar sesión:', error);
      });
  }

  reloadPage(): void {
    if (this.isElectron()) {
      console.log('Running in Electron, attempting IPC reload...');
      if (window.electronAPI && typeof window.electronAPI.send === 'function') {
        window.electronAPI.send('reload-app-window'); // ¡Esta es la llamada clave!
      } else {
        console.warn(
          'Electron API not found. Falling back to window.location.reload()...'
        );
        window.location.reload();
      }
    } else {
      console.log('Running in Web, using window.location.reload()...');
      window.location.reload();
    }
  }

  private isElectron(): boolean {
    if (this.platform.is('electron')) {
      return true;
    }
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.indexOf('electron/') > -1) {
      return true;
    }
    if (window.electronAPI) {
      // Buena comprobación adicional
      return true;
    }
    return false;
  }
}
