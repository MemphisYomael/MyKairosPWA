import { Component, OnInit, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CallService } from '../call.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-call',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './call.component.html',
  styleUrls: ['./call.component.css']
})
export class CallComponent implements OnInit, OnDestroy {
  @ViewChild('remoteAudio') remoteAudio!: ElementRef<HTMLAudioElement>;
  
  public users: string[] = [];
  public incoming: { callId: string, from: string } | null = null;
  public status = '';
  public callDuration = 0;
  public formattedDuration = '00:00';
  public isMuted = false;
  public isCallActive = false;
  public volume = 80; // Default volume (0-100)
  public callInProgress = false; // Para mostrar el estado de "llamando..."
  public connectionError = false;
  
  private subscriptions: Subscription[] = [];
  private audioContext: AudioContext | null = null;
  private audioGainNode: GainNode | null = null;

  constructor(
    public callSvc: CallService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Suscripciones a los observables del servicio
    this.subscriptions.push(
      this.callSvc.getAvailableUsers().subscribe(u => {
        this.users = u;
        this.cdr.detectChanges();
      }),
      
      this.callSvc.onIncomingCall().subscribe(c => {
        this.incoming = c;
        if (c) {
          // Reproducir tono de llamada entrante
          this.playRingtone();
        } else {
          this.stopRingtone();
        }
        this.cdr.detectChanges();
      }),
      
      this.callSvc.onCallStatus().subscribe(s => {
        this.status = s;
        this.callInProgress = s.includes('Llamando');
        this.connectionError = s.includes('Error');
        this.cdr.detectChanges();
      }),
      
      this.callSvc.onCallDuration().subscribe(d => {
        this.callDuration = d;
        this.formattedDuration = this.formatDuration(d);
        this.cdr.detectChanges();
      }),
      
      this.callSvc.onMuteStatus().subscribe(m => {
        this.isMuted = m;
        this.cdr.detectChanges();
      }),
      
      this.callSvc.onCallActive().subscribe(a => {
        this.isCallActive = a;
        if (a) {
          this.stopRingtone();
        }
        this.cdr.detectChanges();
      }),
      
      // Manejar stream remoto cuando esté disponible
      this.callSvc.onRemoteStream().subscribe(stream => {
        if (stream && this.remoteAudio?.nativeElement) {
          this.setupAudioProcessing(stream);
          this.cdr.detectChanges();
        } else if (!stream && this.audioContext) {
          this.cleanupAudioProcessing();
        }
      })
    );

    // Iniciar verificación de usuarios disponibles
    this.callSvc.refreshAvailable();
    
    // Configurar intervalo para refrescar usuarios disponibles
    const refreshInterval = setInterval(() => {
      if (!this.isCallActive) {
        this.callSvc.refreshAvailable();
      }
    }, 10000); // Cada 10 segundos
    
    // Añadir el intervalo a las suscripciones para limpiarlo después
    this.subscriptions.push({
      unsubscribe: () => clearInterval(refreshInterval)
    } as Subscription);
  }

  ngOnDestroy() {
    this.hangup();
    // Cancelar todas las suscripciones
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    this.stopRingtone();
    this.cleanupAudioProcessing();
    
    // Si hay una llamada activa, terminarla
      this.callSvc.endCurrentCall();
  }

  startCall(user: string) {
    this.callSvc.initiateCall(user).catch(err => {
      console.error('Error al iniciar llamada:', err);
      this.status = 'Error al iniciar llamada';
      this.cdr.detectChanges();
    });
  }

  accept() {
    if (this.incoming) {
      this.stopRingtone();
      this.callSvc.acceptCall(this.incoming.callId).catch(err => {
        console.error('Error al aceptar llamada:', err);
        this.status = 'Error al aceptar llamada';
        this.cdr.detectChanges();
      });
    }
  }

  reject() {
    if (this.incoming) {
      this.stopRingtone();
      this.callSvc.rejectCall(this.incoming.callId).catch(err => {
        console.error('Error al rechazar llamada:', err);
        this.status = 'Error al rechazar llamada';
        this.cdr.detectChanges();
      });
    }
  }

  hangup() {
    this.callSvc.endCurrentCall();
  }

  toggleMute() {
    this.callSvc.toggleMute();
  }

  onVolumeChange() {
    if (this.audioGainNode) {
      // Aplicar el volumen al GainNode en un rango de 0 a 2
      // (0 = silencio, 1 = volumen normal, 2 = doble volumen)
      this.audioGainNode.gain.value = this.volume / 50;
    } else {
      // Usar el método del servicio como fallback
      this.callSvc.setVolume(this.volume);
    }
  }

  formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Tono de llamada
  private ringtoneAudio: HTMLAudioElement | null = null;

  private playRingtone() {
    if (!this.ringtoneAudio) {
      this.ringtoneAudio = new Audio('assets/sounds/ringtone.mp3');
      this.ringtoneAudio.loop = true;
    }
    this.ringtoneAudio.play().catch(err => {
      console.warn('No se pudo reproducir el tono de llamada:', err);
    });
  }

  private stopRingtone() {
    if (this.ringtoneAudio) {
      this.ringtoneAudio.pause();
      this.ringtoneAudio.currentTime = 0;
    }
  }

  // Procesamiento de audio para mejor control del volumen
  private setupAudioProcessing(stream: MediaStream) {
    try {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Limpiar nodos anteriores si existieran
      this.cleanupAudioProcessing();

      // Conectar el stream a un nodo de ganancia para control de volumen
      const source = this.audioContext.createMediaStreamSource(stream);
      this.audioGainNode = this.audioContext.createGain();
      source.connect(this.audioGainNode);
      this.audioGainNode.connect(this.audioContext.destination);
      
      // Establecer volumen inicial
      this.audioGainNode.gain.value = this.volume / 50;
      
      // También configurar el elemento de audio como respaldo
      this.remoteAudio.nativeElement.srcObject = stream;
      this.remoteAudio.nativeElement.play().catch(err => {
        console.error('Error reproduciendo audio:', err);
      });
    } catch (err) {
      console.error('Error configurando procesamiento de audio:', err);
      // Fallback al método tradicional
      this.remoteAudio.nativeElement.srcObject = stream;
      this.remoteAudio.nativeElement.play().catch(console.error);
    }
  }

  private cleanupAudioProcessing() {
    if (this.audioContext) {
      if (this.audioContext.state !== 'closed') {
        this.audioContext.close().catch(console.error);
      }
      this.audioContext = null;
      this.audioGainNode = null;
    }
    
    if (this.remoteAudio?.nativeElement) {
      this.remoteAudio.nativeElement.srcObject = null;
    }
  }
}