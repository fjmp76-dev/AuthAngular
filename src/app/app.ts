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
export class App implements OnInit, OnDestroy {

  private authService = inject(AuthService);
  private activityService = inject(ActivityService);
  private tokenRefreshService = inject(TokenRefreshService);
  private router = inject(Router);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.activityService.startWatching();
        this.tokenRefreshService.startWatching();
      } else {
        this.activityService.stopWatching();
        this.tokenRefreshService.stopWatching();
      }
    });
  }

  ngOnInit(): void {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.authService.isAuthenticated()) {
        this.tokenRefreshService.onUserActivity(true);
      }
    });
  }

  ngOnDestroy(): void {
    this.activityService.stopWatching();
    this.tokenRefreshService.stopWatching();
  }
}