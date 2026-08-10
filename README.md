# BlueMates

The active application is in [`web`](./web). The root `docker-compose.yml` starts the Next.js web service, a persistent PostgreSQL database and persistent authenticated media storage.

The current product includes a public-by-default digital dive logbook with optional privacy, diver profiles and friend requests, an interactive world globe, future-dive planning, GPS site reviews and photo uploads. Start it with `docker compose up --build` and open `http://localhost:3000`.

The WebApp version is sourced from `web/package.json` and displayed automatically in the footer. New standard functions increment the final number with `npm run version:func`; major functions increment the first number with `npm run version:major`.

## Demo population

Run `docker compose exec web npm run db:seed-demo` to create or refresh the idempotent demo population. It adds Gorge, Lucas and Michelle, connects them to every non-demo member, and fills their public profiles with dive logs, future trips and geolocated reviews. All three demo accounts use the password `DemoDive2026!`; their emails are `gorge@demo.bluemates.test`, `lucas@demo.bluemates.test` and `michelle@demo.bluemates.test`.

The `android` and `ios` directories document the planned native clients. They intentionally do not duplicate the web implementation yet; future clients will consume the versioned JSON authentication API and share the same PostgreSQL-backed accounts.
