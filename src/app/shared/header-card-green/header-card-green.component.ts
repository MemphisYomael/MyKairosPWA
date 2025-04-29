import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-header-card-green',
  standalone: true,
  imports: [],
  templateUrl: './header-card-green.component.html',
  styleUrl: './header-card-green.component.css'
})
export class HeaderCardGreenComponent {
  @Input() title: string = 'Componente Nombre';

}
