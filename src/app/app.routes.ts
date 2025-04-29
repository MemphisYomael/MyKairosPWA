import { ChatbotComponent } from './IA/chatbot/chatbot.component';
import { GeminiApp1Component } from './IA/gemini-app-1/gemini-app-1.component';
import { Routes } from '@angular/router';
import { LoginComponent } from './user/login/login.component';
import { TareasComponent } from './components/tareas/tareas.component';
import { FinanzasComponent } from './components/finanzas/finanzas.component';
import { CrearIngresoEgresoComponent } from './shared/crear-ingreso-egreso/crear-ingreso-egreso.component';
import { EditorTextoComponent } from './components/editor-texto/editor-texto.component';
import { MyDevocionalesComponent } from './components/my-devocionales/my-devocionales.component';
import { MySuscripcionsComponent } from './components/my-suscripcions/my-suscripcions.component';
import { MyLinksComponent } from './components/my-links/my-links.component';
import { MyOracionesComponent } from './components/my-oraciones/my-oraciones.component';
import { MyResolucionesComponent } from './components/my-resoluciones/my-resoluciones.component';
import { UtilidadesComponent } from './shared/utilidades/utilidades.component';
import { InicioComponent } from './shared/inicio/inicio.component';
import { RendicionCuentasComponent } from './components/rendicion-cuentas/rendicion-cuentas.component';
import { VidaEspiritualComponent } from './user/vida-espiritual/vida-espiritual.component';
import { OrganizacionComponent } from './user/organizacion/organizacion.component';
import { IAComponent } from './user/ia/ia.component';
import { EconomiaComponent } from './user/economia/economia.component';
import { FotosATextoComponent } from './IA/fotos-a-texto/fotos-a-texto.component';
import { MyComponent } from './speechToText/my/my.component';
import { FullscreenMapPageComponent } from './maps/fullscreen-map-page/fullscreen-map-page.component';
import { MarkerPageComponent } from './maps/marker-page/marker-page.component';
import { HousesPageComponent } from './maps/houses-page/houses-page.component';
import { HeaderComponent } from './shared/header/header.component';
import { UserDetailComponent } from './components/user-detail/user-detail.component';
import { UserEditComponent } from './components/user-edit/user-edit.component';
import { EditorInicioComponent } from './components/editor-inicio/editor-inicio.component';
import { MessagesComponent } from './components/messages/messages.component';
import { MemberMessagesComponent } from './components/member-messages/member-messages.component';
import { authGuard } from './guard/auth.guard';
import { loginGuard } from './guard/login.guard';
import { PaymentViewComponent } from './payments/payment-view/payment-view.component';

export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  // Rutas protegidas con authGuard
  { 
    path: '',
    canActivate: [authGuard],
    children: [
      { path: 'tareas', component: TareasComponent },
      { path: 'finanzas', component: FinanzasComponent },
      { path: 'finanzas/crear', component: CrearIngresoEgresoComponent },
      { path: 'editor/:id', component: EditorTextoComponent },
      { path: 'my-devocionales', component: MyDevocionalesComponent },
      { path: 'my-suscripciones', component: MySuscripcionsComponent },
      { path: 'my-links', component: MyLinksComponent },
      { path: 'my-oraciones', component: MyOracionesComponent },
      { path: 'my-resoluciones', component: MyResolucionesComponent },
      { path: 'my-utilidades', component: UtilidadesComponent },
      { path: '', component: InicioComponent },
      { path: 'my-batalla', component: RendicionCuentasComponent },
      { path: 'my-editor-inicio', component: EditorInicioComponent },
      { path: 'gemini', component: GeminiApp1Component },
      { path: 'vida-espiritual', component: VidaEspiritualComponent },
      { path: 'organizacion', component: OrganizacionComponent },
      { path: 'economia', component: EconomiaComponent },
      { path: 'ia', component: IAComponent },
      { path: 'image', component: FotosATextoComponent },
      { path: 'chat-bot', component: ChatbotComponent },
      { path: 'speech', component: MyComponent },
      { path: 'fullscreen-map', component: FullscreenMapPageComponent },
      { path: 'markers-map', component: MarkerPageComponent },
      { path: 'houses-map', component: HousesPageComponent },
      { path: 'user-detail', component: UserDetailComponent },
      { path: 'user-edit', component: UserEditComponent },
      { path: 'messages', component: MessagesComponent },
      { path: 'member/:id', component: MemberMessagesComponent },
      { path: 'payment', component: PaymentViewComponent },

      
    ]
  },

  // Ruta wildcard para redirigir cualquier otra ruta no definida
  { path: '**', redirectTo: '', pathMatch: 'full' }
];