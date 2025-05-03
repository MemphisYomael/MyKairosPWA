import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { YoutubeDownloaderService } from '../../services/youtube-downloader.service';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-youtube-downloader',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './youtube-downloader.component.html',
  styleUrls: ['./youtube-downloader.component.css']
})
export class YoutubeDownloaderComponent implements OnInit {
  downloaderForm: FormGroup;
  isLoading = false;
  downloadProgress = 0;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  videoInfo: any = null;
  
  // Opciones adicionales para formato y calidad
  formatos = [
    { value: 'mp4', label: 'MP4' },
    { value: 'webm', label: 'WebM' }
  ];
  
  calidades = [
    { value: 'highest', label: 'La más alta disponible' },
    { value: 'medium', label: 'Media' },
    { value: 'lowest', label: 'Baja (más rápida)' }
  ];

  constructor(
    private fb: FormBuilder,
    private youtubeService: YoutubeDownloaderService
  ) {
    this.downloaderForm = this.fb.group({
      youtubeUrl: ['', [
        Validators.required,
        Validators.pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+/)
      ]],
      formato: ['mp4', Validators.required],
      calidad: ['highest', Validators.required]
    });
  }

  ngOnInit(): void {
  }

  onSubmit(): void {
    if (this.downloaderForm.invalid) {
      return;
    }

    const youtubeUrl = this.downloaderForm.get('youtubeUrl')?.value;
    const formato = this.downloaderForm.get('formato')?.value;
    const calidad = this.downloaderForm.get('calidad')?.value;
    
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.downloadProgress = 0;

    console.log('Iniciando descarga para URL:', youtubeUrl);
    console.log('Formato seleccionado:', formato);
    console.log('Calidad seleccionada:', calidad);

    // First get video info
    this.youtubeService.getVideoInfo(youtubeUrl).subscribe({
      next: (response: any) => {
        console.log('Video info recibida:', response);
        this.videoInfo = response;
        this.downloadVideo(youtubeUrl, formato, calidad);
      },
      error: (error: any) => {
        console.error('Error en getVideoInfo:', error);
        this.handleError(error);
      }
    });
  }

  downloadVideo(url: string, formato: string, calidad: string): void {
    console.log('Iniciando descarga del video:', url);
    
    this.youtubeService.downloadVideo(url, formato, calidad).subscribe({
      next: (event: any) => {
        console.log('Evento de descarga recibido:', event);
        if (event.type === 'progress') {
          this.downloadProgress = event.progress;
        } else if (event.type === 'complete') {
          this.isLoading = false;
          this.successMessage = '¡Video descargado exitosamente!';
        }
      },
      error: (error: any) => {
        console.error('Error en downloadVideo:', error);
        this.handleError(error);
      }
    });
  }

  private handleError(error: any): void {
    this.isLoading = false;
    
    // Extraer mensaje de error más específico
    if (error instanceof HttpErrorResponse) {
      if (error.status === 404) {
        this.errorMessage = 'No se pudo acceder al servicio de descarga. Por favor verifica que el backend esté en ejecución.';
      } else if (error.status === 500) {
        this.errorMessage = 'Error en el servidor: ' + (error.error?.message || error.message);
      } else {
        this.errorMessage = `Error HTTP: ${error.status} - ${error.statusText}`;
      }
    } else {
      this.errorMessage = error.message || 'Ocurrió un error durante la descarga. Por favor intenta nuevamente.';
    }
    
    // Si hay un cuerpo de error en formato blob, intentar leerlo para mostrar más detalles
    if (error.error instanceof Blob && error.error.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = () => {
        const errorText = reader.result as string;
        if (errorText) {
          this.errorMessage += ` Detalles: ${errorText}`;
        }
        console.error('Error completo:', this.errorMessage);
      };
      reader.readAsText(error.error);
    } else {
      console.error('Error:', error);
    }
  }

  resetForm(): void {
    this.downloaderForm.reset({
      formato: 'mp4',
      calidad: 'highest'
    });
    this.errorMessage = null;
    this.successMessage = null;
    this.videoInfo = null;
    this.downloadProgress = 0;
  }
}