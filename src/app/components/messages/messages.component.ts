import { Component, inject, OnInit, signal } from '@angular/core';
import { IMessage, MessageService } from '../../services/message.service';
import { MatCardModule, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [MatCardModule, CommonModule, MatCardTitle, MatCardSubtitle, RouterLink],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.css'
})
export class MessagesComponent implements OnInit{
  messageService = inject(MessageService);
  container = 'Inbox';

  ngOnInit(): void {
    this.loadMessages();
  }

  loadMessages(){
    this.messageService.getMessages(this.container);
  }

  getRoute(message: IMessage){
    if(this.container === 'Outbox') return `/member/${message.recipientUserName}`;
    return `/member/${message.senderUserName}`;
  }

  
}
