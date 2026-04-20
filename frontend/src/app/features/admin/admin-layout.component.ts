import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SupabaseAuthService } from '../../core/services/supabase-auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-gray-900 px-6 py-3 text-white">
        <div class="mx-auto flex max-w-7xl items-center justify-between">
          <div class="flex items-center gap-6">
            <a routerLink="/" class="text-lg font-bold text-amber-400">🪁 Kami Admin</a>
            <nav class="hidden gap-4 text-sm md:flex">
              <a routerLink="/admin" routerLinkActive="text-amber-400" [routerLinkActiveOptions]="{exact:true}" class="hover:text-amber-300">Dashboard</a>
              <a routerLink="/admin/slots" routerLinkActive="text-amber-400" class="hover:text-amber-300">Calendario</a>
              <a routerLink="/admin/bookings" routerLinkActive="text-amber-400" class="hover:text-amber-300">Prenotazioni</a>
              <a routerLink="/admin/lesson-types" routerLinkActive="text-amber-400" class="hover:text-amber-300">Lezioni</a>
              <a routerLink="/admin/instructors" routerLinkActive="text-amber-400" class="hover:text-amber-300">Istruttori</a>
              <a routerLink="/admin/weather" routerLinkActive="text-amber-400" class="hover:text-amber-300">Meteo</a>
            </nav>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span class="rounded bg-amber-500/20 px-2 py-0.5 text-xs text-amber-400">ADMIN</span>
            <span>{{ auth.currentUser()?.name }}</span>
            <button (click)="auth.signOut()" class="rounded bg-white/10 px-3 py-1 hover:bg-white/20">Esci</button>
          </div>
        </div>
      </header>
      <main class="mx-auto max-w-7xl px-6 py-8">
        <router-outlet />
      </main>
      <footer class="border-t py-4 text-center text-xs text-gray-400">Powered by Kami Experience</footer>
    </div>
  `,
})
export class AdminLayoutComponent {
  constructor(public auth: SupabaseAuthService) {}
}
