import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Booking, SlotStatus } from '@kite/shared-types';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { SkeletonComponent } from '../../shared/components/skeleton.component';
import { EmptyComponent } from '../../shared/components/empty.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-bookings-list',
  standalone: true,
  imports: [RouterLink, FormsModule, StatusBadgeComponent, SkeletonComponent, EmptyComponent, DatePipe],
  template: `
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Le mie prenotazioni</h1>
      <select [(ngModel)]="filter" class="rounded-lg border px-3 py-2 text-sm">
        <option value="">Tutte</option>
        <option value="PENDING">In attesa</option>
        <option value="CONFIRMED">Confermate</option>
        <option value="CANCELLED_BY_WEATHER">Annullate meteo</option>
        <option value="COMPLETED">Completate</option>
      </select>
    </div>

    @if (loading()) {
      <app-skeleton [count]="4" height="80px" />
    } @else if (filtered().length === 0) {
      <app-empty title="Nessuna prenotazione" subtitle="Prenota la tua prima lezione!" />
    } @else {
      <div class="space-y-3">
        @for (b of filtered(); track b.id) {
          <a [routerLink]="['/portale/prenotazioni', b.id]"
            class="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md">
            <div>
              <p class="font-bold text-gray-900">{{ b.slot.lessonType.title }}</p>
              <p class="text-sm text-gray-500">
                {{ b.slot.startsAt | date:'dd/MM/yyyy HH:mm' }} — {{ b.slot.instructor.user.name }} — {{ b.slot.location.name }}
              </p>
            </div>
            <app-status-badge [status]="b.status" />
          </a>
        }
      </div>
    }
  `,
})
export class BookingsListComponent implements OnInit {
  bookings = signal<Booking[]>([]);
  loading = signal(true);
  filter = '';

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getMyBookings().subscribe({
      next: (data) => { this.bookings.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  filtered(): Booking[] {
    if (!this.filter) return this.bookings();
    return this.bookings().filter((b) => b.status === this.filter);
  }
}
