import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel, HubConnectionState } from '@microsoft/signalr';
import { BehaviorSubject, Observable, Subject, from } from 'rxjs';
import { environment } from '../../environments/environment';

interface PeerConnectionConfig {
  iceServers: Array<{
    urls: string[];
    username?: string;
    credential?: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class CallService {
  public hub!: HubConnection;
  public availableUsers$ = new BehaviorSubject<string[]>([]);
  public incomingCall$ = new BehaviorSubject<{ callId: string, from: string }|null>(null);
  public callStatus$ = new BehaviorSubject<string>('');
  public callDuration$ = new BehaviorSubject<number>(0);
  public isMuted$ = new BehaviorSubject<boolean>(false);
  public isVideoEnabled$ = new BehaviorSubject<boolean>(false);
  public isScreenSharing$ = new BehaviorSubject<boolean>(false);
  public isCallActive$ = new BehaviorSubject<boolean>(false);
  public connectionReady$ = new BehaviorSubject<boolean>(false);
  
  // WebRTC
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private localVideoStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private remoteStream = new BehaviorSubject<MediaStream | null>(null);
  private remoteVideoEnabled = new BehaviorSubject<boolean>(false);
  private remoteScreenSharing = new BehaviorSubject<boolean>(false);
  private activeCallId: string | null = null;
  private timer: any = null;
  private startTime: number = 0;
  private connectionPromise: Promise<void> | null = null;
  private screenTrackId: string | null = null;

  // ICE configuration - usando servidores STUN públicos
  private peerConfig: PeerConnectionConfig = {
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302'
        ]
      }
    ]
  };

  constructor() {
    this.hub = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}hubs/call`, {
        accessTokenFactory: () => localStorage.getItem('token')!
      })
      .configureLogging(LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    this.registerHubHandlers();
    this.startConnection();
  }

  private async startConnection() {
    try {
      this.connectionPromise = this.hub.start();
      await this.connectionPromise;
      this.connectionReady$.next(true);
      console.log("SignalR connection established successfully");
      await this.refreshAvailable();
    } catch (error) {
      console.error("Failed to establish SignalR connection:", error);
      this.callStatus$.next('Error de conexión');
      this.connectionReady$.next(false);
      
      // Retry connection after 5 seconds
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  private async ensureConnection(): Promise<boolean> {
    if (this.hub.state === HubConnectionState.Connected) {
      return true;
    }
    
    if (this.hub.state === HubConnectionState.Disconnected) {
      try {
        await this.hub.start();
        this.connectionReady$.next(true);
        return true;
      } catch (error) {
        console.error("Failed to reconnect:", error);
        this.connectionReady$.next(false);
        return false;
      }
    }
    
    // If connecting, wait for it
    if (this.connectionPromise) {
      try {
        await this.connectionPromise;
        return true;
      } catch {
        return false;
      }
    }
    
    return false;
  }

  public registerHubHandlers() {
    this.hub.on('UserAvailableForCalls', user => this.refreshAvailable());
    this.hub.on('IncomingCall', (callId: string, from: string) => {
      this.incomingCall$.next({ callId, from });
    });
    this.hub.on('CallInitiated', (callId, to) => {
      this.callStatus$.next(`Llamando a ${to}…`);
      this.activeCallId = callId;
      this.createPeerConnection();
    });
    this.hub.on('CallAccepted', callId => {
      this.callStatus$.next('Llamada aceptada');
      // Iniciar la oferta WebRTC cuando somos el llamante
      if (this.peerConnection && this.activeCallId === callId) {
        this.createOffer();
      }
    });
    this.hub.on('CallConnected', callId => {
      this.callStatus$.next('Conectados');
      this.isCallActive$.next(true);
      this.startCallTimer();
    });
    this.hub.on('CallRejected', callId => {
      this.callStatus$.next('Llamada rechazada');
      this.resetCallState();
    });
    this.hub.on('CallEnded', reason => {
      this.callStatus$.next(`Finalizada: ${reason}`);
      this.resetCallState();
    });
    this.hub.on('ReceiveCallSignal', (callId, data, type) => {
      this.handleSignalingData(callId, data, type);
    });
    this.hub.on('RemoteMediaStateChanged', (callId, isAudioEnabled, isVideoEnabled, isScreenSharing) => {
      this.remoteVideoEnabled.next(isVideoEnabled);
      this.remoteScreenSharing.next(isScreenSharing);
    });
    
    // Handle reconnection events
    this.hub.onreconnecting(() => {
      console.log("Attempting to reconnect...");
      this.connectionReady$.next(false);
    });
    
    this.hub.onreconnected(() => {
      console.log("Reconnected successfully");
      this.connectionReady$.next(true);
      this.refreshAvailable();
    });
    
    this.hub.onclose(() => {
      console.log("Connection closed");
      this.connectionReady$.next(false);
      
      // Try to restart connection after a delay
      setTimeout(() => this.startConnection(), 5000);
    });
  }

  public async refreshAvailable() {
    if (await this.ensureConnection()) {
      try {
        const list = await this.hub.invoke<string[]>('GetAvailableUsers');
        this.availableUsers$.next(list);
      } catch (error) {
        console.error("Error fetching available users:", error);
        this.availableUsers$.next([]);
      }
    }
  }

  // Expuestos al componente:
  public getAvailableUsers(): Observable<string[]> { return this.availableUsers$.asObservable(); }
  public onIncomingCall(): Observable<{ callId: string, from: string }|null> { return this.incomingCall$.asObservable(); }
  public onCallStatus(): Observable<string> { return this.callStatus$.asObservable(); }
  public onRemoteStream(): Observable<MediaStream | null> { return this.remoteStream.asObservable(); }
  public onCallDuration(): Observable<number> { return this.callDuration$.asObservable(); }
  public onMuteStatus(): Observable<boolean> { return this.isMuted$.asObservable(); }
  public onVideoStatus(): Observable<boolean> { return this.isVideoEnabled$.asObservable(); }
  public onScreenSharingStatus(): Observable<boolean> { return this.isScreenSharing$.asObservable(); }
  public onRemoteVideoEnabled(): Observable<boolean> { return this.remoteVideoEnabled.asObservable(); }
  public onRemoteScreenSharing(): Observable<boolean> { return this.remoteScreenSharing.asObservable(); }
  public onCallActive(): Observable<boolean> { return this.isCallActive$.asObservable(); }
  public onConnectionReady(): Observable<boolean> { return this.connectionReady$.asObservable(); }

  // WebRTC methods
  public async createPeerConnection() {
    try {
      // Solicitar permisos de audio (siempre necesarios)
      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      
      // Crear conexión WebRTC
      this.peerConnection = new RTCPeerConnection(this.peerConfig);
      
      // Añadir pistas de audio locales
      this.localStream.getAudioTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });

      // Escuchar pistas remotas
      this.peerConnection.ontrack = (event) => {
        const stream = this.remoteStream.value || new MediaStream();
        
        // Verificar si la pista ya está en el stream
        const trackExists = stream.getTracks().some(t => t.id === event.track.id);
        if (!trackExists) {
          stream.addTrack(event.track);
          this.remoteStream.next(stream);
        }
        
        // Detectar si es una pista de video (para activar la UI correspondiente)
        if (event.track.kind === 'video') {
          if (event.track.label.includes('screen') || event.transceiver?.mid === 'screen') {
            this.remoteScreenSharing.next(true);
          } else {
            this.remoteVideoEnabled.next(true);
          }
        }
      };

      // Manejar candidatos ICE
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.activeCallId) {
          this.sendSignal(
            this.activeCallId, 
            JSON.stringify(event.candidate),
            'ice-candidate'
          );
        }
      };

      // Manejar cambios de estado de conexión
      this.peerConnection.onconnectionstatechange = () => {
        switch(this.peerConnection?.connectionState) {
          case 'connected':
            console.log('Peers connected!');
            break;
          case 'disconnected':
          case 'failed':
            console.log('Peer connection failed/disconnected');
            this.endCurrentCall();
            break;
        }
      };

    } catch (err) {
      console.error('Error creating peer connection:', err);
      this.callStatus$.next('Error al acceder al micrófono');
    }
  }

  public async createOffer() {
    try {
      if (!this.peerConnection) {
        await this.createPeerConnection();
      }
      
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      
      // Enviar oferta al otro peer
      if (this.activeCallId) {
        this.sendSignal(
          this.activeCallId, 
          JSON.stringify(offer), 
          'offer'
        );
      }
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  }

  public async createAnswer() {
    try {
      if (!this.peerConnection) {
        await this.createPeerConnection();
      }
      
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);
      
      // Enviar respuesta al otro peer
      if (this.activeCallId) {
        this.sendSignal(
          this.activeCallId, 
          JSON.stringify(answer), 
          'answer'
        );
      }
    } catch (err) {
      console.error('Error creating answer:', err);
    }
  }

  public async handleSignalingData(callId: string, data: string, type: string) {
    if (!this.peerConnection && ['offer', 'answer', 'ice-candidate'].includes(type)) {
      await this.createPeerConnection();
      this.activeCallId = callId;
    }

    switch (type) {
      case 'offer':
        try {
          const offerDesc = JSON.parse(data);
          await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offerDesc));
          await this.createAnswer();
        } catch (err) {
          console.error('Error handling offer:', err);
        }
        break;
        
      case 'answer':
        try {
          const answerDesc = JSON.parse(data);
          await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(answerDesc));
        } catch (err) {
          console.error('Error handling answer:', err);
        }
        break;
        
      case 'ice-candidate':
        try {
          const candidate = JSON.parse(data);
          await this.peerConnection!.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error handling ICE candidate:', err);
        }
        break;
    }
  }

  public resetCallState() {
    // Limpiar estado de vídeo
    this.isVideoEnabled$.next(false);
    this.isScreenSharing$.next(false);
    this.remoteVideoEnabled.next(false);
    this.remoteScreenSharing.next(false);
    
    // Cerrar conexión WebRTC
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Detener streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.localVideoStream) {
      this.localVideoStream.getTracks().forEach(track => track.stop());
      this.localVideoStream = null;
    }
    
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
      this.screenStream = null;
    }
    
    this.screenTrackId = null;
    
    // Limpiar remoteStream
    this.remoteStream.next(null);
    
    // Limpiar estado
    this.activeCallId = null;
    this.isCallActive$.next(false);
    this.stopCallTimer();
    this.incomingCall$.next(null);
  }

  private startCallTimer() {
    this.startTime = Date.now();
    this.callDuration$.next(0);
    
    this.timer = setInterval(() => {
      const duration = Math.floor((Date.now() - this.startTime) / 1000);
      this.callDuration$.next(duration);
    }, 1000);
  }

  public stopCallTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.callDuration$.next(0);
  }

  public endCurrentCall() {
    if (this.activeCallId) {
      this.endCall(this.activeCallId).catch(console.error);
    }
  }

  // Métodos para UI:
  public async initiateCall(user: string) {
    if (await this.ensureConnection()) {
      try {
        await this.hub.invoke('InitiateCall', user);
        await this.refreshAvailable();
      } catch (error) {
        console.error("Error initiating call:", error);
        this.callStatus$.next('Error al iniciar llamada');
        throw error;
      }
    } else {
      this.callStatus$.next('Error de conexión');
      throw new Error('Connection not available');
    }
  }
  
  public async acceptCall(callId: string) {
    if (await this.ensureConnection()) {
      try {
        this.activeCallId = callId;
        await this.createPeerConnection();
        await this.hub.invoke('AcceptCall', callId);
        this.incomingCall$.next(null);
      } catch (error) {
        console.error("Error accepting call:", error);
        this.callStatus$.next('Error al aceptar llamada');
        throw error;
      }
    } else {
      this.callStatus$.next('Error de conexión');
      throw new Error('Connection not available');
    }
  }
  
  public async rejectCall(callId: string) {
    if (await this.ensureConnection()) {
      try {
        await this.hub.invoke('RejectCall', callId);
        this.incomingCall$.next(null);
      } catch (error) {
        console.error("Error rejecting call:", error);
        throw error;
      }
    } else {
      this.incomingCall$.next(null);
    }
  }
  
  public async endCall(callId: string) {
    if (await this.ensureConnection()) {
      try {
        await this.hub.invoke('EndCall', callId);
      } catch (error) {
        console.error("Error ending call:", error);
      }
    }
    this.resetCallState();
    await this.refreshAvailable();
  }
  
  public async sendSignal(callId: string, data: any, type: string) {
    if (await this.ensureConnection()) {
      try {
        return await this.hub.invoke('SendCallSignal', callId, data, type);
      } catch (error) {
        console.error("Error sending signal:", error);
      }
    }
  }

  // Utilidades de audio
  public toggleMute() {
    if (!this.localStream) return;

    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length === 0) return;

    const isMuted = !audioTracks[0].enabled;
    audioTracks[0].enabled = isMuted;
    this.isMuted$.next(!isMuted);
    
    this.updateMediaState();
  }

  public setVolume(volume: number) {
    // Implementación para cuando tengamos un elemento de audio en el componente
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.volume = volume / 100;
    });
  }

  // NUEVOS MÉTODOS PARA CÁMARA Y COMPARTIR PANTALLA

  // Métodos para cámara
  public async toggleVideo() {
    try {
      if (this.isVideoEnabled$.value) {
        // Desactivar vídeo
        if (this.localVideoStream) {
          this.localVideoStream.getTracks().forEach(track => {
            track.stop();
            if (this.peerConnection) {
              const senders = this.peerConnection.getSenders();
              const sender = senders.find(s => s.track?.kind === 'video' && s.track.label === track.label);
              if (sender) {
                this.peerConnection.removeTrack(sender);
              }
            }
          });
          this.localVideoStream = null;
        }
        this.isVideoEnabled$.next(false);
      } else {
        // Activar vídeo
        if (!this.isScreenSharing$.value) {  // No permitir activar la cámara si ya estamos compartiendo pantalla
          const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
          this.localVideoStream = videoStream;
          this.isVideoEnabled$.next(true);
          
          // Añadir pista de vídeo al peerConnection
          if (this.peerConnection) {
            videoStream.getVideoTracks().forEach(track => {
              this.peerConnection!.addTrack(track, videoStream);
            });
            
            // Renegociar conexión
            await this.createOffer();
          }
        }
      }
      
      this.updateMediaState();
      
    } catch (err) {
      console.error('Error toggling video:', err);
      this.callStatus$.next('Error al acceder a la cámara');
    }
  }

  // Métodos para compartir pantalla
  public async toggleScreenSharing() {
    try {
      if (this.isScreenSharing$.value) {
        // Detener compartir pantalla
        if (this.screenStream) {
          this.screenStream.getTracks().forEach(track => {
            track.stop();
            if (this.peerConnection && this.screenTrackId) {
              const senders = this.peerConnection.getSenders();
              const sender = senders.find(s => s.track?.id === this.screenTrackId);
              if (sender) {
                this.peerConnection.removeTrack(sender);
              }
            }
          });
          this.screenStream = null;
          this.screenTrackId = null;
        }
        this.isScreenSharing$.next(false);
      } else {
        // Iniciar compartir pantalla
        if (!this.isVideoEnabled$.value) {  // No permitir compartir pantalla si la cámara está activada
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
            video: { 
              displaySurface: "window"
            }
          });
          
          // Manejar cuando el usuario detenga la compartición desde el navegador
          screenStream.getVideoTracks()[0].onended = () => {
            this.toggleScreenSharing();
          };
          
          this.screenStream = screenStream;
          this.screenTrackId = screenStream.getVideoTracks()[0].id;
          this.isScreenSharing$.next(true);
          
          // Añadir pista de vídeo al peerConnection con transceiver especial
          if (this.peerConnection) {
            const videoTrack = screenStream.getVideoTracks()[0];
            const transceiver = this.peerConnection.addTransceiver(videoTrack, {
              streams: [screenStream],
              direction: 'sendonly'
            });
            
            // Identificar este transceiver como pantalla
            // transceiver.mid = 'screen';
            
            // Renegociar conexión
            await this.createOffer();
          }
        }
      }
      
      this.updateMediaState();
      
    } catch (err) {
      console.error('Error toggling screen sharing:', err);
      this.callStatus$.next('Error al compartir pantalla');
      this.isScreenSharing$.next(false);
    }
  }

  // Actualizar estado de medios
  private async updateMediaState() {
    if (this.activeCallId && await this.ensureConnection()) {
      try {
        const isAudioEnabled = this.localStream?.getAudioTracks().some(t => t.enabled) || false;
        const isVideoEnabled = this.isVideoEnabled$.value;
        const isScreenSharing = this.isScreenSharing$.value;
        
        await this.hub.invoke('UpdateMediaState', this.activeCallId, isAudioEnabled, isVideoEnabled, isScreenSharing);
      } catch (error) {
        console.error("Error updating media state:", error);
      }
    }
  }

  // Obtener stream local para vista previa
  public getLocalVideoStream(): MediaStream | null {
    if (this.isVideoEnabled$.value) {
      return this.localVideoStream;
    } else if (this.isScreenSharing$.value) {
      return this.screenStream;
    }
    return null;
  }
}