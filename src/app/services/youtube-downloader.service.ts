import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpHeaders } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

// Interfaz que refleja exactamente la clase VideoRequest del backend
interface VideoRequest {
  url: string;
  format?: string;
  quality?: string;
}

@Injectable({
  providedIn: 'root'
})
export class YoutubeDownloaderService {
  // Asegúrate de que esta URL coincida exactamente con tu endpoint de backend
  private apiEnv = environment.apiUrl;
  private apiUrl = this.apiEnv + 'api/youtube'; 

  constructor(private http: HttpClient) { }

  getVideoInfo(url: string): Observable<any> {
    console.log('Enviando petición info a:', `${this.apiUrl}/info`);
    
    // Crear el objeto request con la misma estructura que espera el backend
    const requestData: VideoRequest = {
      url: url,
      format: 'mp4',      // Enviar los valores por defecto explícitamente
      quality: 'highest'  // para mantener consistencia con el backend
    };
    
    // Añadir un timestamp para evitar cacheo
    const timestamp = new Date().getTime();
    
    return this.http.post(`${this.apiUrl}/info?t=${timestamp}`, requestData, {
      headers: new HttpHeaders({
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      })
    }).pipe(
      catchError(error => {
        console.error('Error en getVideoInfo:', error);
        // Añadir más detalles al error para mejor diagnóstico
        const errorMessage = this.extractErrorMessage(error);
        return throwError(() => ({ 
          originalError: error,
          message: errorMessage || 'Error al obtener información del video'
        }));
      })
    );
  }

  downloadVideo(url: string, format: string = 'mp4', quality: string = 'highest'): Observable<any> {
    console.log('Enviando petición download a:', `${this.apiUrl}/download`);
    
    // Crear el objeto request con la misma estructura que espera el backend
    const requestData: VideoRequest = {
      url: url,
      format: format,
      quality: quality
    };
    
    // Añadir un timestamp para evitar cacheo
    const timestamp = new Date().getTime();
    
    return this.http.post(`${this.apiUrl}/download?t=${timestamp}`, requestData, {
      responseType: 'blob',
      observe: 'events',
      reportProgress: true,
      headers: new HttpHeaders({
        'Accept': 'video/mp4,video/webm,video/3gpp,application/octet-stream',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      })
    }).pipe(
      map(event => this.getDownloadStatus(event)),
      catchError(error => {
        console.error('Error en downloadVideo:', error);
        
        // Si el error contiene un mensaje en formato blob, leerlo
        if (error.error instanceof Blob && error.error.type === 'text/plain') {
          return new Observable(observer => {
            const reader = new FileReader();
            reader.onload = () => {
              try {
                const errorText = reader.result as string;
                error.message = errorText || error.message;
              } catch (e) {}
              observer.error(error);
              observer.complete();
            };
            reader.readAsText(error.error);
          });
        }
        
        // Añadir más detalles al error para mejor diagnóstico
        const errorMessage = this.extractErrorMessage(error);
        return throwError(() => ({ 
          originalError: error,
          message: errorMessage || 'Error al descargar el video'
        }));
      })
    );
  }

  private getDownloadStatus(event: HttpEvent<any>): any {
    switch (event.type) {
      case HttpEventType.DownloadProgress:
        if (!event.total) {
          // Si no tenemos el total, reportar un progreso indeterminado
          return { type: 'progress-indeterminate' };
        }
        const progress = Math.round(100 * event.loaded / event.total);
        return { type: 'progress', progress };
      
      case HttpEventType.Response:
        if (event.body) {
          // Verificar que el body no es un error en formato texto
          if (event.body instanceof Blob && event.body.type.startsWith('text/')) {
            return new Observable(observer => {
              const reader = new FileReader();
              reader.onload = () => {
                const text = reader.result as string;
                if (text && text.toLowerCase().includes('error')) {
                  observer.error({ message: text });
                } else {
                  this.saveFile(event.body, this.getFilenameFromResponse(event));
                  observer.next({ type: 'complete' });
                }
                observer.complete();
              };
              reader.readAsText(event.body);
            });
          }
          
          // Es un archivo válido, guardarlo
          this.saveFile(event.body, this.getFilenameFromResponse(event));
          return { type: 'complete' };
        }
        return { type: 'error', message: 'No se pudo obtener el contenido del video' };
      
      default:
        return { type: 'other' };
    }
  }

  private getFilenameFromResponse(response: any): string {
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
      if (matches != null && matches[1]) {
        return matches[1].replace(/['"]/g, '');
      }
    }
    return 'youtube-video.mp4';
  }

 // Actualiza el método saveFile en youtube-downloader.service.ts
private saveFile(blob: Blob, filename: string): void {
  // Mantener el tipo MIME original del blob en lugar de intentar cambiarlo
  console.log('Guardando archivo con tipo MIME:', blob.type);
  
  // Crear URL del blob
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  
  // Opcional: Añadir un mensaje para ayudar al usuario si tiene problemas
  console.log('Descargando archivo, si tiene problemas para reproducirlo, pruebe con VLC Media Player');
  
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
  
  private extractErrorMessage(error: any): string {
    if (!error) return 'Error desconocido';
    
    // Si es un HttpErrorResponse, extraer el mensaje más útil
    if (error.status) {
      if (error.status === 0) {
        return 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.';
      } else if (error.status === 404) {
        return 'No se pudo acceder al servicio de descarga. Verifica que el backend esté en ejecución.';
      } else if (error.status === 500) {
        // Intentar extraer el mensaje del cuerpo del error
        if (error.error && typeof error.error === 'string') {
          return error.error;
        } else if (error.error && error.error.message) {
          return error.error.message;
        } else if (error.message) {
          return error.message;
        }
        return `Error en el servidor (${error.status})`;
      }
      return `Error HTTP: ${error.status} - ${error.statusText || 'Error desconocido'}`;
    }
    
    // Si tiene un mensaje directo
    if (error.message) {
      return error.message;
    }
    
    // Si todo lo demás falla, convertir a string
    return String(error);
  }
}