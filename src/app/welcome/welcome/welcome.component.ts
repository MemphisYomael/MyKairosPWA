import { Component, OnInit, ChangeDetectionStrategy, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router'; // Import Router
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { trigger, transition, style, animate, query, stagger, state } from '@angular/animations';
import { ComunicacionEntreComponentesService } from '../../services/comunicacion-entre-componentes.service';
import { MensajeriaHubsService } from '../../services/mensajeria-hubs.service';
import { MessageService } from '../../services/message.service';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';

// Updated Feature Interface
interface Feature {
  category: string;
  icon: string;
  title: string;
  description: string;
  route: string; // Added route property
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatTooltipModule
  ],
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('welcomeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('500ms ease-out', style({ opacity: 1 })),
      ]),
    ]),
    trigger('logoAnimation', [
      transition(':enter', [
        style({ transform: 'scale(0.5)', opacity: 0 }),
        animate('800ms 200ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ transform: 'scale(1)', opacity: 1 })),
      ]),
    ]),
     trigger('featuresListAnimation', [
        transition(':enter', [
          query('.feature-category', [
            style({ opacity: 0, transform: 'translateY(20px)' }),
            stagger(150, [
              animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
            ])
          ], { optional: true })
        ]),
      ]),
  ]
})
export class WelcomeComponent implements OnInit {

  animationState = signal('visible');

  // Updated features list with routes
  features: Feature[] = [
    // Organización
    { category: 'Organización', icon: 'task_alt', title: 'Mis Tareas', description: 'Gestiona pendientes con recordatorios y notificaciones.', route: '/tareas' },
    { category: 'Organización', icon: 'link', title: 'Mis Enlaces', description: 'Guarda y organiza tus enlaces importantes en un solo lugar.', route: '/my-links' },
    { category: 'Organización', icon: 'flag', title: 'Mis Resoluciones', description: 'Mantén tus metas y propósitos siempre presentes.', route: '/my-resoluciones' },
    { category: 'Organización', icon: 'description', title: 'Mis Notas', description: 'Crea y edita notas fácilmente (¡como en Word!).', route: '/my-editor-inicio' }, // Using EditorInicioComponent route
    // Vida Espiritual
    { category: 'Vida Espiritual', icon: 'auto_stories', title: 'Mis Devocionales', description: 'Guarda y comparte tus reflexiones espirituales diarias.', route: '/my-devocionales' },
    { category: 'Vida Espiritual', icon: 'record_voice_over', title: 'Mis Oraciones', description: 'Organiza peticiones y sigue las respuestas divinas.', route: '/my-oraciones' },
    { category: 'Vida Espiritual', icon: 'shield', title: 'Mi Batalla Espiritual', description: 'Registra tentaciones y fortalece tu crecimiento.', route: '/my-batalla' },
    // Finanzas
    { category: 'Finanzas', icon: 'credit_card', title: 'Mis Suscripciones', description: 'Controla pagos recurrentes y evita cargos sorpresa.', route: '/my-suscripciones' },
    { category: 'Finanzas', icon: 'bar_chart', title: 'Mis Finanzas', description: 'Registra ingresos/gastos, presupuesta y exporta a Excel.', route: '/finanzas' },
    // IA
    { category: 'Inteligencia Artificial', icon: 'hub', title: 'Ia', description: 'Explora las funcionalidades generales de IA.', route: '/ia' }, // Added Ia feature
    { category: 'Inteligencia Artificial', icon: 'travel_explore', title: 'Buscador de Top Lugares (BETA)', description: 'Descubre lugares populares usando mapas.', route: '/houses-map' }, // Added Buscador de Top Lugares feature
    { category: 'Inteligencia Artificial', icon: 'shopping_cart_checkout', title: 'Buscador de Productos IA', description: 'Encuentra el producto perfecto con IA: specs, precio, reseñas y links.', route: '/gemini' }, // Assuming /gemini is for product search via GeminiApp1Component
    { category: 'Inteligencia Artificial', icon: 'document_scanner', title: 'Imagen a Texto con IA', description: 'Extrae texto de imágenes y analízalo con IA.', route: '/image' },
    { category: 'Inteligencia Artificial', icon: 'smart_toy', title: 'Asistente MyKairos IA', description: 'Conversa con Gemini, tu asistente inteligente integrado.', route: '/chat-bot' },
    // You might have other features like speech, youtube downloader, etc. Add them here with appropriate routes if needed.
    // { category: 'Utilidades', icon: 'mic', title: 'Speech to Text', description: 'Convierte tu voz a texto.', route: '/speech' },
    // { category: 'Utilidades', icon: 'download', title: 'Youtube Downloader', description: 'Descarga videos de YouTube.', route: '/youtube' },

  ];

  // Grouped features getter (ensure correct ordering)
  get groupedFeatures(): { category: string; items: Feature[] }[] {
    const groups: { [key: string]: Feature[] } = {};
    this.features.forEach(feature => {
      if (!groups[feature.category]) {
        groups[feature.category] = [];
      }
      groups[feature.category].push(feature);
    });

    // Define the desired order of categories
    const orderedCategories = ['Organización', 'Vida Espiritual', 'Finanzas', 'Inteligencia Artificial', 'Utilidades']; // Add 'Utilidades' or others if used
    return orderedCategories
        .filter(category => groups[category]) // Only include categories that have features
        .map(category => ({ category: category, items: groups[category] }));
  }

  // trackBy functions
  trackByCategory(index: number, group: { category: string; items: Feature[] }): string {
      return group.category;
  }
  trackByFeature(index: number, feature: Feature): string {
    return feature.title; // Use a unique identifier, title should be unique within category
  }

  constructor(
    private router: Router, // Inject Router
    private servicioCompartido: ComunicacionEntreComponentesService,
    private changeDetectorRef: ChangeDetectorRef,
    private presenceService: MensajeriaHubsService,
    public messageService: MessageService,
    private serviceGlobal: ServicioApi1DbService
  ) {}

  ngOnInit(): void {
    if (this.serviceGlobal.isAuthenticated()) {
      this.messageService.createMainHubConnection();
      this.presenceService.createHubConnection(this.serviceGlobal.getToken());
    }

    
  }

  // Navigation method for features
  navigateToFeature(route: string): void {
    if (route) {
      this.router.navigate([route]);
    } else {
      console.warn('No route defined for this feature chip.');
      // Optionally: Show a snackbar or message to the user
    }
  }

  // Navigation method for the main button
  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  
}