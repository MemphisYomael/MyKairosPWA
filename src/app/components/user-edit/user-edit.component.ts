import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HeaderCardComponent } from '../../shared/header-card/header-card.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    HeaderCardComponent,
  ],
  templateUrl: './user-edit.component.html',
  styleUrls: ['./user-edit.component.css'],
})
export class UserEditComponent {

  private toastr = inject(ToastrService)
  // Signal para almacenar los datos del usuario
  user = signal<any | null>(null);
  // Formulario reactivo para editar al usuario
  userForm: FormGroup;

  public serviceGlobal = inject(ServicioApi1DbService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  constructor(private fb: FormBuilder) {
    // Inicializa el formulario con campos vacíos
    this.userForm = this.fb.group({
      userName: ['', [
        Validators.required, // Si también es requerido
        Validators.pattern(/^\S*$/) // <-- Este es el validador clave
        // Podrías añadir más validadores aquí si es necesario
      ]],      email: [''],
      phoneNumber: [''],
      partner: [''],
      password:['']
    });
  }

  ngOnInit() {
    const id = this.serviceGlobal.getId();
    this.serviceGlobal.getuserById(id).subscribe((data: any) => {
      console.log('ESTE COMPONENTE:', data);
      this.user.set(data);
      this.userForm.patchValue({
        userName: data.userName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        partner: data.partner,
        // password: data.passwordHash
      });
    });

    this.route.queryParams.subscribe((params) => {
      // Guarda los datos del usuario a partir de los parámetros de la ruta
      this.user.set(params);
      console.log(params);
      // Rellena el formulario con los datos actuales del usuario
    });
  }

  saveChanges() {
  console.log(this.userForm.value);
    this.serviceGlobal.editUsuario(this.userForm.value).subscribe((data)=> {
      console.log(data);
      console.log('Usuario actualizado:', this.userForm.value);
      this.snackBar.open('Tu usuario ha sido actualizado correctamente. Porfavor cierre y vuelva a iniciar sesion. (Si no lo hace, no podra usar la aplicacion)', 'WARNING', {
        duration: 300000,
      });
      this.logOut();

    })
    // Aquí se puede implementar la lógica para actualizar el usuario a través del API.

    // Opcional: redirigir o recargar información después de guardar.
    // this.router.navigate(['/user-detail']);
  }

  clipboardCopy(textToCopy: any, evento: string) {
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        this.snackBar.open(evento + ' copiado al portapapeles', 'Cerrar', {
          duration: 2000,
        });
        console.log('Texto copiado al portapapeles:', textToCopy);
      })
      .catch((err) => {
        console.error('Error al copiar el texto: ', err);
      });
  }

  getColor(username: string): string {
    const initial = username.charAt(0).toUpperCase();
    const colorMap: { [key: string]: string } = {
      A: '#f44336',
      B: '#e91e63',
      C: '#9c27b0',
      D: '#673ab7',
      E: '#3f51b5',
      F: '#2196f3',
      G: '#03a9f4',
      H: '#00bcd4',
      I: '#009688',
      J: '#4caf50',
      K: '#8bc34a',
      L: '#cddc39',
      M: '#ffeb3b',
      N: '#ffc107',
      O: '#ff9800',
      P: '#ff5722',
      Q: '#795548',
      R: '#9e9e9e',
      S: '#607d8b',
    };
    return colorMap[initial] || '#607d8b';
  }

  logOut(){
    this.serviceGlobal.logout();
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 1000);
  }
}
