import { Component, input } from '@angular/core';
import { SlotStatus } from '@kite/shared-types';

const STATUS_CONFIG: Record<string, { label: string; class: string; icon: string }> = {
  PENDING: { label: 'In attesa', class: 'bg-amber-100 text-amber-800', icon: '🕐' },
  CONFIRMED: { label: 'Confermata', class: 'bg-green-100 text-green-800', icon: '✅' },
  CANCELLED_BY_WEATHER: { label: 'Annullata (meteo)', class: 'bg-sky-100 text-sky-800', icon: '⛈️' },
  CANCELLED_BY_SCHOOL: { label: 'Annullata', class: 'bg-red-100 text-red-800', icon: '❌' },
  COMPLETED: { label: 'Completata', class: 'bg-gray-100 text-gray-600', icon: '✔️' },
  AVAILABLE: { label: 'Disponibile', class: 'bg-cyan-100 text-cyan-800', icon: '📅' },
};

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    <span [class]="cfg.class" class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium">
      <span>{{ cfg.icon }}</span> {{ cfg.label }}
    </span>
  `,
})
export class StatusBadgeComponent {
  status = input.required<SlotStatus>();
  get cfg() {
    return STATUS_CONFIG[this.status()] ?? STATUS_CONFIG['PENDING'];
  }
}
