import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatListItem } from '@angular/material/list';
import { HeaderCardComponent } from "../../shared/header-card/header-card.component";
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { StatusBar } from '@capacitor/status-bar';

@Component({
  selector: 'app-vida-espiritual',
  standalone: true,
  imports: [ MatButtonModule, HeaderCardComponent, MatCardModule, RouterLink],
  templateUrl: './vida-espiritual.component.html',
  styleUrl: './vida-espiritual.component.css'
})
export class VidaEspiritualComponent {

  // async configureStatusBar(){
  //   try{
  //     await StatusBar.setBackgroundColor({ color: '#6a11cb' });
  //     await StatusBar.setOverlaysWebView({overlay: false});
  //   }catch(err){
  //     console.log("no se pudo configurar el status bar", err);
  //   }
  // }

  //   async resetStatusBar(){
  //   try{
  //     await StatusBar.setBackgroundColor({ color: '#ffffff' });
  //     await StatusBar.setOverlaysWebView({overlay: false});
  //   }catch(err){
  //     console.log("no se pudo configurar el status bar", err);
  //   }
  // }

  // ngOnInit(){
  //   this.configureStatusBar();
  // }

  // ngOnDestroy(){
  //   this.resetStatusBar();
  // }

}
