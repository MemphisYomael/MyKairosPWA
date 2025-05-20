import { Injectable, signal } from '@angular/core';
import { IsermonResponse } from '../interfaces/isermon-response';

@Injectable({
  providedIn: 'root'
})
export class ComunicacionEntreComponentesService {
 public isDesktop = false;
public barraLateral = signal(true);
  public barraSuperior = signal(true);
  public barraInferior = signal(true);
  public mostrarPersonaChat = signal(false);
  public personaChat = signal('Memphis');
  public chatBotFloat = signal(true);
  // Añadir señal para almacenar y compartir el sermón actual
  public sermonActual = signal<IsermonResponse | null>(null);

  public cargandoPeticion = signal(true);
  constructor() { }
}