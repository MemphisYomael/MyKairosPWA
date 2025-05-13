import { Injectable, signal } from '@angular/core';
import { IsermonResponse } from '../interfaces/isermon-response';

@Injectable({
  providedIn: 'root'
})
export class ComunicacionEntreComponentesService {

  public barraSuperior = signal(true);
  public barraInferior = signal(true);
  public mostrarPersonaChat = signal(false);
  public personaChat = signal('Memphis');
  public chatBotFloat = signal(true);
  // Añadir señal para almacenar y compartir el sermón actual
  public sermonActual = signal<IsermonResponse | null>(null);

  constructor() { }
}