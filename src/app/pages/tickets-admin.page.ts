import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { apiErrorMessage } from '../core/api-error';
import { ClipPaymentRecord } from '../shared/models/clip-payment.model';
import { Event } from '../shared/models/event.model';
import { Ticket } from '../shared/models/ticket.model';
import { EventService } from '../shared/services/event.service';
import { TicketService } from '../shared/services/ticket.service';

@Component({
  selector: 'app-tickets-admin-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-6xl p-4">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <h1 class="text-2xl font-semibold">Tickets</h1>
        <span class="flex-1"></span>
        <a routerLink="/tickets/new" class="rounded bg-indigo-600 px-3 py-2 text-white no-underline">New manual ticket</a>
      </div>

      <div class="mb-3 flex flex-wrap gap-2">
        <input [ngModel]="search()" (ngModelChange)="search.set($event)" placeholder="Search name, email, id"
          class="rounded border p-2" />
        <select [ngModel]="eventFilter()" (ngModelChange)="eventFilter.set($event)" class="rounded border p-2">
          <option value="">All events</option>
          @for (e of events(); track e.id) { <option [value]="e.id">{{ e.name }}</option> }
        </select>
        <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)" class="rounded border p-2">
          <option value="">Any status</option>
          <option value="ACTIVE">Active</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select [ngModel]="methodFilter()" (ngModelChange)="methodFilter.set($event)" class="rounded border p-2">
          <option value="">Any payment</option>
          <option value="CLIP">CLIP</option>
          <option value="MANUAL">Manual</option>
        </select>
      </div>

      @if (error()) { <p class="mb-2 text-red-600">{{ error() }}</p> }
      @if (loading()) { <p>Loading…</p> }

      <div class="overflow-x-auto rounded bg-white shadow">
        <table class="w-full text-left text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="p-2">Owner</th><th class="p-2">Event</th><th class="p-2">Seat</th>
              <th class="p-2">Price</th><th class="p-2">Payment</th><th class="p-2">Status</th>
              <th class="p-2">Purchased</th><th class="p-2"></th>
            </tr>
          </thead>
          <tbody>
            @for (t of filtered(); track t.id) {
              <tr class="border-t">
                <td class="p-2">{{ t.ownerName }}<br /><span class="text-gray-500">{{ t.ownerEmail }}</span></td>
                <td class="p-2">{{ eventName(t.eventId) }}</td>
                <td class="p-2">{{ t.seatNumber }}</td>
                <td class="p-2">{{ t.price == null ? '—' : (t.price | currency) }}</td>
                <td class="p-2">
                  {{ t.paymentMethod }}
                  @if (t.paymentNotes) { <br /><span class="text-gray-500">{{ t.paymentNotes }}</span> }
                </td>
                <td class="p-2" [class.text-red-600]="t.status === 'CANCELLED'">{{ t.status }}</td>
                <td class="p-2">{{ t.purchasedAt | date: 'short' }}</td>
                <td class="space-x-2 p-2 whitespace-nowrap">
                  @if (t.paymentMethod === 'CLIP') {
                    <button class="text-indigo-600 underline" (click)="showPayment(t)">Payment</button>
                  }
                  @if (t.status === 'ACTIVE') {
                    <button class="text-red-600 underline" (click)="cancel(t)">Cancel</button>
                  }
                </td>
              </tr>
            } @empty {
              @if (!loading()) { <tr><td colspan="8" class="p-4 text-center text-gray-500">No tickets</td></tr> }
            }
          </tbody>
        </table>
      </div>

      @if (payment(); as p) {
        <div class="mt-4 rounded bg-white p-4 shadow">
          <h2 class="mb-2 font-semibold">CLIP payment {{ p.id }}</h2>
          <p>Status: {{ p.status }} @if (p.statusDetailMessage) { ({{ p.statusDetailMessage }}) }</p>
          <p>Amount: {{ p.amount | currency: p.currency }}</p>
          <p>Receipt: {{ p.receiptNo ?? '—' }}</p>
          <p>Recorded: {{ p.recordedAt | date: 'medium' }}</p>
          <button class="mt-2 underline" (click)="payment.set(null)">Close</button>
        </div>
      }
    </div>
  `,
})
export class TicketsAdminPage {
  private readonly ticketService = inject(TicketService);
  private readonly eventService = inject(EventService);

  readonly tickets = signal<Ticket[]>([]);
  readonly events = signal<Event[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly payment = signal<ClipPaymentRecord | null>(null);

  readonly search = signal('');
  readonly eventFilter = signal('');
  readonly statusFilter = signal('');
  readonly methodFilter = signal('');

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.tickets().filter(
      (t) =>
        (!this.eventFilter() || t.eventId === this.eventFilter()) &&
        (!this.statusFilter() || t.status === this.statusFilter()) &&
        (!this.methodFilter() || t.paymentMethod === this.methodFilter()) &&
        (!q || `${t.ownerName} ${t.ownerEmail} ${t.id}`.toLowerCase().includes(q)),
    );
  });

  constructor() {
    forkJoin({ tickets: this.ticketService.getAll(), events: this.eventService.getAll() }).subscribe({
      next: ({ tickets, events }) => {
        this.tickets.set(tickets);
        this.events.set(events);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(apiErrorMessage(e));
        this.loading.set(false);
      },
    });
  }

  eventName(id: string): string {
    return this.events().find((e) => e.id === id)?.name ?? id;
  }

  showPayment(t: Ticket): void {
    this.ticketService.getPayment(t.id).subscribe({
      next: (p) => this.payment.set(p),
      error: (e) => this.error.set(apiErrorMessage(e)),
    });
  }

  cancel(t: Ticket): void {
    if (!confirm(`Cancel ticket for ${t.ownerName} (seat ${t.seatNumber})? The seat will be freed.`)) return;
    this.ticketService.cancel(t.id).subscribe({
      next: (updated) => this.tickets.update((list) => list.map((x) => (x.id === updated.id ? updated : x))),
      error: (e) => this.error.set(apiErrorMessage(e)),
    });
  }
}
