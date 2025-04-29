import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpEventType } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private apiUrl = 'http://localhost:5046/api/usuario/transcribe-audio-file';
  private token = localStorage.getItem('token');

  constructor(private http: HttpClient) { }

  uploadAudioFile(file: File, progressCallback?: (progress: number) => void): Observable<any> {
    const chunkSize = 1024 * 1024; // 1MB chunks
    let start = 0;
    let end = chunkSize;
    let chunkNumber = 0;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const uploadSubject = new Subject<any>();

    const uploadChunk = () => {
      if (start >= file.size) {
        uploadSubject.complete();
        return;
      }

      const chunk = file.slice(start, end);
      const formData = new FormData();
      formData.append('audioFile', chunk, `audio_chunk_${chunkNumber}`);
      formData.append('totalChunks', totalChunks.toString());
      formData.append('chunkNumber', chunkNumber.toString());

      const headers = new HttpHeaders({
        'Authorization': `Bearer ${this.token}`
      });

      this.http.post(this.apiUrl, formData, {
        headers: headers,
        reportProgress: true,
        observe: 'events'
      }).subscribe(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = Math.round((event.loaded / file.size) * 100);
          if (progressCallback) {
            progressCallback(progress);
          }
        } else if (event.type === HttpEventType.Response) {
          chunkNumber++;
          start = end;
          end += chunkSize;
          uploadChunk();
          if (chunkNumber === totalChunks){
            uploadSubject.next(event.body);
          }
        }
      }, error => {
        uploadSubject.error(error);
      });
    };

    uploadChunk();

    return uploadSubject.asObservable();
  }
}