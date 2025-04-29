import { Component } from '@angular/core';
import { MatList, MatListItem } from '@angular/material/list';
import { HeaderCardComponent } from "../../shared/header-card/header-card.component";
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { HeaderCardRedComponent } from "../../shared/header-card-red/header-card-red.component";

@Component({
  selector: 'app-ia',
  standalone: true,
  imports: [ MatButtonModule, RouterLink, MatCardModule, HeaderCardRedComponent],
  templateUrl: './ia.component.html',
  styleUrl: './ia.component.css'
})
export class IAComponent {

}
