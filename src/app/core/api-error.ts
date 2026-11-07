import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    return err.error?.message ?? (err.status === 0 ? 'Cannot reach the server' : err.message);
  }
  return 'Unexpected error';
}
