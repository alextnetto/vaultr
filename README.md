# Vaultr

**Secure personal data vault with expiring share links.**

Store any data as key-value pairs. Share selectively via unique, expiring links. Recipients can copy or download — no account needed.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript** (strict)
- **PostgreSQL** via Prisma ORM
- **NextAuth.js** (credentials, JWT sessions)
- **AES-256-GCM** encryption at rest
- **shadcn/ui** + Tailwind CSS
- **Vitest** + Testing Library

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a remote connection string)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your values
cp .env.example .env

# 3. Set up the database
npx prisma db push

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for JWT signing (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App URL, e.g. `http://localhost:3000` |
| `ENCRYPTION_KEY` | AES-256 key — exactly 64 hex characters (32 bytes) |

See `.env.example` for a template.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint with ESLint
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, Register
│   ├── (protected)/vault/  # Vault, Share, Shares
│   ├── api/                # REST API routes
│   └── s/[id]/             # Public share viewer
├── components/
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── auth.service.ts     # Auth business logic
│   ├── vault.service.ts    # Vault CRUD operations
│   ├── share.service.ts    # Share lifecycle
│   ├── file.service.ts     # Encrypted file storage
│   ├── crypto.ts           # AES-256-GCM encrypt/decrypt
│   └── db.ts               # Prisma client
└── test/                   # Test utilities
```

## License

MIT
