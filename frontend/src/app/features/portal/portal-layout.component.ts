import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SupabaseAuthService } from '../../core/services/supabase-auth.service';

@Component({
  selector: 'app-portal-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-cyan-700 px-6 py-4 text-white">
        <div class="mx-auto flex max-w-5xl items-center justify-between">
          <div class="flex items-center gap-6">
            <a routerLink="/" class="text-xl font-bold">🪁 Kami Kite</a>
            <nav class="hidden gap-4 text-sm md:flex">
              <a routerLink="/portale" routerLinkActive="font-bold" [routerLinkActiveOptions]="{exact:true}" class="hover:underline">Dashboard</a>
              <a routerLink="/portale/prenotazioni" routerLinkActive="font-bold" class="hover:underline">Prenotazioni</a>
            </nav>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span>{{ auth.currentUser()?.name }}</span>
            <button (click)="auth.signOut()" class="rounded bg-white/20 px-3 py-1 hover:bg-white/30">Esci</button>
          </div>
        </div>
      </header>
      <main class="mx-auto max-w-5xl px-6 py-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class PortalLayoutComponent {
  constructor(public auth: SupabaseAuthService) {}
}
