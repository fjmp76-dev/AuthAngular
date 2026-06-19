import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  // Ruta de login — sin layout
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then(m => m.LoginComponent)
  },

  // Rutas con layout — header + sidebar
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'landing',
        loadComponent: () =>
          import('./features/landing/landing.component').then(m => m.LandingComponent),
        data: { screen: 'landing' }
      },
      {
        path: 'captura',
        loadComponent: () =>
          import('./features/captura/captura.component').then(m => m.CapturaComponent),
        data: { screen: 'captura' }
      },
      {
        path: 'permisos',
        loadComponent: () =>
          import('./features/permisos/permisos.component').then(m => m.PermisosComponent),
        data: { screen: 'permisos' }
      },
      {
        path: '',
        redirectTo: 'landing',
        pathMatch: 'full'
      }
    ]
  },

  {
    path: '**',
    redirectTo: 'login'
  }
];