import { Component, ErrorHandler, inject, Inject } from '@angular/core';
import {
  MAT_BOTTOM_SHEET_DATA,
  MatBottomSheet,
} from '@angular/material/bottom-sheet';
import { MatListModule } from '@angular/material/list';
import { Route, Router } from '@angular/router';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { MatDialog, MatDialogClose } from '@angular/material/dialog';
import { EditorTextoComponent } from '../../components/editor-texto/editor-texto.component';
import { CrearDeevocionalComponent } from '../crear-deevocional/crear-deevocional.component';
import {FormsModule} from '@angular/forms';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';
import {MatFormFieldModule} from '@angular/material/form-field';
import { IFinanza } from '../../interfaces/ifinanza';
import { CrearLinksComponent } from '../../components/crear-links/crear-links.component';

@Component({
  selector: 'app-acciones',
  standalone: true,
  imports: [MatListModule, MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule],
  templateUrl: './acciones.component.html',
  styleUrl: './acciones.component.css',
})
export class AccionesComponent {
  eliminarActivo: boolean = false;
  tipoIngreso: string[] = ['Ingreso', 'Egreso', 'Dinero Comprometido']
  private _bottomSheet = inject(MatBottomSheet);

  constructor(
    @Inject(MAT_BOTTOM_SHEET_DATA) public data: any,
    public route: Router,
    private service: ServicioApi1DbService,
    private dialog: MatDialog
  ) {}


  ngOnInit() {
    console.log(this.data);
  }

  //Editar componentes objetos
  editar($event?: any) {
    if (this.data.endpoint == 'devocional-consejeria') {
       const dialogRef = this.dialog.open(CrearDeevocionalComponent, {
            disableClose: false,
            data: {
              objeto: this.data.objeto,
              isEdit: true
            },
            width: '300px',
            height: '390px'
          });
      
          dialogRef.afterClosed().subscribe((result) => {
            console.log('El diálogo se cerró');
            this._bottomSheet.dismiss();
          });
      
         
    }

    if (this.data.endpoint == 'finanzas-publicidades') {
      const finanza: IFinanza = this.data.objeto;
      finanza.Nombre = $event.value;
      console.log($event.value);
      this.service.putFinanzas(finanza).subscribe((data) => {
        console.log(data);
        this._bottomSheet.dismiss();
      });
    }
    
    if (this.data.endpoint == 'word-sermones') {
    }
    }

  //Eliminar Componentes Objetos
  eliminar() {
    if (this.data.endpoint == 'oracion-filtros') {
      this.service.deleteOraciones(this.data.objeto.id).subscribe((data) => {
        console.log(data);
        this._bottomSheet.dismiss();
      })
    }

    if (this.data.endpoint == 'devocional-filtros') {
      this.service.deleteDevocionales(this.data.objeto.id).subscribe((data) => {
        console.log(data);

        this._bottomSheet.dismiss();
      });
    }

    if (this.data.endpoint == 'rendicion-reuniones') {
      this.service.deleteTentaciones(this.data.objeto.id).subscribe((data) => {
        console.log(data);

        this._bottomSheet.dismiss();
      });
    }

    if (this.data.endpoint == 'word-sermones') {
      this.service.deleteSermones(this.data.objeto.id).subscribe((data) => {
        console.log(data);
        this.cerrarModal();
        this._bottomSheet.dismiss();
      });
    }

    if (this.data.endpoint == 'devocional-consejeria') {
      this.service.deleteDevocionales(this.data.objeto.id).subscribe((data) => {
        console.log(data);

        this._bottomSheet.dismiss();
      });
    }

    if (this.data.endpoint == 'tareas-acciones') {
      this.service.deleteTareas(this.data.objeto.id).subscribe((data) => {
        console.log(data);
        this._bottomSheet.dismiss();
      });
    }

     if (this.data.endpoint == 'finanzas-publicidades') {
      this.service.deleteFinanzas(this.data.objeto.id).subscribe((data) => {
        console.log(data);
        this._bottomSheet.dismiss();
      });
    }

     if (this.data.endpoint == 'suscripciones-itinerarios') {
      this.service.deleteSuscripcion(this.data.objeto.id).subscribe((data) => {
        console.log(data);
        this._bottomSheet.dismiss();
      });
    }

     if (this.data.endpoint == 'resolucion-clasificaciones') {
      this.service.deleteResolucion(this.data.objeto.id).subscribe((data) => {
        console.log(data);
        this._bottomSheet.dismiss();
      });
    }

     if (this.data.endpoint == 'links-productos') {
      this.service.deleteLink(this.data.objeto.id).subscribe((data) => {
        console.log(data);
        this._bottomSheet.dismiss();
      });
    }

     // if (this.data.endpoint == '') {
    //   this.service.(this.data.objeto.id).subscribe((data) => {
    //     console.log(data);
    //     window.location.reload();
    //   });
    // }
  }

  //Comparte tus componentes objetos
  compartir($event: MouseEvent) {

    if (this.data.endpoint == 'devocional-consejeria') {
      const dialogRef = this.dialog.open(CrearDeevocionalComponent, {
           disableClose: false,
           data: {
             objeto: this.data.objeto,
             isEdit: false,
             compartirDevocional: true
           },
           width: '300px',
           height: '390px'
         });
     
         dialogRef.afterClosed().subscribe((result) => {
           console.log('El diálogo se cerró');
           this._bottomSheet.dismiss();
          });
   }  
  
  
   if (this.data.endpoint == 'links-productos') {
    const dialogRef = this.dialog.open(CrearLinksComponent, {
         disableClose: false,
         data: {
           objeto: this.data.objeto,
           isEdit: false,
           compartirLink: true
         },
         width: '300px',
         height: '390px'
       });
   
       dialogRef.afterClosed().subscribe((result) => {
         console.log('El diálogo se cerró');
         this._bottomSheet.dismiss();
        });
 }
  
  
  }

  //sacale foto a tus componentes objetos
  photo($event: MouseEvent) {
    this.cerrarModal();
  }

  cerrarModal() {
    this._bottomSheet.dismiss();
  }
}
