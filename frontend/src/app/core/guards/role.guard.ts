import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { SupabaseAuthService } from '../services/supabase-auth.service';
import { Role } from '@kite/shared-types';

export const roleGuard = (...roles: Role[]): CanMatchFn => () => {
  const auth = inject(SupabaseAuthService);
  const router = inject(Router);
  const user = auth.currentUser();
  if (user && roles.includes(user.role)) return true;
  return router.createUrlTree(['/']);
};
