# Corrected project — fixes and verification

Prepared 30 October 2026 from the supplied DBMS-mini-project-main.zip. The original archive was not modified.

## Fixes

- Tracking-event status checks and inserts now share a transaction and shipment row lock. Concurrent requests cannot overwrite a delivered/cancelled status with another event through the API.
- Referenced route endpoints are immutable. Route booking and route editing lock the route consistently; distance/time updates remain supported.
- Booking uses the warehouse's location directly for the initial event, respecting the 120-character SQL column.
- Customer management has pagination. Booking has customer search and pagination, retaining the chosen customer across result pages.
- Weight precision/range, dimension length/positive values, real ISO dates, route decimal limits, warehouse capacity and duplicate driver associations are validated.
- API pagination and IDs reject malformed values. Malformed JSON and database value-limit failures return 400, and internal failures do not expose SQL/server error messages.
- Migrations and reset use the configured database name with escaped identifiers. Repeating migration succeeds. Empty MySQL passwords are honored when explicitly configured.
- GET failures throw into an error screen with a working retry button, instead of being shown as missing data. Public tracking requests are cancelled when navigating away.
- Driver availability excludes drivers assigned to active shipments; the dashboard label matches the calculation.
- All mutations invalidate related app caches. Assignment supports unassigning and resets the edit fields after a successful save.
- Dates use UTC database sessions; calendar DATE strings display without timezone shifts. Seed data uses the current date, with an optional reproducible reference date.
- MongoDB connection/socket waits are bounded to 1.5 seconds; activity logging remains best effort and nonfatal to main requests.
- Administrator access is required for management pages and private APIs. Credentials are configured through environment variables; public tracking remains open. Browser cross-site writes are rejected. Public admin links use full navigation to avoid triggering a background login challenge through prefetch.
- The theme toggle waits for client theme state before changing its icon, fixing the original server/client hydration mismatch.
- Lint command corrected; explicit-any violations, React keys, and unused variables cleaned up without disabling lint rules.
- Shared API types and a checked client API helper added. Type checking generates Next route types first, so it works from a fresh extraction.
- Docker database ports bind to localhost. README and environment template updated with sign-in and test instructions.

## Checks completed

| Check | Result |
| --- | --- |
| Dependency installation | Passed; original dependency audit reported zero known vulnerabilities |
| `npm run lint` | Passed, zero errors and warnings |
| `npm run typecheck` | Passed |
| `npm run build` | Passed, production build |
| Unit + opt-in database suite | 14 tests passed; zero failed/skipped when database tests enabled |
| Migration twice on custom database | Passed |
| Full database reset and seed | Passed: 40 shipments, 100 packages, 169 tracking events, 30 Mongo activity logs |
| API smoke checks | Auth protection, public tracking, all resource GETs, malformed IDs/filters/JSON and FK-restricted deletion passed |
| Headless Chrome page checks | Dashboard, all management pages, customer/shipment detail and both tracking pages passed |
| Browser workflows | Customer creation, shipment booking, delivery update and public tracking passed |
| Browser error handling | Simulated API 500 showed error screen; retry recovered after service restoration |
| Theme and mobile navigation | Passed, no unexpected page JavaScript errors |

Database regressions exercise real SQL: concurrent terminal events, transaction rollback, maintenance assignment rejection, route edit rejection, long locations, available drivers, and pagination/search with 105 customers. Six unit regressions cover validation, authorization, API error propagation and query parsing. The 14-test total includes the database parent test and its seven subtests.

Verification environment: Node.js 24.19.0, MySQL Community Server 26.7.0, MongoDB 8.2.6, and headless Google Chrome on macOS. Tests used isolated local services; no existing user database was reset. The supplied Docker configurations for MySQL 8.0 / MongoDB 7.0 were retained but those exact container versions were not run in this environment.

## Getting started

1. Extract the ZIP and open the `DBMS-mini-project-fixed` directory.
2. Run `npm ci`.
3. Copy `.env.example` to `.env.local`, configure database connections, and set your own `ADMIN_USERNAME` / `ADMIN_PASSWORD` (minimum 12 characters).
4. Start MySQL and MongoDB. Run `npm run db:migrate`, then `npm run db:seed` only if you want to replace data with the demo dataset.
5. Run `npm run dev`. The dashboard prompts for the configured administrator credentials.

Read README.md for full setup and test commands. Dependencies, generated build output, local credentials, and test databases are deliberately excluded from this archive.

The checks establish that the tested workflows work; they do not guarantee that software is free of every possible bug. This remains a classroom mini-project with one administrator credential, best-effort logging, and no production load or penetration testing. Use HTTPS for a hosted administrator login.
