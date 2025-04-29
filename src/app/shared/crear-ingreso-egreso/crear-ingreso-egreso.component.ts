import { ChangeDetectionStrategy, Component, ErrorHandler } from '@angular/core';
import {MatSelectModule} from '@angular/material/select';
import {MatCardModule} from '@angular/material/card';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IFinanza } from '../../interfaces/ifinanza';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-crear-ingreso-egreso',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [ MatFormFieldModule, MatInputModule, MatDatepickerModule,
       MatInputModule, MatSelectModule, MatCardModule, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crear-ingreso-egreso.component.html',
  styleUrl: './crear-ingreso-egreso.component.css'
})
export class CrearIngresoEgresoComponent {
f: Date = new Date();


  constructor(private servicioApi1Db: ServicioApi1DbService,
    private dialogRef: MatDialogRef<CrearIngresoEgresoComponent>
  ){}



crearFinanza(fecha: any,tipo: string,detalles: string,cantidad: any) {
  const finanza: IFinanza = {
    Nombre: tipo,
    Descripcion: detalles,
    Stock: 0,
    urlImagen: fecha,
    linkCompra: '',
    Precio: cantidad
  }
  this.servicioApi1Db.postFinanza(finanza).subscribe((data) =>{
    console.log(data);
    this.dialogRef.close(); // Puede pasar datos opcionalmente
  })


}


}
