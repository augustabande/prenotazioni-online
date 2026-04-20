import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseAuthService } from '../../core/services/supabase-auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gradient-to-b from-cyan-600 to-cyan-800 px-6">
      <div class="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <a routerLink="/" class="mb-6 block text-center text-2xl font-bold text-cyan-700">🪁 Kami Kite</a>

        @if (!sent()) {
          <h2 class="mb-2 text-center text-lg font-bold text-gray-900">Accedi</h2>
          <p class="mb-6 text-center text-sm text-gray-500">Riceverai un magic link via email</p>

          <input type="email" [(ngModel)]="email" placeholder="La tua email"
            class="mb-4 w-full rounded-lg border px-4 py-3 text-sm focus:border-cyan-500 focus:outline-none" />

          @if (error()) {
            <p class="mb-3 text-sm text-red-600">{{ error() }}</p>
          }

          <button (click)="login()" [disabled]="!email || submitting()"
            class="w-full rounded-lg bg-cyan-600 py-3 font-bold text-white disabled:opacity-40 hover:bg-cyan-500">
            {{ submitting() ? 'Invio...' : 'Invia magic link' }}
          </button>
        } @else {
          <div class="text-center">
            <span class="text-4xl">📧</span>
            <h2 class="mt-4 text-lg font-bold text-gray-900">Controlla la tua email</h2>
            <p class="mt-2 text-sm text-gray-600">
              Abbiamo inviato un link di accesso a <strong>{{ email }}</strong>
            </p>
            <button (click)="sent.set(false)" class="mt-6 text-sm text-cyan-600 hover:underline">
              Usa un'altra email
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  sent = signal(false);
  error = signal('');
  submitting = signal(false);

  private auth = inject(SupabaseAuthService);
  private router = inject(Router);

  constructor() {
    if (this.auth.isLoggedIn()) this.router.navigate(['/portale']);
  }

  async login() {
    this.submitting.set(true);
    this.error.set('');
    const { error } = await this.auth.signIn(this.email);
    this.submitting.set(false);
    if (error) {
      this.error.set(error);
    } else {
      this.sent.set(true);
    }
  }
}
