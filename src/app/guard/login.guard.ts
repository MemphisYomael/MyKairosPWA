import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ServicioApi1DbService } from '../services/servicio-api1-db.service';

export const loginGuard: CanActivateFn = (route, state) => {
  const authService = inject(ServicioApi1DbService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // El usuario ya está autenticado, redirigir a la ruta por defecto
    router.navigate(['user-edit']); // Cambia esto a la ruta que prefieras, por ejemplo '/vida-espiritual'
    return false;
  } else {
    // El usuario no está autenticado, permitir acceso al login
    return true;
  }
};