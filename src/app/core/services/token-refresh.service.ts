import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Subject, interval, takeUntil } from 'rxjs';
import { AuthResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class TokenRefreshService implements OnDestroy {

  private readonly API_URL = 'http://localhost:5160/api/auth';
  private readonly REFRESH_THRESHOLD_MS = 1 * 60 * 1000; // renueva si faltan 1 min
  private readonly CHECK_INTERVAL_MS = 10 * 1000;         // revisa cada 10 seg

  private destroy$ = new Subject<void>();
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  startWatching(): void {
    // Revisar cada 30 segundos si el token necesita renovarse
    interval(this.CHECK_INTERVAL_MS)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.checkAndRefresh());
  }

  stopWatching(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Llamado por el ActivityService cuando detecta actividad del usuario
 onUserActivity(force: boolean = false): void {
  console.log('onUserActivity llamado, force:', force);
  if (force) {
    this.refresh();
  } else {
    this.checkAndRefresh();
  }
}

private checkAndRefresh(): void {
  const user = this.authService.currentUser();
  console.log('checkAndRefresh — user:', user?.username, 'expiresAt:', user?.expiresAt);
  
  if (!user) return;

  const now = new Date().getTime();
  const expiresAt = new Date(user.expiresAt).getTime();
  const timeLeft = expiresAt - now;

  console.log(`Tiempo restante: ${Math.round(timeLeft / 1000)} segundos`);
  console.log(`Threshold: ${this.REFRESH_THRESHOLD_MS / 1000} segundos`);
  console.log(`¿Debe renovar?: ${timeLeft > 0 && timeLeft <= this.REFRESH_THRESHOLD_MS}`);

  if (timeLeft > 0 && timeLeft <= this.REFRESH_THRESHOLD_MS) {
    this.refresh();
  }
}

private refresh(): void {
    this.http.post<AuthResponse>(`${this.API_URL}/refresh`, {}).subscribe({
      next: (response) => {
        if (response.success) {
          const currentUser = this.authService.currentUser();
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              token: response.token,
              expiresAt: new Date(response.expiresAt)
            };
            sessionStorage.setItem('auth_user', JSON.stringify(updatedUser));
            this.authService.currentUser.set(updatedUser);
          }
        }
      },
      error: (err) => {
        console.error('Error renovando token:', err);
      }
    });
  }

  ngOnDestroy(): void {
    this.stopWatching();
  }
}