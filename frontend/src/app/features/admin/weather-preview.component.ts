import { Component, OnInit, signal, ElementRef, viewChild, afterNextRender } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { WindForecast } from '@kite/shared-types';
import { SkeletonComponent } from '../../shared/components/skeleton.component';

@Component({
  selector: 'app-weather-preview',
  standalone: true,
  imports: [SkeletonComponent],
  template: `
    <h1 class="mb-6 text-2xl font-bold text-gray-900">Previsione Vento — 48h</h1>

    @if (loading()) {
      <app-skeleton [count]="1" height="300px" />
    } @else if (forecast().length === 0) {
      <p class="text-gray-400">Nessun dato meteo disponibile.</p>
    } @else {
      <div class="rounded-xl border bg-white p-6 shadow-sm">
        <canvas #chart width="900" height="300" class="w-full"></canvas>
        <div class="mt-4 flex items-center gap-6 text-xs text-gray-500">
          <span class="flex items-center gap-1"><span class="inline-block h-3 w-3 rounded bg-cyan-500"></span> Vento (nodi)</span>
          <span class="flex items-center gap-1"><span class="inline-block h-3 w-3 rounded bg-green-400"></span> Range ideale 12–30</span>
          <span class="flex items-center gap-1"><span class="inline-block h-3 w-3 rounded bg-red-400"></span> Fuori range</span>
        </div>
      </div>

      <div class="mt-6 overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table class="w-full text-left text-xs">
          <thead class="border-b bg-gray-50 text-gray-500">
            <tr><th class="px-3 py-2">Ora</th><th class="px-3 py-2">Vento (nodi)</th><th class="px-3 py-2">Direzione</th></tr>
          </thead>
          <tbody>
            @for (f of forecast(); track f.time) {
              <tr class="border-b" [class]="f.windSpeedKnots >= 12 && f.windSpeedKnots <= 30 ? '' : 'bg-red-50'">
                <td class="px-3 py-2">{{ f.time }}</td>
                <td class="px-3 py-2 font-bold">{{ f.windSpeedKnots }}</td>
                <td class="px-3 py-2">{{ f.windDirection }}°</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class WeatherPreviewComponent implements OnInit {
  forecast = signal<WindForecast[]>([]);
  loading = signal(true);
  chartCanvas = viewChild<ElementRef<HTMLCanvasElement>>('chart');

  constructor(private api: ApiService) {
    afterNextRender(() => this.drawChart());
  }

  ngOnInit() {
    this.api.getWeatherForecast(48).subscribe({
      next: (data) => {
        this.forecast.set(data);
        this.loading.set(false);
        setTimeout(() => this.drawChart(), 50);
      },
      error: () => this.loading.set(false),
    });
  }

  private drawChart() {
    const el = this.chartCanvas()?.nativeElement;
    if (!el || this.forecast().length === 0) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    const data = this.forecast();
    const w = el.width, h = el.height;
    const maxWind = Math.max(...data.map((d) => d.windSpeedKnots), 35);
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    ctx.clearRect(0, 0, w, h);

    // Grid + ideal range
    const y12 = padding.top + chartH * (1 - 12 / maxWind);
    const y30 = padding.top + chartH * (1 - 30 / maxWind);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
    ctx.fillRect(padding.left, y30, chartW, y12 - y30);

    // Threshold lines
    [12, 30].forEach((v) => {
      const y = padding.top + chartH * (1 - v / maxWind);
      ctx.strokeStyle = '#86efac';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(w - padding.right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#6b7280';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${v}`, 5, y + 3);
    });

    // Wind line
    ctx.beginPath();
    ctx.strokeStyle = '#0891b2';
    ctx.lineWidth = 2;
    data.forEach((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartW;
      const y = padding.top + chartH * (1 - d.windSpeedKnots / maxWind);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    data.forEach((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartW;
      const y = padding.top + chartH * (1 - d.windSpeedKnots / maxWind);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = d.windSpeedKnots >= 12 && d.windSpeedKnots <= 30 ? '#0891b2' : '#ef4444';
      ctx.fill();
    });

    // X labels (every 6h)
    ctx.fillStyle = '#9ca3af';
    ctx.font = '10px sans-serif';
    data.forEach((d, i) => {
      if (i % 6 === 0) {
        const x = padding.left + (i / (data.length - 1)) * chartW;
        const label = d.time.split('T')[1]?.substring(0, 5) || d.time;
        ctx.fillText(label, x - 12, h - 10);
      }
    });
  }
}
