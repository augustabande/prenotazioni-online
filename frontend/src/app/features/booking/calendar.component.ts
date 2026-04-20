import { Component, input, output, OnInit, signal, CUSTOM_ELEMENTS_SCHEMA, inject } from '@angular/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventClickArg } from '@fullcalendar/core';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ApiService } from '../../core/services/api.service';
import { Slot } from '@kite/shared-types';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FullCalendarModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<full-calendar [options]="calendarOptions()" />`,
  styles: [`
    :host { display: block; }
    :host ::ng-deep .fc { font-size: 0.85rem; }
    :host ::ng-deep .fc-event { cursor: pointer; border: none; }
  `],
})
export class CalendarComponent implements OnInit {
  lessonTypeId = input.required<string>();
  slotSelected = output<string>();

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
    eventClick: (info: EventClickArg) => this.onEventClick(info),
  });

  private api = inject(ApiService);

  ngOnInit() {
    this.api.getSlots({
      startAfter: new Date().toISOString(),
      lessonTypeId: this.lessonTypeId(),
    }).subscribe((slots) => {
      const events = slots
        .filter((s) => s.status === 'AVAILABLE' || s.status === 'PENDING')
        .map((s) => this.toEvent(s));
      this.calendarOptions.update((o) => ({ ...o, events }));
    });
  }

  private toEvent(slot: Slot) {
    const available = slot.status === 'AVAILABLE';
    return {
      id: slot.id,
      title: available ? `${slot.instructor.user.name}` : 'Non disponibile',
      start: slot.startsAt,
      end: slot.endsAt,
      backgroundColor: available ? '#0891b2' : '#d1d5db',
      textColor: available ? '#fff' : '#6b7280',
      extendedProps: { available, slotId: slot.id },
    };
  }

  private onEventClick(info: EventClickArg) {
    if (info.event.extendedProps['available']) {
      this.slotSelected.emit(info.event.extendedProps['slotId']);
    }
  }
}
