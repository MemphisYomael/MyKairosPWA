import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-header-card-green',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './header-card-green.component.html',
  styleUrl: './header-card-green.component.css'
})
export class HeaderCardGreenComponent {
  @Input() title: string = 'Componente Nombre';
  @Input() disponibleSinInternet: boolean = false;
}