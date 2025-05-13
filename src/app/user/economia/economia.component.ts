import { HeaderCardYellowComponent } from './../../shared/header-card-yellow/header-card-yellow.component';
import { Component } from '@angular/core';
import { MatCard, MatCardModule } from '@angular/material/card';
import { MatListItem } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { StatusBar } from '@capacitor/status-bar';

@Component({
  selector: 'app-economia',
  standalone: true,
  imports: [MatCardModule, RouterLink, HeaderCardYellowComponent],
  templateUrl: './economia.component.html',
  styleUrl: './economia.component.css'
})
export class EconomiaComponent {
  // async configureStatusBar(){
  //   try{
  //     await StatusBar.setBackgroundColor({ color: '#ffff00' });
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
