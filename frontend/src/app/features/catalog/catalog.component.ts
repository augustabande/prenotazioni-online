import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { LessonType } from '@kite/shared-types';
import { SkeletonComponent } from '../../shared/components/skeleton.component';
import { EmptyComponent } from '../../shared/components/empty.component';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [RouterLink, SkeletonComponent, EmptyComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-cyan-700 px-6 py-4 text-white">
        <div class="mx-auto flex max-w-5xl items-center justify-between">
          <a routerLink="/" class="text-xl font-bold">🪁 Kami Kite</a>
          <a routerLink="/login" class="text-sm hover:underline">Accedi</a>
        </div>
      </header>

      <main class="mx-auto max-w-5xl px-6 py-10">
        <h1 class="mb-8 text-3xl font-bold text-gray-900">Le nostre lezioni</h1>

        @if (loading()) {
          <app-skeleton [count]="4" height="160px" />
        } @else if (lessons().length === 0) {
          <app-empty title="Nessuna lezione disponibile" subtitle="Torna a trovarci presto!" />
        } @else {
          <div class="grid gap-6 md:grid-cols-2">
            @for (l of lessons(); track l.id) {
              <div class="rounded-2xl border bg-white p-6 shadow-sm transition hover:shadow-md">
                <div class="mb-3 flex items-start justify-between">
                  <h2 class="text-xl font-bold text-gray-900">{{ l.title }}</h2>
                  <span class="rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-800">
                    €{{ l.pricePerPerson }}/pers
                  </span>
                </div>
                <p class="mb-4 text-sm text-gray-600">{{ l.description }}</p>
                <div class="mb-4 flex gap-4 text-xs text-gray-500">
                  <span>⏱ {{ l.durationMinutes }} min</span>
                  <span>👥 {{ l.minParticipants }}–{{ l.maxParticipants }} pers</span>
                  <span>💨 {{ l.requiredWindKnotsMin }}–{{ l.requiredWindKnotsMax }} nodi</span>
                </div>
                <a [routerLink]="['/lezioni', l.id]"
                  class="inline-block rounded-lg bg-cyan-600 px-5 py-2 text-sm font-medium text-white hover:bg-cyan-500">
                  Prenota →
                </a>
              </div>
            }
          </div>
        }
      </main>
    </div>
  `,
})
export class CatalogComponent implements OnInit {
  lessons = signal<LessonType[]>([]);
  loading = signal(true);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getLessonTypes().subscribe({
      next: (data) => { this.lessons.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
