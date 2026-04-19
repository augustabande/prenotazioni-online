import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SupabaseAuthService } from '../services/supabase-auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(SupabaseAuthService).token;
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
