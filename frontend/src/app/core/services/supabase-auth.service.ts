import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { AuthResponse, User } from '@kite/shared-types';
import { firstValueFrom } from 'rxjs';

const JWT_KEY = 'kite_jwt';
const USER_KEY = 'kite_user';

@Injectable({ providedIn: 'root' })
export class SupabaseAuthService {
  private supabase: SupabaseClient;
  private _user = signal<User | null>(this.loadUser());
  private _token = signal<string | null>(localStorage.getItem(JWT_KEY));

  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());

  constructor(private http: HttpClient) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseAnonKey);
    this.supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.access_token) {
        await this.verifyWithBackend(session.access_token);
      }
    });
  }

  get token(): string | null {
    return this._token();
  }

  async signIn(email: string): Promise<{ error?: string }> {
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/lezioni' },
    });
    return error ? { error: error.message } : {};
  }

  async signOut() {
    await this.supabase.auth.signOut();
    this._user.set(null);
    this._token.set(null);
    localStorage.removeItem(JWT_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private async verifyWithBackend(supabaseToken: string) {
    try {
      const res = await firstValueFrom(
        this.http.post<AuthResponse>(`${environment.apiUrl}/auth/verify`, { supabaseToken })
      );
      this._token.set(res.accessToken);
      this._user.set(res.user);
      localStorage.setItem(JWT_KEY, res.accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    } catch {
      this._user.set(null);
      this._token.set(null);
    }
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
