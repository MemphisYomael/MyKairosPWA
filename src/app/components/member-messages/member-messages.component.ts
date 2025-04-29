import { YoutubeService } from './../../IA/youtube.service';
import { Component, inject, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewInit, AfterViewChecked, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TextFieldModule } from '@angular/cdk/text-field';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';

import { IMessage, MessageService } from './../../services/message.service';
import { MensajeriaHubsService } from '../../services/mensajeria-hubs.service';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { KeysService } from '../../IA/keys.service';
import { ComunicacionEntreComponentesService } from '../../services/comunicacion-entre-componentes.service';
import { YoutubeSearchComponent } from '../../shared/youtube-search/youtube-search.component';

export interface SendMessage {
  RecipientUserName: string;
  Content: string;
}

@Component({
  selector: 'app-member-messages',
  standalone: true,
  imports: [
    MatCardModule,
    CommonModule,
    MatIconModule,
    MatButtonModule,
    FormsModule,
    MatFormFieldModule,
    TextFieldModule,
    MatInputModule,
    YoutubeSearchComponent, // Añadido el componente de búsqueda de YouTube
  ],
  templateUrl: './member-messages.component.html',
  styleUrl: './member-messages.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush // Añadir esta línea

})
export class MemberMessagesComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('lastMessage') private lastMessage!: ElementRef;
  @ViewChild(YoutubeSearchComponent) youtubeSearch!: YoutubeSearchComponent;
  
  otheruser = signal<string>('');
  selectedMessage = signal<IMessage | null>(null);
  mensajeriaHubService = inject(MensajeriaHubsService);
  userName = signal<string>('');
  mensajeService = inject(MessageService);
  private route = inject(ActivatedRoute);
  username = signal<string>('');
  messages = signal<IMessage[]>([]);
  private _snackBar = inject(MatSnackBar);
  private servicio1Db = inject(ServicioApi1DbService);
  private googleGeminiService = inject(KeysService);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private model: any;
  private shouldScrollToBottom = true;

  // YouTube URL regex pattern - mejorado para capturar más formatos
  private youtubeUrlPattern = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(\?.*)?$/;

  constructor(public servicioPuente: ComunicacionEntreComponentesService, private YoutubeService: YoutubeService) {
    this.username.set(this.route.snapshot.paramMap.get('id')!);
    // Inicializar el servicio de Google Gemini
    this.googleGeminiService.initialize(this.googleGeminiService.keys);
    this.model = this.googleGeminiService.model;
  }
  
  ngOnInit(): void {
    this.userName.set(localStorage.getItem('userName')!);
    this.getMessagesOnline();
    this.servicioPuente.personaChat.set(this.username());
    this.servicioPuente.mostrarPersonaChat.set(true);
    this.servicioPuente.barraInferior.set(false);
  }
  
  ngAfterViewInit() {
    // Scroll al iniciar el componente
    setTimeout(() => {
      this.scrollToBottom();
    }, 300);
  }
  
  ngAfterViewChecked() {
    // Scroll cada vez que se actualiza la vista si es necesario
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }
  
  scrollToBottom(): void {
    try {
      if (this.lastMessage && this.lastMessage.nativeElement) {
        this.lastMessage.nativeElement.scrollIntoView({ behavior: 'smooth' });
      } else if (this.messagesContainer && this.messagesContainer.nativeElement) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error al hacer scroll:', err);
    }
  }

  getMessagesOnline(){
    this.mensajeService.createHubConnection(this.username());
  }
  
  isMe(userName: string): string {
    return userName === this.userName() ? 'me' : 'you';
  }

  // Comprueba si dos fechas son del mismo día
  sonMismoDia(fecha1: string | Date, fecha2: string | Date): boolean {
    try {
      // Convertir strings a objetos Date si es necesario
      const date1 = typeof fecha1 === 'string' ? new Date(fecha1) : fecha1;
      const date2 = typeof fecha2 === 'string' ? new Date(fecha2) : fecha2;

      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    } catch (error) {
      console.error('Error comparando fechas:', error);
      return false;
    }
  }

  // Formatea la fecha en formato "día, DD de mes de YYYY"
  formatearFecha(fecha: string | Date): string {
    try {
      const date = typeof fecha === 'string' ? new Date(fecha) : fecha;
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error);
      return String(fecha);
    }
  }

  sendMessage(Content: string) {
    if (!Content.trim()) return; // No enviar mensajes vacíos
    
    console.log("Enviando mensaje");
    const mensaje: SendMessage = {
      RecipientUserName: '',
      Content: Content,
    };
    mensaje.RecipientUserName = this.username();
    this.mensajeService.enviarMensaje(mensaje).then((data)=> {
        console.log(data);
        this.shouldScrollToBottom = true;
    })
    return;
  }

  // Abre el modal de opciones guardando el mensaje seleccionado
  openMessageOptions(message: IMessage): void {
    this.selectedMessage.set(message);
    console.log("Mensaje seleccionado:", message);
  }

  // Función para eliminar mensaje
  deleteMessage(message: IMessage | null): void {
    if (!message) return;
    
    console.log("Iniciando eliminación");
    this.mensajeService.deleteMessage(message.id).subscribe((data) => {
      console.log(data);
      console.log("Eliminación completada");
    });
    console.log("Solicitud de eliminación enviada");
  }

  // Implementación para guardar en MyNotas
  saveToMynotas(message: IMessage | null): void {
    if (message) {
      console.log("Guardar mensaje en MyNotas:", message);
      
      const sermonData = {
        titulo: `Nota de ${message.senderUserName} - ${new Date().toLocaleString()}`,
        contenido: message.content,
        dateTime: new Date()
      };
      
      this.servicio1Db.postSermones(sermonData).subscribe(
        (response) => {
          console.log("Nota guardada:", response);
          this._snackBar.open('Mensaje guardado en MyNotas', 'Cerrar', {
            duration: 2000,
          });
        },
        (error) => {
          console.error("Error al guardar en MyNotas:", error);
          this._snackBar.open('Error al guardar en MyNotas', 'Cerrar', {
            duration: 2000,
          });
        }
      );
    }
  }

  // Implementación para guardar en MyTareas
  saveToMytareas(message: IMessage | null): void {
    if (message) {
      console.log("Guardar mensaje en MyTareas:", message);
      
      const tarea = {
        accion: `Mensaje de ${message.senderUserName}`,
        detalle: message.content,
        dia: new Date()
      };
      
      this.servicio1Db.postTareas(tarea).subscribe(
        (response) => {
          console.log("Tarea guardada:", response);
          this._snackBar.open('Mensaje guardado en MyTareas', 'Cerrar', {
            duration: 2000,
          });
        },
        (error) => {
          console.error("Error al guardar en MyTareas:", error);
          this._snackBar.open('Error al guardar en MyTareas', 'Cerrar', {
            duration: 2000,
          });
        }
      );
    }
  }

  // Implementación para traducir con IA
  async translateWithIA(message: IMessage | null) {
    if (message && message.content) {
      console.log("Traducir mensaje con IA:", message);
      
      try {
        // Mostrar loading mediante snackbar
        this._snackBar.open('Traduciendo mensaje...', '', {
          duration: undefined,
        });
        
        // Crear el prompt para la traducción
        const translatePrompt = `
        Traduce el siguiente texto a español (si ya está en español, tradúcelo a inglés):
        
        "${message.content}"
        
        Solo proporciona la traducción, sin explicaciones adicionales.
        `;
        
        // Usar el modelo de IA para traducir
        const result = await this.model.generateContent(translatePrompt);
        const translatedText = result.response.candidates[0].content.parts[0].text;
        
        // Cerrar el snackbar de loading
        this._snackBar.dismiss();
        
        // Creamos un nuevo mensaje y lo enviamos
        const translatedMessage: SendMessage = {
          RecipientUserName: this.username(),
          Content: `Traducción: ${translatedText}`
        };
        
        await this.mensajeService.enviarMensaje(translatedMessage);
        this.shouldScrollToBottom = true;
        
        this._snackBar.open('Mensaje traducido y enviado', 'Cerrar', {
          duration: 2000,
        });
      } catch (error) {
        console.error("Error al traducir con IA:", error);
        this._snackBar.open('Error al traducir el mensaje', 'Cerrar', {
          duration: 2000,
        });
      }
    }
  }

  // Implementación para procesar con IA
  async processWithIA(message: IMessage | null) {
    if (message && message.content) {
      console.log("Procesar mensaje con IA:", message);
      
      try {
        // Mostrar loading mediante snackbar
        this._snackBar.open('Procesando mensaje con IA...', '', {
          duration: undefined,
        });
        
        // Crear el prompt para el procesamiento
        const processPrompt = `
        Analiza el siguiente mensaje y proporciona un resumen, ideas clave o sugerencias de respuesta:
        
        "${message.content}"
        
        Tu análisis debe incluir:
        1. Un breve resumen del contenido
        2. Puntos clave o temas importantes
        3. Una o dos posibles respuestas o acciones recomendadas.

        ESTO ES MUY IMPORTANTE: Si el mensaje es una pregunta, responde directamente a la pregunta de manera completa y detallada sin hacer un análisis.
        `;
        
        // Usar el modelo de IA para procesar
        const result = await this.model.generateContent(processPrompt);
        const processedText = result.response.candidates[0].content.parts[0].text;
        
        // Cerrar el snackbar de loading
        this._snackBar.dismiss();
        
        // Creamos un nuevo mensaje y lo enviamos
        const processedMessage: SendMessage = {
          RecipientUserName: this.username(),
          Content: `Análisis de IA:\n\n${processedText}`
        };
        
        await this.mensajeService.enviarMensaje(processedMessage);
        this.shouldScrollToBottom = true;
        
        this._snackBar.open('Mensaje procesado y enviado', 'Cerrar', {
          duration: 2000,
        });
      } catch (error) {
        console.error("Error al procesar con IA:", error);
        this._snackBar.open('Error al procesar el mensaje', 'Cerrar', {
          duration: 2000,
        });
      }
    }
  }

  // Método para abrir el modal de búsqueda de YouTube
  openYoutubeSearch(): void {
    if (this.youtubeSearch) {
      this.youtubeSearch.openModal();
    } else {
      console.error('Componente de búsqueda de YouTube no disponible');
      this._snackBar.open('No se pudo abrir la búsqueda de YouTube', 'Cerrar', {
        duration: 2000,
      });
    }
  }

  // Método para verificar si es un enlace de YouTube
  isYoutubeUrl(content: string): boolean {
    return this.youtubeUrlPattern.test(content.trim());
  }

  // Método para obtener el ID del video de YouTube
  getYoutubeVideoId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }
// En member-messages.component.ts
private sanitizedUrls = new Map<string, SafeResourceUrl>();

getYoutubeEmbedUrl(videoId: string | null): SafeResourceUrl {
  if (!videoId) return this.sanitizer.bypassSecurityTrustResourceUrl('');
  
  // Buscar en caché primero
  if (!this.sanitizedUrls.has(videoId)) {
    this.sanitizedUrls.set(
      videoId, 
      this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`)
    );
  }
  
  return this.sanitizedUrls.get(videoId)!;
}
  ngOnDestroy(){
    this.mensajeriaHubService.stopHubConnection();
    this.servicioPuente.mostrarPersonaChat.set(false);
    this.servicioPuente.personaChat.set('Kairos');
    this.servicioPuente.barraInferior.set(true);
  }

}