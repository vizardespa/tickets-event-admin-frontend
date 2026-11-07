/**
 * Ticket status — mirrors the backend `TicketStatus` enum.
 */
export type TicketStatus = 'ACTIVE' | 'CANCELLED';

/**
 * How a ticket was paid for — mirrors the backend `TicketPaymentMethod` enum.
 */
export type TicketPaymentMethod = 'CLIP' | 'MANUAL';

/**
 * Ticket model — mirrors the backend `Ticket` data class.
 */
export interface Ticket {
  id: string;
  eventId: string;
  ownerName: string;
  ownerEmail: string;
  seatNumber: number;
  status: TicketStatus;
  purchasedAt: string;
  paymentMethod: TicketPaymentMethod;
  clipPaymentId?: string | null;
  paymentNotes?: string | null;
  ticketTypeId?: string | null;
  price?: number | null;
}


/**
 * Payload for creating a ticket without CLIP (cash, transfer, etc.). `paymentNotes` is required.
 * `seatNumber` is optional — the backend assigns the next available seat if omitted.
 */
export interface ManualTicketRequest {
  eventId: string;
  ownerName: string;
  ownerEmail: string;
  paymentNotes: string;
  ticketTypeId: string;
  seatNumber?: number;
}
