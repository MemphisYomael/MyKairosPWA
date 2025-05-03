import { HttpClient, HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';


@Injectable({
  providedIn: 'root',
})
export class MensajeriaHubsService {
  
  onlineUsers = signal<string[]>([]);
 
  hubUrl = environment.hubsUrl;

  private hubConection?: HubConnection;

  private toastr: ToastrService = inject(ToastrService);

  createHubConnection(token: any){
    this.hubConection = new HubConnectionBuilder()
    .withUrl(this.hubUrl + "presence", {
      accessTokenFactory: () => token,
    })
    .withAutomaticReconnect()
    .build();

    this.hubConection.start().catch(error => console.log(error));

    this.hubConection.on('UserIsOnline', userName => {
      // this.toastr.info(userName + ' has connected');
    }); 

    this.hubConection.on('UserIsOffline', username => {
      // this.toastr.warning(username + ' has disconnected');
    })

    this.hubConection.on('GetOnlineUsers', (usernames: string[]) => {
      this.onlineUsers.set(usernames);
    });

  }

  stopHubConnection(){
    if(this.hubConection?.state === HubConnectionState.Connected){
      this.hubConection.stop().catch(error => console.log(error));
    }
  }

  
}
