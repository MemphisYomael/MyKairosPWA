import { Component } from '@angular/core';
import { MatList, MatListItem } from '@angular/material/list';
import { HeaderCardComponent } from "../../shared/header-card/header-card.component";
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { HeaderCardRedComponent } from "../../shared/header-card-red/header-card-red.component";
import { StatusBar } from '@capacitor/status-bar';

@Component({
  selector: 'app-ia',
  standalone: true,
  imports: [ MatButtonModule, RouterLink, MatCardModule, HeaderCardRedComponent],
  templateUrl: './ia.component.html',
  styleUrl: './ia.component.css'
})
export class IAComponent {

  // async configureStatusBar(){
  //   try{
  //     await StatusBar.setBackgroundColor({ color: '#ff0000' });
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
