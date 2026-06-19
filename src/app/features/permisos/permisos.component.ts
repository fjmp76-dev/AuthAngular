import { Component, inject, computed } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { CommonModule } from '@angular/common';
import { UserContextService } from '../../core/services/user-context.service';
import { NoAccessComponent } from '../no-access/no-access.component';
import { PermissionLevel } from '../../core/models/auth.models';

@Component({
  selector: 'app-permisos',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    NoAccessComponent
],
  templateUrl: './permisos.component.html',
  styleUrl: './permisos.component.scss'
})
export class PermisosComponent {
  userContext = inject(UserContextService);

  canAccess = computed(() => this.userContext.canAccess('permisos'));
  user      = computed(() => this.userContext.currentUser());

  displayedColumns = ['screen', 'level'];
  PermissionLevel  = PermissionLevel;

  getLevelLabel(level: PermissionLevel): string {
    switch (level) {
      case PermissionLevel.W: return 'Escritura';
      case PermissionLevel.R: return 'Lectura';
      default:                return 'Sin acceso';
    }
  }

  getLevelColor(level: PermissionLevel): string {
    switch (level) {
      case PermissionLevel.W: return 'primary';
      case PermissionLevel.R: return 'accent';
      default:                return 'warn';
    }
  }
}