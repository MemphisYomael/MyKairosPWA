import { Component, ErrorHandler } from '@angular/core';
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
import { IRendicionCuentas } from '../../interfaces/irendicion-cuentas';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-crear-rendicion-cuentas',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [FormsModule,MatSlideToggleModule, MatInputModule, MatSelectModule, MatCardModule, MatButtonModule, MatIconModule, MatDatepickerModule, MatFormFieldModule, MatInputModule],
  templateUrl: './crear-rendicion-cuentas.component.html',
  styleUrl: './crear-rendicion-cuentas.component.css'
})
export class CrearRendicionCuentasComponent {
derrota: boolean = false;
fechaTentacion: Date = new Date();
contexto: any;
tentacion: any;


constructor(private servicioApi: ServicioApi1DbService,
  private dialogRef: MatDialogRef<CrearRendicionCuentasComponent>
){}

crearTentacion() {
  const tentacion: IRendicionCuentas= {
    Resolucion: this.derrota.toString(),
    Detalles: this.tentacion.toString(),
    FechaReunion: new Date(),
    FechaImplementacion: this.fechaTentacion,
    Contexto: this.contexto 
  }
  this.servicioApi.postTentaciones(tentacion).subscribe(
    (data) => {
      console.log(data);
      this.dialogRef.close(); // Puede pasar datos opcionalmente
    }
  );
}


opcionesTentacion: any[] = [
  {viewValue: 'Comida'},
  {viewValue: 'Dinero'},
  {viewValue: 'Alcohol'},
  {viewValue: 'Drogas'},
  {viewValue: 'Lujuria'},
  {viewValue: 'Fornicacion'},
  {viewValue: 'Pornografia'},
  {viewValue: 'Orgullo'},
  {viewValue: 'Burla'},
  {viewValue: 'Enojo'},
  {viewValue: 'Pereza'},
  {viewValue: 'Envidia'},
  {viewValue: 'Pensamiento impuro'}
]
}
