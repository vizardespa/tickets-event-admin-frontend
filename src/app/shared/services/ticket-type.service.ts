import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TicketType, TicketTypeRequest } from '../models/ticket-type.model';

@Injectable({ providedIn: 'root' })
export class TicketTypeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api`;

  getByEvent(eventId: string): Observable<TicketType[]> {
    return this.http.get<TicketType[]>(`${this.baseUrl}/events/${eventId}/ticket-types`);
  }

  create(eventId: string, request: TicketTypeRequest): Observable<TicketType> {
    return this.http.post<TicketType>(`${this.baseUrl}/events/${eventId}/ticket-types`, request);
  }

  update(id: string, request: TicketTypeRequest): Observable<TicketType> {
    return this.http.put<TicketType>(`${this.baseUrl}/ticket-types/${id}`, request);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/ticket-types/${id}`);
  }
}
