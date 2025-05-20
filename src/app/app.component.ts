import { StatusBar } from '@capacitor/status-bar';
import { ServicioApi1DbService } from './services/servicio-api1-db.service';
import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  inject,
  Inject,
  Input,
  PLATFORM_ID,
  Renderer2,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LocalNotifications } from '@capacitor/local-notifications';
import { CommonModule, isPlatformBrowser, Location } from '@angular/common';
import { FroalaEditorModule, FroalaViewModule } from 'angular-froala-wysiwyg';
import { MatDialog } from '@angular/material/dialog';
import { ChatbotComponent } from './IA/chatbot/chatbot.component';
import { ComunicacionEntreComponentesService } from './services/comunicacion-entre-componentes.service';
import { MessageService } from './services/message.service';
import { MatBadgeModule } from '@angular/material/badge';
import { CallService } from './call/call.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Capacitor } from '@capacitor/core';
import { ToastrService } from 'ngx-toastr';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { AvisoDeAIntalarAppComponent } from './shared/aviso-de-a-intalar-app/aviso-de-a-intalar-app.component';

// Exponer LocalNotifications para acceder en la consola
(window as any).LocalNotifications = LocalNotifications;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    MatProgressSpinner,
    MatBadgeModule,
    RouterLinkActive,
    FroalaEditorModule,
    FroalaViewModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    RouterOutlet,
    RouterLink,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements AfterViewInit {
  userName = signal<string | null>(null);
  isDesktop = false; // Añadido: propiedad para controlar si es desktop o móvil

  navItems = [
    { path: '/vida-espiritual', icon: 'favorite', label: 'Vida Espiritual' },
    { path: '/organizacion', icon: 'list_alt', label: 'Organización' },
    { path: '/economia', icon: 'attach_money', label: 'Finanzas' },
    { path: '/ia', icon: 'smart_toy', label: 'IA' },
  ];

  private dialog = inject(MatDialog);

  constructor(
    public servicioPuente: ComunicacionEntreComponentesService,
    public messageService: MessageService,
    private el: ElementRef,
    private renderer: Renderer2,
    private location: Location,
    @Inject(PLATFORM_ID) private platformId: Object,
    public servicio1Db: ServicioApi1DbService,
    private callService: CallService,
    private snackBar: MatSnackBar,
    private toastr: ToastrService
  ) {
    this.userName.set(this.servicio1Db.username());

    // Escuchar llamadas entrantes
    this.callService.onIncomingCall().subscribe((call) => {
      if (call) {
        this.showIncomingCallNotification(call);
      }
    });

    // Detectar si es un dispositivo de escritorio basado en el ancho de pantalla
    this.checkScreenSize();
  }

  // Método para detectar el tamaño de pantalla y decidir si mostrar versión escritorio o móvil
  checkScreenSize(): void {
    // Si la plataforma es un navegador, comprobamos el ancho de la pantalla
    if (isPlatformBrowser(this.platformId)) {
      this.isDesktop = window.innerWidth >= 992; // Consideramos desktop si el ancho es >= 992px
    } else {
      // Si no es un navegador (ej. nativo), asumimos que es móvil
      this.isDesktop = false;
    }
  }

  isPWA(): boolean {
    const isStandalone = window.matchMedia(
      '(display-mode: standalone)'
    ).matches;

    const isIOSStandalone = (window.navigator as any).standalone === true;

    return isStandalone || isIOSStandalone;
  }

  // Escuchar cambios en el tamaño de la ventana
  @HostListener('window:resize', ['$event'])
  onResize(): void {
    this.checkScreenSize();
  }

  ngAfterViewInit() {
    this.userName.set(this.servicio1Db.username());
    this.updatePosition();
  }

  atras() {
    this.location.back();
  }

  title = 'myAppSt';
  cambiarColorBarra = async () => {};

  async configureStatusBar() {
    try {
      await StatusBar.setBackgroundColor({ color: '#6a11cb' });
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch (err) {
      console.log('no se pudo configurar el status bar', err);
    }
  }

  abrirDialogInstalarApp() {
    this.dialog.open(AvisoDeAIntalarAppComponent, {
      width: '90%',
      height: '450px',
      panelClass: 'custom-dialog-container', // Añadida clase personalizada
      disableClose: true,
    });
  }

  async ngOnInit() {
    // Ejemplo de uso:
    if (this.isPWA()) {
      //   console.log('La app está corriendo como PWA (instalada).');
    } else {
      this.abrirDialogInstalarApp();
      // this.toastr.info(
      //   'Esta es una app hibrida que puede ser instalada en tu dispositivo<br>' +
      //   '✅ USARLA SIN CONEXIÓN A INTERNET!!!<br><br>' +
      //     '✅ Agregar notas, devocionales, links... y consultar tu informacion TODO SIN INTERNET!<br><br>' +

      //   '📱 En Android: busca la opción "Agregar a inicio"<br>' +
      //   '🍏 En iOS: usa "Compartir" y luego elige "Instalar"<br>',
      //   '📦 ¡Instala la APP! (PWA)',
      //   {
      //     progressAnimation: 'decreasing',
      //     closeButton: true,
      //     enableHtml: true,  // 👉 necesario para que se rendericen los <br>
      //     progressBar: true,   // opcional: barra de progreso
      //       timeOut: 15000,
      //       positionClass: 'toast-top-right',
      //     });

      //   console.log('La app está corriendo en el navegador.');
    }
    if (Capacitor.isNativePlatform()) {
      await this.configureStatusBar();
    }
    (window as any).global = window;

    if (isPlatformBrowser(this.platformId)) {
      // Import all Froala Editor plugins.
      // @ts-ignore
      import('froala-editor/js/plugins.pkgd.min.js');

      // Import a single Froala Editor plugin.
      // @ts-ignore
      import('froala-editor/js/plugins/align.min.js');

      // Import a Froala Editor language file.
      // @ts-ignore
      import('froala-editor/js/languages/de.js');

      // Import a third-party plugin.
      // @ts-ignore
      import('froala-editor/js/third_party/font_awesome.min');
      // @ts-ignore
      import('froala-editor/js/third_party/spell_checker.min');
      // @ts-ignore
      import('froala-editor/js/third_party/embedly.min');
    }

    // Verificamos el tamaño de pantalla al inicio
    this.checkScreenSize();
  }

  @Input() icon = 'add'; // Icono predeterminado, puedes cambiarlo

  // Estado para controlar el arrastre
  private isDragging = false;
  private initialX = 0;
  private initialY = 0;
  private currentX = 20; // Posición inicial X
  private currentY = -400; // Posición inicial Y

  onDragStart(event: MouseEvent) {
    this.isDragging = true;
    this.initialX = event.clientX - this.currentX;
    this.initialY = event.clientY - this.currentY;
    event.preventDefault();
  }

  onTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      this.isDragging = true;
      this.initialX = event.touches[0].clientX - this.currentX;
      this.initialY = event.touches[0].clientY - this.currentY;
      event.preventDefault();
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      this.currentX = event.clientX - this.initialX;
      this.currentY = event.clientY - this.initialY;
      this.updatePosition();
    }
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent) {
    if (this.isDragging && event.touches.length === 1) {
      this.currentX = event.touches[0].clientX - this.initialX;
      this.currentY = event.touches[0].clientY - this.initialY;
      this.updatePosition();
      event.preventDefault(); // Prevenir scroll mientras se arrastra
    }
  }

  getUserInitial(): string {
    if (this.userName() && this.userName()!.length > 0) {
      return this.userName()!.charAt(0);
    }
    return 'U'; // 'U' para usuario por defecto
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isDragging = false;
  }

  @HostListener('document:touchend')
  onTouchEnd() {
    this.isDragging = false;
  }

  private updatePosition() {
    this.renderer.setStyle(
      this.el.nativeElement.querySelector('.button-container'),
      'transform',
      `translate(${this.currentX}px, ${this.currentY}px)`
    );
  }

  openKairos() {
    this.dialog.open(ChatbotComponent, {
      width: '100%',
      height: '550px',
      // maxWidth: '100vw',
      // maxHeight: '100vh'
    });
  }

  private showIncomingCallNotification(call: { callId: string; from: string }) {
    const snackBarRef = this.snackBar.open(
      `Llamada entrante de ${call.from}`,
      'Responder',
      {
        duration: 10000,
      }
    );

    snackBarRef.onAction().subscribe(() => {
      this.callService.acceptCall(call.callId).catch((err) => {
        console.error('Error al aceptar la llamada:', err);
      });
    });

    snackBarRef.afterDismissed().subscribe((info) => {
      if (!info.dismissedByAction) {
        this.callService.rejectCall(call.callId).catch((err) => {
          console.error('Error al rechazar la llamada:', err);
        });
      }
    });
  }
}
