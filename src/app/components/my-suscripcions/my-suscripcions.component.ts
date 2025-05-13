import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { CrearSuscripcionComponent } from '../crear-suscripcion/crear-suscripcion.component';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { CommonModule } from '@angular/common';
import { LocalNotifications } from '@capacitor/local-notifications';
import { HeaderCardComponent } from "../../shared/header-card/header-card.component";
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AccionesComponent } from '../../shared/acciones/acciones.component';
import { Storage } from '@capacitor/storage';
import { ComunicacionEntreComponentesService } from '../../services/comunicacion-entre-componentes.service';
import { HeaderCardYellowComponent } from "../../shared/header-card-yellow/header-card-yellow.component";

@Component({
  selector: 'app-my-suscripcions',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatTableModule, MatButtonModule, MatDividerModule, MatIconModule, HeaderCardComponent, HeaderCardYellowComponent],
  templateUrl: './my-suscripcions.component.html',
  styleUrls: ['./my-suscripcions.component.css']
})
export class MySuscripcionsComponent {
  displayedColumns: string[] = ['plataforma', 'acciones'];
  dataSource = signal<any[]>([]);
  private _bottomSheet = inject(MatBottomSheet);
  fechaActual!: Date;
  isOnline: boolean = navigator.onLine;

  constructor(
    private servicioCompartido: ComunicacionEntreComponentesService,
    private dialog: MatDialog, private api1db: ServicioApi1DbService) {}

  async ngOnInit() {
    this.servicioCompartido.barraInferior.set(false);
    await this.getSuscripciones();
    this.fechaActual = new Date();
    this.fechaActual.setHours(0, 0, 0, 0);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 1,
          title: "Notificación",
          body: "Te notificaremos cuando la fecha esté próxima",
          channelId: "importante",
          schedule: { at: new Date(Date.now() + 1000) },
          actionTypeId: "",
          extra: null
        }
      ]
    });

    this.createNotificationChannel();
  }

  openBottomSheet(devocion: any): void {
    this._bottomSheet.open(AccionesComponent, {
      data: {
        endpoint: 'suscripciones-itinerarios',
        objeto: devocion
      }
    }).afterDismissed().subscribe(()=>{
      this.getSuscripciones();
    });
  }
  
  async getSuscripciones() {
    if (navigator.onLine) {
      this.api1db.getSuscripciones().subscribe(
        async (data: any[]) => {
          console.log(data);
          const mappedData = data.map((item: { fecha: string | number | Date; }) => {
            const fecha = new Date(item.fecha);
            fecha.setHours(0, 0, 0, 0);
            return { ...item, fecha: fecha };
          });
          this.dataSource.set(mappedData);
          // Guardar la data en Storage
          await Storage.set({
            key: 'suscripciones',
            value: JSON.stringify(mappedData),
          });
          console.log((await Storage.get( {key: 'suscripciones'})).value)
          this.scheduleNotifications();
        },
        async (error) => {
          // Si ocurre un error, se intenta recuperar la data almacenada
          const { value } = await Storage.get({ key: 'suscripciones' });
          if (value) {
            this.dataSource.set(JSON.parse(value));
            this.scheduleNotifications();
          }
        }
      );
    } else {
      // Sin conexión: recuperar la data desde Storage
      const { value } = await Storage.get({ key: 'suscripciones' });
      if (value) {
        this.dataSource.set(JSON.parse(value));
        this.scheduleNotifications();
      }
    }
  }

  crearSuscripcion() {
    const dialogRef = this.dialog.open(CrearSuscripcionComponent, {
      disableClose: false,
      width: '300px',
      height: '390px'
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getSuscripciones();
    });
  }

  esFechaCercana(fecha: Date): boolean {
    const fechaVencimiento = new Date(fecha);
    const hoy = new Date();
    const diferenciaEnDias = (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24);
    return diferenciaEnDias <= 3 && diferenciaEnDias >= 0;
  }

  async createNotificationChannel() {
    await LocalNotifications.createChannel({
      id: "importante",
      name: "Notificaciones Importantes",
      description: "Canal para notificaciones de alta importancia",
      importance: 5
    });
  }

  async scheduleNotifications() {
    // Solicitar permisos para notificaciones
    await LocalNotifications.requestPermissions();
    
    // Cancelar todas las notificaciones anteriores para evitar duplicados
    const pendingNotifications = await LocalNotifications.getPending();
    if (pendingNotifications.notifications.length > 0) {
      const notificationIds = pendingNotifications.notifications.map(notification => notification.id);
      await LocalNotifications.cancel({ 
        notifications: notificationIds.map(id => ({ id })) 
      });
    }
  
    // Accedemos al valor del signal correctamente
    if (this.dataSource && Array.isArray(this.dataSource())) {
      for (const subscription of this.dataSource()) {
        // Asegurarse de que la fecha de vencimiento es un objeto Date
        const expirationDate = new Date(subscription.fecha);
        expirationDate.setHours(0, 0, 0, 0);
        
        // Fecha actual al inicio del día para comparaciones justas
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Solo programar notificaciones si la fecha de vencimiento es mayor o igual a hoy
        if (expirationDate >= today) {
          const notifications = [];
          
          // Recordatorio 3 días antes
          const reminderDate3 = new Date(expirationDate);
          reminderDate3.setDate(expirationDate.getDate() - 3);
          
          // Recordatorio 2 días antes
          const reminderDate2 = new Date(expirationDate);
          reminderDate2.setDate(expirationDate.getDate() - 2);
          
          // Recordatorio 1 día antes
          const reminderDate1 = new Date(expirationDate);
          reminderDate1.setDate(expirationDate.getDate() - 1);
          
          // Recordatorio 3 días antes (si todavía no ha pasado)
          if (reminderDate3 >= today) {
            notifications.push({
              id: subscription.id + 3000, // Usar un ID único
              title: 'Recordatorio de suscripción',
              body: `En 3 días vence tu suscripción a ${subscription.nombre}. Recuerda cancelarla si ya no la necesitas.`,
              schedule: { at: reminderDate3 },
              sound: 'default',
              channelId: "importante",
              actionTypeId: "OPEN_APP",
              extra: null
            });
          }
          
          // Recordatorio 2 días antes (si todavía no ha pasado)
          if (reminderDate2 >= today) {
            notifications.push({
              id: subscription.id + 2000, // Usar un ID único
              title: 'Recordatorio de suscripción',
              body: `En 2 días vence tu suscripción a ${subscription.nombre}. Recuerda cancelarla si ya no la necesitas.`,
              schedule: { at: reminderDate2 },
              sound: 'default',
              channelId: "importante",
              actionTypeId: "OPEN_APP",
              extra: null
            });
          }
          
          // Recordatorio 1 día antes (si todavía no ha pasado)
          if (reminderDate1 >= today) {
            notifications.push({
              id: subscription.id + 1000, // Usar un ID único
              title: 'Recordatorio de suscripción',
              body: `En 1 día vence tu suscripción a ${subscription.nombre}. Recuerda cancelarla si ya no la necesitas.`,
              schedule: { at: reminderDate1 },
              sound: 'default',
              channelId: "importante",
              actionTypeId: "OPEN_APP",
              extra: null
            });
          }
          
          // Notificación el mismo día
          if (expirationDate.toDateString() === today.toDateString()) {
            // Crear una notificación para 3 horas después
            const sameDay = new Date();
            sameDay.setHours(sameDay.getHours() + 3); // 3 horas después
            
            notifications.push({
              id: subscription.id + 100, // Usar un ID único
              title: 'Recordatorio urgente de suscripción',
              body: `Tu suscripción a ${subscription.nombre} vence hoy. Recuerda cancelarla si ya no la necesitas.`,
              schedule: { at: sameDay },
              sound: 'default',
              channelId: "importante",
              actionTypeId: "OPEN_APP",
              extra: null
            });
          }
          
          // Programar todas las notificaciones si hay alguna
          if (notifications.length > 0) {
            try {
              await LocalNotifications.schedule({
                notifications: notifications
              });
              console.log(`Notificaciones programadas para suscripción ID ${subscription.id}`);
            } catch (error) {
              console.error('Error al programar notificaciones:', error);
            }
          }
        }
      }
    }
  }

  ngOnDestroy(){
    this.servicioCompartido.barraInferior.set(true);
  }
}
