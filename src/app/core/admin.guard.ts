import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AdminAuthService } from './admin-auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AdminAuthService);
  return auth.key() ? true : inject(Router).createUrlTree(['/login']);
};
