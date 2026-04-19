import { Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  template: `
    @for (_ of rows; track $index) {
      <div class="animate-pulse rounded-lg bg-gray-200" [style.height]="height()"></div>
    }
  `,
  host: { class: 'flex flex-col gap-3' },
})
export class SkeletonComponent {
  count = input(3);
  height = input('80px');
  get rows() { return Array(this.count()); }
}
