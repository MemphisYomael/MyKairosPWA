import {
  ChangeDetectionStrategy, // Importado y activado
  ChangeDetectorRef, // Importado para OnPush
  Component,
  OnInit,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit,
  inject,
  OnDestroy, // Importado para ngOnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {
  FormControl,
  Validators,
  FormGroupDirective,
  NgForm,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { Router } from '@angular/router';
// import { Location } from '@angular/common'; // No parece usarse
import {
  MatProgressSpinner,
  MatProgressSpinnerModule,
} from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { ComunicacionEntreComponentesService } from '../../services/comunicacion-entre-componentes.service';

// Interfaz para el objeto Feature (para tipado fuerte en trackBy)
interface Feature {
  category: string;
  icon: string;
  title: string;
  description: string;
}

// MyErrorStateMatcher (sin cambios)
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(
    control: FormControl | null,
    form: FormGroupDirective | NgForm | null
  ): boolean {
    const isSubmitted = form && form.submitted;
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched || isSubmitted)
    );
  }
}

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatCardModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html', //
  styleUrls: ['./login.component.css'], //
  animations: [
    // Animación de entrada/salida general (sin cambios)
    trigger('stepAnimation', [
       transition(':increment', [
        query(':enter', [
          style({ transform: 'translateX(100%)', opacity: 0 }),
          animate('600ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX(0%)', opacity: 1 }))
        ], { optional: true }),
        query(':leave', [
          style({ transform: 'translateX(0%)', opacity: 1, position: 'absolute', top: 0, left: 0, width: '100%' }),
          animate('600ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX(-100%)', opacity: 0 }))
        ], { optional: true }),
      ]),
      transition(':decrement', [
         query(':enter', [
          style({ transform: 'translateX(-100%)', opacity: 0 }),
          animate('600ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX(0%)', opacity: 1 }))
        ], { optional: true }),
        query(':leave', [
          style({ transform: 'translateX(0%)', opacity: 1, position: 'absolute', top: 0, left: 0, width: '100%' }),
          animate('600ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX(100%)', opacity: 0 }))
        ], { optional: true }),
      ])
    ]),
    // Animación para las tarjetas de funcionalidades al ENTRAR
    trigger('featureCardAnimation', [
       transition(':enter', [ // Cambiado a :enter para animar solo al aparecer
         query('.feature-card', [ // Aplicamos el stagger aquí dentro si queremos que las tarjetas aparezcan una tras otra
            style({ opacity: 0, transform: 'translateY(30px)' }),
            stagger('100ms', [ // Stagger para animar una después de otra
               animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
            ])
         ], { optional: true }) // Optional true por si no hay tarjetas
       ]),
    ]),
    // Animación para el logo "My" (sin cambios) - Se puede remover si ya no se usa el texto
    trigger('logoMyAnimation', [
       transition(':enter', [
          style({ opacity: 0, transform: 'scale(0.5)' }),
          animate('800ms 200ms cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'scale(1)' })),
       ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush // Estrategia OnPush activada
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy { // Añadido OnDestroy
  // Auth related signals and controls
  cargando = signal<boolean>(false);
  errorRegistro = signal<string>('');
  emailFormControl = new FormControl('', [Validators.required, Validators.email]); //

  // --- MODIFICACIÓN AQUÍ ---
  passwordFormControl = new FormControl('', [
    Validators.required, //
    Validators.minLength(8), //
    Validators.pattern(/.*[A-Z].*/), // Debe contener al menos una mayúscula
    Validators.pattern(/.*[!@#$%^&*(),.?":{}|<>].*/) // Debe contener al menos un caracter especial
  ]);
  // --- FIN MODIFICACIÓN ---

  usernameFormControl = new FormControl('', [Validators.pattern(/^\S*$/), Validators.required]); //

  matcher = new MyErrorStateMatcher(); //
  hide: boolean = true; //

  // Onboarding flow controls
  currentStep = signal<number>(1); //
  authAction = signal<'login' | 'register' | null>(null); //

  @ViewChild('featuresScrollContainer') featuresScrollContainer!: ElementRef; //

  // Lista de funcionalidades (*** MODIFICADO: Orden cambiado ***)
  features: Feature[] = [ //
    // Organización primero
    { category: 'Organización', icon: 'task_alt', title: 'Mis Tareas', description: 'Gestiona pendientes con recordatorios y notificaciones.' }, //
    { category: 'Organización', icon: 'link', title: 'Mis Enlaces', description: 'Guarda y organiza tus enlaces importantes en un solo lugar.' }, //
    { category: 'Organización', icon: 'flag', title: 'Mis Resoluciones', description: 'Mantén tus metas y propósitos siempre presentes.' }, //
    { category: 'Organización', icon: 'description', title: 'Mis Notas', description: 'Crea y edita notas fácilmente (¡como en Word!).' }, //
    // Vida Espiritual después
    { category: 'Vida Espiritual', icon: 'auto_stories', title: 'Mis Devocionales', description: 'Guarda y comparte tus reflexiones espirituales diarias.' }, //
    { category: 'Vida Espiritual', icon: 'record_voice_over', title: 'Mis Oraciones', description: 'Organiza peticiones y sigue las respuestas divinas.' }, //
    { category: 'Vida Espiritual', icon: 'shield', title: 'Mi Batalla Espiritual', description: 'Registra tentaciones y fortalece tu crecimiento.' }, //
    // Resto de categorías
    { category: 'Finanzas', icon: 'credit_card', title: 'Mis Suscripciones', description: 'Controla pagos recurrentes y evita cargos sorpresa.' }, //
    { category: 'Finanzas', icon: 'bar_chart', title: 'Mis Finanzas', description: 'Registra ingresos/gastos, presupuesta y exporta a Excel.' }, //
    { category: 'Inteligencia Artificial', icon: 'shopping_cart_checkout', title: 'Buscador de Productos IA', description: 'Encuentra el producto perfecto con IA: specs, precio, reseñas y links.' }, //
    { category: 'Inteligencia Artificial', icon: 'document_scanner', title: 'Imagen a Texto con IA', description: 'Extrae texto de imágenes y analízalo con IA.' }, //
    { category: 'Inteligencia Artificial', icon: 'smart_toy', title: 'Asistente MyKairos IA', description: 'Conversa con Gemini, tu asistente inteligente integrado.' }, //
  ];

  // Agrupar features (sin cambios funcionales, solo tipo añadido)
  get groupedFeatures(): { category: string; items: Feature[] }[] { //
    const groups: { [key: string]: Feature[] } = {};
    this.features.forEach(feature => {
      if (!groups[feature.category]) {
        groups[feature.category] = [];
      }
      groups[feature.category].push(feature);
    });

    // *** MODIFICADO: Asegurar el orden deseado en la salida agrupada ***
    const orderedCategories = ['Organización', 'Vida Espiritual', 'Finanzas', 'Inteligencia Artificial']; //
    return orderedCategories
        .filter(category => groups[category]) // Filtrar categorías que realmente existen en features
        .map(category => ({ category: category, items: groups[category] }));
  }

  // Función trackBy para optimizar el *ngFor de features
  trackByFeature(index: number, feature: Feature): string { //
    return feature.title; // Usar un identificador único, como el título
  }
   // Función trackBy para optimizar el *ngFor de grupos (opcional pero buena práctica)
  trackByCategory(index: number, group: { category: string; items: Feature[] }): string { //
      return group.category;
  }


  constructor( //
    // private location: Location, // No se usa
    private serviciologin: ServicioApi1DbService,
    private router: Router,
    private servicioCompartido: ComunicacionEntreComponentesService,
    private changeDetectorRef: ChangeDetectorRef // Inyectar ChangeDetectorRef
  ) {}

  ngOnInit(): void { //
    this.servicioCompartido.barraSuperior.set(false);
    this.servicioCompartido.barraInferior.set(false);
    this.servicioCompartido.chatBotFloat.set(false);

    this.changeDetectorRef.markForCheck(); // Marcar para revisión inicial si es necesario
  }

  ngAfterViewInit(): void { //
     // Lógica post-renderizado si es necesaria
  }

  // Navigation methods
  nextStep(): void { //
    const current = this.currentStep();
     // *** MODIFICADO: Permitir avanzar hasta el paso 4 desde features ***
     if (current < 4) {
        this.currentStep.set(current + 1);
        // Si vamos al paso 3 (choice), reseteamos acción por si acaso
        if (this.currentStep() === 3) {
           this.authAction.set(null);
           this.resetFormsAndErrors(); // Llama a markForCheck
        } else {
           this.changeDetectorRef.markForCheck();
        }
     }
  }

  prevStep(): void { //
    const current = this.currentStep();
    if (current === 4) {
       this.currentStep.set(3);
       this.authAction.set(null);
       this.resetFormsAndErrors(); // resetFormsAndErrors ya llama a markForCheck
    } else if (current > 1) {
      this.currentStep.set(current - 1);
      this.authAction.set(null); // Asegurarse de resetear la acción también
      // No es necesario resetear forms aquí si no estamos en el paso 4
      this.changeDetectorRef.markForCheck();
    }
  }

  selectAuthAction(action: 'login' | 'register'): void { //
    this.authAction.set(action);
    this.currentStep.set(4);
    this.resetFormsAndErrors(); // resetFormsAndErrors ya llama a markForCheck
    if (action === 'login') {
      this.usernameFormControl.clearValidators();
      this.usernameFormControl.updateValueAndValidity();
    } else {
      this.usernameFormControl.setValidators([Validators.pattern(/^\S*$/), Validators.required]);
      this.usernameFormControl.updateValueAndValidity();
    }
     // No es necesario markForCheck aquí porque resetFormsAndErrors ya lo hace
  }

  resetFormsAndErrors(): void { //
    this.emailFormControl.reset();
    this.passwordFormControl.reset();
    this.usernameFormControl.reset();
    this.errorRegistro.set('');
    this.cargando.set(false);
    this.changeDetectorRef.markForCheck(); // Marcar para revisión con OnPush
  }


  // Auth methods
  togglePasswordVisibility(): void { //
    this.hide = !this.hide;
     // No es estrictamente necesario markForCheck aquí para un booleano simple,
     // pero no hace daño si hay dudas.
     // this.changeDetectorRef.markForCheck();
  }

  onSubmit(): void { //
    if (!this.authAction()) return;

    const action = this.authAction();
    let isValid = false;

    if (action === 'login') {
      isValid = this.emailFormControl.valid && this.passwordFormControl.valid;
    } else if (action === 'register') {
       isValid = this.emailFormControl.valid && this.passwordFormControl.valid && this.usernameFormControl.valid;
    }

    if (isValid) {
       this.cargando.set(true);
       this.errorRegistro.set('');
       this.changeDetectorRef.markForCheck(); // Marcar antes de la llamada asíncrona

       const email = this.emailFormControl.value ?? '';
       const password = this.passwordFormControl.value ?? '';

       if (action === 'login') {
         const login = { Email: email, Password: password };
         this.serviciologin.login(login).subscribe({
           next: (data) => {
             console.log(data);
             this.cargando.set(false);
             // Asegúrate que las barras se muestren ANTES de navegar
             this.servicioCompartido.barraSuperior.set(true);
             this.servicioCompartido.barraInferior.set(true);
             this.changeDetectorRef.markForCheck(); // Marcar antes de navegar
             this.router.navigate(['/inicio']);
           },
           error: (error) => {
               this.handleAuthError(error, 'login'); // handleAuthError llama markForCheck
           }
         });
       } else { // action === 'register'
         const username = this.usernameFormControl.value ?? '';
         const register = { Email: email, Password: password, UserName: username };
         this.serviciologin.registrar(register).subscribe({
           next: (data) => {
             this.cargando.set(false);
             // *** MODIFICADO: Mantener en el paso 4, mostrar mensaje éxito? ***
             // Opcional: Podrías volver al paso 3 o mostrar un mensaje aquí mismo.
             // this.currentStep.set(3);
             // this.authAction.set(null);
             this.resetFormsAndErrors(); // Limpia y marca para revisión
             // Ejemplo: Mostrar mensaje de éxito (requeriría un signal o variable adicional)
             // this.registroExitoso.set('¡Cuenta creada! Ahora puedes iniciar sesión.');
             // O simplemente limpiar y que el usuario vea el form vacío
             console.log(data);
             this.cargando.set(false);
             // Asegúrate que las barras se muestren ANTES de navegar
             this.servicioCompartido.barraSuperior.set(true);
             this.servicioCompartido.barraInferior.set(true);
             this.changeDetectorRef.markForCheck(); // Marcar antes de navegar
             this.router.navigate(['/inicio']);
           },
            error: (error) => {
                this.handleAuthError(error, 'register'); // handleAuthError llama markForCheck
            }
         });
       }
    } else {
      console.log('Formulario inválido');
      this.emailFormControl.markAsTouched();
      this.passwordFormControl.markAsTouched();
      if(action === 'register') this.usernameFormControl.markAsTouched();
      // No es necesario markForCheck aquí, la validación de formularios lo maneja
    }
  }

   handleAuthError(error: any, type: 'login' | 'register'): void { //
        this.cargando.set(false);
        console.error(`${type} error:`, error);
        let errorMessage = 'Ocurrió un error. Inténtalo de nuevo.'; // Mensaje por defecto

        if (type === 'login') {
             // Mensaje más específico para login
             if (error.status === 400 || error.status === 401) { // Asumiendo errores comunes
                errorMessage = 'Email o contraseña incorrectos.';
             } else {
                errorMessage = 'No se pudo iniciar sesión. Verifica tu conexión o inténtalo más tarde.';
             }
        } else { // register error
             if (error.error && error.error.errores) {
              if (error.error.errores.mensaje) {
                errorMessage = error.error.errores.mensaje;
              } else if (typeof error.error.errores === 'string') {
                 // Intenta mejorar el mensaje de contraseña si es el error común
                 if (error.error.errores.includes('Password')) {
                     errorMessage = 'La contraseña debe tener 8+ caracteres, mayúscula, minúscula, número y símbolo (ej: P@ssword1).';
                 } else if (error.error.errores.includes('UserName')) {
                     errorMessage = 'El nombre de usuario ya existe o contiene caracteres inválidos.';
                 } else if (error.error.errores.includes('Email')) {
                     errorMessage = 'El email ya está registrado.';
                 } else {
                     errorMessage = error.error.errores; // Otro error de registro
                 }
              } else {
                 errorMessage = 'Error en el registro. Verifica tus datos.';
              }
            } else {
              errorMessage = 'Falló el registro. Inténtalo de nuevo más tarde.';
            }
        }
        this.errorRegistro.set(errorMessage);
        this.changeDetectorRef.markForCheck(); // Marcar para mostrar el error
  }


  ngOnDestroy(){ //
    // Asegúrate de restaurar las barras si el componente se destruye
    // Esto es importante si el usuario navega fuera durante el onboarding
        this.servicioCompartido.barraSuperior.set(true);
        this.servicioCompartido.barraInferior.set(true);
        this.servicioCompartido.chatBotFloat.set(true);
        // Podríamos necesitar markForCheck aquí si la destrucción y restauración
        // ocurren de forma que Angular no lo detecte automáticamente.
        // this.changeDetectorRef.markForCheck();
  }
}