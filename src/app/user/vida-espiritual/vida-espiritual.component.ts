import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListItem } from '@angular/material/list';
import { HeaderCardComponent } from "../../shared/header-card/header-card.component";
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-vida-espiritual',
  standalone: true,
  imports: [ MatButtonModule, HeaderCardComponent, MatCardModule, RouterLink],
  templateUrl: './vida-espiritual.component.html',
  styleUrl: './vida-espiritual.component.css'
})
export class VidaEspiritualComponent {

}
