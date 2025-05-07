import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { inject } from '@angular/core';  // Necesario para la inyección en componentes standalone
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AutenticacionService {
  // Usamos inject() para obtener el servicio de autenticación
  private auth: Auth = inject(Auth);

  // Método para hacer login
  login(email: string, password: string): Observable<any> {
    return new Observable((observer) => {
      signInWithEmailAndPassword(this.auth, email, password)
        .then((userCredential) => {
          observer.next(userCredential);
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }

  // Método para hacer logout
  logout(): Promise<void> {
    return signOut(this.auth);
  }

  // Método para obtener el usuario actual
  getCurrentUser(): Observable<any> {
    return new Observable((observer) => {
      onAuthStateChanged(this.auth, (user) => {
        observer.next(user);  // Emitimos el usuario si está autenticado
      });
    });
  }
  
  // Método para verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!this.auth.currentUser;
  }
}