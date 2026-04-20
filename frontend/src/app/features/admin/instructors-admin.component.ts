import { Component, OnInit, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Instructor } from '@kite/shared-types';
import { SkeletonComponent } from '../../shared/components/skeleton.component';
import { EmptyComponent } from '../../shared/components/empty.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-instructors-admin',
  standalone: true,
  imports: [FormsModule, SkeletonComponent, EmptyComponent],
  template: `
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Istruttori</h1>
      <button (click)="showForm = !showForm" class="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500">+ Nuovo</button>
    </div>

    @if (showForm) {
      <div class="mb-6 rounded-xl border bg-white p-6 shadow-sm">
        <h3 class="mb-4 font-bold">Nuovo istruttore</h3>
        <div class="grid gap-3 md:grid-cols-2">
          <input [(ngModel)]="form.name" placeholder="Nome" class="rounded-lg border px-3 py-2 text-sm" />
          <input [(ngModel)]="form.email" placeholder="Email" class="rounded-lg border px-3 py-2 text-sm" />
          <textarea [(ngModel)]="form.bio" placeholder="Bio" rows="2" class="rounded-lg border px-3 py-2 text-sm md:col-span-2"></textarea>
          <input [(ngModel)]="form.certifications" placeholder="Certificazioni (virgola)" class="rounded-lg border px-3 py-2 text-sm" />
          <input [(ngModel)]="form.colorHex" type="color" class="h-10 w-20 rounded border" />
        </div>
        <button (click)="create()" class="mt-4 rounded-lg bg-cyan-600 px-6 py-2 text-sm font-bold text-white hover:bg-cyan-500">Crea</button>
      </div>
    }

    @if (loading()) {
      <app-skeleton [count]="3" height="80px" />
    } @else if (instructors().length === 0) {
      <app-empty title="Nessun istruttore" subtitle="Crea il primo istruttore!" />
    } @else {
      <div class="space-y-3">
        @for (i of instructors(); track i.id) {
          <div class="flex items-center gap-4 rounded-xl border bg-white p-4 shadow-sm">
            <div class="h-10 w-10 rounded-full" [style.background-color]="i.colorHex"></div>
            <div class="flex-1">
              <p class="font-bold text-gray-900">{{ i.user.name }}</p>
              <p class="text-sm text-gray-500">{{ i.bio }}</p>
              <div class="mt-1 flex flex-wrap gap-1">
                @for (c of i.certifications; track c) {
                  <span class="rounded-full bg-cyan-50 px-2 py-0.5 text-xs text-cyan-700">{{ c }}</span>
                }
              </div>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class InstructorsAdminComponent implements OnInit {
  instructors = signal<Instructor[]>([]);
  loading = signal(true);
  showForm = false;
  form = { name: '', email: '', bio: '', certifications: '', colorHex: '#2563EB' };

  private api = inject(ApiService);
  private snack = inject(MatSnackBar);

  ngOnInit() { this.load(); }

  load() {
    this.api.getInstructors().subscribe({
      next: (d) => { this.instructors.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  create() {
    this.api.createInstructor({
      ...this.form,
      certifications: this.form.certifications.split(',').map((s) => s.trim()).filter(Boolean),
    }).subscribe(() => {
      this.snack.open('Istruttore creato', 'OK', { duration: 3000 });
      this.showForm = false;
      this.form = { name: '', email: '', bio: '', certifications: '', colorHex: '#2563EB' };
      this.load();
    });
  }
}
