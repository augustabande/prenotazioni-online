import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <span class="text-6xl">🌊</span>
      <h1 class="mt-4 text-4xl font-bold text-gray-900">404</h1>
      <p class="mt-2 text-gray-500">Questa pagina è stata portata via dal vento.</p>
      <a routerLink="/" class="mt-6 rounded-lg bg-cyan-600 px-6 py-3 font-bold text-white hover:bg-cyan-500">Torna alla home</a>
    </div>
  `,
})
export class NotFoundComponent {}
