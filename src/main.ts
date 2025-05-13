import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app/app.routes'; // Importa las rutas desde el archivo
import { authInterceptor } from './app/services/auth.interceptor';
import { provideToastr } from 'ngx-toastr';
import { isDevMode } from '@angular/core';
import { provideServiceWorker } from '@angular/service-worker';

bootstrapApplication(AppComponent, {
  ...appConfig,
providers: [
  provideAnimations(), // 👈 Activa animaciones
  provideHttpClient(),
  provideToastr({
    timeOut: 3000,
    positionClass: 'toast-top-right',
    preventDuplicates: true,
    toastClass: 'ngx-toast-custom', // Clase CSS personalizada
    titleClass: 'ngx-toast-title-custom',
    messageClass: 'ngx-toast-message-custom',
    progressBar: true,
  }),
  provideRouter(appRoutes),
  provideHttpClient(withInterceptors([authInterceptor])), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
]
})
  .catch((err) => console.error(err));


