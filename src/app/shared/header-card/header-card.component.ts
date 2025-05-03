import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-header-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './header-card.component.html',
  styleUrl: './header-card.component.css'
})
export class HeaderCardComponent {
  @Input() title: string = 'Componente Nombre';
  @Input() disponibleSinInternet: boolean = false;


}
