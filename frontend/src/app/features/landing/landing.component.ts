import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-screen bg-gradient-to-b from-cyan-600 to-cyan-800 text-white">
      <header class="flex items-center justify-between px-6 py-4">
        <span class="text-xl font-bold">🪁 Kami Kite</span>
        <a routerLink="/login" class="rounded-lg bg-white/20 px-4 py-2 text-sm backdrop-blur hover:bg-white/30">Accedi</a>
      </header>

      <section class="flex flex-col items-center px-6 py-24 text-center">
        <h1 class="mb-4 text-4xl font-extrabold leading-tight md:text-6xl">
          Impara il kitesurf<br/>a Fuerteventura
        </h1>
        <p class="mb-8 max-w-xl text-lg text-cyan-100">
          Lezioni private e semi-private a El Cotillo con istruttori certificati IKO.
          Prenota online, conferma automatica basata sulle condizioni meteo reali.
        </p>
        <a routerLink="/lezioni"
          class="rounded-xl bg-amber-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition hover:bg-amber-400">
          Vedi lezioni disponibili →
        </a>
      </section>

      <section class="mx-auto grid max-w-4xl gap-6 px-6 pb-24 md:grid-cols-3">
        @for (f of features; track f.title) {
          <div class="rounded-2xl bg-white/10 p-6 backdrop-blur">
            <span class="text-3xl">{{ f.icon }}</span>
            <h3 class="mt-3 font-bold">{{ f.title }}</h3>
            <p class="mt-1 text-sm text-cyan-100">{{ f.desc }}</p>
          </div>
        }
      </section>
    </div>
  `,
})
export class LandingComponent {
  features = [
    { icon: '🌊', title: 'Spot perfetto', desc: 'El Cotillo: laguna protetta per principianti, reef per avanzati.' },
    { icon: '🌤️', title: 'Conferma meteo', desc: 'Lezione confermata solo con vento ideale. Rimborso automatico se annullata.' },
    { icon: '💳', title: 'Deposito sicuro', desc: 'Paghi solo il 30% alla prenotazione. Il resto dopo la conferma meteo.' },
  ];
}
