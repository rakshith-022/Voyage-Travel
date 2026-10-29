# Voyago — Travel Booking App

A full-stack travel booking mini-project: browse curated trips, search and filter them,
sign up / sign in, book a trip, and manage your bookings from a dashboard.

Built for a college assessment to demonstrate a complete frontend ↔ backend ↔ database flow.

---

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | HTML, CSS, vanilla JavaScript (no framework/build step) |
| Backend   | Node.js + Express (REST API) |
| Database  | SQLite (via `better-sqlite3`) |
| Auth      | Email/password with `bcryptjs` hashing + `jsonwebtoken` (JWT) |

The Express server also serves the frontend as static files, so the whole app runs
from a single `npm start` — no separate frontend server, no CORS headaches when you
open it in a browser.

---

## Project structure

```
travel-booking-app/
├── backend/
│   ├── server.js          # Express app entrypoint
│   ├── db.js               # SQLite connection + schema
│   ├── seed.js              # Populates 12 sample destinations
│   ├── middleware/auth.js    # JWT verification middleware
│   └── routes/
│       ├── auth.js           # register / login / me
│       ├── destinations.js   # list / search / detail
│       └── bookings.js       # create / list / cancel (auth required)
└── frontend/
    ├── index.html
    ├── css/style.css        # design system + all component styles
    └── js/app.js            # API calls, rendering, auth, booking flow
```

---

## Setup

**Requirements:** Node.js 18+ (comes with npm).

```bash
cd backend
npm install
npm run seed      # creates backend/voyago.sqlite and loads 12 destinations
npm start         # starts the API + frontend on http://localhost:4000
```

Then open **http://localhost:4000** in your browser.

Optional: copy `backend/.env.example` to `backend/.env` to set a custom `PORT`
or `JWT_SECRET`. If you skip this, sensible defaults are used automatically.

To reset the data, delete `backend/voyago.sqlite` and run `npm run seed` again.

---

## Features

- **Browse & search** — 12 seeded destinations across 5 categories (Islands, Nature,
  Culture, Adventure, City), with live search, category filter and price/rating sort.
- **Destination detail** — description, highlights, and a live price calculator that
  updates as you change the number of travelers.
- **Auth** — register and sign in with a hashed password; session persisted via a JWT
  stored in `localStorage`.
- **Booking** — signed-in users can book a trip for a future date and see the total
  price computed server-side (never trusted from the client).
- **Dashboard ("My trips")** — lists a user's bookings with status, and lets them
  cancel a confirmed booking.
- **No external image dependencies** — every destination "poster" is generated with
  CSS gradients + inline SVG icons keyed to its category, so the UI looks consistent
  and never breaks from a dead image link (handy when demoing offline).

---

## API reference

All routes are prefixed with `/api`.

| Method | Route                       | Auth | Description |
|--------|------------------------------|------|-------------|
| POST   | `/auth/register`             | –    | Create an account, returns `{ token, user }` |
| POST   | `/auth/login`                 | –    | Returns `{ token, user }` |
| GET    | `/auth/me`                     | ✅   | Current user info |
| GET    | `/destinations?search=&category=&sort=` | – | List/search/filter destinations |
| GET    | `/destinations/categories`     | –    | Distinct category list |
| GET    | `/destinations/:id`            | –    | Single destination with highlights |
| POST   | `/bookings`                     | ✅   | Body: `{ destinationId, travelDate, travelers }` |
| GET    | `/bookings/my`                   | ✅   | Current user's bookings |
| PATCH  | `/bookings/:id/cancel`            | ✅   | Cancel a booking |

Auth routes marked ✅ require an `Authorization: Bearer <token>` header.

---

## Database schema

```
users        (id, name, email UNIQUE, password_hash, created_at)
destinations (id, name, country, category, price_per_person, duration_days,
              rating, description, highlights JSON, image_seed, image_hue)
bookings     (id, user_id → users, destination_id → destinations,
              travel_date, travelers, total_price, status, created_at)
```

`total_price` is always calculated on the server (`price_per_person × travelers`)
so it can't be tampered with from the client — worth mentioning if you're asked
about security in a viva.

---

## Notes for presenting this project

- **Why SQLite?** Zero configuration, a single file, and enough for a mini-project;
  swapping it for PostgreSQL/MySQL would mainly mean changing `db.js` since the SQL
  is kept close to standard.
- **Why no frontend framework?** Keeps the "backend serves everything" story simple
  for a viva — you can point to any DOM update in `app.js` and trace it straight to
  an `apiFetch()` call.
- **Password security:** passwords are hashed with bcrypt before storage; plain-text
  passwords are never saved or returned by the API.
- **Possible extensions** if asked "what would you add next": payment integration
  (mock), an admin panel to manage destinations, pagination, email confirmations,
  or reviews/ratings from past travelers.
