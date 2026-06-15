import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, AuthUser, LoginRequest } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly API_URL = 'http://localhost:5160/api/auth';

  // Signal reactivo — cualquier componente que lo lea se actualiza automático
  currentUser = signal<AuthUser | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, request).pipe(
      tap(response => {
        if (response.success) {
          const user: AuthUser = {
            username: response.username,
            role: response.role,
            token: response.token,
            expiresAt: new Date(response.expiresAt)
          };
          sessionStorage.setItem('auth_user', JSON.stringify(user));
          this.currentUser.set(user);
        }
      })
    );
  }

  logout(): void {
    sessionStorage.removeItem('auth_user');
    this.currentUser.set(null);
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
      } else {
        sessionStorage.removeItem('auth_user');
      }
    } catch {
      sessionStorage.removeItem('auth_user');
    }
  }
}