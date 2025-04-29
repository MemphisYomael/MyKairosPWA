import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../services/audio.service';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-my',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './my.component.html',
  styleUrl: './my.component.css'
})
export class MyComponent {
  selectedFile: File | null = null;
  transcription: string = '';
  isLoading: boolean = false;
  error: string | null = null;
  uploadProgress: number = 0; // Add progress tracking

  constructor(private audioService: AudioService) { }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  async uploadFile() {
    if (this.selectedFile) {
      this.isLoading = true;
      this.error = null;
      this.uploadProgress = 0; // Reset progress

      try {
        const transcription = await this.audioService.uploadAudioFile(this.selectedFile, (progress) => {
          this.uploadProgress = progress;
        }).toPromise();

        this.transcription = transcription.transcription;
        this.isLoading = false;
      } catch (err: any) {
        console.error('Error uploading audio:', err);
        this.error = 'Error transcribing audio. Please try again.';
        this.isLoading = false;
      }
    } else {
      this.error = 'Please select an audio file.';
    }
  }
}