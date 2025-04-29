import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ServicioApi1DbService } from '../services/servicio-api1-db.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(ServicioApi1DbService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // El usuario está autenticado, permitir el acceso
    return true;
  } else {
    // El usuario no está autenticado, redirigir al login
    router.navigate(['/login']);
    return false;
  }
};