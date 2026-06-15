import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { ActivityService } from './core/services/activity.service';
import { TokenRefreshService } from './core/services/token-refresh.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private activityService = inject(ActivityService);
  private tokenRefreshService = inject(TokenRefreshService);
  private router = inject(Router);

constructor() {
    console.log('AppComponent constructor');
    
    effect(() => {
      console.log('effect disparado');
      const user = this.authService.currentUser();
      console.log('user:', user);
    });
  }

  ngOnInit(): void {
    console.log('AppComponent ngOnInit');
  }

  ngOnDestroy(): void {
    this.activityService.stopWatching();
    this.tokenRefreshService.stopWatching();
  }
}