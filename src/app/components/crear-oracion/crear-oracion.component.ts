import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { IOraciones } from '../../interfaces/ioraciones';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-crear-oracion',
  standalone: true,
  imports: [MatInputModule, FormsModule, MatFormFieldModule , MatCardModule, MatButtonModule, MatIconModule] ,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crear-oracion.component.html',
  styleUrl: './crear-oracion.component.css'
})
export class CrearOracionComponent {


  constructor(private servicioApi1Db: ServicioApi1DbService,
    private dialogRef: MatDialogRef<CrearOracionComponent>
  ){}



crearOracion(oraciones: string, detalles: string) {
  if(detalles != "" || oraciones != ""){
  const oracion: IOraciones = {
    Nombre: oraciones,
    Descripcion: detalles
  }

  if(oracion){
  this.servicioApi1Db.postOraciones(oracion).subscribe((data) => {
    console.log(data);
    this.dialogRef.close(); // Puede pasar datos opcionalmente
  })
}
}
else{
  console.log("no hay valores");
}
}
}
