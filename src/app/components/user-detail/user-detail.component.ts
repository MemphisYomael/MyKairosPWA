import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { UserData } from '../../shared/inicio/inicio.component';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { MensajeriaHubsService } from '../../services/mensajeria-hubs.service';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { HeaderComponent } from "../../shared/header/header.component";
import { HeaderCardComponent } from "../../shared/header-card/header-card.component";
import { MatSnackBar } from '@angular/material/snack-bar';
import { LikesService } from '../../services/likes.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, HeaderCardComponent, MatButtonModule, MatIconButton],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.css',
})
export class UserDetailComponent {
    likeIds = signal<string[]>([]);
    hasLiked =  computed(() => this.LikesService.likeIds().includes(this.user().userId));
    
    LikesService = inject(LikesService);
  user = signal<any | null>(null);
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
  isAuthenticated = computed(() => this.serviceGlobal.isAuthenticated());

  constructor(
    public serviceGlobal: ServicioApi1DbService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}


  ngOnInit() {
    this.LikesService.getLikeIds();
    setTimeout(() => {
      this.likeIds.set(this.LikesService.likeIds());
      console.log(this.likeIds());

    }, 1000);
    setTimeout(() => {
      this.hasLiked();
    }, 1000);
   
    this.usuarioSesion.set(this.serviceGlobal.username());
    // Obtiene los usuarios desde el servicio
    this.serviceGlobal.getUsers().subscribe((data: any) => {
      console.log(data);
      this.users.set(data.reverse());
    });

    this.route.queryParams.subscribe((params) => {
      console.log(params); // accedes a todos
      this.user.set(params);

    });

    // Crea la conexión del hub si el usuario está autenticado
    // if (this.serviceGlobal.isAuthenticated()) {
    //   this.presenceService.createHubConnection(this.serviceGlobal.getToken());
    // }
  }

  alternarFollow(){
    this.LikesService.toggleLike(this.user().userId).subscribe((data) => {
      console.log(data);
      this.LikesService.getLikeIds();

    })
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
    this.usuarioSesion.set(this.serviceGlobal.username());
  }

  clipboardCopy(textToCopy: any, evento: string){
    navigator.clipboard.writeText(textToCopy).then(() => {
      this.snackBar.open(evento + ' copiado al portapapeles', 'Cerrar', {
        duration: 2000,
      });
      console.log('Texto copiado al portapapeles:', textToCopy);
    }).catch(err => {
      console.error('Error al copiar el texto: ', err);
    });
  }
}
