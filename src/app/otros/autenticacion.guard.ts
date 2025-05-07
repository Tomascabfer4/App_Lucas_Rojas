import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable, first, map } from 'rxjs';
import { AutenticacionService } from '../servicios/autenticacion.service';

@Injectable({
  providedIn: 'root'
})

export class autenticacionGuard implements CanActivate {
  
  constructor(private servicioautenticacion: AutenticacionService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    // Usamos getCurrentUser() y esperamos (tomamos el primero) para saber el estado actual
    return this.servicioautenticacion.getCurrentUser().pipe(
      first(),
      map(user => {
        if (user) {
          return true;
        } else {
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }

}
