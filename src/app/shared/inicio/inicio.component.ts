import { ToastrService } from 'ngx-toastr';
import { LikesService } from './../../services/likes.service';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MensajeriaHubsService } from '../../services/mensajeria-hubs.service';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { MatChipsModule } from '@angular/material/chips';
import { MessageService, UnreadMessageCount } from '../../services/message.service';
import { MatBadgeModule } from '@angular/material/badge';

export interface UserData {
  claveAcceso: string | null;
  cursos: any | null;
  suscription: boolean;
  fechaSuscripcion: string;
  fechaCreacionCuenta: string;
  codigoSuscripcion: string | null;
  usuarioAsociado: any | null;
  partner: any | null;
  id: string;
  userName: string;
  normalizedUserName: string;
  email: string;
  normalizedEmail: string;
  emailConfirmed: boolean;
  passwordHash: string;
  securityStamp: string;
  concurrencyStamp: string;
  phoneNumber: string | null;
  phoneNumberConfirmed: boolean;
  twoFactorEnabled: boolean;
  lockoutEnd: string | null;
  lockoutEnabled: boolean;
  accessFailedCount: number;
}

@Component({
  selector: 'app-inicio',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    CommonModule,
    MatChipsModule,
    RouterLink,
    MatBadgeModule
  ],
  templateUrl: './inicio.component.html',
  styleUrls: ['./inicio.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioComponent implements OnInit {
  cargando = signal<boolean>(false);
  private searchSubject = new Subject<string>();
  searchTerm: string = '';

  likeIds = signal<string[]>([]);
  hasLiked = computed(() => this.likeIds().includes(this.member()?.id ?? ''));

  LikesService = inject(LikesService);
  private route = inject(ActivatedRoute);
  private ToastrService = inject(ToastrService);
  usuarioSesion = signal<string | null>(null);
  // Signal que almacena el listado de usuarios
  users = signal<UserData[]>([]);
  // Inyección del servicio de presencia (marcado como público para usar en la plantilla)
  public presenceService = inject(MensajeriaHubsService);
  // Signal que almacena el usuario actual (miembro)
  member = signal<UserData | null>(null);
  // Computed que verifica si el usuario actual está online
  isOnline = computed(() => {
    const currentMember = this.member();
    if (!currentMember) return false;
    return this.presenceService.onlineUsers().includes(currentMember.id);
  });
  // Computed que verifica la autenticación
  isAuthenticated = computed(() => this.serviceGlobal.isAuthenticated());

  constructor(
    public serviceGlobal: ServicioApi1DbService,
    private router: Router,
    public messageService: MessageService
  ) {}

  ngOnInit() {
    this.LikesService.getMutual();
    this.LikesService.getLikeIds();
    this.likeIds.set(this.LikesService.likeIds());
    this.usuarioSesion.set(this.serviceGlobal.username());
    
    // Obtenemos los mensajes no leídos y mensajes del inbox
    this.messageService.getMessages('Unread');
    this.messageService.getMessages('Inbox');
    
    // Inicia la conexión para recibir actualizaciones de mensajes no leídos
    if (this.serviceGlobal.isAuthenticated()) {
      this.messageService.createMainHubConnection();
    }
    
    this.alternar();
    
    // Crea la conexión del hub si el usuario está autenticado
    if (this.serviceGlobal.isAuthenticated()) {
      this.presenceService.createHubConnection(this.serviceGlobal.getToken());
    }

    this.searchSubject.pipe(
      debounceTime(300), // Espera 300ms sin cambios antes de emitir
      distinctUntilChanged()
    ).subscribe(searchText => {
      this.searchTerm = searchText;
      this.performSearch(searchText);
    });
  }

  // Método para obtener el contador de mensajes no leídos para un usuario específico
  getUnreadCount(username: string): number {
    const userCount = this.messageService.unreadMessageCounts().find(
      count => count.username === username
    );
    return userCount ? userCount.count : 0;
  }

  // Función simple para asignar un color a partir de la inicial del username.
  getColor(username: string): string {
    const initial = username.charAt(0).toUpperCase();
    // Definir un objeto con colores para algunas letras o calcularlo dinámicamente.
    const colorMap: { [key: string]: string } = {
      A: '#f44336',
      B: '#e91e63',
      C: '#9c27b0',
      D: '#673ab7',
      E: '#3f51b5',
      F: '#2196f3',
      G: '#03a9f4',
      H: '#00bcd4',
      I: '#009688',
      J: '#4caf50',
      K: '#8bc34a',
      L: '#cddc39',
      M: '#ffeb3b',
      N: '#ffc107',
      O: '#ff9800',
      P: '#ff5722',
      Q: '#795548',
      R: '#9e9e9e',
      S: '#607d8b',
      // Agrega más letras según convenga.
    };
    // Retorna el color mapeado o un color por defecto.
    return colorMap[initial] || '#607d8b';
  }

  // Función para cargar los usuarios
  loadUsers() {
    this.cargando.set(true);
    this.users.set([]);
    this.serviceGlobal.getUsers().subscribe((data: any) => {
      console.log(data);
      this.users.set(data.reverse());
      this.cargando.set(false);
    });
    this.cargando.set(false);
  }

  // Función para recargar la lista de usuarios
  contador = signal<1 | 2 | 3 | 4>(4);
  alternar(conteo?: 1 | 2 |3 | 4) {
    if(conteo != null ) {
      this.contador.set(conteo)
    };

    switch (this.contador()) {
      case 1:
        // this.loadUsers();
        this.loadLikes("");
        break;
      case 2:
        this.predicate.set('liked');
        this.loadLikes(this.predicate());
        break;
      case 3:
        this.predicate.set('likedBy');
        this.loadLikes(this.predicate());
        break;
      case 4:
        this.cargando.set(true);
        this.predicate.set('mutual');
        this.loadLikes(this.predicate());
        this.cargando.set(false)
        break;
    }
  }

  navegar(user: UserData) {
    this.router.navigate(['/user-detail'], {
      queryParams: {
        userId: user.id,
        userName: user.userName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        suscription: user.suscription,
        fechaCreacionCuenta: user.fechaCreacionCuenta,
        partner: user.usuarioAsociado,
      },
    });
  }

  predicate = signal<string>('liked');
  loadLikes(predicado: string) {
    this.LikesService.getLikes(predicado).subscribe((data: any) => {
      console.log(data);
      this.users.set(data);
      return data;
    });
  }

  // Método llamado en cada input, envía el valor al subject
  onSearch(value: any) {
    this.searchSubject.next(value);
  }

  // Aquí defines la lógica para la búsqueda (llamada a servicio, filtrado, etc.)
  performSearch(query: string) {
    console.log(query)
    this.LikesService.buscarUsuarios(query).subscribe((data: any) => {
      this.users.set(data);
      console.log(data);
    });
  }

  ngOnDestroy() {
    // Limpieza de suscripciones y conexiones
    this.searchSubject.unsubscribe();
    this.messageService.stopHubConnection();
  }

  revisarAmigos(id: string): boolean {
    return this.LikesService.listaParametro().some((element) => element.id === id);
  }
  
  // Verifica si hay mensajes no leídos de un usuario específico
  hasUnreadMessages(userName: string): boolean {
    return this.getUnreadCount(userName) > 0;
  }
}