# OrbitX Admin Frontend

React 19 + Vite admin dashboard for the OrbitX platform.

## Stack

- React 19, TypeScript, Vite 7
- TanStack Query, Zustand, React Hook Form + Zod
- Tailwind CSS 4
- Vitest + React Testing Library + MSW (tests)

## Getting started

```bash
npm install
npm run dev    # starts the Vite dev server on http://localhost:3000
```

## Build

```bash
npm run build   # type-checks (tsc -b) then builds with Vite
npm run preview # preview the production build locally
```

## Tests

```bash
# run the full suite once
npm test

# watch mode while developing
npm run test:watch

# coverage (writes HTML report to coverage/index.html)
npm run test:cov
```

Stack:

- **Vitest** with the `jsdom` environment and globals (`describe`, `it`, `expect`, `vi`).
- **@testing-library/react** + **@testing-library/jest-dom** for component tests.
- **@testing-library/user-event** for realistic user interactions.
- **MSW** for HTTP mocking in service tests — import `setupServer` from `msw/node` and intercept requests issued by `apiClient` so tests never hit the real backend.

Global setup lives in [src/test/setup.ts](src/test/setup.ts) (registers `jest-dom` matchers + RTL cleanup). Config is in [vitest.config.ts](vitest.config.ts).

**DoD policy (B0):** every feature PR that adds or changes a service/component must include unit tests covering the change. The PR template's "Tests added" checkbox is required.

## Lint

```bash
npm run lint
```
