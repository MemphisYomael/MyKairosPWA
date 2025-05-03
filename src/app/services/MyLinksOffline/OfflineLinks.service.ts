import { Injectable } from '@angular/core';
import { Storage } from '@capacitor/storage';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { v4 as uuidv4 } from 'uuid';
import { ServicioApi1DbService } from '../servicio-api1-db.service';
import { Ilinks } from '../../interfaces/ilinks';

@Injectable({
  providedIn: 'root'
})
export class OfflineLinksService {
  private offlineLinks = new BehaviorSubject<Ilinks[]>([]);
  private offlineEdits = new BehaviorSubject<Ilinks[]>([]);
  
  constructor(
    private api1DbService: ServicioApi1DbService,
    private http: HttpClient
  ) {
    this.loadOfflineData();
  }

  async loadOfflineData() {
    // Cargar enlaces creados offline
    const { value: offlineLinksValue } = await Storage.get({ key: 'offline-links' });
    if (offlineLinksValue) {
      this.offlineLinks.next(JSON.parse(offlineLinksValue));
    }

    // Cargar ediciones offline
    const { value: offlineEditsValue } = await Storage.get({ key: 'offline-edits' });
    if (offlineEditsValue) {
      this.offlineEdits.next(JSON.parse(offlineEditsValue));
    }
  }

  getOfflineLinks(): Observable<Ilinks[]> {
    return this.offlineLinks.asObservable();
  }

  getOfflineEdits(): Observable<Ilinks[]> {
    return this.offlineEdits.asObservable();
  }

  async addOfflineLink(link: Ilinks): Promise<Ilinks> {
    // Generar un ID temporal para identificar el link mientras está offline
    const tempLink: Ilinks = {
      ...link,
      id: `offline-${uuidv4()}`,  // ID temporal con prefijo para identificarlo
      isOffline: true             // Marca para identificar que es un link creado offline
    };

    const currentLinks = this.offlineLinks.value;
    const updatedLinks = [...currentLinks, tempLink];
    
    // Guardar en el BehaviorSubject
    this.offlineLinks.next(updatedLinks);
    
    // Guardar en el Storage
    await Storage.set({
      key: 'offline-links',
      value: JSON.stringify(updatedLinks)
    });

    return tempLink;
  }

  async addOfflineEdit(link: Ilinks): Promise<Ilinks> {
    const currentEdits = this.offlineEdits.value;
    
    // Verificar si ya existe una edición para este link
    const existingEditIndex = currentEdits.findIndex(edit => edit.id === link.id);
    
    let updatedEdits;
    if (existingEditIndex >= 0) {
      // Actualizar la edición existente
      updatedEdits = [...currentEdits];
      updatedEdits[existingEditIndex] = link;
    } else {
      // Agregar nueva edición
      updatedEdits = [...currentEdits, { ...link, isOfflineEdit: true }];
    }
    
    // Guardar en el BehaviorSubject
    this.offlineEdits.next(updatedEdits);
    
    // Guardar en el Storage
    await Storage.set({
      key: 'offline-edits',
      value: JSON.stringify(updatedEdits)
    });

    return link;
  }

  async syncOfflineData(): Promise<boolean> {
    if (!navigator.onLine) {
      console.log('No hay conexión a Internet, no se puede sincronizar');
      return false;
    }

    try {
      // Sincronizar creaciones offline
      const offlineLinks = this.offlineLinks.value;
      for (const link of offlineLinks) {
        // Eliminar propiedades temporales antes de enviar
        const { id, isOffline, ...cleanLink } = link;
        
        await this.api1DbService.postLinks(cleanLink).toPromise();
      }
      
      // Limpiar links offline después de sincronizar
      this.offlineLinks.next([]);
      await Storage.set({
        key: 'offline-links',
        value: JSON.stringify([])
      });

      // Sincronizar ediciones offline
      const offlineEdits = this.offlineEdits.value;
      for (const link of offlineEdits) {
        console.log(link)
        // Eliminar propiedad de marca antes de enviar
        const { isOfflineEdit, ...cleanLink } = link;
        console.log(cleanLink)
        await this.api1DbService.putLink(cleanLink).toPromise();
      }
      
      // Limpiar ediciones offline después de sincronizar
      this.offlineEdits.next([]);
      await Storage.set({
        key: 'offline-edits',
        value: JSON.stringify([])
      });

      return true;
    } catch (error) {
      console.error('Error al sincronizar datos offline:', error);
      return false;
    }
  }

  async clearOfflineData() {
    this.offlineLinks.next([]);
    this.offlineEdits.next([]);
    
    await Storage.set({
      key: 'offline-links',
      value: JSON.stringify([])
    });
    
    await Storage.set({
      key: 'offline-edits',
      value: JSON.stringify([])
    });
  }

  // Verificar si hay datos pendientes de sincronización
  hasPendingSync(): boolean {
    return this.offlineLinks.value.length > 0 || this.offlineEdits.value.length > 0;
  }

  // Contar elementos pendientes de sincronización
  getPendingSyncCount(): number {
    return this.offlineLinks.value.length + this.offlineEdits.value.length;
  }
}