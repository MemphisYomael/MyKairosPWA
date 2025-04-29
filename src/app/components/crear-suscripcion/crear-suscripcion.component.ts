import { Component } from '@angular/core';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { Iitinerarios } from '../../interfaces/I-Itinerarios';
import {  ErrorHandler } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-crear-suscripcion',
  standalone: true,
  providers: [provideNativeDateAdapter()],

  imports: [FormsModule,MatSlideToggleModule, MatInputModule, MatSelectModule, MatCardModule, MatButtonModule, MatIconModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './crear-suscripcion.component.html',
  styleUrl: './crear-suscripcion.component.css',
})
export class CrearSuscripcionComponent {
Plataforma: any;
fecha: any = new Date();


  constructor(private api1Db: ServicioApi1DbService,
    private dialogRef: MatDialogRef<CrearSuscripcionComponent>
  ){}



  crearSuscripcion() {
    const Suscripcion: Iitinerarios = {
      Nombre: this.Plataforma,
      Fecha: new Date(this.fecha)
    }
    this.api1Db.postSuscripcion(Suscripcion).subscribe((data) => {
      console.log(data);
      this.dialogRef.close(); // Puede pasar datos opcionalmente
    })
  }
}
