import {ChangeDetectionStrategy, Component} from '@angular/core';
import {MatSelectModule} from '@angular/material/select';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { IResoluciones } from '../../interfaces/iresoluciones';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-crear-resoluciones',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, FormsModule, MatButtonModule],
  templateUrl: './crear-resoluciones.component.html',
  styleUrl: './crear-resoluciones.component.css'
})
export class CrearResolucionesComponent {

  nombre!: string;
  dia: Date = new Date();

  constructor(private apiDb1: ServicioApi1DbService,
    private dialogRef: MatDialogRef<CrearResolucionesComponent>
    
  ){}

  crearResolucion(){
    const resolucion: IResoluciones = {
      Nombre: this.nombre,
      Dia: this.dia
    }

    this.apiDb1.postResoluciones(resolucion).subscribe((data) => {
      console.log(data);
      this.dialogRef.close(); // Puede pasar datos opcionalmente
    })
  }

}
