import { Injectable, signal, inject, NgZone, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { AuthResponse, AuthUser, LoginRequest } from '../models/auth.models';
import { UserContextService } from './user-context.service';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API_URL = 'http://localhost:5160/api/auth';

  currentUser = signal<AuthUser | null>(null);

  private http = inject(HttpClient);
  private router = inject(Router);
  private userContext = inject(UserContextService);
  private ngZone = inject(NgZone);

constructor() {
  this.restoreSession();

  // Sincronizar token cuando UserContext lo actualice
  effect(() => {
    const contextUser = this.userContext.currentUser();
    if (!contextUser) return;

    const current = this.currentUser();
    if (!current) return;

    // Si el token cambió en UserContext, actualizar AuthService
    if (contextUser.token !== current.token) {
      const updated: AuthUser = {
        ...current,
        token: contextUser.token,
        expiresAt: contextUser.expiresAt
      };
      this.currentUser.set(updated);
      sessionStorage.setItem('auth_user', JSON.stringify(updated));
    }
  });
}

login(request: LoginRequest): Observable<AuthResponse> {
  return new Observable<AuthResponse>(observer => {
    this.loginAsync(request)
      .then(response => {
        observer.next(response);
        observer.complete();
      })
      .catch(err => observer.error(err));
  });
}

private async loginAsync(request: LoginRequest): Promise<AuthResponse> {
  const response = await firstValueFrom(
    this.http.post<AuthResponse>(`${this.API_URL}/login`, request)
  );

  if (response.success) {
    const user: AuthUser = {
      username: response.username,
      role: response.role,
      token: response.token,
      expiresAt: new Date(response.expiresAt)
    };
    sessionStorage.setItem('auth_user', JSON.stringify(user));
    this.currentUser.set(user);

    await firstValueFrom(
      this.userContext.initialize(
        response.username,
        response.role,
        response.token,
        new Date(response.expiresAt)
      )
    );

    // Navegar directamente desde el servicio
    this.ngZone.run(() => {
      this.router.navigate(['/landing']);
    });
  }

  return response;
}

  logout(): void {
    sessionStorage.removeItem('auth_user');
    this.currentUser.set(null);
    this.userContext.clear();
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return new Date() < new Date(user.expiresAt);
  }

  getToken(): string | null {
    return this.currentUser()?.token ?? null;
  }

  private restoreSession(): void {
    const stored = sessionStorage.getItem('auth_user');
    if (!stored) return;

    try {
      const user: AuthUser = JSON.parse(stored);
      if (new Date() < new Date(user.expiresAt)) {
        this.currentUser.set(user);
        this.userContext.restoreSession();
      } else {
        sessionStorage.removeItem('auth_user');
      }
    } catch {
      sessionStorage.removeItem('auth_user');
    }
  }

  updateToken(token: string, expiresAt: Date): void {
    const user = this.currentUser();
    if (!user) return;
    const updated: AuthUser = { ...user, token, expiresAt };
    sessionStorage.setItem('auth_user', JSON.stringify(updated));
    this.currentUser.set(updated);
  }
}