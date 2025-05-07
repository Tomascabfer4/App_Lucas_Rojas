import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterOutlet, IonRouterLink, IonImg, IonToggle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { duplicateSharp, fileTrayFullSharp, statsChartSharp, personSharp, trophySharp, exitOutline } from 'ionicons/icons';
import { AutenticacionService } from './servicios/autenticacion.service';
import { Subscription } from 'rxjs';
import { NotificacionesService } from './servicios/notificaciones.service';
import { TemaService } from './servicios/tema.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  imports: [IonToggle,  FormsModule, CommonModule, IonImg, RouterLink, RouterLinkActive, IonApp, IonSplitPane, IonMenu, IonContent, IonList, IonMenuToggle, IonItem, IonIcon, IonLabel, IonRouterLink, IonRouterOutlet],
})
export class AppComponent implements OnInit {

  public appPages = [
    { title: 'Todas Las Licitaciones', url: '/paginas/todaslicitaciones', icon: 'file-tray-full' },
    { title: 'Licitaciones Adjudicadas', url: '/paginas/adjudicadas', icon: 'trophy' },
    { title: 'Mis Licitaciones', url: '/paginas/mislicitaciones', icon: 'person' },
    { title: 'Crear Licitacion', url: '/paginas/crearlicitacion', icon: 'duplicate' },
    { title: 'Estadísticas', url: '/paginas/estadisticas', icon: 'stats-chart' },
  ];

  public isDark = false;
  public userName: string = '';
  private userSub!: Subscription;

  constructor(private serviciotema: TemaService, private servicionotificaciones: NotificacionesService, private servicioautenticacion: AutenticacionService, private router: Router ) {
    addIcons({ duplicateSharp, fileTrayFullSharp, statsChartSharp, personSharp, trophySharp, exitOutline });
  }

  ngOnInit(): void {
    // Suscríbete al observable que emite el usuario actual
    this.userSub = this.servicioautenticacion.getCurrentUser().subscribe(user => {
      if (user) {
        // Si existe displayName, se usa; de lo contrario, se usa el email
        this.userName = user.displayName ? user.displayName : user.email;
      } else {
        this.userName = '';
      }
    });
    this.servicionotificaciones.notifyDaysRemaining();
    this.serviciotema.isDark$.subscribe(d => this.isDark = d);
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
    this.servicioautenticacion.logout()
      .then(() => {
        // Redirige al usuario a la página de login tras cerrar sesión
        this.router.navigate(['/login']).then(() => {
          window.location.reload();
        });
      })
      .catch((error) => {
        console.error('Error al cerrar sesión:', error);
      });
  }

}
