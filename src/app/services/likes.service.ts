import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class LikesService {
  baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  public likeIds = signal<string[]>([]);
  public listaParametro = signal<any[]>([]);
  
  toggleLike(targetId: string) {
    return this.http.post(`${this.baseUrl}api/likes/${targetId}`, {});
  }

  getLikes(predicate: string) {
    return this.http.get(`${this.baseUrl}api/likes?predicate=${predicate}`);
  }

  getMutual() {
    return this.http.get(`${this.baseUrl}api/likes?predicate=Mutual`).subscribe((data: any) => {
      console.log("Mutuals: ", data);
      this.listaParametro.set(data);
    })
  }

  getLikeIds() {
    return this.http.get<string[]>(`${this.baseUrl}api/likes/list`).subscribe({
      next: (ids) => {
        this.likeIds.set(ids);
      },
    });
  }

  buscarUsuarios(busqueda: string) {
    return this.http.get<any>(
      `${this.baseUrl}api/likes/users?busqueda=${busqueda}`
    );
  }
}
