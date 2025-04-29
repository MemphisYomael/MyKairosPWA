import { HeaderCardYellowComponent } from './../../shared/header-card-yellow/header-card-yellow.component';
import { Component } from '@angular/core';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatListItem } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';

@Component({
  selector: 'app-economia',
  standalone: true,
  imports: [MatCardModule, RouterLink, HeaderCardYellowComponent],
  templateUrl: './economia.component.html',
  styleUrl: './economia.component.css'
})
export class EconomiaComponent {

}
