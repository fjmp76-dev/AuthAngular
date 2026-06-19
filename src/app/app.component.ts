import { Component, OnInit, OnDestroy, inject, effect } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent implements OnInit, OnDestroy {

  private authService = inject(AuthService);

constructor() {
    effect(() => {
      const user = this.authService.currentUser();
    });
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}
}