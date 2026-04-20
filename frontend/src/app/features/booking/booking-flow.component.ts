import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { SupabaseAuthService } from '../../core/services/supabase-auth.service';
import { Slot } from '@kite/shared-types';
import { SkeletonComponent } from '../../shared/components/skeleton.component';
import { DatePipe } from '@angular/common';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-booking-flow',
  standalone: true,
  imports: [FormsModule, RouterLink, SkeletonComponent, DatePipe],
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-cyan-700 px-6 py-4 text-white">
        <div class="mx-auto flex max-w-3xl items-center gap-4">
          <a routerLink="/lezioni" class="hover:underline">← Lezioni</a>
          <span class="text-xl font-bold">🪁 Prenota</span>
        </div>
      </header>

      <main class="mx-auto max-w-3xl px-6 py-10">
        <!-- Stepper -->
        <div class="mb-8 flex items-center justify-center gap-2 text-sm">
          @for (s of steps; track s; let i = $index) {
            <span [class]="i <= step() ? 'bg-cyan-600 text-white' : 'bg-gray-200 text-gray-500'"
              class="flex h-8 w-8 items-center justify-center rounded-full font-bold">{{ i + 1 }}</span>
            @if (i < steps.length - 1) {
              <span class="h-0.5 w-8" [class]="i < step() ? 'bg-cyan-600' : 'bg-gray-200'"></span>
            }
          }
        </div>

        @if (loading()) {
          <app-skeleton [count]="3" height="60px" />
        } @else {
          <!-- Step 1: Dati -->
          @if (step() === 0) {
            <div class="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 class="mb-4 text-xl font-bold">Conferma i tuoi dati</h2>
              @if (slot(); as s) {
                <div class="mb-4 rounded-lg bg-cyan-50 p-4 text-sm">
                  <p><strong>{{ s.lessonType.title }}</strong> con {{ s.instructor.user.name }}</p>
                  <p>📅 {{ s.startsAt | date:'dd/MM/yyyy HH:mm' }} — {{ s.location.name }}</p>
                  <p class="mt-1 font-bold text-amber-700">Deposito: €{{ deposit() }} (30% di €{{ s.lessonType.pricePerPerson }})</p>
                </div>
              }
              <div class="space-y-3">
                <div>
                  <label for="bf-name" class="text-sm font-medium text-gray-700">Nome</label>
                  <input id="bf-name" [value]="auth.currentUser()?.name ?? ''" disabled
                    class="mt-1 w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label for="bf-email" class="text-sm font-medium text-gray-700">Email</label>
                  <input id="bf-email" [value]="auth.currentUser()?.email ?? ''" disabled
                    class="mt-1 w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label for="bf-notes" class="text-sm font-medium text-gray-700">Note (opzionale)</label>
                  <textarea id="bf-notes" [(ngModel)]="notes" rows="2"
                    class="mt-1 w-full rounded-lg border px-3 py-2 text-sm" placeholder="Es: prima esperienza..."></textarea>
                </div>
                <label class="flex items-start gap-2 text-sm">
                  <input type="checkbox" [(ngModel)]="accepted" class="mt-1" />
                  <span>Accetto che la lezione è soggetta a conferma meteo 24h prima. In caso di annullamento il deposito viene rimborsato automaticamente.</span>
                </label>
              </div>
              <button (click)="goToPayment()" [disabled]="!accepted"
                class="mt-6 w-full rounded-lg bg-cyan-600 py-3 font-bold text-white disabled:opacity-40 hover:bg-cyan-500">
                Procedi al pagamento →
              </button>
            </div>
          }

          <!-- Step 2: Pagamento -->
          @if (step() === 1) {
            <div class="rounded-2xl border bg-white p-6 shadow-sm">
              <h2 class="mb-4 text-xl font-bold">Pagamento deposito</h2>
              <p class="mb-4 text-sm text-gray-600">Deposito di <strong>€{{ deposit() }}</strong> — autorizzazione sulla carta, addebito solo dopo conferma meteo.</p>
              <div id="card-element" class="rounded-lg border p-4"></div>
              @if (payError()) {
                <p class="mt-2 text-sm text-red-600">{{ payError() }}</p>
              }
              <button (click)="confirmPayment()" [disabled]="paying()"
                class="mt-6 w-full rounded-lg bg-amber-500 py-3 font-bold text-white disabled:opacity-40 hover:bg-amber-400">
                {{ paying() ? 'Elaborazione...' : 'Autorizza deposito' }}
              </button>
            </div>
          }

          <!-- Step 3: Conferma -->
          @if (step() === 2) {
            <div class="rounded-2xl border bg-white p-6 text-center shadow-sm">
              <span class="text-5xl">🎉</span>
              <h2 class="mt-4 text-2xl font-bold text-gray-900">Prenotazione ricevuta!</h2>
              <p class="mt-2 text-gray-600">
                La tua lezione è in stato <strong class="text-amber-600">in attesa di conferma meteo</strong>.
                Riceverai un'email 24 ore prima con la conferma definitiva.
              </p>
              <div class="mt-6 flex justify-center gap-4">
                <a routerLink="/portale" class="rounded-lg bg-cyan-600 px-6 py-2 text-white hover:bg-cyan-500">Le mie prenotazioni</a>
                <a routerLink="/lezioni" class="rounded-lg border px-6 py-2 text-gray-700 hover:bg-gray-50">Altre lezioni</a>
              </div>
            </div>
          }
        }
      </main>
    </div>
  `,
})
export class BookingFlowComponent implements OnInit {
  steps = ['Dati', 'Pagamento', 'Conferma'];
  step = signal(0);
  slot = signal<Slot | null>(null);
  loading = signal(true);
  paying = signal(false);
  payError = signal('');
  notes = '';
  accepted = false;

  deposit = computed(() => {
    const s = this.slot();
    return s ? (Math.round(Number(s.lessonType.pricePerPerson) * 0.3 * 100) / 100) : 0;
  });

  private stripe: Stripe | null = null;
  private cardElement: StripeCardElement | null = null;
  private clientSecret = '';

  private route = inject(ActivatedRoute);
  private api = inject(ApiService);
  auth = inject(SupabaseAuthService);

  ngOnInit() {
    const slotId = this.route.snapshot.paramMap.get('slotId')!;
    this.api.getSlots({ startAfter: new Date(0).toISOString() }).subscribe({
      next: (slots) => {
        this.slot.set(slots.find((s) => s.id === slotId) ?? null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToPayment() {
    const slotId = this.slot()?.id;
    if (!slotId) return;

    this.loading.set(true);
    this.api.createBooking(slotId, this.notes || undefined).subscribe({
      next: async (res) => {
        this.clientSecret = res.clientSecret;
        this.step.set(1);
        this.loading.set(false);
        await this.mountStripe();
      },
      error: () => this.loading.set(false),
    });
  }

  private async mountStripe() {
    this.stripe = await loadStripe(environment.stripePublicKey);
    if (!this.stripe) return;
    const elements = this.stripe.elements({ clientSecret: this.clientSecret });
    this.cardElement = elements.create('card', {
      style: { base: { fontSize: '16px', color: '#1f2937' } },
    });
    // Wait for DOM
    setTimeout(() => {
      this.cardElement?.mount('#card-element');
    }, 50);
  }

  async confirmPayment() {
    if (!this.stripe || !this.cardElement) return;
    this.paying.set(true);
    this.payError.set('');

    const { error } = await this.stripe.confirmCardPayment(this.clientSecret, {
      payment_method: { card: this.cardElement },
    });

    if (error) {
      this.payError.set(error.message ?? 'Errore nel pagamento');
      this.paying.set(false);
    } else {
      this.step.set(2);
      this.paying.set(false);
    }
  }
}
