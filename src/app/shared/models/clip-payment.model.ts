export interface ClipPaymentRecord {
  id: string;
  ticketId?: string | null;
  status: string;
  statusDetailCode?: string | null;
  statusDetailMessage?: string | null;
  amount: number;
  currency: string;
  description: string;
  receiptNo?: string | null;
  clipCreatedAt?: string | null;
  recordedAt: string;
  updatedAt: string;
}
