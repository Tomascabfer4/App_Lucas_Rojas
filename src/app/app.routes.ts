import { Routes } from '@angular/router';
import { autenticacionGuard } from './otros/autenticacion.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'paginas/todaslicitaciones', pathMatch: 'full' },
  {
    path: 'paginas/todaslicitaciones',
    loadComponent: () => import('./paginas/todaslicitaciones/todaslicitaciones.page')
      .then(m => m.TodaslicitacionesPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'paginas/adjudicadas',
    loadComponent: () => import('./paginas/adjudicadas/adjudicadas.page')
      .then(m => m.AdjudicadasPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'paginas/mislicitaciones',
    loadComponent: () => import('./paginas/mislicitaciones/mislicitaciones.page')
      .then(m => m.MislicitacionesPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'paginas/crearlicitacion',
    loadComponent: () => import('./paginas/crearlicitacion/crearlicitacion.page')
      .then(m => m.CrearlicitacionPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'paginas/estadisticas',
    loadComponent: () => import('./paginas/estadisticas/estadisticas.page')
      .then(m => m.EstadisticasPage),
    canActivate: [autenticacionGuard]
  },
  {
    path: 'login',
    loadComponent: () => import('./paginas/login/login.page').then(m => m.LoginPage)
  }
];
