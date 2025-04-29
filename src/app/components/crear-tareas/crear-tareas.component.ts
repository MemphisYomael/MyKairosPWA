import { Component } from '@angular/core';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { Iitinerarios } from '../../interfaces/I-Itinerarios';
import { ErrorHandler } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { IAcciones } from '../../interfaces/Iacciones';
import { Storage } from '@capacitor/storage'; // Import Storage
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-crear-tareas',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    FormsModule,
    MatSlideToggleModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './crear-tareas.component.html',
  styleUrl: './crear-tareas.component.css',
})
export class CrearTareasComponent {
  Tarea: any;
  fechaEntrega: Date = new Date();
  detalles: any;

  constructor(private api1Db: ServicioApi1DbService,
    private dialogRef: MatDialogRef<CrearTareasComponent>
  ) {}

  async crearTarea() {
    const tarea: IAcciones = {
      accion: this.Tarea,
      detalle: this.detalles,
      dia: this.fechaEntrega,
    };

    if (navigator.onLine) {
      try {
        const data = await this.api1Db.postTareas(tarea).toPromise();
        console.log(data);
        this.dialogRef.close(); // Puede pasar datos opcionalmente
      } catch (error) {
        console.error('Error al guardar tarea:', error);
        // Fallback to local storage
        await this.saveTareaToLocalStorage(tarea);
      }
    } else {
      // No internet, save to local storage
      await this.saveTareaToLocalStorage(tarea);
    }
  }

  async saveTareaToLocalStorage(tarea: IAcciones) {
    try {
      const { value } = await Storage.get({ key: 'tareas' });
      let tareas: IAcciones[] = [];
      if (value) {
        tareas = JSON.parse(value);
      }
      //@ts-ignore
      tarea.Contrasena = "160616";
      tareas.push(tarea);
      await Storage.set({
        key: 'tareas',
        value: JSON.stringify(tareas),
      });
      this.dialogRef.close(); // Puede pasar datos opcionalmente
    } catch (error) {
      console.error('Error al guardar tarea en local storage:', error);
      // Handle the error appropriately, maybe show a message to the user
    }
  }
}
