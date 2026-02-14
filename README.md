# 🔐 Vaultr

**Secure personal data sharing with expiring links.**

Share sensitive information — IDs, passport numbers, addresses — through encrypted, self-destructing links. Data is encrypted end-to-end: the decryption key lives in the URL fragment and never touches the server.

## Features

- 🔒 **End-to-end encryption** — AES-256-GCM, key stays in URL fragment
- ⏰ **Expiring links** — 1 hour to 30 days, data auto-deleted
- 🔑 **Password protection** — Optional extra security layer
- 📎 **File attachments** — Upload and share documents
- 🌗 **Dark/light mode** — Clean, minimal shadcn/ui design
- 📱 **Mobile responsive** — Works beautifully on any device

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **SQLite** (via better-sqlite3)
- **Node.js crypto** (AES-256-GCM)

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

1. User fills in fields (name, ID, etc.) or uploads files
2. Data is encrypted with a random AES-256-GCM key
3. Encrypted blob is stored in SQLite; key goes in URL fragment (`#`)
4. Recipient opens link → key is read client-side → data decrypted in browser
5. Link expires → data permanently deleted

The encryption key in the URL fragment (`#key`) is **never sent to the server** per the HTTP spec. This means even if the database is compromised, the data remains encrypted.

## Architecture

```
/src
├── app/
│   ├── page.tsx              # Create share form
│   ├── s/[id]/page.tsx       # View shared data
│   └── api/
│       ├── shares/route.ts   # POST: create share
│       ├── shares/[id]/route.ts  # POST: retrieve & decrypt
│       └── files/[id]/route.ts   # GET: download file
├── components/
│   └── ui/                   # shadcn components
└── lib/
    ├── db.ts                 # SQLite setup
    └── crypto.ts             # Encryption utilities
```

## Security Notes

This is a **proof of concept**. For production use, consider:

- Rate limiting on API endpoints
- CSRF protection
- Content Security Policy headers
- Database encryption at rest
- Secure file storage (S3, etc.)
- Audit logging
- Maximum share size limits

## License

MIT
