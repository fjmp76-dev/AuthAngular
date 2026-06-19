import { Injectable, signal, inject, computed, NgZone, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, firstValueFrom } from 'rxjs';
import {
  CurrentUser, ICurrentUser, PermissionLevel,
  PermissionsResponse, AuthResponse
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class UserContextService implements OnDestroy {

  private readonly API_URL         = 'http://localhost:5160/api';
  private readonly AUTH_URL        = 'http://localhost:5160/api/auth';
  private readonly THRESHOLD_MS    = 30 * 1000;  // 30 segundos
  private readonly CHECK_INTERVAL  = 1000;       // intervalo de background check (1 seg)

  private http    = inject(HttpClient);
  private ngZone  = inject(NgZone);
  private router  = inject(Router);

  // ── Estado global ──────────────────────────────────────
  currentUser = signal<CurrentUser | null>(null);

  isLoggedIn = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    return new Date() < new Date(user.expiresAt);
  });

  // Milisegundos restantes para que expire el token
  timeLeftMs = computed(() => {
    const user = this.currentUser();
    if (!user) return 0;
    this.nowSignal();
    return new Date(user.expiresAt).getTime() - Date.now();
  });

  // ── Reloj ──────────────────────────────────────────────
  nowSignal = signal(new Date());
  inThreasholdSignal = signal(false);
  isPendingRefreshSignal = signal(false);
  private clockId: ReturnType<typeof setInterval> | null = null;

  // ── Control interno ────────────────────────────────────
  public lastRefresh    = 0;
  private isPendingRefresh=false;
  private boundHandler: (() => void) | null = null;
  private isRefreshing  = false;

  // ── Inicialización ─────────────────────────────────────

  initialize(username: string, role: string, token: string, expiresAt: Date): Observable<PermissionsResponse> {
    return this.http.get<PermissionsResponse>(`${this.API_URL}/permissions/${username}`).pipe(
      tap(response => {
        if (response.success) {
          const user: ICurrentUser = { username, role, token, expiresAt, permissions: response.permissions };
          this.lastRefresh = Date.now();
          sessionStorage.setItem('current_user', JSON.stringify(user));
          this.currentUser.set(new CurrentUser(user));
        }
      })
    );
  }

  restoreSession(): void {
    const stored = sessionStorage.getItem('current_user');
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored);
      if (new Date() < new Date(parsed.expiresAt)) {
        this.currentUser.set(new CurrentUser(parsed));
      } else {
        sessionStorage.removeItem('current_user');
      }
    } catch {
      sessionStorage.removeItem('current_user');
    }
  }

updateToken(token: string, expiresAt: Date): void {
  const user = this.currentUser();
  if (!user) return;

  // Actualizar UserContext
  const updated: ICurrentUser = { ...user, token, expiresAt };
  this.lastRefresh = Date.now();
  sessionStorage.setItem('current_user', JSON.stringify(updated));
  this.currentUser.set(new CurrentUser(updated));

  // Actualizar AuthService sessionStorage directamente
  const stored = sessionStorage.getItem('auth_user');
  if (stored) {
    const authUser = JSON.parse(stored);
    authUser.token = token;
    authUser.expiresAt = expiresAt;
    sessionStorage.setItem('auth_user', JSON.stringify(authUser));
  }
}

  clear(): void {
    sessionStorage.removeItem('current_user');
    this.currentUser.set(null);
  }

  // ── Permisos ───────────────────────────────────────────

  getPermission(screen: string): PermissionLevel {
    const user = this.currentUser();
    if (!user) return PermissionLevel.N;
    const p = user.permissions.find(p => p.screen.toLowerCase() === screen.toLowerCase());
    return p?.level ?? PermissionLevel.N;
  }

  canWrite(screen: string):  boolean { return this.getPermission(screen) === PermissionLevel.W; }
  canRead(screen: string):   boolean { return this.getPermission(screen) >= PermissionLevel.R; }
  canAccess(screen: string): boolean { return this.getPermission(screen) !== PermissionLevel.N; }

  // ── Watching ───────────────────────────────────────────

  startWatching(): void {
    // Reloj update cada segundo
    if (!this.clockId) {
      this.clockId = setInterval(() => {
        this.nowSignal.set(new Date());
        this.inThreasholdSignal.set(this.isInTheshold());
        this.isPendingRefreshSignal.set(this.isPendingRefresh);
        this.checkAndRefresh();
      }, this.CHECK_INTERVAL);
    }

    // Eventos de actividad
    if (!this.boundHandler) {
      this.boundHandler = () => this.controlCheckAndRefresh();
      document.addEventListener('click',   this.boundHandler);
      document.addEventListener('keydown', this.boundHandler);
      document.addEventListener('input',   this.boundHandler);
      document.addEventListener('focusin', this.boundHandler);
    }
  }

  stopWatching(): void {
    if (this.clockId) {
        clearInterval(this.clockId);
        this.clockId = null;
    }

    if (this.boundHandler) {
      document.removeEventListener('click',    this.boundHandler);
      document.removeEventListener('keydown',  this.boundHandler);
      document.removeEventListener('input',    this.boundHandler);
      document.removeEventListener('focusin',  this.boundHandler);
      this.boundHandler = null;
    }
  }

  // ── Lógica de renovación ───────────────────────────────

  isInTheshold(): boolean {
    return this.timeLeftMs() <= this.THRESHOLD_MS;
  }

  isExpired(): boolean {
    return this.timeLeftMs() <= 0;
  }

  controlCheckAndRefresh(): void {
    if (!this.isPendingRefresh) 
      this.isPendingRefresh = true;
     return;
  }

  checkAndRefresh(force: boolean = false): void {

    if (force) {
      //console.log('checkAndRefresh: por api');
      this.doRefresh();
      return;
    }
    
    if (!this.isInTheshold()) return;

    if (this.isExpired()) {
      // Token expirado — logout
      this.ngZone.run(() => {
        //console.log('checkAndRefresh: Token expirado');
        this.clear();
        this.router.navigate(['/login']);
      });
      return;
    }

    if (this.isInTheshold() && this.isPendingRefresh) {
      //console.log('checkAndRefresh: En threshold, programando refresh');
      this.doRefresh();
      this.isPendingRefresh = false;
      return;
    }
  }

  async doRefresh(): Promise<void> {
    if (this.isRefreshing) return;
    this.isRefreshing = true;

    const token = this.currentUser()?.token;
    if (!token) {
      this.isRefreshing = false;
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${this.AUTH_URL}/refresh`, {})
      );

      if (response.success) {
        this.lastRefresh = Date.now();
        this.updateToken(response.token, new Date(response.expiresAt));
      }
    } catch (err) {
      console.error('Error renovando token:', err);
    } finally {
      this.isRefreshing = false;
    }
  }

  ngOnDestroy(): void {
    this.stopWatching();
  }
}