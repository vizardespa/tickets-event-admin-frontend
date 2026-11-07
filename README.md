# Tickets Event Admin Frontend

Angular 21 admin app for `tickets-event-backend`. It signs in with the backend's `ADMIN_API_KEY`, which is sent as the `X-Admin-Key` header. The key is kept in `sessionStorage`.

## Features

- Tickets: list with filters, cancel a ticket (frees the seat), view the stored CLIP payment.
- Manual ticket: `POST /api/tickets/manual` creates a valid ticket without CLIP (cash, transfer, etc.). `paymentNotes` is required and the purchase window is not enforced.
- Events: create, edit and delete events, and manage their ticket types.

## Run

```bash
npm install
npm start   # http://localhost:4300
```

The API base URL is `src/environments/environment.ts` (`http://localhost:8080` by default).

## Backend requirement

Configure `ADMIN_API_KEY` in the backend's ignored `.env` file and start the backend.
Use that same key to sign in here. The backend requires this secret at startup, and
restricted endpoints remain protected server-side. Do not commit or share the key.
