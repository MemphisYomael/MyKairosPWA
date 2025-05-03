import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';
import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { SendMessage } from '../components/member-messages/member-messages.component';
import { UserData } from '../shared/inicio/inicio.component';

export interface IMessage {
  id: number;
  senderId: string;
  senderUserName: string;
  senderPhotoUrl: string;
  recipientUserName: string;
  recipientPhotoUrl: string;
  recipientId: string;
  content: string;
  dateRead: Date;
  messageSent: Date;
}

export interface UnreadMessageCount {
  username: string;
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  
  noLeidos = signal<IMessage[]>([]);
  unreadMessageCounts = signal<UnreadMessageCount[]>([]);
  hubUrl = environment.hubsUrl;
  messages = signal<IMessage[]>([]);
  private hubConnection?: HubConnection;
  baseUrl = environment.apiUrl;
  messageThread = signal<IMessage[]>([]);
  
  constructor(private http: HttpClient) {}

  createHubConnection(otherUserName: string) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl + 'message?user=' + otherUserName, {
        accessTokenFactory: () => this.getToken()
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start().catch((error: any) => console.log(error));
    
    this.hubConnection.on('ReceiveMessageThread', messages => {
      this.messageThread.set(messages);
      console.log(messages);
    });

    this.hubConnection.on('NewMessage', message => {
      this.messageThread.update(messages => [...messages, message]);
      console.log(message);
    });
    
    // Añadir manejador para mensajes no leídos
    this.hubConnection.on('UnreadMessages', messages => {
      this.noLeidos.set(messages);
      this.updateUnreadMessageCounts(messages);
    });
  }
  
  // Método para crear conexión principal para mensajes no leídos
  createMainHubConnection() {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl + 'message', {
        accessTokenFactory: () => this.getToken()
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start().catch((error: any) => console.log(error));
    
    // Añadir manejador para mensajes no leídos
    this.hubConnection.on('UnreadMessages', messages => {
      this.noLeidos.set(messages);
      this.updateUnreadMessageCounts(messages);
    });
  }

  private updateUnreadMessageCounts(messages: IMessage[]) {
    // Agrupar mensajes por remitente y contar
    const counts: { [key: string]: number } = {};
    
    messages.forEach(message => {
      if (!counts[message.senderUserName]) {
        counts[message.senderUserName] = 0;
      }
      counts[message.senderUserName]++;
    });
    
    // Convertir a array para la señal
    const countArray: UnreadMessageCount[] = Object.keys(counts).map(username => ({
      username,
      count: counts[username]
    }));
    
    this.unreadMessageCounts.set(countArray);
  }

  stopHubConnection() {
    if (this.hubConnection?.state === HubConnectionState.Connected) {
      this.hubConnection.stop().catch((error) => console.log(error));
    }
  }
  
  getMessages(container: string) {
    return this.http.get<IMessage[]>(this.baseUrl + 'api/messages?container=' + container).subscribe((data) => {
      console.log("mensajes para mi: ", data);
      this.messages.set(data.reverse());
      
      if (container === 'Unread') {
        this.noLeidos.set(data);
        this.updateUnreadMessageCounts(data);
      }
    });
  }

  getUnreadMessages() {
    return this.http.get<IMessage[]>(this.baseUrl + 'api/messages?container=Unread').subscribe((data) => {
      this.noLeidos.set(data);
      this.updateUnreadMessageCounts(data);
    });
  }

  getMessageThreds(userName: string) {
    return this.http.get(this.baseUrl + 'api/messages/thread/' + userName);
  }

  async enviarMensaje(mensaje: SendMessage): Promise<void> {
    if (!this.hubConnection || this.hubConnection.state !== HubConnectionState.Connected) {
      console.error('Cannot send message: Connection is not in the Connected state.');
      return Promise.reject('Connection is not in the Connected state.');
    }

    return this.hubConnection.invoke('SendMessage', mensaje).catch((error) => {
      console.error('Error sending message:', error);
      throw error;
    });
  }

  deleteMessage(id: number) {
    return this.http.delete(this.baseUrl + 'api/messages/' + id);
  }

  getToken(): string {
    return localStorage.getItem('token')!;
  }

}