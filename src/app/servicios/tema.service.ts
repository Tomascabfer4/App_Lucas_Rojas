import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TemaService {
  // Inicializamos aquí el valor y aplicamos la clase al <html>
  private dark$ = new BehaviorSubject<boolean>(
    localStorage.getItem('theme') === 'dark'
  );
  isDark$ = this.dark$.asObservable();

  constructor() {
    // Al arrancar, forzamos la clase según el valor guardado (o false por defecto)
    document.documentElement.classList.toggle('dark', this.dark$.value);
  }

  toggle(dark: boolean) {
    this.dark$.next(dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', dark);
  }
}
        