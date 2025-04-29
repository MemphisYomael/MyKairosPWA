import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-header-card-red',
  standalone: true,
  imports: [],
  templateUrl: './header-card-red.component.html',
  styleUrl: './header-card-red.component.css'
})
export class HeaderCardRedComponent {
  @Input() title: string = 'Componente Nombre';

}
