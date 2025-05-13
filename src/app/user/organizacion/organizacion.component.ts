import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { HeaderCardGreenComponent } from '../../shared/header-card-green/header-card-green.component';
import { StatusBar } from '@capacitor/status-bar';

@Component({
  selector: 'app-organizacion',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatCardModule, HeaderCardGreenComponent],
  templateUrl: './organizacion.component.html',
  styleUrl: './organizacion.component.css'
})
export class OrganizacionComponent {
// async configureStatusBar(){
//     try{
//       await StatusBar.setBackgroundColor({ color: '#00ff00' });
//       await StatusBar.setOverlaysWebView({overlay: false});
//     }catch(err){
//       console.log("no se pudo configurar el status bar", err);
//     }
//   }

//     async resetStatusBar(){
//     try{
//       await StatusBar.setBackgroundColor({ color: '#ffffff' });
//       await StatusBar.setOverlaysWebView({overlay: false});
//     }catch(err){
//       console.log("no se pudo configurar el status bar", err);
//     }
//   }

//   ngOnInit(){
//     this.configureStatusBar();
//   }

//   ngOnDestroy(){
//     this.resetStatusBar();
//   }
  
}
