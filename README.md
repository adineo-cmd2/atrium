# Atrium

A shared front door for ten reasoning instruments, each built and served from
its own repository.

Atrium is not a merger. It builds each app's frontend with that app's own Astro
config, copies the result into `site/<slug>/`, and adds one portal and one small
navigation tab. Every backend, database, search index, and saved key stays
inside its own app.

## The ten rooms

| # | Room | Repository | API | Built pages |
| --- | --- | --- | --- | --- |
| 01 | Socratic Debate Partner | `socratic-debate-partner` | `8001` | 5 |
| 02 | Bias Mirror | `cognitive-bias-detector` | `8002` | 6 |
| 03 | ContraLens | `contradiction-finder` | `8003` | 6 |
| 04 | Unknown Engine | `unknown-research-engine` | `8004` | 6 |
| 05 | AI Showrunner | `ai-showrunner` | `8005` | 6 |
| 06 | Counterfactual History | `counterfactual-history` | `8006` | 6 |
| 07 | Architecture Archaeologist | `architecture-archaeologist` | `8007` | 6 |
| 08 | Code Optimizer | `code-optimizer` | `8008` | 6 |
| 09 | Policy Simulator | `policy-simulator` | `8009` | 6 |
| 10 | Premortem Engine | `premortem-engine` | `8010` | 7 |

## Build

The build expects the ten sibling app checkouts in `..` with their dependencies
installed.

```bash
npm run build
npm start
```

Open <http://localhost:4400>.

What the build does:

1. Installs each frontend's dependencies if `node_modules` is missing.
2. Runs each app's own build (`npm run build`), falling back to `astro build`
   only if the app's type-check step fails.
3. Copies only `frontend/dist/` into `site/<slug>/`.
4. Generates the portal at `/` from the app manifest.
5. Injects `/_shell/shell.js` into every app page. The tab only navigates; it
   reads no app data.
6. Runs isolation checks: no backend directories, no databases, no `.env`
   files, and no app's API port or storage key in another app's tree.

`npm run build:fast` reuses existing `frontend/dist/` folders and only
reassembles the portal.

## Data boundary

| Concern | Atrium | Each room |
| --- | --- | --- |
| URL space | `/` only | `/<slug>/` |
| Build | portal + shell | its own Astro build |
| Backend | none | its own FastAPI process on `8001`–`8010` |
| Database | none | its own SQLite file inside `backend/` |
| Search | none | its own index |
| Browser storage | none | `codebase_id` in Architecture Archaeologist only |

The portal reads only each app's name, tagline, description, route list, port,
and built page count. It never reads a database, a search index, or a saved
session.

## Running the backends

Each app's backend is unchanged. Start each one in its own directory with the
combined origin allowed:

```bash
cd ../socratic-debate-partner/backend
FRONTEND_ORIGIN=http://localhost:4400 uvicorn app.main:app --port 8001
```

Repeat for the other nine, using the ports in the table. `../start-backends.sh`
starts all ten if their Python dependencies are already installed.

Use `http://localhost:4400`, not `http://127.0.0.1:4400`: the backends are
started with `FRONTEND_ORIGIN=http://localhost:4400` so their CORS settings
accept the front door.

## Deploying

`site/` is a static tree. Serve it at the root of a domain with any static host.
The frontends will load, but each room's API still has to be deployed and
reachable at the URL in its own `frontend/src/lib/apiClient.ts` (or overridden
with that app's `PUBLIC_API_BASE` at build time). Atrium does not deploy or
proxy the backends.
