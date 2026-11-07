import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AdminAuthService } from '../core/admin-auth.service';
import { apiErrorMessage } from '../core/api-error';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-sm p-6">
      <h1 class="mb-4 text-2xl font-semibold">Admin access</h1>
      <form (ngSubmit)="submit()" class="space-y-3 rounded bg-white p-4 shadow">
        <label class="block text-sm">Admin API key
          <input type="password" name="key" [(ngModel)]="key" required class="mt-1 w-full rounded border p-2" />
        </label>
        @if (error()) { <p class="text-sm text-red-600">{{ error() }}</p> }
        <button type="submit" [disabled]="!key || busy()" class="w-full rounded bg-indigo-600 p-2 text-white disabled:opacity-50">
          {{ busy() ? 'Checking…' : 'Sign in' }}
        </button>
      </form>
    </div>
  `,
})
export class LoginPage {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AdminAuthService);
  private readonly router = inject(Router);

  key = '';
  readonly busy = signal(false);
  readonly error = signal('');

  submit(): void {
    this.busy.set(true);
    this.error.set('');
    this.http
      .get(`${environment.apiBaseUrl}/api/tickets`, { headers: { 'X-Admin-Key': this.key } })
      .subscribe({
        next: () => {
          this.auth.setKey(this.key);
          this.router.navigate(['/tickets']);
        },
        error: (e) => {
          this.busy.set(false);
          this.error.set(e.status === 403 ? 'Invalid admin key' : apiErrorMessage(e));
        },
      });
  }
}
