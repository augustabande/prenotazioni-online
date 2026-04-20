import { Component, OnInit, signal, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ApiService } from '../../core/services/api.service';
import { Slot, Instructor, LessonType } from '@kite/shared-types';
import { MatSnackBar } from '@angular/material/snack-bar';

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: '#0891b2',
  PENDING: '#f59e0b',
  CONFIRMED: '#16a34a',
  CANCELLED_BY_WEATHER: '#3b82f6',
  CANCELLED_BY_SCHOOL: '#ef4444',
  COMPLETED: '#6b7280',
};

@Component({
  selector: 'app-slots-calendar',
  standalone: true,
  imports: [FullCalendarModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-2xl font-bold text-gray-900">Calendario Slot</h1>
      <div class="flex gap-2">
        <button (click)="showCreate = !showCreate" class="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-500">+ Crea slot</button>
        <button (click)="showCancelDay = !showCancelDay" class="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50">Cancella giornata</button>
      </div>
    </div>

    <!-- Create slot form -->
    @if (showCreate) {
      <div class="mb-6 rounded-xl border bg-white p-6 shadow-sm">
        <h3 class="mb-4 font-bold">Nuovo slot</h3>
        <div class="grid gap-3 md:grid-cols-3">
          <select [(ngModel)]="newSlot.instructorId" class="rounded-lg border px-3 py-2 text-sm">
            <option value="">Istruttore...</option>
            @for (i of instructors(); track i.id) { <option [value]="i.id">{{ i.user.name }}</option> }
          </select>
          <select [(ngModel)]="newSlot.lessonTypeId" class="rounded-lg border px-3 py-2 text-sm">
            <option value="">Tipo lezione...</option>
            @for (lt of lessonTypes(); track lt.id) { <option [value]="lt.id">{{ lt.title }}</option> }
          </select>
          <input type="datetime-local" [(ngModel)]="newSlot.startsAt" class="rounded-lg border px-3 py-2 text-sm" />
        </div>
        <button (click)="createSlot()" class="mt-4 rounded-lg bg-cyan-600 px-6 py-2 text-sm font-bold text-white hover:bg-cyan-500">Crea</button>
      </div>
    }

    <!-- Cancel day form -->
    @if (showCancelDay) {
      <div class="mb-6 rounded-xl border bg-white p-6 shadow-sm">
        <h3 class="mb-4 font-bold text-red-600">Cancella giornata</h3>
        <div class="flex gap-3">
          <input type="date" [(ngModel)]="cancelDate" class="rounded-lg border px-3 py-2 text-sm" />
          <input [(ngModel)]="cancelReason" placeholder="Motivo (obbligatorio)" class="flex-1 rounded-lg border px-3 py-2 text-sm" />
          <button (click)="doCancelDay()" [disabled]="!cancelDate || !cancelReason"
            class="rounded-lg bg-red-600 px-6 py-2 text-sm font-bold text-white disabled:opacity-40 hover:bg-red-500">Cancella</button>
        </div>
      </div>
    }

    <!-- Selected slot detail -->
    @if (selectedSlot(); as s) {
      <div class="mb-6 rounded-xl border bg-white p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-bold">{{ s.lessonType.title }} — {{ s.instructor.user.name }}</p>
            <p class="text-sm text-gray-500">Stato: {{ s.status }}</p>
          </div>
          <div class="flex gap-2">
            @if (s.status === 'PENDING') {
              <button (click)="changeStatus(s.id, 'CONFIRMED')" class="rounded bg-green-600 px-3 py-1 text-xs text-white">Conferma</button>
              <button (click)="changeStatus(s.id, 'CANCELLED_BY_WEATHER')" class="rounded bg-blue-600 px-3 py-1 text-xs text-white">Annulla meteo</button>
              <button (click)="changeStatus(s.id, 'CANCELLED_BY_SCHOOL')" class="rounded bg-red-600 px-3 py-1 text-xs text-white">Annulla scuola</button>
            }
            @if (s.status === 'CONFIRMED') {
              <button (click)="changeStatus(s.id, 'COMPLETED')" class="rounded bg-gray-600 px-3 py-1 text-xs text-white">Completato</button>
              <button (click)="changeStatus(s.id, 'CANCELLED_BY_WEATHER')" class="rounded bg-blue-600 px-3 py-1 text-xs text-white">Annulla meteo</button>
            }
            <button (click)="selectedSlot.set(null)" class="rounded bg-gray-200 px-3 py-1 text-xs">Chiudi</button>
          </div>
        </div>
      </div>
    }

    <full-calendar [options]="calendarOptions()" />
  `,
  styles: [`:host ::ng-deep .fc { font-size: 0.8rem; } :host ::ng-deep .fc-event { cursor: pointer; border: none; border-radius: 4px; }`],
})
export class SlotsCalendarComponent implements OnInit {
  showCreate = false;
  showCancelDay = false;
  cancelDate = '';
  cancelReason = '';
  newSlot = { instructorId: '', lessonTypeId: '', startsAt: '' };
  instructors = signal<Instructor[]>([]);
  lessonTypes = signal<LessonType[]>([]);
  selectedSlot = signal<Slot | null>(null);
  allSlots = signal<Slot[]>([]);

  calendarOptions = signal<CalendarOptions>({
    plugins: [timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    locale: 'it',
    headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
    slotMinTime: '07:00:00',
    slotMaxTime: '20:00:00',
    allDaySlot: false,
    height: 'auto',
    events: [],
    eventClick: (info: EventClickArg) => {
      const slot = this.allSlots().find((s) => s.id === info.event.id);
      this.selectedSlot.set(slot ?? null);
    },
  });

  private api = inject(ApiService);
  private snack = inject(MatSnackBar);

  ngOnInit() {
    this.api.getInstructors().subscribe((i) => this.instructors.set(i));
    this.api.getLessonTypes().subscribe((lt) => this.lessonTypes.set(lt));
    this.loadSlots();
  }

  loadSlots() {
    this.api.getSlots().subscribe((slots) => {
      this.allSlots.set(slots);
      const events = slots.map((s) => ({
        id: s.id,
        title: `${s.lessonType.title} — ${s.instructor.user.name}`,
        start: s.startsAt,
        end: s.endsAt,
        backgroundColor: s.instructor.colorHex || STATUS_COLORS[s.status] || '#6b7280',
        borderColor: STATUS_COLORS[s.status],
        textColor: '#fff',
      }));
      this.calendarOptions.update((o) => ({ ...o, events }));
    });
  }

  createSlot() {
    const lt = this.lessonTypes().find((l) => l.id === this.newSlot.lessonTypeId);
    if (!lt || !this.newSlot.instructorId || !this.newSlot.startsAt) return;
    const startsAt = new Date(this.newSlot.startsAt).toISOString();
    const endsAt = new Date(new Date(this.newSlot.startsAt).getTime() + lt.durationMinutes * 60_000).toISOString();
    // Use first location from any existing slot
    const locationId = this.allSlots()[0]?.locationId;
    if (!locationId) return;
    this.api.createSlot({ instructorId: this.newSlot.instructorId, locationId, lessonTypeId: lt.id, startsAt, endsAt, maxStudents: lt.maxParticipants }).subscribe(() => {
      this.snack.open('Slot creato', 'OK', { duration: 3000 });
      this.showCreate = false;
      this.loadSlots();
    });
  }

  doCancelDay() {
    this.api.cancelDay(this.cancelDate, this.cancelReason).subscribe((res) => {
      this.snack.open(`${res.cancelled} slot cancellati`, 'OK', { duration: 3000 });
      this.showCancelDay = false;
      this.loadSlots();
    });
  }

  changeStatus(id: string, status: string) {
    this.api.updateSlotStatus(id, status, 'Azione admin').subscribe(() => {
      this.snack.open('Stato aggiornato', 'OK', { duration: 3000 });
      this.selectedSlot.set(null);
      this.loadSlots();
    });
  }
}
