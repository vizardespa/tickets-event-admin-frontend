import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiErrorMessage } from '../core/api-error';
import { Event } from '../shared/models/event.model';
import { Ticket } from '../shared/models/ticket.model';
import { TicketType } from '../shared/models/ticket-type.model';
import { EventService } from '../shared/services/event.service';
import { TicketTypeService } from '../shared/services/ticket-type.service';
import { TicketService } from '../shared/services/ticket.service';

@Component({
  selector: 'app-manual-ticket-page',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-xl p-4">
      <h1 class="mb-1 text-2xl font-semibold">Create ticket without CLIP</h1>
      <p class="mb-4 text-sm text-gray-600">
        Issues a valid ticket paid by other means (cash, transfer...). The purchase window is not enforced.
      </p>

      <form (ngSubmit)="submit()" class="space-y-3 rounded bg-white p-4 shadow">
        <label class="block text-sm">Event
          <select name="event" [ngModel]="eventId" (ngModelChange)="onEvent($event)" required class="mt-1 w-full rounded border p-2">
            <option value="" disabled>Select an event</option>
            @for (e of events(); track e.id) {
              <option [value]="e.id">{{ e.name }} ({{ e.availableSeats }} seats left)</option>
            }
          </select>
        </label>
        <label class="block text-sm">Ticket type
          <select name="type" [(ngModel)]="ticketTypeId" required [disabled]="!eventId" class="mt-1 w-full rounded border p-2">
            <option value="" disabled>Select a ticket type</option>
            @for (t of types(); track t.id) { <option [value]="t.id">{{ t.name }} — {{ t.price | currency }}</option> }
          </select>
        </label>
        <label class="block text-sm">Owner name
          <input name="name" [(ngModel)]="ownerName" required class="mt-1 w-full rounded border p-2" />
        </label>
        <label class="block text-sm">Owner email
          <input name="email" type="email" [(ngModel)]="ownerEmail" required class="mt-1 w-full rounded border p-2" />
        </label>
        <label class="block text-sm">Seat number (optional, auto-assigned if empty)
          <input name="seat" type="number" min="1" [(ngModel)]="seatNumber" class="mt-1 w-full rounded border p-2" />
        </label>
        <label class="block text-sm">Payment notes (required)
          <textarea name="notes" [(ngModel)]="paymentNotes" required rows="3" placeholder="e.g. Paid cash to Juan on 2026-11-07"
            class="mt-1 w-full rounded border p-2"></textarea>
        </label>

        @if (error()) { <p class="text-sm text-red-600">{{ error() }}</p> }
        <div class="flex gap-2">
          <button type="submit" [disabled]="!valid() || busy()" class="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50">
            {{ busy() ? 'Creating…' : 'Create ticket' }}
          </button>
          <a routerLink="/tickets" class="px-4 py-2">Back</a>
        </div>
      </form>

      @if (created(); as t) {
        <div class="mt-4 rounded border border-green-300 bg-green-50 p-4">
          Ticket created for {{ t.ownerName }}: seat {{ t.seatNumber }}, id {{ t.id }}.
        </div>
      }
    </div>
  `,
})
export class ManualTicketPage {
  private readonly eventService = inject(EventService);
  private readonly typeService = inject(TicketTypeService);
  private readonly ticketService = inject(TicketService);

  readonly events = signal<Event[]>([]);
  readonly types = signal<TicketType[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly created = signal<Ticket | null>(null);

  eventId = '';
  ticketTypeId = '';
  ownerName = '';
  ownerEmail = '';
  seatNumber: number | null = null;
  paymentNotes = '';

  constructor() {
    this.eventService.getAll().subscribe({
      next: (e) => this.events.set(e),
      error: (e) => this.error.set(apiErrorMessage(e)),
    });
  }

  onEvent(id: string): void {
    this.eventId = id;
    this.ticketTypeId = '';
    this.types.set([]);
    this.typeService.getByEvent(id).subscribe({
      next: (t) => this.types.set(t),
      error: (e) => this.error.set(apiErrorMessage(e)),
    });
  }

  valid(): boolean {
    return !!(this.eventId && this.ticketTypeId && this.ownerName.trim() && this.ownerEmail.trim() && this.paymentNotes.trim());
  }

  submit(): void {
    this.busy.set(true);
    this.error.set('');
    this.created.set(null);
    this.ticketService
      .createManual({
        eventId: this.eventId,
        ticketTypeId: this.ticketTypeId,
        ownerName: this.ownerName.trim(),
        ownerEmail: this.ownerEmail.trim(),
        paymentNotes: this.paymentNotes.trim(),
        ...(this.seatNumber ? { seatNumber: this.seatNumber } : {}),
      })
      .subscribe({
        next: (t) => {
          this.created.set(t);
          this.busy.set(false);
          this.ownerName = this.ownerEmail = this.paymentNotes = '';
          this.seatNumber = null;
          this.eventService.getAll().subscribe((e) => this.events.set(e));
        },
        error: (e) => {
          this.error.set(apiErrorMessage(e));
          this.busy.set(false);
        },
      });
  }
}
