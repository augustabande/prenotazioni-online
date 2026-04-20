import { Component, OnInit, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Booking, Slot } from '@kite/shared-types';
import { SkeletonComponent } from '../../shared/components/skeleton.component';
import { DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [SkeletonComponent, DatePipe],
  template: `
    @if (loading()) {
      <app-skeleton [count]="3" height="100px" />
    } @else {
      <h1 class="mb-6 text-2xl font-bold text-gray-900">Dashboard Admin</h1>

      <!-- KPI Cards -->
      <div class="mb-8 grid gap-4 md:grid-cols-3">
        <div class="rounded-2xl border bg-white p-6 shadow-sm">
          <p class="text-sm text-gray-500">Prenotazioni pending</p>
          <p class="text-3xl font-bold text-amber-600">{{ pendingCount() }}</p>
        </div>
        <div class="rounded-2xl border bg-white p-6 shadow-sm">
          <p class="text-sm text-gray-500">Slot domani</p>
          <p class="text-3xl font-bold text-cyan-600">{{ tomorrowSlots().length }}</p>
        </div>
        <div class="rounded-2xl border bg-white p-6 shadow-sm">
          <p class="text-sm text-gray-500">Revenue mese (depositi)</p>
          <p class="text-3xl font-bold text-green-600">€{{ monthRevenue() }}</p>
        </div>
      </div>

      <!-- Pending decisions -->
      <h2 class="mb-4 text-lg font-bold text-gray-800">Prossime decisioni meteo</h2>
      @if (pendingSlots().length === 0) {
        <p class="text-sm text-gray-400">Nessuno slot in attesa di decisione.</p>
      } @else {
        <div class="space-y-3">
          @for (s of pendingSlots(); track s.id) {
            <div class="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm">
              <div>
                <p class="font-bold text-gray-900">{{ s.lessonType.title }} — {{ s.instructor.user.name }}</p>
                <p class="text-sm text-gray-500">{{ s.startsAt | date:'dd/MM/yyyy HH:mm' }} — {{ s.location.name }}</p>
              </div>
              <div class="flex gap-2">
                <button (click)="approve(s.id)" class="rounded-lg bg-green-600 px-4 py-2 text-xs font-bold text-white hover:bg-green-500">✅ Conferma</button>
                <button (click)="reject(s.id)" class="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500">❌ Annulla</button>
              </div>
            </div>
          }
        </div>
      }
    }
  `,
})
export class AdminDashboardComponent implements OnInit {
  loading = signal(true);
  bookings = signal<Booking[]>([]);
  slots = signal<Slot[]>([]);

  pendingCount = signal(0);
  tomorrowSlots = signal<Slot[]>([]);
  pendingSlots = signal<Slot[]>([]);
  monthRevenue = signal(0);

  constructor(private api: ApiService, private snack: MatSnackBar) {}

  ngOnInit() {
    this.api.getAllBookings().subscribe((b) => {
      this.bookings.set(b);
      this.pendingCount.set(b.filter((x) => x.status === 'PENDING').length);
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      this.monthRevenue.set(
        Math.round(b.filter((x) => x.createdAt >= monthStart && x.status !== 'CANCELLED_BY_SCHOOL').reduce((s, x) => s + Number(x.depositAmount), 0))
      );
    });

    this.api.getSlots().subscribe((s) => {
      this.slots.set(s);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()).toISOString();
      const tEnd = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1).toISOString();
      this.tomorrowSlots.set(s.filter((x) => x.startsAt >= tStart && x.startsAt < tEnd));
      this.pendingSlots.set(s.filter((x) => x.status === 'PENDING'));
      this.loading.set(false);
    });
  }

  approve(slotId: string) {
    this.api.updateSlotStatus(slotId, 'CONFIRMED', 'Confermato manualmente da admin').subscribe(() => {
      this.snack.open('Slot confermato', 'OK', { duration: 3000 });
      this.ngOnInit();
    });
  }

  reject(slotId: string) {
    this.api.updateSlotStatus(slotId, 'CANCELLED_BY_SCHOOL', 'Annullato da admin').subscribe(() => {
      this.snack.open('Slot annullato', 'OK', { duration: 3000 });
      this.ngOnInit();
    });
  }
}
