import { HttpRequest, HttpEvent, HttpInterceptorFn, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ServicioApi1DbService } from './servicio-api1-db.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const router = inject(Router);
  const authService = inject(ServicioApi1DbService);
  
  // Comprobamos si la URL pertenece a la API de YouTube
  if (req.url.includes('youtube')) {
    console.info('Solicitud a YouTube detectada. Se bloquea la adición del header Authorization.');
    // Retornamos la solicitud original sin modificarla para que no se le añada el token
    return next(req);
  }
  if (req.url.includes('transkriptor')) {
    console.info('Solicitud a transkriptor detectada. Se bloquea la adición del header Authorization.');
    // Retornamos la solicitud original sin modificarla para que no se le añada el token
    return next(req);
  }

  let request = req;
  
  if(!req.url.includes('youtube') && !req.url.includes('transkriptor')) {
    // Para todas las demás solicitudes, se añade el header de autorización si existe un token
    const token = localStorage.getItem('token');
    if (token) {
      request = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
  }

  // Procesar la solicitud y capturar errores de autorización
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si el error es de autorización (401), redirigir al login
      if (error.status === 401) {
        console.error('Error de autenticación detectado. Redirigiendo al login...');
        authService.logout(); // Cerrar sesión
        router.navigate(['/login']); // Redirigir al login
      }
      return throwError(() => error);
    })
  );
};