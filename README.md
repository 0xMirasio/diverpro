# BlueMates

The active application is in [`web`](./web). The root `docker-compose.yml` starts the Next.js web service, a persistent PostgreSQL database and persistent authenticated media storage.

The current product includes a public-by-default digital dive logbook with optional privacy, diver profiles and friend requests, an interactive world globe, future-dive planning, GPS site reviews and photo uploads. Start it with `docker compose up --build` and open `http://localhost:3000`.

The dive-site catalogue is imported from OpenStreetMap through Overpass (`sport=scuba_diving` plus `scuba_diving:divespot`) and is attributed under ODbL. Run `docker compose exec web npm run db:import-sites` to refresh the snapshot. Dive.site data is not copied because its terms do not grant reusable database rights without prior written permission.

The WebApp version is sourced from `web/package.json` and displayed automatically in the footer. New standard functions increment the final number with `npm run version:func`; major functions increment the first number with `npm run version:major`.

## Demo population

The Gorge, Lucas and Michelle seed is reserved for isolated development and test databases. It is never part of deployment and now refuses to run when `NODE_ENV=production`, unless an operator explicitly sets `ALLOW_DEMO_SEED=true` in a disposable test environment.

The `android` and `ios` directories document the planned native clients. They intentionally do not duplicate the web implementation yet; future clients will consume the versioned JSON authentication API and share the same PostgreSQL-backed accounts.
