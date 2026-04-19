import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { SupabaseAuthService } from '../services/supabase-auth.service';

export const authGuard: CanMatchFn = () => {
  const auth = inject(SupabaseAuthService);
  const router = inject(Router);
  return auth.isLoggedIn() || router.createUrlTree(['/login']);
};
