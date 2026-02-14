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

## Roadmap

### Near-term
- [ ] Custom domains per user
- [ ] OAuth login (Google, GitHub)
- [ ] File/document uploads in vault
- [ ] Share templates ("Send me your address" → requester fills a form)
- [ ] Notification when share is viewed
- [ ] Bulk share (multiple recipients, individual links)

### SOC 2 Compliance Path

**Security**
- [ ] Multi-factor authentication (TOTP/WebAuthn)
- [ ] Rate limiting + brute force protection
- [ ] CORS, CSP, and security headers
- [ ] Vulnerability scanning (automated, CI/CD)
- [ ] Penetration testing (third-party)
- [ ] Incident response plan (documented)
- [ ] Key management service (AWS KMS / HashiCorp Vault) — no hardcoded keys
- [ ] Session management + forced logout

**Availability**
- [ ] Uptime monitoring + alerting
- [ ] Multi-region deployment
- [ ] Database backups with tested restores
- [ ] Disaster recovery plan (documented)

**Processing Integrity**
- [ ] Full audit log — every access, share, revoke with timestamps, IPs
- [ ] Data validation + integrity checks
- [ ] Error handling that never leaks sensitive data

**Confidentiality**
- [ ] Data classification (PII tagging)
- [ ] Auto-purge expired data (hard delete, not soft)
- [ ] Encryption key rotation
- [ ] Access restricted to minimum necessary (principle of least privilege)

**Privacy**
- [ ] Privacy policy + terms of service
- [ ] Consent management
- [ ] Right to delete (full account + data wipe)
- [ ] Data processing agreements (DPA)
- [ ] GDPR / LGPD compliance

### Infrastructure
- [ ] Migrate from SQLite to PostgreSQL
- [ ] Migrate file storage to S3 (encrypted buckets)
- [ ] CI/CD pipeline with security scanning
- [ ] Staging environment
- [ ] Log aggregation + SIEM

## License

MIT
