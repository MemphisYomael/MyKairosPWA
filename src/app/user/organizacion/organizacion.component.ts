import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { HeaderCardGreenComponent } from '../../shared/header-card-green/header-card-green.component';

@Component({
  selector: 'app-organizacion',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, HeaderCardGreenComponent],
  templateUrl: './organizacion.component.html',
  styleUrl: './organizacion.component.css'
})
export class OrganizacionComponent {

}
