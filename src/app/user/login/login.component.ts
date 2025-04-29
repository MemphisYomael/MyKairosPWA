import {
  ChangeDetectionStrategy,
  Component,
  ErrorHandler,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  FormControl,
  Validators,
  FormGroupDirective,
  NgForm,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { HeaderCardRedComponent } from '../../shared/header-card-red/header-card-red.component';
import { HeaderCardComponent } from '../../shared/header-card/header-card.component';
import {
  MatProgressSpinner,
  MatProgressSpinnerModule,
} from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    MatProgressSpinner,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatCardModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    HeaderCardComponent,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  cargando = signal<boolean>(false);
  errorRegistro = signal<string>('');
  emailFormControl = new FormControl('', [
    Validators.required,
    Validators.email,
  ]);
  passwordFormControl = new FormControl('', Validators.required);
  usernameFormControl = new FormControl('', [Validators.pattern(/^\S*$/), Validators.required]);

  matcher = new MyErrorStateMatcher();

  // Variable que controla si la contraseña se muestra o se oculta
  hide: boolean = true;

  constructor(
    private location: Location,
    private serviciologin: ServicioApi1DbService,
    private route: Router
  ) {}

  // Alterna la visibilidad de la contraseña
  togglePasswordVisibility(): void {
    this.hide = !this.hide;
  }

  onSubmit(accion: number): void {
    this.cargando.set(true);
    if (accion == 1) {
      if (this.emailFormControl.valid && this.passwordFormControl.valid) {
        const email = this.emailFormControl.value;
        const password = this.passwordFormControl.value;

        const login = {
          Email: email,
          Password: password,
        };

        this.serviciologin.login(login).subscribe((data) => {
          console.log(data);
          this.cargando.set(false);

          if (data != ErrorHandler) {
            this.cargando.set(false);

            this.location.back();
          }
        });
        setTimeout(() => {
          this.cargando.set(false);

        }, 2000);

      } else {
        console.log('Formulario inválido');
        this.cargando.set(false);
      }
    }
    if (accion == 2) {
      if (this.emailFormControl.valid && this.passwordFormControl.valid) {
        const email = this.emailFormControl.value;
        const password = this.passwordFormControl.value;
        const username = this.usernameFormControl.value;

        const register = {
          Email: email,
          Password: password,
          UserName: username,
        };

        this.serviciologin.registrar(register).subscribe({
          next: (data) => {
            this.cargando.set(false);

            this.location.back();
          },
          error: (error) => {
            // Aquí puedes manejar el error
            this.cargando.set(false);

            console.error('Error en el registro:', error);
            this.errorRegistro.set(error.error.errores.mensaje);
            if (
              this.errorRegistro() == '' ||
              this.errorRegistro() == undefined
            ) {
              this.cargando.set(false);

              console.log(error.error.errores);
              this.errorRegistro.set(
                error.error.errores +
                  '. La contraseña debe tener al menos 8 caracteres y un caracter especial. Ex. MyContraseña123!'
              );
            }
            // Puedes mostrar un mensaje al usuario o realizar otras acciones necesarias
            this.cargando.set(false);
          },
        });
      }
    }
  }
}
