import { Component, inject, signal, computed, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink } from '@angular/router';
import { UserContextService } from '../../core/services/user-context.service';

export interface CapturaRecord {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  notas: string;
}

type FormMode = 'hidden' | 'add' | 'view' | 'edit';

@Component({
  selector: 'app-captura',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule
  ],
  templateUrl: './captura.component.html',
  styleUrl: './captura.component.scss'
})
export class CapturaComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);
  userContext = inject(UserContextService);

  // Permisos de esta pantalla
  canWrite = computed(() => this.userContext.canWrite('captura'));
  canRead  = computed(() => this.userContext.canRead('captura'));

  // Dataset en memoria
  records = signal<CapturaRecord[]>([
    { id: 1, nombre: 'Juan',  apellido: 'Pérez',  email: 'juan@test.com',
      telefono: '555-1111', direccion: 'Calle 1', ciudad: 'CDMX',    notas: '' },
    { id: 2, nombre: 'María', apellido: 'López',  email: 'maria@test.com',
      telefono: '555-2222', direccion: 'Calle 2', ciudad: 'GDL',     notas: 'VIP' },
    { id: 3, nombre: 'Pedro', apellido: 'García', email: 'pedro@test.com',
      telefono: '555-3333', direccion: 'Calle 3', ciudad: 'MTY',     notas: '' },
    { id: 4, nombre: 'Ana',   apellido: 'Torres', email: 'ana@test.com',
      telefono: '555-4444', direccion: 'Calle 4', ciudad: 'Puebla',  notas: '' },
    { id: 5, nombre: 'Luis',  apellido: 'Ramos',  email: 'luis@test.com',
      telefono: '555-5555', direccion: 'Calle 5', ciudad: 'Cancún',  notas: '' },
    { id: 6, nombre: 'Sara',  apellido: 'Díaz',   email: 'sara@test.com',
      telefono: '555-6666', direccion: 'Calle 6', ciudad: 'Mérida',  notas: '' },
  ]);

  // Paginación
  pageSize = 5;
  pageIndex = 0;
  pagedRecords = computed(() => {
    const start = this.pageIndex * this.pageSize;
    return this.records().slice(start, start + this.pageSize);
  });

  // Tabla
  displayedColumns = computed(() => {
    const base = ['id', 'nombre', 'apellido', 'email', 'ciudad'];
    return [...base, 'acciones'];
  });

  // Formulario
  formMode = signal<FormMode>('hidden');
  selectedRecord = signal<CapturaRecord | null>(null);
  private nextId = 7;

  form: FormGroup = this.fb.group({
    nombre:    ['', Validators.required],
    apellido:  ['', Validators.required],
    email:     ['', [Validators.required, Validators.email]],
    telefono:  ['', Validators.required],
    direccion: ['', Validators.required],
    ciudad:    ['', Validators.required],
    notas:     ['']
  });

  // Título dinámico del formulario
  formTitle = computed(() => {
    switch (this.formMode()) {
      case 'add':  return 'Nuevo Registro';
      case 'edit': return 'Editar Registro';
      case 'view': return 'Ver Registro';
      default:     return '';
    }
  });

  isViewMode = computed(() => this.formMode() === 'view');

  // ── Acciones de tabla ────────────────────────────────────

  onAdd(): void {
    this.form.reset();
    this.form.enable();
    this.selectedRecord.set(null);
    this.formMode.set('add');
    this.cdr.detectChanges();
  }

  onView(record: CapturaRecord): void {
    this.selectedRecord.set(record);
    this.form.patchValue(record);
    this.form.disable();
    this.formMode.set('view');
    this.cdr.detectChanges();
    this.scrollToForm();
  }

  onEdit(record: CapturaRecord): void {
    this.selectedRecord.set(record);
    this.form.patchValue(record);
    this.form.enable();
    this.formMode.set('edit');
    this.cdr.detectChanges();
    this.scrollToForm();
  }

  onDelete(record: CapturaRecord): void {
    this.records.update(list => list.filter(r => r.id !== record.id));

    // Ajustar página si quedó vacía
    const totalAfter = this.records().length;
    const maxPage = Math.max(0, Math.ceil(totalAfter / this.pageSize) - 1);
    if (this.pageIndex > maxPage) this.pageIndex = maxPage;

    if (this.selectedRecord()?.id === record.id) {
      this.onCancel();
    }

    this.snackBar.open('Registro eliminado', 'OK', { duration: 3000 });
    this.cdr.detectChanges();
  }

  // ── Acciones de formulario ───────────────────────────────

  onSubmit(): void {
    if (this.form.invalid) return;

    const values = this.form.value;

    if (this.formMode() === 'add') {
      const newRecord: CapturaRecord = { id: this.nextId++, ...values };
      this.records.update(list => [...list, newRecord]);
      this.snackBar.open('Registro agregado', 'OK', { duration: 3000 });
    } else if (this.formMode() === 'edit') {
      const id = this.selectedRecord()!.id;
      this.records.update(list =>
        list.map(r => r.id === id ? { id, ...values } : r)
      );
      this.snackBar.open('Registro actualizado', 'OK', { duration: 3000 });
    }

    this.onCancel();
    this.cdr.detectChanges();
  }

  onCancel(): void {
    this.form.reset();
    this.formMode.set('hidden');
    this.selectedRecord.set(null);
    this.cdr.detectChanges();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize  = event.pageSize;
    this.cdr.detectChanges();
  }

  private scrollToForm(): void {
    setTimeout(() => {
      document.getElementById('captura-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
}