import { Component, inject, signal, computed, ChangeDetectorRef, OnInit } from '@angular/core';
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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserContextService } from '../../core/services/user-context.service';
import { CapturaService } from '../../core/services/captura.service';
import { CapturaRecord } from '../../core/models/auth.models';

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
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './captura.component.html',
  styleUrl: './captura.component.scss'
})
export class CapturaComponent implements OnInit {
  private fb             = inject(FormBuilder);
  private snackBar       = inject(MatSnackBar);
  private cdr            = inject(ChangeDetectorRef);
  private capturaService = inject(CapturaService);
  userContext            = inject(UserContextService);

  // Permisos
  canWrite = computed(() => this.userContext.canWrite('captura'));
  canRead  = computed(() => this.userContext.canRead('captura'));

  // Estado
  records   = signal<CapturaRecord[]>([]);
  loading   = signal(false);

  // Paginación
  pageSize = 5;
  pageIndex = 0;

  // Tabla
  displayedColumns: string[] = ['id', 'nombre', 'apellido', 'email', 'ciudad', 'acciones'];

  // Formulario
  formMode = signal<FormMode>('hidden');
  selectedRecord = signal<CapturaRecord | null>(null);

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

  ngOnInit(): void {
    this.loadRecords();
  }

  // ── API calls ────────────────────────────────────────

  getPagedRecords(): CapturaRecord[] {
    const start = this.pageIndex * this.pageSize;
    return this.records().slice(start, start + this.pageSize);
  }

  loadRecords(): void {
  this.loading.set(true);
  this.capturaService.getAll().subscribe({
    next: (data) => {
      this.records.set(data);
      this.loading.set(false);
      this.cdr.detectChanges();
    },
    error: () => {
      this.snackBar.open('Error cargando registros', 'OK', { duration: 3000 });
      this.loading.set(false);
      this.cdr.detectChanges();
    }
  });
}

  // ── Acciones tabla ───────────────────────────────────

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
    this.capturaService.delete(record.id).subscribe({
      next: () => {
        this.records.update(list => list.filter(r => r.id !== record.id));
        const totalAfter = this.records().length;
        const maxPage = Math.max(0, Math.ceil(totalAfter / this.pageSize) - 1);
        if (this.pageIndex > maxPage) this.pageIndex = maxPage;
        if (this.selectedRecord()?.id === record.id) this.onCancel();
        this.snackBar.open('Registro eliminado', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
      error: () => {
        this.snackBar.open('Error eliminando registro', 'OK', { duration: 3000 });
      }
    });
  }

  // ── Acciones formulario ──────────────────────────────

  onSubmit(): void {
    if (this.form.invalid) return;

    const values = this.form.value;

    if (this.formMode() === 'add') {
      const newRecord: CapturaRecord = { id: 0, ...values };
      this.capturaService.add(newRecord).subscribe({
        next: (created) => {
          this.records.update(list => [...list, created]);
          this.snackBar.open('Registro agregado', 'OK', { duration: 3000 });
          this.onCancel();
          this.cdr.detectChanges();
        },
        error: () => {
          this.snackBar.open('Error agregando registro', 'OK', { duration: 3000 });
        }
      });
    } else if (this.formMode() === 'edit') {
      const record: CapturaRecord = { id: this.selectedRecord()!.id, ...values };
      this.capturaService.update(record).subscribe({
        next: (updated) => {
          this.records.update(list =>
            list.map(r => r.id === updated.id ? updated : r)
          );
          this.snackBar.open('Registro actualizado', 'OK', { duration: 3000 });
          this.onCancel();
          this.cdr.detectChanges();
        },
        error: () => {
          this.snackBar.open('Error actualizando registro', 'OK', { duration: 3000 });
        }
      });
    }
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