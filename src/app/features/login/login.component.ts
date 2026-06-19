import { Component, signal, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  // Signals en lugar de propiedades normales
  loading = signal(false);
  errorMessage = signal('');
  hidePassword = signal(true);

onSubmit(): void {
  if (this.loginForm.invalid) return;

  this.loading.set(true);
  this.errorMessage.set('');

  this.authService.login(this.loginForm.value).subscribe({
    error: (err) => {
      this.ngZone.run(() => {
        this.loading.set(false);
        this.errorMessage.set(
          err.status === 401
            ? 'Usuario o contraseña incorrectos'
            : 'Error al conectar con el servidor'
        );
      });
    }
  });
}
}