import { MatDialogActions, MatDialogModule, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-aviso-de-a-intalar-app',
  standalone: true,
  imports: [MatTabsModule, MatCardModule, MatListModule, MatButtonModule, MatDialogModule],
  templateUrl: './aviso-de-a-intalar-app.component.html',
  styleUrl: './aviso-de-a-intalar-app.component.css',
})
export class AvisoDeAIntalarAppComponent {
  typesOfShoes: string[] = [
    'Sin conexion a internet',
    'Notificaciones en MyTareas, etc...',
    'Acceso rapido a la aplicacion',
    'Sin necesidad de abrir el navegador',
  ];

  constructor(public MatDialogRef: MatDialogRef<AvisoDeAIntalarAppComponent>){}

  closeDialog() {
    this.MatDialogRef.close();
  }
}
