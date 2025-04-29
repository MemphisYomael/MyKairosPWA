import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-header-card',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './header-card.component.html',
  styleUrl: './header-card.component.css'
})
export class HeaderCardComponent {
  @Input() title: string = 'Componente Nombre';

}
