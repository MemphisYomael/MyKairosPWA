import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GeminiService } from '../../services/gemini.service';
import { SkeletonComponent } from '../../skeleton/skeleton/skeleton.component';
import { HeaderCardComponent } from "../../shared/header-card/header-card.component";
import { MatCardContent, MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { HeaderCardRedComponent } from "../../shared/header-card-red/header-card-red.component";

@Component({
  selector: 'app-gemini-chat-bot',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, SkeletonComponent, FormsModule, CommonModule, HeaderCardComponent, MatCardContent, MatCardModule, MatProgressBarModule, HeaderCardRedComponent],
  templateUrl: './fotos-a-texto.component.html',
  styleUrls: ['./fotos-a-texto.component.css']
})
export class FotosATextoComponent {
  fileSelected = signal<boolean>(false);
  title = 'gemini-inte';
  prompt: string = '';
  geminiService: GeminiService = inject(GeminiService);
  loading: boolean = false;
  chatHistory: any[] = [];
  promptUser: string = '';
  // Aquí almacenas tu API Key
  apiKey: string = 'AIzaSyCz8H6WzTpEXGqL1cblaaWAnd1AYQNmrtk';

  constructor(private _snackBar: MatSnackBar) {
    this.geminiService.getMessageHistory().subscribe((res) => {
      if (res) {
        this.chatHistory.push(res);
      }
    });
  }

  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this._snackBar.open('Copiado al portapapeles', 'Cerrar', {
        duration: 2000,
      });
    }).catch(err => {
      console.error('Error al copiar al portapapeles', err);
      this._snackBar.open('Error al copiar', 'Cerrar', {
        duration: 2000,
      });
    });
  }
  async sendData() {
    if (!this.loading) {
      this.loading = true;
      const data =`Este es el texto extraido de una imagen: ${this.prompt}. Y esta es la peticion del usuario: ${this.promptUser}. `;
      // this.chatHistory.push({ from: 'user', message: data });
      this.promptUser = '';
      await this.geminiService.generateText(data);
      this.loading = false;
    }
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.fileSelected.set(true);
      const reader = new FileReader();
      reader.onload = async (e: any) => {
        const fileUrl = e.target.result;
        let fileType = '';
        if (file.type.startsWith('image/')) {
          fileType = 'image';
        } else if (file.type.startsWith('video/')) {
          fileType = 'video';
        } else if (file.type.startsWith('audio/')) {
          fileType = 'audio';
        }

        this.chatHistory.push({
          from: 'user',
          type: fileType,
          content: fileUrl,
          fileName: file.name
        });

        if (fileType === 'image') {
          this.loading = true;
          const base64Image = fileUrl.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
          const requestPayload = {
            requests: [{
              image: { content: base64Image },
              features: [{ type: 'TEXT_DETECTION' }]
            }]
          };

          try {
            const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestPayload)
            });
            const data = await response.json();

            const detectedText = data.responses?.[0]?.textAnnotations?.[0]?.description || 'No se detectó texto';
            const analysis = this.analyzeInvoiceText(detectedText);
            this.chatHistory.push({ from: 'bot', message: analysis });
          } catch (error) {
            console.error('Error en Google Vision API:', error);
            this.chatHistory.push({ from: 'bot', message: 'Hubo un error al procesar la imagen con Vision API.' });
          }
          this.loading = false;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  analyzeInvoiceText(text: string): string {
    let invoiceNumber = 'No encontrado';
    let date = 'No encontrada';
    let total = 'No encontrado';

    const invoiceMatch = text.match(/factura\s*[:\-]?\s*(\w+)/i);
    if (invoiceMatch && invoiceMatch[1]) invoiceNumber = invoiceMatch[1];

    const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
    if (dateMatch && dateMatch[1]) date = dateMatch[1];

    const totalMatch = text.match(/total\s*[:\-]?\s*([\d.,]+)/i);
    if (totalMatch && totalMatch[1]) total = totalMatch[1];

    this.prompt = text;
    // Se reemplazan los saltos de línea por <br> y se remueven asteriscos
    return `Texto extraído:<br>${this.formatText(text)}`;
  }

  getFileMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'mp4': return 'video/mp4';
      case 'webm': return 'video/webm';
      case 'ogg': return 'video/ogg';
      case 'mp3': return 'audio/mpeg';
      case 'wav': return 'audio/wav';
      default: return '';
    }
  }

  formatText(text: string) {
    return text.replaceAll('*', '').replace(/\n/g, '<br>');
  }
}
