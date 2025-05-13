import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit, // Needed for ViewChild interaction after view updates
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
// No longer using MatRadioModule, using cards and buttons instead
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
import { group } from '@angular/animations';
import { ComunicacionEntreComponentesService } from '../../services/comunicacion-entre-componentes.service';
// Declare the PayPal global variable
declare let paypal: any;

// Interfaces (no changes needed)
interface Plan {
  id: string;
  name: string;
  description: string;
  price?: number;
  active?: boolean; // For default free plan state
  isCurrent?: boolean; // To mark the actual current plan (if known)
  koinCost?: number;
  durationMonths?: number;
}

@Component({
  selector: 'app-payment-view',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './payment-view.component.html',
  styleUrls: ['./payment-view.component.css'],
  animations: [ // Manteniendo las animaciones
    trigger('stepAnimation', [
       transition(':increment', [
        group([ // Use group for simultaneous animations if needed
          query(':enter', [
            style({ transform: 'translateX(100%)', opacity: 0 }),
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX(0%)', opacity: 1 }))
          ], { optional: true }),
          query(':leave', [
            style({ transform: 'translateX(0%)', opacity: 1, position: 'absolute', top: 0, left: 0, width: '100%' }),
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX(-100%)', opacity: 0 }))
          ], { optional: true }),
        ])
      ]),
      transition(':decrement', [
         group([
          query(':enter', [
            style({ transform: 'translateX(-100%)', opacity: 0 }),
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX(0%)', opacity: 1 }))
          ], { optional: true }),
          query(':leave', [
            style({ transform: 'translateX(0%)', opacity: 1, position: 'absolute', top: 0, left: 0, width: '100%' }),
            animate('500ms cubic-bezier(0.35, 0, 0.25, 1)', style({ transform: 'translateX(100%)', opacity: 0 }))
          ], { optional: true }),
        ])
      ])
    ]),
    // Opcional: Animación para las tarjetas de plan
    trigger('planCardAnimation', [
        transition(':enter', [
            query('.plan-card', [
                style({ opacity: 0, transform: 'translateY(20px)' }),
                stagger('100ms', [
                    animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
                ])
            ], { optional: true })
        ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentViewComponent implements OnInit, AfterViewInit, OnDestroy {

  // --- State Signals ---
  currentStep = signal<number>(1);
  selectedPlanId = signal<string>('free'); // Default selection
  paymentStatus = signal<'idle' | 'processing' | 'success' | 'error'>('idle');
  paymentError = signal<string | null>(null);
  paymentDetails = signal<any>(null);
  payPalButtonRendered = signal<boolean>(false); // Track if button is rendered

  // --- Configuration ---
  // IMPORTANT: Replace '3.47' with the actual price for 100 MyKoins
  readonly myKoinPrice = '3.47';
  readonly premiumPlan: Plan = {
    id: 'premium',
    name: 'Plan Premium',
    description: 'Acceso completo a todas las funciones de MyKairos.',
    isCurrent: false, // Asume que el usuario no tiene premium inicialmente
    koinCost: 100,
    durationMonths: 3,
    price: parseFloat(this.myKoinPrice) // Convertir a número si es necesario
  };
  readonly freePlan: Plan = {
    id: 'free',
    name: 'Plan Gratuito',
    description: 'Funcionalidades básicas para empezar.',
    active: true, // Indicate this is the base/default free plan
    isCurrent: true // Asume que el usuario empieza con el plan gratuito
  };

  // Combine plans for easier iteration in the template
  readonly plans: Plan[] = [this.freePlan, this.premiumPlan];

  // ViewChild to get reference to the container
  @ViewChild('paypalContainer') paypalContainer!: ElementRef<HTMLDivElement>;

  public payPalRenderAttempted = false; // Flag to prevent multiple render attempts per view

  constructor(
    private http: HttpClient,
    private changeDetectorRef: ChangeDetectorRef,
    private servicioCompartido: ComunicacionEntreComponentesService
  ) {}

  ngOnInit(): void {
    this.servicioCompartido.barraInferior.set(false);
    // Determine initial user plan if possible (e.g., from a service)
    // For now, we assume the user starts with the free plan.
    this.selectedPlanId.set(this.freePlan.id);
    this.freePlan.isCurrent = true; // Example logic
    this.premiumPlan.isCurrent = false;
  }

  ngAfterViewInit(): void {
      // This hook ensures the view is initialized. We'll trigger render from here if starting on step 3 (unlikely).
      this.tryRenderPayPalButton();
  }

  ngOnDestroy(): void {
    this.servicioCompartido.barraInferior.set(true);

      // Cleanup if needed
  }

  // --- Navigation ---
  nextStep(): void {
    const current = this.currentStep();
    if (this.selectedPlanId() === 'free' && current === 1) {
        // If free plan is selected, maybe navigate elsewhere or show a message?
        // For now, let's prevent moving forward unless premium is chosen.
        // Or simply stay on step 1.
        console.log("Continuando con el plan gratuito.");
        // this.router.navigate(['/inicio']); // Example navigation
        return; // Stay on step 1 or navigate away
    }

    if (current < 3) {
      this.currentStep.set(current + 1);
      this.payPalRenderAttempted = false; // Reset attempt flag when moving step
      this.payPalButtonRendered.set(false);
      this.paymentStatus.set('idle'); // Reset payment status
      this.paymentError.set(null);
      this.paymentDetails.set(null);

      // Important: Trigger change detection so ngAfterViewInit/Checked can potentially catch the update
      this.changeDetectorRef.detectChanges(); // Use detectChanges for immediate check
      this.tryRenderPayPalButton(); // Attempt render after state update
    }
  }

  prevStep(): void {
    const current = this.currentStep();
    if (current > 1) {
      this.currentStep.set(current - 1);
      this.payPalRenderAttempted = false; // Reset attempt flag
      this.payPalButtonRendered.set(false);
      // Clear PayPal container if going back from step 3
      if (current === 3 && this.paypalContainer?.nativeElement) {
         this.paypalContainer.nativeElement.innerHTML = '';
         console.log("PayPal container cleared.");
      }
      this.changeDetectorRef.markForCheck();
    }
  }

  // --- Plan Selection ---
  selectPlan(planId: string): void {
    if (planId === 'free') {
        // Handle selecting the free plan - maybe just update the signal
        // and potentially disable the 'next' button or change its text.
        this.selectedPlanId.set(planId);
        console.log("Plan Gratuito seleccionado.");
    } else {
        // Selecting the premium plan moves to the next step (confirmation)
        this.selectedPlanId.set(planId);
        this.nextStep(); // Automatically go to confirmation when premium is clicked
    }
     this.changeDetectorRef.markForCheck();
  }

  // --- PayPal Integration ---
  public tryRenderPayPalButton(): void {
    // Only attempt if on step 3, container exists, SDK is likely loaded, and not already attempted/rendered
    if (this.currentStep() === 3 && !this.payPalRenderAttempted && typeof paypal !== 'undefined') {
        // Check if the ViewChild element is ready
        if (this.paypalContainer?.nativeElement) {
            console.log("Attempting to render PayPal button...");
            this.payPalRenderAttempted = true; // Mark as attempted for this view
            this.renderPayPalButton(this.paypalContainer.nativeElement);
        } else {
            // If container not ready yet, wait for the next change detection cycle
            console.log("PayPal container not ready yet, will retry on next check.");
            // Schedule a check - Angular's cycle might handle this, or use setTimeout(0) if needed
             setTimeout(() => this.tryRenderPayPalButton(), 50); // Small delay retry
        }
    } else if (this.currentStep() === 3 && typeof paypal === 'undefined') {
        console.error("PayPal SDK (paypal object) not found. Ensure it's loaded in index.html.");
        this.paymentStatus.set('error');
        this.paymentError.set("Error al cargar la pasarela de pago. Verifica tu conexión o refresca la página.");
        this.changeDetectorRef.markForCheck();
    } else if (this.currentStep() === 3 && this.payPalRenderAttempted && !this.payPalButtonRendered()) {
         // If attempted but not rendered (e.g., due to SDK error previously), log it.
         console.log("PayPal button render already attempted in this view.");
    }
  }

  private renderPayPalButton(containerElement: HTMLElement): void {
    if (!containerElement) {
      console.error('PayPal button container element invalid.');
      this.paymentStatus.set('error');
      this.paymentError.set('Error interno: Contenedor de pago no válido.');
      this.changeDetectorRef.markForCheck();
      return;
    }
    // Clear previous buttons
    containerElement.innerHTML = '';
    this.paymentStatus.set('processing');
    this.payPalButtonRendered.set(false);
    this.changeDetectorRef.markForCheck();
    console.log("Rendering PayPal button in container:", containerElement);

    try {
      paypal.Buttons({
        createOrder: (_data: any, actions: any) => {
          console.log("Creating PayPal order...");
          this.paymentStatus.set('processing');
          this.paymentError.set(null);
          this.changeDetectorRef.markForCheck();
          return actions.order.create({
            purchase_units: [{
              description: `Compra de ${this.premiumPlan.koinCost} MyKoins para ${this.premiumPlan.durationMonths} meses Premium MyKairos`,
              amount: {
                currency_code: 'USD', // ** VERIFY/ADJUST CURRENCY **
                value: this.myKoinPrice
              }
            }]
          });
        },
        onApprove: async (_data: any, actions: any) => {
           console.log("PayPal order approved by user.");
          this.paymentStatus.set('processing'); // Still processing backend verification
          this.changeDetectorRef.markForCheck();
          try {
            const details = await actions.order.capture();
            console.log('PayPal order captured:', details);
            this.paymentDetails.set(details);

            // *** Backend Verification Call ***
            this.http.post('/api/pagos/paypal-verify', { orderId: details.id })
              .subscribe({
                next: (backendResponse) => {
                  console.log('Backend verification successful:', backendResponse);
                  this.paymentStatus.set('success');
                  // Mark premium plan as current (example)
                  this.premiumPlan.isCurrent = true;
                  this.freePlan.isCurrent = false;
                  this.changeDetectorRef.markForCheck();
                },
                error: (err) => {
                  console.error('Backend verification failed:', err);
                  this.paymentStatus.set('error');
                  this.paymentError.set('Pago aprobado, pero falló la activación. Contacta soporte.');
                  this.changeDetectorRef.markForCheck();
                }
              });

          } catch (error) {
            console.error('Error capturing PayPal order:', error);
            this.paymentStatus.set('error');
            this.paymentError.set('Error al finalizar el pago tras aprobación.');
            this.changeDetectorRef.markForCheck();
          }
        },
        onError: (err: any) => {
          console.error('PayPal Buttons onError:', err);
          this.paymentStatus.set('error');
          // Try to give a more specific message if possible
          let message = 'Error durante el proceso de pago con PayPal.';
          if (err && typeof err.message === 'string' && err.message.includes('fetch')) {
              message = 'Error de conexión al procesar el pago. Verifica tu internet.'
          }
          this.paymentError.set(message);
          this.payPalButtonRendered.set(false); // Indicate button is gone/failed
          this.payPalRenderAttempted = false; // Allow retry
          this.changeDetectorRef.markForCheck();
        },
        onCancel: (_data: any) => {
          console.log('PayPal payment cancelled by user.');
          this.paymentStatus.set('idle');
          this.paymentError.set('Proceso de pago cancelado.');
           this.payPalButtonRendered.set(false); // Indicate button is gone
           this.payPalRenderAttempted = false; // Allow retry maybe? Or just go back.
          this.changeDetectorRef.markForCheck();
          this.prevStep(); // Go back immediately on cancel
        }
      }).render(containerElement).then(() => {
        console.log("PayPal button successfully rendered.");
        // Button is ready, but payment is still 'idle' until user clicks
        this.paymentStatus.set('idle'); // Set back to idle after button appears
        this.payPalButtonRendered.set(true);
        this.changeDetectorRef.markForCheck();
      }).catch((err: any) => {
        console.error('Error rendering PayPal button:', err);
        this.paymentStatus.set('error');
        this.paymentError.set('No se pudo mostrar el botón de pago de PayPal.');
        this.payPalButtonRendered.set(false);
         this.payPalRenderAttempted = false; // Allow retry
        this.changeDetectorRef.markForCheck();
      });
    } catch (sdkError) {
      console.error('PayPal SDK execution error:', sdkError);
      this.paymentStatus.set('error');
      this.paymentError.set('Error al iniciar la pasarela de pago.');
      this.payPalButtonRendered.set(false);
       this.payPalRenderAttempted = false; // Allow retry
      this.changeDetectorRef.markForCheck();
    }
  }
}