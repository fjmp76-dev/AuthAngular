import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserContextService } from '../services/user-context.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const userContext = inject(UserContextService);
  const router      = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Las rutas hijas manejan su propio acceso con NoAccessComponent
  // El guard solo verifica autenticación
  return true;
};