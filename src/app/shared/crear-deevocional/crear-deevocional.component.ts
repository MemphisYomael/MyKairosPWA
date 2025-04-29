import { Component, Inject } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { _closeDialogVia, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ImydevocionalesConsejerias } from '../../interfaces/imydevocionales-consejerias';
import { FormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid'; // Importa la función para generar UUIDs
import { Storage } from '@capacitor/storage';

@Component({
  selector: 'app-crear-deevocional',
  providers: [provideNativeDateAdapter()],
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
  ],
  templateUrl: './crear-deevocional.component.html',
  styleUrl: './crear-deevocional.component.css',
})
export class CrearDeevocionalComponent {
  compartirDevocional: boolean = false;
  devocionalParaEditar: ImydevocionalesConsejerias = {
    nombre: '',
    detalles: '',
    fecha: new Date(),
    lugar: '',
  };
  editar: boolean = false;
  share: string = '';
  constructor(
    private servicioApi: ServicioApi1DbService,
    private dialogRef: MatDialogRef<CrearDeevocionalComponent>,
    private route: Router,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      isEdit: boolean;
      objeto: ImydevocionalesConsejerias;
      compartirDevocional: boolean;
    }
  ) {}

  ngOnInit() {
    if (this.data) {
      this.editar = this.data.isEdit;
      this.devocionalParaEditar = this.data.objeto;
      this.compartirDevocional = this.data.compartirDevocional;
    }
  }
  async crearDevocional(
    pasaje: string = '',
    detalles: string = '',
    contexto: string = '',
    fecha: any = new Date()
  ) {
    const devocional: ImydevocionalesConsejerias = {
      nombre: pasaje,
      detalles: detalles,
      lugar: contexto,
      fecha: new Date(fecha),
      //@ts-ignore    
    };

    // Generar un ID único para el objeto

    if (!this.editar && !this.compartirDevocional) {
      if (navigator.onLine) {
        try {
          const data = await this.servicioApi
            .postDevocionales(devocional)
            .toPromise();
          console.log(data);
          this.dialogRef.close(); // Puede pasar datos opcionalmente
        } catch (error) {
          console.error('Error al guardar devocional:', error);
          const { value } = await Storage.get({ key: 'devocionales' });
          devocional.Contrasena = "160616";
          const devocionales = JSON.parse(value!);
          devocionales.push(devocional);
          await Storage.set({
            key: 'devocionales',
            value: JSON.stringify(devocionales),
          });
          this.dialogRef.close(); // Puede pasar datos opcionalmente
        }
      } else {
        const { value } = await Storage.get({ key: 'devocionales' });
        devocional.Contrasena = "160616";

        const devocionales = JSON.parse(value!);
        devocionales.push(devocional);
        await Storage.set({
          key: 'devocionales',
          value: JSON.stringify(devocionales),
        });
        this.dialogRef.close(); // Puede pasar datos opcionalmente
      }
    } else if (this.editar && !this.compartirDevocional) {
      devocional.id = this.data.objeto.id;
      this.servicioApi.putDevocionales(devocional).subscribe((data) => {
        console.log(data);
        this.dialogRef.close(); // Puede pasar datos opcionalmente
      });
    } else if (this.compartirDevocional) {
      const devocionalShare: ImydevocionalesConsejerias =
        this.devocionalParaEditar;
      devocionalShare.share?.push(this.share);
      console.log(devocionalShare);
      this.servicioApi.putDevocionales(devocionalShare).subscribe((data) => {
        console.log(data);
        this.dialogRef.close(); // Puede pasar datos opcionalmente
      });
    }
  }
}
