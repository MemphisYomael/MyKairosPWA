import { ChangeDetectionStrategy, Component, ErrorHandler, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { Ilinks } from '../../interfaces/ilinks';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';


@Component({
  selector: 'app-crear-links',
  standalone: true,
  imports: [MatCardModule, FormsModule, MatFormFieldModule, MatInputModule,  MatIconModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crear-links.component.html',
  styleUrl: './crear-links.component.css'
})
export class CrearLinksComponent {
share: any;



constructor(private api1DbService: ServicioApi1DbService,
  private dialogRef: MatDialogRef<CrearLinksComponent>,
  @Inject(MAT_DIALOG_DATA) public data: {
    isEdit: boolean;
    objeto: Ilinks;
    compartirLink: boolean;
  }
){}



  
guardarLink(url: string, titulo: string, descripcion: string) {

  const link: Ilinks = {
    Nombre: titulo,
    Descripcion: descripcion,
    Stock: 0,
    linkCompra: url,
    FotoPortada: '',
    Precio: 0
  }

  this.api1DbService.postLinks(link).subscribe((data)=> {
    console.log(data);
    this.dialogRef.close(); // Puede pasar datos opcionalmente
  })
}

compartirLink() {

  const link: Ilinks = this.data.objeto;
  link.share?.push(this.share);
  this.api1DbService.putLink(link).subscribe((data)=> {
    console.log(data);
    this.dialogRef.close(); // Puede pasar datos opcionalmente
  })
}

}
