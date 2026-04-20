import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Booking } from '@kite/shared-types';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { SkeletonComponent } from '../../shared/components/skeleton.component';
import { EmptyComponent } from '../../shared/components/empty.component';
import { DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [FormsModule, StatusBadgeComponent, SkeletonComponent, EmptyComponent, DatePipe],
  template: `
    <h1 class="mb-6 text-2xl font-bold text-gray-900">Prenotazioni</h1>

    <div class="mb-4 flex flex-wrap gap-3">
      <select [(ngModel)]="filterStatus" class="rounded-lg border px-3 py-2 text-sm">
        <option value="">Tutti gli stati</option>
        <option value="PENDING">Pending</option>
        <option value="CONFIRMED">Confirmed</option>
        <option value="CANCELLED_BY_WEATHER">Annullate meteo</option>
        <option value="CANCELLED_BY_SCHOOL">Annullate scuola</option>
        <option value="COMPLETED">Completate</option>
      </select>
      <input type="text" [(ngModel)]="filterSearch" placeholder="Cerca..." class="rounded-lg border px-3 py-2 text-sm" />
    </div>

    @if (loading()) {
      <app-skeleton [count]="5" height="60px" />
    } @else if (filtered().length === 0) {
      <app-empty title="Nessuna prenotazione" subtitle="Le prenotazioni appariranno qui." />
    } @else {
      <div class="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table class="w-full text-left text-sm">
          <thead class="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th class="px-4 py-3">Cliente</th>
              <th class="px-4 py-3">Lezione</th>
              <th class="px-4 py-3">Data</th>
              <th class="px-4 py-3">Istruttore</th>
              <th class="px-4 py-3">Stato</th>
              <th class="px-4 py-3">Azioni</th>
            </tr>
          </thead>
          <tbody>
            @for (b of filtered(); track b.id) {
              <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3">{{ b.user?.name || '—' }}</td>
                <td class="px-4 py-3">{{ b.slot.lessonType.title }}</td>
                <td class="px-4 py-3">{{ b.slot.startsAt | date:'dd/MM HH:mm' }}</td>
                <td class="px-4 py-3">{{ b.slot.instructor.user.name }}</td>
                <td class="px-4 py-3"><app-status-badge [status]="b.status" /></td>
                <td class="px-4 py-3">
                  @if (b.status === 'CONFIRMED' || b.status === 'PENDING') {
                    <button (click)="cancel(b.id)" class="text-xs text-red-600 hover:underline">Annulla</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class AdminBookingsComponent implements OnInit {
  bookings = signal<Booking[]>([]);
  loading = signal(true);
  filterStatus = '';
  filterSearch = '';

  constructor(private api: ApiService, private snack: MatSnackBar) {}

  ngOnInit() { this.load(); }

  load() {
    this.api.getAllBookings().subscribe({
      next: (data) => { this.bookings.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  filtered(): Booking[] {
    let list = this.bookings();
    if (this.filterStatus) list = list.filter((b) => b.status === this.filterStatus);
    if (this.filterSearch) {
      const q = this.filterSearch.toLowerCase();
      list = list.filter((b) => b.user?.name?.toLowerCase().includes(q) || b.slot?.lessonType?.title?.toLowerCase().includes(q));
    }
    return list;
  }

  cancel(id: string) {
    this.api.cancelBooking(id).subscribe(() => {
      this.snack.open('Prenotazione annullata', 'OK', { duration: 3000 });
      this.load();
    });
  }
}
