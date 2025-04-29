import { Component, inject, ViewChild } from '@angular/core';
import { KeysService } from '../keys.service';
import { GenerativeModel, Part } from '@google/generative-ai';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SkeletonComponent } from '../../skeleton/skeleton/skeleton.component';
import { MatCardModule } from '@angular/material/card';
import { HeaderCardComponent } from '../../shared/header-card/header-card.component';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { IsermonResponse } from '../../interfaces/isermon-response';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { HttpClient } from '@angular/common/http';
import { Ilinks } from '../../interfaces/ilinks';
import { IRendicionCuentas } from '../../interfaces/irendicion-cuentas';
import { IOraciones } from '../../interfaces/ioraciones';
import { Iitinerarios } from '../../interfaces/I-Itinerarios';
import { IAcciones } from '../../interfaces/Iacciones';
import { IResoluciones } from '../../interfaces/iresoluciones';

interface GeminiResponse {
  endpoint: number;
  nombreEndpoint: string;
  objetoAEnviar: any;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [
    MatIconModule,
    MatButtonModule,
    FormsModule,
    CommonModule,
    SkeletonComponent,
    MatCardModule,
    HeaderCardComponent,
    MatProgressBarModule,
  ],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css'],
})
export class ChatbotComponent {
  diaDeHoy: Date = new Date();
  prompt: string = '';
  model!: GenerativeModel;
  #googleGeminiService = inject(KeysService);
  loading: boolean = false;
  chatHistory: any[] = [];

  // El prompt base para enviar a Gemini
  private basePrompt: string = `
  Eres un asistente experto en la aplicación MyKairos. Tu tarea es identificar la intención del usuario y generar un objeto JSON estructurado correctamente para interactuar con los endpoints de la API.

  INSTRUCCIONES:
  1. Analiza cuidadosamente lo que el usuario quiere hacer
  2. Identifica cuál de los siguientes endpoints debe utilizarse
  3. Genera un objeto JSON con los campos requeridos para ese endpoint
  4. Responde SOLO con el objeto JSON (sin texto adicional)
  5. Si debes colocar el dia de hoy en algun sitio, este es el dia de hoy: ${this.diaDeHoy.toString()}

  ENDPOINTS DISPONIBLES:

  1. MyLinks (POST) - Para guardar enlaces
     - Interfaz: Ilinks 
     - Campos: { Nombre: string, Descripcion: string, Stock: number, linkCompra: string, FotoPortada: string, Precio: number }
     - Si el usuario proporciona una URL sin título o descripción, genera valores apropiados basados en la URL
     - Si el usuario escribe un enlace de YouTube, web, o cualquier URL, usa este endpoint
  
  2. MyNotas (POST) - Para guardar sermones o documentos de texto
     - Interfaz: IsermonResponse
     - Campos: { titulo: string, contenido: string, dateTime: Date; contrasena: string; } //en contrasena coloca un filtro para la nota, dependiendo del contenido. El filtro debe empezar cpon IA/NOMBRE-DEL-FILTRO
     - Si el usuario quiere guardar texto, ideas, notas o sermones, usa este endpoint
  
  3. MyRendicionCuentas (POST) - Para registrar tentaciones o rendición de cuentas
     - Interfaz: IRendicionCuentas
     - Campos: { Resolucion: string, Detalles: string, FechaReunion: Date, FechaImplementacion: Date, Contexto: string }
     - Si el usuario habla sobre una lucha con tentación, pecado o caída espiritual
  
  4. MyOraciones (POST) - Para peticiones de oración
     - Interfaz: IOraciones
     - Campos: { Nombre: string, Descripcion: string }
     - Si el usuario menciona oración, petición o necesidad espiritual
  
  5. MySuscripciones (POST) - Para suscripciones a plataformas
     - Interfaz: Iitinerarios
     - Campos: { Nombre: string, Fecha: Date }
     - Si el usuario menciona suscripciones, servicios o plataformas a las que se suscribe
  
  6. MyTareas (POST) - Para tareas o pendientes
     - Interfaz: IAcciones
     - Campos: { accion: string, detalle: string, dia: Date }
     - Si el usuario habla sobre tareas, pendientes o cosas por hacer
  
  7. MyResoluciones (POST) - Para resoluciones o compromisos
     - Interfaz: IResoluciones 
     - Campos: { Nombre: string, Dia: Date }
     - Si el usuario menciona resoluciones, compromisos o propósitos
  
     8. MyDevocionales (POST) - Para devocionales personales
     - Interfaz: ImydevocionalesConsejerias
      - Campos: { //  nombre: string; //pasaje
    detalles: string; //lo que Dios me dijo
    fecha: Date; //dia
    lugar: string; //contexto
}
    - Si el usuario habla sobre devocionales, pasajes bíblicos o reflexiones espirituales

  FORMATO DE RESPUESTA:
  Debes responder únicamente con un objeto JSON estructurado así:
  {
    "endpoint": [número del endpoint 1-7],
    "nombreEndpoint": [nombre del endpoint],
    "objetoAEnviar": [objeto completo con todos los campos necesarios]
  }

  EJEMPLOS:
  
  1. Si el usuario dice: "https://youtu.be/wnHczxwukYY?si=ASHVt47tNc5ekOvf"
     Respuesta:
     {
       "endpoint": 1,
       "nombreEndpoint": "MyLinks",
       "objetoAEnviar": {
         "Nombre": "Video de YouTube",
         "Descripcion": "Video guardado desde el chatbot",
         "Stock": 0,
         "linkCompra": "https://youtu.be/wnHczxwukYY?si=ASHVt47tNc5ekOvf",
         "FotoPortada": "",
         "Precio": 0
       }
     }
  
  2. Si el usuario dice: "Hoy caí en la tentación de la pornografía"
     Respuesta:
     {
       "endpoint": 3,
       "nombreEndpoint": "MyRendicionCuentas",
       "objetoAEnviar": {
         "Resolucion": "false",
         "Detalles": "Caí en la tentación de la pornografía",
         "FechaReunion": "2025-04-18T00:00:00.000Z",
         "FechaImplementacion": "2025-04-18T00:00:00.000Z",
         "Contexto": "Pornografia"
       }
     }
  
  3. Si el usuario dice: "Necesito oración por mi familia, están pasando por problemas económicos"
     Respuesta:
     {
       "endpoint": 4,
       "nombreEndpoint": "MyOraciones",
       "objetoAEnviar": {
         "Nombre": "Oración por familia",
         "Descripcion": "Necesito oración por mi familia, están pasando por problemas económicos"
       }
     }
  `;

  constructor(
    private _snackBar: MatSnackBar,
    private servicio1Db: ServicioApi1DbService,
    private http: HttpClient
  ) {
    this.#googleGeminiService.initialize(this.#googleGeminiService.keys);
    this.model = this.#googleGeminiService.model;
  }

  ngOnInit() {}

  copyToClipboard(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this._snackBar.open('Copiado al portapapeles', 'Cerrar', {
          duration: 2000,
        });
      })
      .catch((err) => {
        console.error('Error al copiar al portapapeles', err);
        this._snackBar.open('Error al copiar', 'Cerrar', {
          duration: 2000,
        });
      });
  }

  async sendData() {
    if (this.prompt && !this.loading) {
      this.loading = true;
      let data = this.prompt;
      let parts: Part[] = [];

      // Recopila archivos subidos y crea partes para generateContent
      for (const item of this.chatHistory) {
        if (item.from === 'user' && item.type) {
          if (
            item.type === 'image' ||
            item.type === 'video' ||
            item.type === 'audio' ||
            item.type === 'document'
          ) {
            parts.push({
              inlineData: {
                mimeType: this.getFileMimeType(item.fileName),
                data: item.content.split(',')[1],
              },
            });
          }
        }
      }

      // Agregar el mensaje del usuario al historial
      this.chatHistory.push({ from: 'user', message: this.prompt });
      this.prompt = '';

      try {
        // Primera llamada a Gemini para procesar la intención del usuario
        const intentParts = [...parts];
        intentParts.push({
          text: this.basePrompt + '\n\nEntrada del usuario: ' + data,
        });

        const intentResponse = await this.model.generateContent(intentParts);
        const intentText =
          intentResponse.response.candidates![0].content.parts[0].text;

        try {
          // Intenta parsear la respuesta como JSON
          const parsedResponse: GeminiResponse = JSON.parse(
            this.cleanJsonString(intentText!)
          );
          console.log('Respuesta parseada:', parsedResponse);

          // Ejecutar la acción correspondiente según el endpoint identificado
          await this.executeAction(parsedResponse);

          // Segunda llamada a Gemini para generar una respuesta conversacional
          parts.push({ text: data });
          const conversationalResponse = await this.model.generateContent(
            parts
          );
          const textResponse =
            conversationalResponse.response.candidates![0].content.parts[0]
              .text;

          // Mostrar respuesta al usuario
          this.chatHistory.push({
            from: 'bot',
            message: `${textResponse}\n\n(He procesado tu solicitud para "${parsedResponse.nombreEndpoint}")`,
          });
        } catch (jsonError) {
          console.error('Error al parsear JSON:', jsonError);
          // Si falla el parseo, mostrar la respuesta original de Gemini
          parts.push({ text: data });
          const fallbackResponse = await this.model.generateContent(parts);
          const fallbackText =
            fallbackResponse.response.candidates![0].content.parts[0].text;
          this.chatHistory.push({ from: 'bot', message: fallbackText });
        }
      } catch (error: any) {
        console.error('Error al generar contenido:', error);
        this.chatHistory.push({
          from: 'bot',
          message: 'Error al procesar la solicitud. Intenta de nuevo.',
        });
        this._snackBar.open('Error en la solicitud', 'Cerrar', {
          duration: 2000,
        });
      } finally {
        this.loading = false;
      }
    }
  }

  // Función auxiliar para limpiar el JSON
  cleanJsonString(jsonString: string): string {
    // Encuentra el primer { y el último }
    const startIdx = jsonString.indexOf('{');
    const endIdx = jsonString.lastIndexOf('}');

    if (startIdx !== -1 && endIdx !== -1) {
      return jsonString.substring(startIdx, endIdx + 1);
    }
    return jsonString;
  }

  async executeAction(response: GeminiResponse) {
    try {
      switch (response.endpoint) {
        case 1: // MyLinks
          await this.servicio1Db.postLinks(response.objetoAEnviar).toPromise();
          this._snackBar.open('Enlace guardado correctamente', 'Cerrar', {
            duration: 2000,
          });
          break;

        case 2: // MyDocuments
          await this.servicio1Db
            .postSermones(response.objetoAEnviar)
            .toPromise();
          this._snackBar.open('Documento guardado correctamente', 'Cerrar', {
            duration: 2000,
          });
          break;

        case 3: // MyRendicionCuentas
          await this.servicio1Db
            .postTentaciones(response.objetoAEnviar)
            .toPromise();
          this._snackBar.open('Rendición de cuentas registrada', 'Cerrar', {
            duration: 2000,
          });
          break;

        case 4: // MyOraciones
          await this.servicio1Db
            .postOraciones(response.objetoAEnviar)
            .toPromise();
          this._snackBar.open('Petición de oración guardada', 'Cerrar', {
            duration: 2000,
          });
          break;

        case 5: // MySuscripciones
          await this.servicio1Db
            .postSuscripcion(response.objetoAEnviar)
            .toPromise();
          this._snackBar.open('Suscripción registrada', 'Cerrar', {
            duration: 2000,
          });
          break;

        case 6: // MyTareas
          await this.servicio1Db.postTareas(response.objetoAEnviar).toPromise();
          this._snackBar.open('Tarea guardada correctamente', 'Cerrar', {
            duration: 2000,
          });
          break;

        case 7: // MyResoluciones
          await this.servicio1Db
            .postResoluciones(response.objetoAEnviar)
            .toPromise();
          this._snackBar.open('Resolución registrada', 'Cerrar', {
            duration: 2000,
          });
          break;

        case 8: // MyDevocionales
          await this.servicio1Db
            .postDevocionales(response.objetoAEnviar)
            .toPromise();
          this._snackBar.open('Devocional guardado correctamente', 'Cerrar', {
            duration: 2000,
          });
          break;

        default:
          console.error('Endpoint no reconocido:', response.endpoint);
      }
    } catch (error) {
      console.error('Error al ejecutar la acción:', error);
      this._snackBar.open('Error al procesar la solicitud', 'Cerrar', {
        duration: 2000,
      });
    }
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const fileUrl = e.target.result as string;
        let fileType = '';
        if (file.type.startsWith('image/')) {
          fileType = 'image';
        } else if (file.type.startsWith('video/')) {
          fileType = 'video';
        } else if (file.type.startsWith('audio/')) {
          fileType = 'audio';
        } else if (
          file.type === 'text/plain' ||
          file.type === 'application/pdf'
        ) {
          fileType = 'document';
        }

        this.chatHistory.push({
          from: 'user',
          type: fileType,
          content: fileUrl,
          fileName: file.name,
        });

        this.loading = false;
      };
      reader.readAsDataURL(file);
    }
  }

  getFileMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp4':
        return 'video/mp4';
      case 'webm':
        return 'video/webm';
      case 'ogg':
        return 'video/ogg';
      case 'mp3':
        return 'audio/mpeg';
      case 'wav':
        return 'audio/wav';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'txt':
        return 'text/plain';
      case 'pdf':
        return 'application/pdf';
      default:
        return '';
    }
  }

  formatText(text: string): string {
    const placeholder = '___NEWLINE___';
    let temp = text.replace(/\n/g, placeholder);
    temp = temp
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
    return temp.replace(new RegExp(placeholder, 'g'), '<br>');
  }

  MyDocuments(contenido: string) {
    const sermon: IsermonResponse = {
      titulo: 'Mensaje MyGptKiller: ' + new Date().toString(),
      contenido: contenido,
      dateTime: new Date(),
    };
    this.servicio1Db.postSermones(sermon).subscribe((data) => {
      console.log(data);
      this._snackBar.open('Respuesta Guardada en MyDocuments', 'Cerrar', {
        duration: 2000,
      });
    });
  }

  MyDocumentsAll(conversacion: any[]) {
    const sermon: IsermonResponse = {
      titulo: 'Conversacion con MyKairos: ' + new Date().toString(),
      contenido: '',
      dateTime: new Date(),
    };
    this.chatHistory.forEach((element) => {
      console.log(element);
      sermon.contenido += `<br/><h4><b>${element.from}:</b></h4> ${element.message}`;
      console.log(sermon.contenido);
    });

    console.log(sermon);
    this.servicio1Db.postSermones(sermon).subscribe((data) => {
      console.log(data);
      this._snackBar.open('Conversacion Guardada en MyDocuments', 'Cerrar', {
        duration: 2000,
      });
    });
  }
}
