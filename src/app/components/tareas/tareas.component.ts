import { ServicioApi1DbService } from './../../services/servicio-api1-db.service';
import { Ilinks } from './../../interfaces/ilinks';
import { Component, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CrearTareasComponent } from '../crear-tareas/crear-tareas.component';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatListModule } from '@angular/material/list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { LocalNotifications } from '@capacitor/local-notifications';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AccionesComponent } from '../../shared/acciones/acciones.component';
import { Storage } from '@capacitor/storage';
import { ComunicacionEntreComponentesService } from '../../services/comunicacion-entre-componentes.service';
import { HeaderCardGreenComponent } from "../../shared/header-card-green/header-card-green.component";

declare var bootstrap: any; // Para usar Bootstrap modal

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [
    MatSlideToggleModule,
    MatListModule,
    MatExpansionModule,
    MatTableModule,
    MatProgressBarModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    MatCardModule,
    HeaderCardGreenComponent
],
  templateUrl: './tareas.component.html',
  styleUrls: ['./tareas.component.css']
})
export class TareasComponent {
  progressBar = signal<boolean>(true);
  displayedColumns: string[] = ['tarea', 'fecha', 'detalles', 'acciones'];
  dataSource = signal<any[]>([]);
  selectedTarea: any = null;
  private tareaModal: any;
  constructor(private serivcioCompartido: ComunicacionEntreComponentesService,private dialog: MatDialog, private api1db: ServicioApi1DbService, private snackbar: MatSnackBar) {}

  private _bottomSheet = inject(MatBottomSheet);

  ngOnInit() {
    this.serivcioCompartido.barraInferior.set(false);
    this.getDataDesdeStorage();
    this.getTareas();
  }

  ngAfterViewInit() {
    // Inicializar el modal de Bootstrap
    this.tareaModal = new bootstrap.Modal(document.getElementById('tareaModal'));
  }

  openTareaModal(tarea: any) {
    this.selectedTarea = tarea;
    // Abrir el modal usando Bootstrap
    this.tareaModal.show();
  }

  onTaskStatusChange(completed: boolean) {
    if (this.selectedTarea) {
      this.selectedTarea.realizada = completed;
      this.api1db.putTareas(this.selectedTarea).subscribe(
        (response) => {
          console.log('Tarea actualizada:', response);
          this.snackbar.open('Tarea actualizada', 'Cerrar', {
            duration: 2000
          });
        },
        (error) => {
          console.error('Error al actualizar la tarea:', error);
        }
      );
      // Aquí podrías agregar lógica para actualizar el estado en la base de datos
      // Por ejemplo: this.api1db.updateTaskStatus(this.selectedTarea.id, completed);
    }
  }

  async getDataDesdeStorage(){
    const { value } = await Storage.get({ key: 'tareas' });
    if (value) {
      this.dataSource.set(JSON.parse(value));
      this.progressBar.set(false);
      this.scheduleNotifications();
    }

    if (value) {
      JSON.parse(value).forEach((element: any) => {
          if(element.Contrasena === "160616"){
            const data = this.api1db.postTareas(element).toPromise();
            console.log(data);
          }
      });
    }
  }

  openBottomSheet(devocion: any): void {
    this._bottomSheet.open(AccionesComponent, {
      data: {
        endpoint: 'tareas-acciones',
        objeto: devocion
      }
    }).afterDismissed().subscribe(()=>{
      this.getTareas();
    });
  }

  async getTareas() {
    if (navigator.onLine) {
      this.api1db.getTareas().subscribe(
        async (data) => {
          console.log(data);
          this.dataSource.set(data);
          this.progressBar.set(false);
          // Almacenar la data en el Storage
          await Storage.set({
            key: 'tareas',
            value: JSON.stringify(data)
          });
          this.scheduleNotifications();
        },
        async (error) => {
          console.error("Error al llamar a la API:", error);
          // Si hay error en la API, intentar recuperar la data del Storage
          const { value } = await Storage.get({ key: 'tareas' });
          if (value) {
            this.dataSource.set(JSON.parse(value));
            this.progressBar.set(false);
            this.scheduleNotifications();
          }
        }
      );
    } else {
      // Sin conexión: recuperar la data del Storage
      const { value } = await Storage.get({ key: 'tareas' });
      if (value) {
        this.dataSource.set(JSON.parse(value));
        this.progressBar.set(false);
        console.log("Usuario offline: data recuperada del Storage.");
        this.scheduleNotifications();
      } else {
        console.log("Usuario offline y no hay data almacenada en Storage.");
        this.progressBar.set(false);
      }
    }
  }

  crearTareas() {
    const dialogRef = this.dialog.open(CrearTareasComponent, {
      disableClose: false,
      data: {},
      width: '300px', // Ajusta el ancho del modal
      height: '390px'
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getTareas();
    });
  }

  async scheduleNotifications() {
    // Solicitar permisos para enviar notificaciones
    await LocalNotifications.requestPermissions();
  
    // Accedemos al valor del signal correctamente
    if (this.dataSource && Array.isArray(this.dataSource())) {
      // Obtener todas las notificaciones pendientes
      const pendingNotifications = await LocalNotifications.getPending();
      
      // Cancelar todas las notificaciones anteriores para evitar duplicados
      if (pendingNotifications && pendingNotifications.notifications.length > 0) {
        const notificationIds = pendingNotifications.notifications.map(n => ({ id: n.id }));
        await LocalNotifications.cancel({ notifications: notificationIds });
      }
      
      for (const tarea of this.dataSource()) {
        // Convertir la fecha de vencimiento en un objeto Date y asegurar que sea al inicio del día
        const expirationDate = new Date(tarea.dia);
        expirationDate.setHours(0, 0, 0, 0);
        
        // Fecha actual al inicio del día para comparaciones justas
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Si la fecha de vencimiento es mayor o igual a hoy
        if (expirationDate >= today) {
          const notifications = [];
          
          // Calcular fechas de recordatorio
          const reminderDate3 = new Date(expirationDate);
          reminderDate3.setDate(expirationDate.getDate() - 3);
          
          const reminderDate2 = new Date(expirationDate);
          reminderDate2.setDate(expirationDate.getDate() - 2);
          
          const reminderDate1 = new Date(expirationDate);
          reminderDate1.setDate(expirationDate.getDate() - 1);
          
          // Notificación 3 días antes (si todavía no ha pasado)
          if (reminderDate3 >= today) {
            notifications.push({
              id: tarea.id + 3000, // Usar un ID único
              title: 'Recordatorio de tu tarea',
              body: `En 3 días se te acaba el tiempo para: ${tarea.accion}. Detalles: ${tarea.detalle || ''}`,
              schedule: { at: reminderDate3 },
              sound: 'default',
              channelId: 'importante',
              actionTypeId: 'OPEN_APP',
              extra: null
            });
          }
          
          // Notificación 2 días antes (si todavía no ha pasado)
          if (reminderDate2 >= today) {
            notifications.push({
              id: tarea.id + 2000, // Usar un ID único
              title: 'Recordatorio de tu tarea',
              body: `En 2 días se te acaba el tiempo para: ${tarea.accion}. Detalles: ${tarea.detalle || ''}`,
              schedule: { at: reminderDate2 },
              sound: 'default',
              channelId: 'importante',
              actionTypeId: 'OPEN_APP',
              extra: null
            });
          }
          
          // Notificación 1 día antes (si todavía no ha pasado)
          if (reminderDate1 >= today) {
            notifications.push({
              id: tarea.id + 1000, // Usar un ID único
              title: 'Recordatorio de tu tarea',
              body: `En 1 día se te acaba el tiempo para: ${tarea.accion}. Detalles: ${tarea.detalle || ''}`,
              schedule: { at: reminderDate1 },
              sound: 'default',
              channelId: 'importante',
              actionTypeId: 'OPEN_APP',
              extra: null
            });
          }
          
          // Notificación el mismo día
          if (expirationDate.toDateString() === today.toDateString()) {
            // Crear una notificación para 3 horas después (o para una hora específica si prefieres)
            const sameDay = new Date();
            sameDay.setHours(sameDay.getHours() + 3); // 3 horas después
            
            notifications.push({
              id: tarea.id + 100, // Usar un ID único
              title: 'Recordatorio urgente de tu tarea',
              body: `Tu tarea "${tarea.accion}" vence hoy. Detalles: ${tarea.detalle || ''}`,
              schedule: { at: sameDay },
              sound: 'default',
              channelId: 'importante',
              actionTypeId: 'OPEN_APP',
              extra: null
            });
          }
          
          // Programar todas las notificaciones si hay alguna
          if (notifications.length > 0) {
            try {
              await LocalNotifications.schedule({
                notifications: notifications
              });
              console.log(`Notificaciones programadas para tarea ID ${tarea.id}`);
            } catch (error) {
              console.error('Error al programar notificaciones:', error);
            }
          }
        }
      }
    }
    
    // Asegurarse de que se ha creado el canal de notificaciones
    await this.createNotificationChannel();
  }
  // Añade este método si aún no lo tienes
  async createNotificationChannel() {
    await LocalNotifications.createChannel({
      id: "importante",
      name: "Notificaciones Importantes",
      description: "Canal para notificaciones de alta importancia",
      importance: 5
    });
  }


  ngOnDestroy(){
    this.serivcioCompartido.barraInferior.set(true);
  }
}
