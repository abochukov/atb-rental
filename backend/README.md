# Car Rental Backend (NestJS)

Backend API skeleton for the car-rental project.

## Tech stack

- NestJS
- PostgreSQL

## Modules (skeleton)

- `health`
- `users`
- `vehicles`
- `locations`
- `bookings`

## Local setup

```bash
npm install
npm run start:dev
```

Backend runs on `http://localhost:3000` with API prefix `api`.

Health check endpoint:

```text
GET /api/health
```

## Database setup

Start PostgreSQL:

```bash
docker compose up -d
```

Apply schema:

```bash
psql -U postgres -d car_rental -f sql/001_init.sql
```

Environment example:

```text
.env.example
```

Copy `.env.example` to `.env` and adjust values for local/AWS environments.

## FE-BE local integration

- Backend: `http://localhost:3000/api`
- Frontend expects this base URL in `src/app/services/api.service.ts`
- CORS is enabled for `http://localhost:4200`

## Notes

- The SQL schema includes overlap protection for bookings via PostgreSQL exclusion constraints.
- Guest booking is supported by keeping `user_id` nullable and storing guest snapshot fields in `bookings`.
