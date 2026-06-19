import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, from, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { UserContextService } from '../services/user-context.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService  = inject(AuthService);
  const userContext  = inject(UserContextService);
  const router       = inject(Router);

  const isAuthUrl = req.url.includes('/api/auth/');

  // Antes de cada request que NO sea auth — verificar si hay que renovar
  const proceed$ = isAuthUrl
    ? next(addToken(req, authService.getToken()))
    : from(userContext.doRefresh()).pipe(
        switchMap(() => next(addToken(req, authService.getToken())))
      );

  return proceed$.pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        const isLoginRequest = req.url.includes('/auth/login');
        if (!isLoginRequest) {
          authService.logout();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};

function addToken(req: import('@angular/common/http').HttpRequest<unknown>, token: string | null) {
  return token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
}