import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { apiErrorMessage } from '../core/api-error';
import { Event, EventRequest } from '../shared/models/event.model';
import { TicketType, TicketTypeRequest } from '../shared/models/ticket-type.model';
import { EventService } from '../shared/services/event.service';
import { TicketTypeService } from '../shared/services/ticket-type.service';

interface EventForm {
  name: string;
  description: string;
  venue: string;
  date: string;
  totalSeats: number;
  availableSeats: number | null;
}

interface TypeForm {
  name: string;
  description: string;
  price: number;
  purchaseStartAt: string;
  purchaseEndAt: string;
}

const toLocalInput = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const toIso = (local: string): string | null => (local ? new Date(local).toISOString() : null);

@Component({
  selector: 'app-events-admin-page',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  template: `
    <div class="mx-auto max-w-5xl p-4">
      <div class="mb-4 flex items-center">
        <h1 class="flex-1 text-2xl font-semibold">Events</h1>
        <button class="rounded bg-indigo-600 px-3 py-2 text-white" (click)="newEvent()">New event</button>
      </div>
      @if (error()) { <p class="mb-2 text-red-600">{{ error() }}</p> }

      @if (form(); as f) {
        <form (ngSubmit)="saveEvent()" class="mb-4 grid gap-3 rounded bg-white p-4 shadow sm:grid-cols-2">
          <label class="text-sm">Name<input name="n" [(ngModel)]="f.name" required class="mt-1 w-full rounded border p-2" /></label>
          <label class="text-sm">Venue<input name="v" [(ngModel)]="f.venue" required class="mt-1 w-full rounded border p-2" /></label>
          <label class="text-sm">Date<input name="d" type="datetime-local" [(ngModel)]="f.date" required class="mt-1 w-full rounded border p-2" /></label>
          <label class="text-sm">Total seats<input name="ts" type="number" min="1" [(ngModel)]="f.totalSeats" required class="mt-1 w-full rounded border p-2" /></label>
          <label class="text-sm">Available seats (optional)<input name="as" type="number" min="0" [(ngModel)]="f.availableSeats" class="mt-1 w-full rounded border p-2" /></label>
          <label class="text-sm sm:col-span-2">Description<textarea name="ds" rows="2" [(ngModel)]="f.description" class="mt-1 w-full rounded border p-2"></textarea></label>
          <div class="space-x-2 sm:col-span-2">
            <button type="submit" class="rounded bg-indigo-600 px-4 py-2 text-white">Save</button>
            <button type="button" (click)="form.set(null)">Cancel</button>
          </div>
        </form>
      }

      @for (e of events(); track e.id) {
        <div class="mb-3 rounded bg-white p-4 shadow">
          <div class="flex flex-wrap items-center gap-2">
            <div class="flex-1">
              <div class="font-semibold">{{ e.name }}</div>
              <div class="text-sm text-gray-600">{{ e.venue }} · {{ e.date | date: 'medium' }} · {{ e.availableSeats }}/{{ e.totalSeats }} seats left</div>
            </div>
            <button class="text-indigo-600 underline" (click)="toggleTypes(e)">Ticket types</button>
            <button class="text-indigo-600 underline" (click)="editEvent(e)">Edit</button>
            <button class="text-red-600 underline" (click)="deleteEvent(e)">Delete</button>
          </div>

          @if (openEventId() === e.id) {
            <div class="mt-3 border-t pt-3">
              @for (t of types(); track t.id) {
                <div class="flex items-center gap-2 py-1 text-sm">
                  <span class="flex-1">{{ t.name }} — {{ t.price | currency }}
                    @if (t.purchaseStartAt || t.purchaseEndAt) {
                      <span class="text-gray-500">({{ t.purchaseStartAt ? (t.purchaseStartAt | date: 'short') : '…' }} → {{ t.purchaseEndAt ? (t.purchaseEndAt | date: 'short') : '…' }})</span>
                    }
                  </span>
                  <button class="text-indigo-600 underline" (click)="editType(t)">Edit</button>
                  <button class="text-red-600 underline" (click)="deleteType(t)">Delete</button>
                </div>
              } @empty { <p class="text-sm text-gray-500">No ticket types yet</p> }

              @if (typeForm(); as tf) {
                <form (ngSubmit)="saveType(e)" class="mt-2 grid gap-2 rounded border p-3 sm:grid-cols-2">
                  <label class="text-sm">Name<input name="tn" [(ngModel)]="tf.name" required class="mt-1 w-full rounded border p-2" /></label>
                  <label class="text-sm">Price<input name="tp" type="number" min="0" step="0.01" [(ngModel)]="tf.price" required class="mt-1 w-full rounded border p-2" /></label>
                  <label class="text-sm">Purchase opens<input name="tsa" type="datetime-local" [(ngModel)]="tf.purchaseStartAt" class="mt-1 w-full rounded border p-2" /></label>
                  <label class="text-sm">Purchase closes<input name="tea" type="datetime-local" [(ngModel)]="tf.purchaseEndAt" class="mt-1 w-full rounded border p-2" /></label>
                  <label class="text-sm sm:col-span-2">Description<input name="td" [(ngModel)]="tf.description" class="mt-1 w-full rounded border p-2" /></label>
                  <div class="space-x-2 sm:col-span-2">
                    <button type="submit" class="rounded bg-indigo-600 px-3 py-1 text-white">Save type</button>
                    <button type="button" (click)="typeForm.set(null)">Cancel</button>
                  </div>
                </form>
              } @else {
                <button class="mt-2 text-indigo-600 underline" (click)="newType()">Add ticket type</button>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class EventsAdminPage {
  private readonly eventService = inject(EventService);
  private readonly typeService = inject(TicketTypeService);

  readonly events = signal<Event[]>([]);
  readonly types = signal<TicketType[]>([]);
  readonly openEventId = signal<string | null>(null);
  readonly form = signal<EventForm | null>(null);
  readonly typeForm = signal<TypeForm | null>(null);
  readonly error = signal('');

  private editingEventId: string | null = null;
  private editingTypeId: string | null = null;

  constructor() {
    this.reload();
  }

  private fail = (e: unknown) => this.error.set(apiErrorMessage(e));

  private reload(): void {
    this.eventService.getAll().subscribe({ next: (e) => this.events.set(e), error: this.fail });
  }

  newEvent(): void {
    this.editingEventId = null;
    this.form.set({ name: '', description: '', venue: '', date: '', totalSeats: 100, availableSeats: null });
  }

  editEvent(e: Event): void {
    this.editingEventId = e.id;
    this.form.set({
      name: e.name,
      description: e.description,
      venue: e.venue,
      date: toLocalInput(e.date),
      totalSeats: e.totalSeats,
      availableSeats: e.availableSeats,
    });
  }

  saveEvent(): void {
    const f = this.form();
    if (!f) return;
    const req: EventRequest = {
      name: f.name,
      description: f.description,
      venue: f.venue,
      date: toIso(f.date) ?? '',
      totalSeats: f.totalSeats,
      ...(f.availableSeats != null ? { availableSeats: f.availableSeats } : {}),
    };
    const call = this.editingEventId
      ? this.eventService.update(this.editingEventId, req)
      : this.eventService.create(req);
    call.subscribe({
      next: () => {
        this.error.set('');
        this.form.set(null);
        this.reload();
      },
      error: this.fail,
    });
  }

  deleteEvent(e: Event): void {
    if (!confirm(`Delete event "${e.name}"?`)) return;
    this.eventService.delete(e.id).subscribe({ next: () => this.reload(), error: this.fail });
  }

  toggleTypes(e: Event): void {
    this.typeForm.set(null);
    if (this.openEventId() === e.id) {
      this.openEventId.set(null);
      return;
    }
    this.openEventId.set(e.id);
    this.loadTypes(e.id);
  }

  private loadTypes(eventId: string): void {
    this.types.set([]);
    this.typeService.getByEvent(eventId).subscribe({ next: (t) => this.types.set(t), error: this.fail });
  }

  newType(): void {
    this.editingTypeId = null;
    this.typeForm.set({ name: '', description: '', price: 0, purchaseStartAt: '', purchaseEndAt: '' });
  }

  editType(t: TicketType): void {
    this.editingTypeId = t.id;
    this.typeForm.set({
      name: t.name,
      description: t.description,
      price: t.price,
      purchaseStartAt: toLocalInput(t.purchaseStartAt),
      purchaseEndAt: toLocalInput(t.purchaseEndAt),
    });
  }

  saveType(e: Event): void {
    const f = this.typeForm();
    if (!f) return;
    const req: TicketTypeRequest = {
      name: f.name,
      description: f.description,
      price: f.price,
      purchaseStartAt: toIso(f.purchaseStartAt),
      purchaseEndAt: toIso(f.purchaseEndAt),
    };
    const call = this.editingTypeId
      ? this.typeService.update(this.editingTypeId, req)
      : this.typeService.create(e.id, req);
    call.subscribe({
      next: () => {
        this.error.set('');
        this.typeForm.set(null);
        this.loadTypes(e.id);
      },
      error: this.fail,
    });
  }

  deleteType(t: TicketType): void {
    if (!confirm(`Delete ticket type "${t.name}"?`)) return;
    this.typeService.delete(t.id).subscribe({ next: () => this.loadTypes(t.eventId), error: this.fail });
  }
}
