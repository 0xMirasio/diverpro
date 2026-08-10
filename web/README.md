# BlueMates web

A responsive, trilingual authentication foundation for BlueMates. The application uses Next.js, PostgreSQL, Prisma migrations, bcrypt password hashing and signed HTTP-only session cookies.

## Product modules

- Digital logbook with depth, duration, site, notes, GPS, up to six photos and per-logbook/per-dive privacy.
- Diver discovery by username or member ID, friend requests, accept/decline workflow and public profile routes.
- Editable profile with birth date, biography, profile image and public/private visibility.
- Interactive MapLibre world globe showing completed dives, friends' public activity, future dives and public site reviews with distinct markers.
- Search-as-you-type place selection with multilingual Photon/OpenStreetMap suggestions, optional location bias, reverse geocoding and browser GPS.
- Future-dive planning with GPS and per-plan privacy.
- Geolocated 1–5 star site reviews with comments and photos.

New profiles, logbooks, dives and planned dives are public by default; members can explicitly switch each supported scope to private. Existing privacy choices are preserved. All visibility checks are enforced in server queries and media delivery routes, not only hidden in the interface.

## Run with Docker

From the repository root:

```bash
AUTH_SECRET="replace-this-with-a-long-random-production-secret" docker compose up --build
```

Open `http://localhost:3000`. PostgreSQL data is kept in `bluemates_postgres`; uploaded media is kept in `bluemates_uploads` and served through an authenticated API route.

## Run locally

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

Use a local PostgreSQL instance matching `DATABASE_URL` in `.env`.

## Identity model

- `id`: internal immutable UUID, safe for database relationships.
- `publicId`: human-readable ID generated from first and last names (`jane-doe`, then `jane-doe-2`, etc.).
- `username`: chosen by the user and enforced case-insensitively through the unique `usernameKey` column.
- `email`: enforced case-insensitively through the unique `emailKey` column.

Prisma migrations under `prisma/migrations` make the database portable to managed PostgreSQL providers. Run `npm run db:deploy` during production deployment.

The local media adapter writes to `UPLOAD_DIR`. For horizontal production scaling, mount distributed storage or replace `lib/storage.ts` with an S3-compatible adapter while retaining the database-backed media authorization layer.

## Authentication

Email/password login and registration are active. Google OAuth is intentionally displayed as disabled; `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=false` reserves the configuration flag for a later provider implementation.

For an internet-facing release, add distributed login throttling (for example Redis), email verification, password reset delivery, audit logging and production secrets management.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm test
npm run db:migrate
npm run db:deploy
npm run version:func
npm run version:major
```

`web/package.json` is the single WebApp version source displayed automatically in the footer. `version:func` increments the final number for a standard new function; `version:major` increments the first number for a major change.

## Generated visual

`public/images/scuba-hero.png` is an original project asset generated for this interface. It contains no third-party logo or licensed stock photography dependency.

`public/images/logbook-background.png` is an original generated photograph-style asset for the digital logbook.

## Map data

The current development globe uses MapLibre's public demo style. Before a high-traffic production launch, configure a dedicated compatible tile provider or self-hosted tiles and review its attribution/usage policy.

Place search is proxied by the authenticated `/api/geocoding` routes, debounced in the browser and cached for ten minutes. `GEOCODER_URL` defaults to Photon's fair-use demo server. Configure a private Photon deployment or another compatible endpoint for production traffic; no client rebuild is needed.
