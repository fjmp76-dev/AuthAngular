import { Component, inject, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { UserContextService } from '../../core/services/user-context.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent {
  userContext = inject(UserContextService);
  user = computed(() => this.userContext.currentUser());
}