# AGENTS.md — orbitx-admin-frontend

This is one of three independent repos that make up **OrbitX**, a Naira-denominated (Nigeria) dispatch/delivery platform. The other two (`orbitx-backend/` and `OrbitMobile/`) live side-by-side under the parent `orbit/` workspace directory.

## Read this before writing code

The canonical project context lives at: **[../_bmad-output/project-context.md](../_bmad-output/project-context.md)**

It contains 289 critical rules across 7 categories — technology stack & version pins, language-specific rules, framework conventions, testing discipline, code quality, workflow rules, and don't-miss anti-patterns. **Read it before implementing any change** in this repo.

## Repo-specific quick reference

- **Stack**: React 19.2 + Vite 7.3 + TypeScript `~5.9.3` (full `strict`, `verbatimModuleSyntax`). TanStack Query 5 for server state, Zustand 5 for client state. Tailwind 4 (CSS-first via `@theme` in `src/index.css`). Zod 4 + react-hook-form. react-router-dom 7.
- **Working branch**: `development` (PRs into `development`; merge to `main` triggers deploy).
- **Lint/build**: `npm run lint`, `npm run build`. **No test runner is installed yet** — see the "Testing Rules" section of the linked context before adding one.
- **API client**: `src/services/api/client.ts` — single axios instance. **Response interceptor silently unwraps `response.data.data`**, so callers see the inner payload, not the backend envelope.
- **Path alias**: `@/* → src/*`.
- **Dev port**: 3000 (collides with backend API — override if running both).

## Cross-repo coordination

The backend serializes some fields as `snake_case` (e.g., `first_name`, `last_name`) while this repo expects `camelCase` (`name`). Mapping happens client-side today. Do not rename either side without coordinating with the backend repo.

## If the linked context file is missing

If `../_bmad-output/project-context.md` is unreachable (e.g., this repo was cloned standalone), ask the user for the file or regenerate it via the BMad `bmad-generate-project-context` skill from the parent workspace.
