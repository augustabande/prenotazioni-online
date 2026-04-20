import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { LessonType } from '@kite/shared-types';
import { SkeletonComponent } from '../../shared/components/skeleton.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-lesson-types-admin',
  standalone: true,
  imports: [FormsModule, SkeletonComponent],
  template: `
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Tipi di lezione</h1>
      <button (click)="startCreate()" class="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500">+ Nuovo</button>
    </div>

    @if (editing()) {
      <div class="mb-6 rounded-xl border bg-white p-6 shadow-sm">
        <h3 class="mb-4 font-bold">{{ form.id ? 'Modifica' : 'Nuovo' }} tipo lezione</h3>
        <div class="grid gap-3 md:grid-cols-2">
          <input [(ngModel)]="form.code" placeholder="Codice" class="rounded-lg border px-3 py-2 text-sm" />
          <input [(ngModel)]="form.title" placeholder="Titolo" class="rounded-lg border px-3 py-2 text-sm" />
          <textarea [(ngModel)]="form.description" placeholder="Descrizione" rows="2" class="rounded-lg border px-3 py-2 text-sm md:col-span-2"></textarea>
          <input type="number" [(ngModel)]="form.durationMinutes" placeholder="Durata (min)" class="rounded-lg border px-3 py-2 text-sm" />
          <input type="number" [(ngModel)]="form.pricePerPerson" placeholder="Prezzo/persona €" class="rounded-lg border px-3 py-2 text-sm" />
          <input type="number" [(ngModel)]="form.minParticipants" placeholder="Min partecipanti" class="rounded-lg border px-3 py-2 text-sm" />
          <input type="number" [(ngModel)]="form.maxParticipants" placeholder="Max partecipanti" class="rounded-lg border px-3 py-2 text-sm" />
          <input type="number" [(ngModel)]="form.requiredWindKnotsMin" placeholder="Vento min (nodi)" class="rounded-lg border px-3 py-2 text-sm" />
          <input type="number" [(ngModel)]="form.requiredWindKnotsMax" placeholder="Vento max (nodi)" class="rounded-lg border px-3 py-2 text-sm" />
        </div>
        <div class="mt-4 flex gap-2">
          <button (click)="save()" class="rounded-lg bg-cyan-600 px-6 py-2 text-sm font-bold text-white hover:bg-cyan-500">Salva</button>
          <button (click)="editing.set(false)" class="rounded-lg border px-6 py-2 text-sm">Annulla</button>
        </div>
      </div>
    }

    @if (loading()) {
      <app-skeleton [count]="4" height="80px" />
    } @else {
      <div class="space-y-3">
        @for (lt of lessons(); track lt.id) {
          <div class="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
            <div>
              <p class="font-bold text-gray-900">{{ lt.title }} <span class="text-xs text-gray-400">({{ lt.code }})</span></p>
              <p class="text-sm text-gray-500">{{ lt.durationMinutes }}min · €{{ lt.pricePerPerson }} · 💨 {{ lt.requiredWindKnotsMin }}–{{ lt.requiredWindKnotsMax }} nodi</p>
            </div>
            <div class="flex gap-2">
              <button (click)="edit(lt)" class="text-xs text-cyan-600 hover:underline">Modifica</button>
              <button (click)="remove(lt.id)" class="text-xs text-red-600 hover:underline">Disattiva</button>
            </div>
          </div>
        }
      </div>
    }
  `,
})
export class LessonTypesAdminComponent implements OnInit {
  lessons = signal<LessonType[]>([]);
  loading = signal(true);
  editing = signal(false);
  form: any = {};

  constructor(private api: ApiService, private snack: MatSnackBar) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.getLessonTypes().subscribe({
      next: (d) => { this.lessons.set(d); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  startCreate() {
    this.form = { code: '', title: '', description: '', durationMinutes: 120, pricePerPerson: 100, minParticipants: 1, maxParticipants: 1, requiredWindKnotsMin: 12, requiredWindKnotsMax: 30 };
    this.editing.set(true);
  }

  edit(lt: LessonType) {
    this.form = { ...lt };
    this.editing.set(true);
  }

  save() {
    const obs = this.form.id
      ? this.api.updateLessonType(this.form.id, this.form)
      : this.api.createLessonType(this.form);
    obs.subscribe(() => {
      this.snack.open('Salvato', 'OK', { duration: 3000 });
      this.editing.set(false);
      this.load();
    });
  }

  remove(id: string) {
    this.api.deleteLessonType(id).subscribe(() => {
      this.snack.open('Disattivato', 'OK', { duration: 3000 });
      this.load();
    });
  }
}
