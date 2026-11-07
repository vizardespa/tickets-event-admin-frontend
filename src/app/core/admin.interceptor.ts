import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AdminAuthService } from './admin-auth.service';

export const adminInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AdminAuthService);
  const router = inject(Router);
  const key = auth.key();
  if (!key || !req.url.startsWith(environment.apiBaseUrl)) {
    return next(req);
  }
  return next(req.clone({ setHeaders: { 'X-Admin-Key': key } })).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 403) {
        auth.clear();
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
