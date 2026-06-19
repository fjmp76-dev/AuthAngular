import { Component, inject, computed } from '@angular/core';
import { DatePipe, } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../core/services/auth.service';
import { UserContextService } from '../../core/services/user-context.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [DatePipe, MatToolbarModule, MatButtonModule, MatIconModule, MatTooltipModule ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private authService = inject(AuthService);
  userContext = inject(UserContextService);

  user = computed(() => this.userContext.currentUser());

  logout(): void {
    this.authService.logout();
  }
}