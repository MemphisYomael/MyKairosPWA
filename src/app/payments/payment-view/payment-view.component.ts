import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
declare let paypal: any;

@Component({
  selector: 'app-payment-view',
  standalone: true,
  imports: [],
  templateUrl: './payment-view.component.html',
  styleUrl: './payment-view.component.css'
})
export class PaymentViewComponent {

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.renderPayPalButton();
  }

  private renderPayPalButton(): void {
    paypal.Buttons({
      // 1. Configurar la creación de la orden
      createOrder: (_data: any, actions: any) => {
        return actions.order.create({
          purchase_units: [{
            amount: { value: '3.47' }
          }]
        });
      },
      // 2. Capturar el pago tras aprobación
      onApprove: (_data: any, actions: any) => {
        return actions.order.capture().then((details: any) => {
          console.log('Pago exitoso:', details);
          // 3. Enviar resultado al backend .NET
          this.http.post('/api/pagos', { pago: 'exitoso' })
            .subscribe(() => console.log('Backend notificado')); 
        });
      },
      onError: (err: any) => {
        console.error('Error en PayPal:', err);
      }
    }).render('#paypal-button-container');
  }
}
