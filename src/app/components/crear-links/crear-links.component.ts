import { ChangeDetectionStrategy, Component, ErrorHandler, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { Ilinks } from '../../interfaces/ilinks';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OfflineLinksService } from '../../services/MyLinksOffline/OfflineLinks.service';

@Component({
  selector: 'app-crear-links',
  standalone: true,
  imports: [MatCardModule, FormsModule, MatFormFieldModule, MatInputModule, MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crear-links.component.html',
  styleUrl: './crear-links.component.css'
})
export class CrearLinksComponent {
  share: any;
  formData: Ilinks = {
    Nombre: '',
    Descripcion: '',
    Stock: 0,
    linkCompra: '',
    FotoPortada: '',
    Precio: 0,
    share: []
  };

  constructor(
    private api1DbService: ServicioApi1DbService,
    private offlineLinksService: OfflineLinksService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CrearLinksComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      isEdit: boolean;
      objeto: any;
      compartirLink: boolean;
    }
  ) {
    // Si es edición, cargar datos del objeto
    console.log(this.data.objeto)
    if (data && data.isEdit && data.objeto) {
      
      this.formData.Nombre = data.objeto.nombre;
      this.formData.Descripcion = data.objeto.descripcion;
      this.formData.Stock = data.objeto.stock;
      this.formData.linkCompra = data.objeto.linkCompra;
      this.formData.FotoPortada = data.objeto.fotoPortada;
      this.formData.Precio = data.objeto.precio;
      this.formData.share = data.objeto.share;
    }
  }

  async guardarLink(url: string, titulo: string, descripcion: string) {
    const link: Ilinks = {
      Nombre: titulo,
      Descripcion: descripcion,
      Stock: 0,
      linkCompra: url,
      FotoPortada: '',
      Precio: 0,
      share: []
    };

    // Verificar si hay conexión a Internet
    if (navigator.onLine) {
      // Si está online, guardar directamente en la API
      this.api1DbService.postLinks(link).subscribe((data) => {
        console.log('Link guardado en API:', data);
        this.mostrarMensaje('Link guardado correctamente');
        this.dialogRef.close(data);
      }, error => {
        console.error('Error al guardar el link:', error);
        this.mostrarMensaje('Error al guardar. Inténtalo de nuevo.');
      });
    } else {
      // Si está offline, guardar localmente
      try {
        const savedLink = await this.offlineLinksService.addOfflineLink(link);
        console.log('Link guardado offline:', savedLink);
        this.mostrarMensaje('Link guardado localmente (sin conexión)');
        this.dialogRef.close(savedLink);
      } catch (error) {
        console.error('Error al guardar offline:', error);
        this.mostrarMensaje('Error al guardar localmente');
      }
    }
  }

  async editarLink() {
    // Verificar si hay conexión a Internet
    if (navigator.onLine) {
      // Si está online, actualizar directamente en la API
      console.log(this.data.objeto, this.data.objeto.id)
      this.formData.id = this.data.objeto.id;
      this.api1DbService.putLink(this.formData).subscribe((data) => {
        console.log('Link actualizado en API:', data);
        this.mostrarMensaje('Link actualizado correctamente');
        this.dialogRef.close(data);
      }, error => {
        console.error('Error al actualizar el link:', error);
        this.mostrarMensaje('Error al actualizar. Inténtalo de nuevo.');
      });
    } else {
      // Si está offline, guardar la edición localmente
      try {
        this.formData.id = this.data.objeto.id;
        const savedEdit = await this.offlineLinksService.addOfflineEdit(this.formData);
        console.log('Edición guardada offline:', savedEdit);
        this.mostrarMensaje('Cambios guardados localmente (sin conexión)');
        this.dialogRef.close(savedEdit);
      } catch (error) {
        console.error('Error al guardar edición offline:', error);
        this.mostrarMensaje('Error al guardar cambios localmente');
      }
    }
  }

  compartirLink() {
    const link: Ilinks = this.data.objeto;
    if (!link.share) {
      link.share = [];
    }
    link.share.push(this.share);
    
    if (navigator.onLine) {
      this.api1DbService.putLink(link).subscribe((data) => {
        console.log('Link compartido:', data);
        this.mostrarMensaje('Link compartido correctamente');
        this.dialogRef.close(data);
      }, error => {
        console.error('Error al compartir el link:', error);
        this.mostrarMensaje('Error al compartir. Inténtalo de nuevo.');
      });
    } else {
      // Si está offline, guardar la edición de compartir localmente
      this.offlineLinksService.addOfflineEdit(link).then((savedEdit: any) => {
        console.log('Compartido guardado offline:', savedEdit);
        this.mostrarMensaje('Link compartido localmente (sin conexión)');
        this.dialogRef.close(savedEdit);
      }).catch((error: any) => {
        console.error('Error al compartir offline:', error);
        this.mostrarMensaje('Error al compartir localmente');
      });
    }
  }

  mostrarMensaje(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}