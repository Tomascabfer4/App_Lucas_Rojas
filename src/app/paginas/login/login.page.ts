import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AutenticacionService } from 'src/app/servicios/autenticacion.service';
import { Router } from '@angular/router';
import { IonInput, IonContent, IonButton, IonLabel, IonItem, ToastController, IonIcon, IonCol, IonGrid, IonRow, IonCard, IonTitle, IonButtons, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { person, lockClosed } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonToolbar, IonButtons, IonTitle, IonCard, IonRow, IonGrid, IonCol, IonIcon, IonInput, IonItem, IonButton, IonContent, CommonModule, FormsModule, ReactiveFormsModule]
})
export class LoginPage {

  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private servicioAutenticacion: AutenticacionService,
    private router: Router,
    private toastController: ToastController
  ) {
    addIcons({person,lockClosed});
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async mostrarMensajeToast() {
    const toast = await this.toastController.create({
      message: 'Las credenciales no son correctas',
      duration: 2000,
      color: 'danger'
    });
    toast.present();
  }

  onSubmit() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.servicioAutenticacion.login(email, password).subscribe({
        next: (response) => {
          localStorage.setItem('usuario', response.user.displayName);
          this.router.navigate(['/paginas/todaslicitaciones']);
        },
        error: (error) => {
          console.error('Login failed', error);
          this.mostrarMensajeToast();
        }
      });
    }
  }
  

}
