# Vaultr — Product Requirements Document

## Vision

Vaultr is a personal data vault. Store anything, share selectively, with expiring links. Dead simple.

## Problem

People repeatedly fill out the same information across forms, apps, and services. They store sensitive data in notes, spreadsheets, or messages — scattered, insecure, and hard to share safely. When they need to share data (e.g., bank details with an accountant), they use unencrypted channels with no expiry or revocation.

## Solution

A secure key-value store with one-click sharing via expiring links.

---

## Core Features

### F1: Authentication
**Goal**: Get users in fast.

| Requirement | Details |
|---|---|
| Sign up | Email + password |
| Sign in | Email + password |
| Session | JWT-based via NextAuth |
| Password | Hashed with bcrypt |

**Acceptance Criteria**:
- User can register with email/password
- User can log in and is redirected to vault
- Invalid credentials show clear error
- Session persists across page refreshes

---

### F2: Vault (Key-Value Store)
**Goal**: Store any piece of data as a labeled key-value pair.

| Requirement | Details |
|---|---|
| Create item | Label (key) + value, with type hint |
| Value types | Text, URL/link, number, document (file upload) |
| Read items | List all items, grouped or flat |
| Update item | Inline edit of label or value |
| Delete item | Single-click with confirmation |
| Encryption | All values encrypted at rest (AES-256-GCM) |

**Data Model**:
```
VaultItem {
  id: string (cuid)
  userId: string (FK)
  label: string          # the key
  value: string          # encrypted
  type: enum(text, url, number, document)
  createdAt: DateTime
  updatedAt: DateTime
}
```

**Acceptance Criteria**:
- User can create items with label + value
- Items display in a clean list
- User can edit any item inline
- User can delete items with confirmation
- All values are encrypted server-side before storage
- Empty state guides user to create first item

---

### F3: Sharing
**Goal**: Share selected vault items via a unique, expiring link.

| Requirement | Details |
|---|---|
| Select items | Toggle which items to include in a share |
| Set expiry | 1 hour, 24 hours, 7 days, 30 days |
| Generate link | Unique URL (e.g., `/s/abc123`) |
| Password protect | Optional password on share |
| Revoke | Owner can revoke a share anytime |
| View shares | List of active/expired shares |

**Data Model**:
```
Share {
  id: string (cuid)
  userId: string (FK)
  itemIds: string[]       # references to VaultItems
  expiresAt: DateTime
  password: string?       # hashed, optional
  revoked: boolean
  viewCount: int
  createdAt: DateTime
}
```

**Acceptance Criteria**:
- User can select 1+ items and generate a share link
- Link has configurable expiry
- Optional password protection
- Share link can be copied with one click
- Owner sees list of all shares with status (active/expired/revoked)
- Owner can revoke any active share

---

### F4: Share Viewer (Recipient Experience)
**Goal**: Recipients can view, copy, and download shared data effortlessly.

| Requirement | Details |
|---|---|
| View | Clean, read-only view of shared items |
| Copy | One-click copy for each value |
| Download | Download as text/JSON for bulk data |
| Expiry indicator | Countdown or "expires in X" |
| Expired state | Clear message when link is expired |
| Password gate | Password prompt if share is protected |
| No auth required | Recipients don't need an account |

**Acceptance Criteria**:
- Recipient opens link, sees data immediately (or password prompt)
- Each value has a copy button
- Bulk download option available
- Countdown shows remaining time
- Expired links show clear "expired" state
- Mobile-friendly layout

---

## Feature Roadmap (PR Sequence)

Each feature below maps to one PR with granular commits.

### Phase 1: Foundation
1. **PR: Project setup & testing infrastructure** — Vitest, testing utilities, CI-ready
2. **PR: Auth hardening** — Clean up auth flow, add proper types, error handling
3. **PR: Vault data model refactor** — Simplify to generic key-value (remove categories), add type field

### Phase 2: Core UX
4. **PR: Vault CRUD** — New vault UI with inline editing, empty states, type-aware rendering
5. **PR: Share creation flow** — Item selection, expiry picker, link generation, copy UX
6. **PR: Share viewer** — Recipient page with copy buttons, download, countdown, mobile layout

### Phase 3: Polish
7. **PR: Share management** — List shares, revoke, view counts
8. **PR: Document/file support** — File upload as vault item type
9. **PR: UX polish** — Loading states, toasts, animations, responsive refinements

---

## Non-Functional Requirements

| Aspect | Requirement |
|---|---|
| Performance | Pages load in < 1s, no layout shifts |
| Security | All values encrypted at rest, passwords hashed, no secrets in client |
| Accessibility | WCAG 2.1 AA — keyboard nav, screen reader support via Radix |
| Mobile | Fully responsive, touch-friendly |
| Browser support | Latest Chrome, Firefox, Safari, Edge |

---

## Out of Scope (v1)

- OAuth / social login
- Team/org vaults
- End-to-end encryption (client-side)
- Audit logs
- API keys / programmatic access
- Custom domains for share links
