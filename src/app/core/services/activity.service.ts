import { Injectable, inject, OnDestroy, NgZone } from '@angular/core';
import { TokenRefreshService } from './token-refresh.service';

@Injectable({ providedIn: 'root' })
export class ActivityService implements OnDestroy {

  private readonly THROTTLE_MS = 5 * 1000; // 5 segundos
  private lastCheck = 0;
  private tokenRefreshService = inject(TokenRefreshService);
  private boundHandler!: () => void;

startWatching(): void {
  console.log('ActivityService — startWatching llamado');
  this.boundHandler = () => {
    const now = Date.now();
    if (now - this.lastCheck >= this.THROTTLE_MS) {
      this.lastCheck = now;
      //console.log('Actividad detectada!');
      this.tokenRefreshService.onUserActivity();
    }
  };

  document.addEventListener('keydown',  this.boundHandler);
  document.addEventListener('click',    this.boundHandler);
  document.addEventListener('input',    this.boundHandler);
}

  stopWatching(): void {
    if (this.boundHandler) {
      document.removeEventListener('keydown',  this.boundHandler);
      document.removeEventListener('click',    this.boundHandler);
      document.removeEventListener('input',    this.boundHandler);
    }
  }

  ngOnDestroy(): void {
    this.stopWatching();
  }
}