import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { Isermon } from '../../interfaces/isermon';
import { IsermonResponse } from '../../interfaces/isermon-response';
import { Storage } from '@capacitor/storage';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-crear-word',
  standalone: true,
  imports: [MatCardModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDividerModule, MatIconModule],
  templateUrl: './crear-word.component.html',
  styleUrl: './crear-word.component.css'
})
export class CrearWordComponent {

constructor(private servicio1Db: ServicioApi1DbService,
  private dialogRef: MatDialogRef<CrearWordComponent>
){}

async crearSermon(sermonTitulo: string, filtro: string) {
  const sermon: IsermonResponse = {
    titulo: sermonTitulo,
    dateTime: new Date(),
    contrasena: filtro,
    temporal: undefined
  };

  if (navigator.onLine) {
    try {
      const data = await this.servicio1Db.postSermones(sermon).toPromise();
      console.log(data);
      this.dialogRef.close(); // Puede pasar datos opcionalmente
    } catch (error) {
      console.error('Error al guardar sermón:', error);
      sermon.temporal = 1606;
      await this.guardarSermonLocalmente(sermon);
    }
  } else {
    await this.guardarSermonLocalmente(sermon);
  }
}

async guardarSermonLocalmente(sermon: IsermonResponse) {
  // Marcar el sermón con la contraseña especial
  sermon.temporal = 1606;
  try {
    // Obtener sermones existentes
    const { value } = await Storage.get({ key: 'sermones' });
    let sermones = value ? JSON.parse(value) : [];
    
    // Añadir ID temporal para identificar el sermón localmente
    sermon.id = this.generateTemporaryId();
    sermon.contenido = ''; // Inicializar contenido vacío
    
    // Añadir el nuevo sermón
    sermones.push(sermon);
    
    // Guardar de vuelta en Storage
    await Storage.set({
      key: 'sermones',
      value: JSON.stringify(sermones)
    });
    
    console.log('Sermón guardado localmente:', sermon);
  } catch (error) {
    console.error('Error al guardar sermón localmente:', error);
  }
}

generateTemporaryId(): number {
  // Usamos valores negativos para evitar colisiones con IDs del servidor
  // Timestamp negativo para asegurar unicidad
  return -Math.floor(Date.now() + Math.random() * 10000);
}
}