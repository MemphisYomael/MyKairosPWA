import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-header-card-yellow',
  standalone: true,
  imports: [],
  templateUrl: './header-card-yellow.component.html',
  styleUrl: './header-card-yellow.component.css'
})
export class HeaderCardYellowComponent {
  @Input() title: string = 'Componente Nombre';

}
