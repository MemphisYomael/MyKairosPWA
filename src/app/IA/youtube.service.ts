// youtube.service.ts (actualizado)
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class YoutubeService {
  // URL base de la API de YouTube
  private apiUrl = 'https://www.googleapis.com/youtube/v3/search';
  // Tu API key de YouTube (debes configurarla en la Google Cloud Console)
  private apiKey = 'AIzaSyDVkITwFKe8RiIve0yQaS_IpWEOmhIfkHc';

  constructor(private http: HttpClient) { }

  /**
   * Realiza la búsqueda de videos en YouTube usando solo la API Key.
   * @param query Término de búsqueda
   * @param maxResults Número máximo de resultados (por defecto 1)
   */
  searchVideos(query: string, maxResults: number = 1): Observable<any> {
    const params = new HttpParams()
      .set('part', 'snippet')
      .set('q', query)
      .set('type', 'video')
      .set('maxResults', maxResults.toString())
      .set('key', this.apiKey);
    
    return this.http.get<any>(this.apiUrl, { params });
  }
}