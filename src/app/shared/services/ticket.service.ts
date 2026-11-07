import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ClipPaymentRecord } from '../models/clip-payment.model';
import { ManualTicketRequest, Ticket } from '../models/ticket.model';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/tickets`;

  getAll(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.baseUrl);
  }

  getById(id: string): Observable<Ticket> {
    return this.http.get<Ticket>(`${this.baseUrl}/${id}`);
  }

  createManual(request: ManualTicketRequest): Observable<Ticket> {
    return this.http.post<Ticket>(`${this.baseUrl}/manual`, request);
  }

  getPayment(id: string): Observable<ClipPaymentRecord> {
    return this.http.get<ClipPaymentRecord>(`${this.baseUrl}/${id}/payment`);
  }

  cancel(id: string): Observable<Ticket> {
    return this.http.delete<Ticket>(`${this.baseUrl}/${id}`);
  }
}
