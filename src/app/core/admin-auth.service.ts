import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'adminApiKey';

@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  readonly key = signal<string | null>(sessionStorage.getItem(STORAGE_KEY));

  setKey(key: string): void {
    sessionStorage.setItem(STORAGE_KEY, key);
    this.key.set(key);
  }

  clear(): void {
    sessionStorage.removeItem(STORAGE_KEY);
    this.key.set(null);
  }
}
