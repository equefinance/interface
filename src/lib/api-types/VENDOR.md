# api-types — vendored backend types

`app.ts`, `apy.ts`, `cache.ts` are copied verbatim from the
`equefinance/backend` repo (`api/src/`), and `schema.ts` / `faucets.ts` from
its `db/src/`. `db.ts` is a local barrel standing in for `@eque/db`.

Why vendored instead of a dependency: the backend repo is private, and the
frontend only needs the **type** `AppType` (`export type AppType = typeof app`)
to build the fully-typed `hono/client`. Every import here is `import type` from
the app's side — none of this code executes in the browser.

**Re-copy rule:** when the backend adds/changes/removes a route or response
shape, re-copy these files from the backend repo and re-run typecheck. The
typed client will fail to compile if the copy drifts, which is the point.

Source commit (backend): v2 review 2026-09-30 (`eque-backend-v2.zip`).
