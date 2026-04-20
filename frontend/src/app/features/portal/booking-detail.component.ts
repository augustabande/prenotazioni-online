import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Booking } from '@kite/shared-types';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { SkeletonComponent } from '../../shared/components/skeleton.component';
import { CalendarComponent } from '../booking/calendar.component';
import { DatePipe } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [RouterLink, StatusBadgeComponent, SkeletonComponent, CalendarComponent, DatePipe],
  template: `
    <a routerLink="/portale/prenotazioni" class="mb-4 inline-block text-sm text-cyan-600 hover:underline">← Prenotazioni</a>

    @if (loading()) {
      <app-skeleton [count]="3" height="60px" />
    } @else if (booking(); as b) {
      <div class="rounded-2xl border bg-white p-6 shadow-sm">
        <div class="mb-4 flex items-start justify-between">
          <h1 class="text-2xl font-bold text-gray-900">{{ b.slot.lessonType.title }}</h1>
          <app-status-badge [status]="b.status" />
        </div>

        <div class="mb-6 grid gap-4 text-sm md:grid-cols-2">
          <div>
            <p class="text-gray-500">Data e ora</p>
            <p class="font-medium">{{ b.slot.startsAt | date:'dd/MM/yyyy HH:mm' }} — {{ b.slot.endsAt | date:'HH:mm' }}</p>
          </div>
          <div>
            <p class="text-gray-500">Istruttore</p>
            <p class="font-medium">{{ b.slot.instructor.user.name }}</p>
          </div>
          <div>
            <p class="text-gray-500">Location</p>
            <p class="font-medium">{{ b.slot.location.name }}</p>
          </div>
          <div>
            <p class="text-gray-500">Importo</p>
            <p class="font-medium">Deposito €{{ b.depositAmount }} / Totale €{{ b.totalAmount }}</p>
          </div>
        </div>

        <!-- Status explanation -->
        @if (b.status === 'PENDING') {
          <div class="mb-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            🕐 In attesa di conferma meteo. La previsione verrà verificata 24 ore prima della lezione.
          </div>
        }
        @if (b.status === 'CONFIRMED') {
          <div class="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
            ✅ Lezione confermata! Le condizioni meteo sono ideali. Ci vediamo in spiaggia!
          </div>
        }
        @if (b.status === 'CANCELLED_BY_WEATHER') {
          <div class="mb-4 rounded-lg bg-sky-50 p-4 text-sm text-sky-800">
            ⛈️ Annullata per condizioni meteo: {{ b.slot.weatherDecisionReason }}
            <br/>Il deposito verrà rimborsato automaticamente.
          </div>
        }

        <!-- Actions -->
        <div class="flex flex-wrap gap-3">
          @if (b.status === 'CANCELLED_BY_WEATHER') {
            <button (click)="showReschedule.set(!showReschedule())"
              class="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-medium text-white hover:bg-cyan-500">
              {{ showReschedule() ? 'Chiudi calendario' : '📅 Riprogramma' }}
            </button>
          }
          @if (canCancel()) {
            <button (click)="cancel()" [disabled]="cancelling()"
              class="rounded-lg border border-red-300 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              {{ cancelling() ? 'Annullamento...' : '❌ Cancella prenotazione' }}
            </button>
          }
        </div>

        @if (showReschedule()) {
          <div class="mt-6">
            <h3 class="mb-3 font-bold text-gray-900">Scegli un nuovo slot</h3>
            <app-calendar [lessonTypeId]="b.slot.lessonTypeId" (slotSelected)="reschedule($event)" />
          </div>
        }
      </div>
    }
  `,
})
export class BookingDetailComponent implements OnInit {
  booking = signal<Booking | null>(null);
  loading = signal(true);
  cancelling = signal(false);
  showReschedule = signal(false);

  canCancel = computed(() => {
    const b = this.booking();
    if (!b || b.status !== 'PENDING') return false;
    const hoursUntil = (new Date(b.slot.startsAt).getTime() - Date.now()) / 3_600_000;
    return hoursUntil >= 48;
  });

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(ApiService);
  private snack = inject(MatSnackBar);

  ngOnInit() {
    this.loadBooking();
  }

  cancel() {
    const id = this.booking()?.id;
    if (!id) return;
    this.cancelling.set(true);
    this.api.cancelBooking(id).subscribe({
      next: () => {
        this.snack.open('Prenotazione cancellata', 'OK', { duration: 3000 });
        this.loadBooking();
        this.cancelling.set(false);
      },
      error: () => this.cancelling.set(false),
    });
  }

  reschedule(newSlotId: string) {
    const id = this.booking()?.id;
    if (!id) return;
    this.api.rescheduleBooking(id, newSlotId).subscribe({
      next: (newBooking) => {
        this.snack.open('Prenotazione riprogrammata!', 'OK', { duration: 3000 });
        this.router.navigate(['/portale/prenotazioni', newBooking.id]);
      },
    });
  }

  private loadBooking() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.api.getMyBookings().subscribe({
      next: (bookings) => {
        this.booking.set(bookings.find((b) => b.id === id) ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
