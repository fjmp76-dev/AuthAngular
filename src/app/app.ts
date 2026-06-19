import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { UserContextService } from './core/services/user-context.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class App implements OnInit, OnDestroy {

  private authService    = inject(AuthService);
  private userContext    = inject(UserContextService);
  private router         = inject(Router);

  constructor() {
    effect(() => {
      const user = this.authService.currentUser();
      if (user) {
        this.userContext.startWatching();
      } else {
        this.userContext.stopWatching();
      }
    });
  }

 ngOnInit(): void {
  let isFirstNavigation = true;

  this.router.events.pipe(
    filter(event => event instanceof NavigationEnd)
  ).subscribe(() => {
    if (isFirstNavigation) {
      isFirstNavigation = false;
      return;
    }

    if (this.authService.isAuthenticated()) {
      this.userContext.checkAndRefresh(false);
    }
  });
}

  ngOnDestroy(): void {
    this.userContext.stopWatching();
  }
}