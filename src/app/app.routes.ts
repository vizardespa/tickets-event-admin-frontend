import { Routes } from '@angular/router';
import { adminGuard } from './core/admin.guard';
import { EventsAdminPage } from './pages/events-admin.page';
import { LoginPage } from './pages/login.page';
import { ManualTicketPage } from './pages/manual-ticket.page';
import { TicketsAdminPage } from './pages/tickets-admin.page';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: '', redirectTo: 'tickets', pathMatch: 'full' },
  { path: 'tickets', component: TicketsAdminPage, canActivate: [adminGuard] },
  { path: 'tickets/new', component: ManualTicketPage, canActivate: [adminGuard] },
  { path: 'events', component: EventsAdminPage, canActivate: [adminGuard] },
  { path: '**', redirectTo: 'tickets' },
];
