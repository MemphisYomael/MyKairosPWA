import { ServicioApi1DbService } from './../../services/servicio-api1-db.service';
import { Component, signal, inject, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser, CommonModule } from "@angular/common";
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';
import {MatIconModule} from '@angular/material/icon';
import {MatDividerModule} from '@angular/material/divider';
import {MatButtonModule} from '@angular/material/button';
import {MatTabsModule} from '@angular/material/tabs';
import {MatCardModule} from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { Isermon } from '../../interfaces/isermon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Storage } from '@capacitor/storage';
import { ComunicacionEntreComponentesService } from '../../services/comunicacion-entre-componentes.service';
import { IsermonResponse } from '../../interfaces/isermon-response';

@Component({
  selector: 'app-editor-texto',
  standalone: true,
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatFormFieldModule, MatCardModule, MatTabsModule, FormsModule, FroalaEditorModule, FroalaViewModule, MatButtonModule, MatDividerModule, MatIconModule],
  templateUrl: './editor-texto.component.html',
  styleUrls: ['./editor-texto.component.css']
})
export class EditorTextoComponent {
  id = signal<string | null>("0");
  editorContent = "";
  titulo = "";
  sermonById = signal<any>("");
  isOffline = false;
  @ViewChild('filtro', { static: false }) filtroInput!: ElementRef;
  obtenerValorFiltro(): string {
    return this.filtroInput.nativeElement.value;
  }
  constructor(
    private servicioCompartido: ComunicacionEntreComponentesService,
    @Inject(PLATFORM_ID) private platformId: Object, 
    private apiService1db: ServicioApi1DbService, 
    private route: ActivatedRoute,
    private router: Router,
    private comunicacionService: ComunicacionEntreComponentesService
  ) {
    this.id.set(this.route.snapshot.paramMap.get('id'));
  }

  async ngOnInit() {
    this.servicioCompartido.barraInferior.set(false);
    // Verificar conexión
    this.isOffline = !navigator.onLine;
    
    // Primero verificar si hay un sermón en el servicio de comunicación
    const sermonActual = this.comunicacionService.sermonActual();
    if (sermonActual && sermonActual.id?.toString() === this.id()) {
      this.editorContent = sermonActual.contenido || '';
      this.sermonById.set(sermonActual);
      return; // Ya tenemos el sermón, no necesitamos hacer más consultas
    }
    
    // Si no hay sermón en el servicio y estamos en línea, cargar del API
    if (!this.isOffline) {
      try {
        this.apiService1db.getSermonById(this.id()).subscribe(
          (data) => {
            this.editorContent = data.contenido || '';
            this.sermonById.set(data);
          },
          async (error) => {
            console.error('Error al cargar sermón:', error);
            await this.cargarSermonLocal(this.id()!);
          }
        );
      } catch (error) {
        console.error('Error al cargar sermón:', error);
        await this.cargarSermonLocal(this.id()!);
      }
    } else {
      // Si estamos offline, cargar del storage local
      await this.cargarSermonLocal(this.id()!);
    }
  }

  async cargarSermonLocal(id: string) {
    try {
      const { value } = await Storage.get({ key: 'sermones' });
      if (value) {
        const sermones = JSON.parse(value);
        const sermon = sermones.find((s: any) => s.id === id);
        console.log(sermon, "sermon actual")
        if (sermon) {
          this.editorContent = sermon.contenido || '';
          this.sermonById.set(sermon);
        } else {
          this.snackbar.open('No se encontró el sermón localmente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/editor-inicio']);
        }
      }
    } catch (error) {
      console.error('Error al cargar sermón local:', error);
      this.snackbar.open('Error al cargar el sermón', 'Cerrar', { duration: 3000 });
    }
  }

  async Guardar(filtro: string) {

    const sermon: Isermon = {
      id: this.sermonById().id,
      Titulo: this.sermonById().titulo,
      Contenido: this.editorContent,
      contrasena: filtro || null
    };
    if (this.sermonById().id < 0) {
      await this.actualizarSermonLocal(sermon);
      return;
    }


    if (navigator.onLine) {
      try {
        const data = await this.apiService1db.putSermones(sermon).subscribe((data) => {
          console.log(data)
          this.snackbar.open('Guardado correctamente', 'Cerrar', { duration: 3000 });
        });
      } catch (error) {
        try{
          await this.crearSermon(sermon).then((data) => {
            console.log(data);
            this.snackbar.open('Sincronizado correctamente', 'Cerrar', { duration: 3000 });
          });
        }catch{
          await this.actualizarSermonLocal(sermon);
        }

      }
    } else {
      await this.actualizarSermonLocal(sermon);
    }
  }

  async actualizarSermonLocal(sermon: Isermon) {
    try {
      const { value } = await Storage.get({ key: 'sermones' });
      if (value) {
        let sermones = JSON.parse(value);
        
        // Encontrar el índice del sermón en el array
        const index = sermones.findIndex((s: any) => s.id === sermon.id);
        
        if (index !== -1) {
          // Actualizar el sermón existente
          sermones[index].contenido = sermon.Contenido;
          sermones[index].titulo = sermon.Titulo;
          sermones[index].contrasena = sermon.contrasena;
          sermones[index].Titulo = sermon.Titulo;

          if( this.comunicacionService.sermonActual()?.temporal != 1606){
          sermones[index].temporal = 1677;

          }
          // Guardar de vuelta en Storage
          await Storage.set({
            key: 'sermones',
            value: JSON.stringify(sermones)
          });
          
          this.snackbar.open('Guardado localmente', 'Cerrar', { duration: 3000 });
          console.log(sermones)
        } else {
          // El sermón no existe localmente
          sermones.push({
            id: sermon.id,
            titulo: sermon.Titulo,
            contenido: sermon.Contenido,
            contrasena: sermon.contrasena,
            dateTime: new Date(),
            temporal: 1606
          });
          
          await Storage.set({
            key: 'sermones',
            value: JSON.stringify(sermones)
          });
          
          console.log(sermones);
          this.snackbar.open('Creada nueva nota localmente', 'Cerrar', { duration: 3000 });
        }
      }
    } catch (error) {
      console.error('Error al actualizar sermón local:', error);
      this.snackbar.open('Error al guardar localmente', 'Cerrar', { duration: 3000 });
    }
  }

  private snackbar = inject(MatSnackBar);


  ngOnDestroy(){
    this.servicioCompartido.barraInferior.set(true);
    this.Guardar(this.obtenerValorFiltro());
  }


  async crearSermon(sermon: any) {
        const data = await this.apiService1db.postSermones(sermon)

}
}