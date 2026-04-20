import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Booking } from '@kite/shared-types';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { SkeletonComponent } from '../../shared/components/skeleton.component';
import { EmptyComponent } from '../../shared/components/empty.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, SkeletonComponent, EmptyComponent, DatePipe],
  template: `
    <h1 class="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

    @if (loading()) {
      <app-skeleton [count]="3" height="80px" />
    } @else {
      <section class="mb-10">
        <h2 class="mb-3 text-lg font-bold text-gray-800">Prossime lezioni</h2>
        @if (upcoming().length === 0) {
          <app-empty title="Nessuna lezione in programma" subtitle="Esplora il catalogo per prenotare!" />
        } @else {
          <div class="space-y-3">
            @for (b of upcoming(); track b.id) {
              <a [routerLink]="['/portale/prenotazioni', b.id]"
                class="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md">
                <div>
                  <p class="font-bold text-gray-900">{{ b.slot.lessonType.title }}</p>
                  <p class="text-sm text-gray-500">{{ b.slot.startsAt | date:'dd/MM/yyyy HH:mm' }} — {{ b.slot.instructor.user.name }}</p>
                </div>
                <app-status-badge [status]="b.status" />
              </a>
            }
          </div>
        }
      </section>

      <section>
        <h2 class="mb-3 text-lg font-bold text-gray-800">Storico</h2>
        @if (past().length === 0) {
          <app-empty title="Nessuna lezione passata" />
        } @else {
          <div class="space-y-3">
            @for (b of past(); track b.id) {
              <a [routerLink]="['/portale/prenotazioni', b.id]"
                class="flex items-center justify-between rounded-xl border bg-white p-4 opacity-70">
                <div>
                  <p class="font-medium text-gray-700">{{ b.slot.lessonType.title }}</p>
                  <p class="text-sm text-gray-400">{{ b.slot.startsAt | date:'dd/MM/yyyy' }}</p>
                </div>
                <app-status-badge [status]="b.status" />
              </a>
            }
          </div>
        }
      </section>
    }
  `,
})
export class DashboardComponent implements OnInit {
  bookings = signal<Booking[]>([]);
  loading = signal(true);

  upcoming = computed(() => {
    const now = new Date().toISOString();
    return this.bookings().filter((b) =>
      b.slot.startsAt > now && (b.status === 'PENDING' || b.status === 'CONFIRMED')
    );
  });

  past = computed(() => {
    const now = new Date().toISOString();
    return this.bookings().filter((b) =>
      b.slot.startsAt <= now || b.status === 'COMPLETED' || b.status === 'CANCELLED_BY_WEATHER' || b.status === 'CANCELLED_BY_SCHOOL'
    );
  });

  private api = inject(ApiService);

  ngOnInit() {
    this.api.getMyBookings().subscribe({
      next: (data) => { this.bookings.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }
}
