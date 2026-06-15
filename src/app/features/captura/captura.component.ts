import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../core/services/auth.service';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-captura',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    DatePipe,
    RouterLink
  ],
  templateUrl: './captura.component.html',
  styleUrl: './captura.component.scss'
})
export class CapturaComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  authService = inject(AuthService);

  form: FormGroup = this.fb.group({
    nombre:    ['', Validators.required],
    apellido:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    telefono:  ['', Validators.required],
    direccion: ['', Validators.required],
    ciudad:    ['', Validators.required],
    notas:     ['']
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.snackBar.open('Datos guardados correctamente', 'OK', { duration: 3000 });
    this.form.reset();
  }
}