import { Component, OnInit, signal, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { LessonType } from '@kite/shared-types';
import { CalendarComponent } from '../booking/calendar.component';
import { SkeletonComponent } from '../../shared/components/skeleton.component';

@Component({
  selector: 'app-lesson-detail',
  standalone: true,
  imports: [RouterLink, CalendarComponent, SkeletonComponent],
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-cyan-700 px-6 py-4 text-white">
        <div class="mx-auto flex max-w-5xl items-center gap-4">
          <a routerLink="/lezioni" class="hover:underline">← Lezioni</a>
          <span class="text-xl font-bold">🪁 Kami Kite</span>
        </div>
      </header>

      <main class="mx-auto max-w-5xl px-6 py-10">
        @if (loading()) {
          <app-skeleton [count]="2" height="120px" />
        } @else if (lesson(); as l) {
          <div class="mb-8">
            <h1 class="mb-2 text-3xl font-bold text-gray-900">{{ l.title }}</h1>
            <p class="mb-4 text-gray-600">{{ l.description }}</p>
            <div class="flex flex-wrap gap-4 text-sm text-gray-500">
              <span class="rounded-full bg-cyan-50 px-3 py-1">⏱ {{ l.durationMinutes }} min</span>
              <span class="rounded-full bg-cyan-50 px-3 py-1">👥 {{ l.minParticipants }}–{{ l.maxParticipants }} pers</span>
              <span class="rounded-full bg-cyan-50 px-3 py-1">💨 {{ l.requiredWindKnotsMin }}–{{ l.requiredWindKnotsMax }} nodi</span>
              <span class="rounded-full bg-amber-50 px-3 py-1 font-bold text-amber-800">€{{ l.pricePerPerson }}/persona</span>
            </div>
          </div>

          <h2 class="mb-4 text-xl font-bold text-gray-900">Scegli una data</h2>
          <app-calendar [lessonTypeId]="l.id" (slotSelected)="onSlotSelected($event)" />
        }
      </main>
    </div>
  `,
})
export class LessonDetailComponent implements OnInit {
  lesson = signal<LessonType | null>(null);
  loading = signal(true);

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getLessonType(id).subscribe({
      next: (data) => { this.lesson.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSlotSelected(slotId: string) {
    this.router.navigate(['/prenota', slotId]);
  }
}
