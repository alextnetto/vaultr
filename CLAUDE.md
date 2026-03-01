# Vaultr - Development Guidelines

## Project Overview

Vaultr is a personal data vault — a key-value store where users securely store data (links, numbers, documents) and share it via expiring unique links. Built with Next.js 14, Prisma, PostgreSQL, NextAuth, and shadcn/ui.

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: NextAuth.js (credentials provider, JWT sessions)
- **UI**: shadcn/ui + Tailwind CSS + Radix primitives
- **Encryption**: AES-256-GCM (server-side)
- **Language**: TypeScript (strict)

### Project Structure
```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── (auth)/             # Auth pages (login, register)
│   ├── (protected)/        # Authenticated pages (vault, shares)
│   ├── api/                # API route handlers
│   └── s/[id]/             # Public share view
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/                    # Shared utilities (auth, db, crypto)
prisma/
└── schema.prisma           # Database schema
```

## Development Process

### Branching & PRs
- Default branch: `main`
- Each feature is implemented as a separate PR with granular commits
- PRs can be self-merged after implementation is complete
- Commit messages: imperative mood, concise (`feat: add vault item creation`, `fix: handle expired share gracefully`)

### Test-Driven Development (TDD)
1. **Write the test first** — define the expected behavior before implementation
2. **Watch it fail** — confirm the test captures the right requirement
3. **Implement minimally** — write just enough code to pass
4. **Refactor** — clean up while keeping tests green
5. Tests live alongside source files or in `__tests__/` directories

### Clean Architecture Principles
- **Separation of concerns**: API routes handle HTTP, business logic lives in services/lib
- **Single responsibility**: each module does one thing well
- **Dependency inversion**: depend on abstractions, not concretions
- **No god components**: break UI into small, composable pieces
- **Explicit over implicit**: no magic, clear data flow

### Code Quality
- TypeScript strict mode — no `any` unless absolutely unavoidable
- Prefer named exports
- Functions over classes for React components
- Keep files under 200 lines; split if larger
- Use early returns to reduce nesting
- Descriptive variable names — no abbreviations beyond common ones (e.g., `id`, `url`, `db`)

## Commands
- `npm run dev` — Start development server
- `npm run build` — Build for production (runs `prisma generate` first)
- `npm run lint` — Lint with ESLint
- `npm test` — Run tests (once test framework is configured)

## Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `NEXTAUTH_SECRET` — NextAuth JWT secret
- `NEXTAUTH_URL` — App URL for NextAuth
- `ENCRYPTION_KEY` — AES-256 encryption key (must be changed in production)
