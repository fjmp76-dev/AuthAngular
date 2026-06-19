import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { CommonModule } from '@angular/common';
import { UserContextService } from '../../core/services/user-context.service';

export interface NavItem {
  label: string;
  path: string;
  icon: string;
  screen: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatListModule,
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent {
  userContext = inject(UserContextService);

  navItems: NavItem[] = [
    { label: 'Landing',   path: '/landing',   icon: 'home',         screen: 'landing'   },
    { label: 'Captura',   path: '/captura',   icon: 'edit_note',    screen: 'captura'   },
    { label: 'Permisos',  path: '/permisos',  icon: 'admin_panel_settings', screen: 'permisos'  },
  ];

  canAccess(screen: string): boolean {
    return this.userContext.canAccess(screen);
  }
}