# Vaultr UX Guidelines

> Store once. Share selectively. Expire automatically.

This document defines the UX principles, user flows, component usage, interaction patterns, and information architecture for Vaultr. Every decision should bias toward fewer screens, fewer clicks, and fewer decisions for the user.

---

## 1. Design Principles

### 1.1 One Screen, One Job

Every screen does exactly one thing. The vault shows your data. The share screen creates a link. There are no multi-purpose dashboards, no settings sprawl, no feature menus. If a screen tries to do two things, split it or cut one.

### 1.2 Defaults Over Decisions

The user should never stare at a form wondering what to pick. Every field ships with a smart default:
- Expiry defaults to **24 hours** (the most common use case).
- Category defaults to the **last-used category**.
- New items focus the value field immediately -- the label can be inferred or typed second.

The goal: a user can create an item and share it in under 10 seconds without changing a single default.

### 1.3 Trust Through Transparency

Users are handing Vaultr their most sensitive data. Every screen must quietly reinforce that their data is safe:
- Show the "AES-256-GCM encrypted" indicator on the vault page -- but keep it subtle (muted text, small lock icon). Do not make it a banner.
- Show a live countdown on shared links so users see exactly when data disappears.
- Show view counts on shares so users know who accessed what.

Never hide security information, but never shout it either. Confidence, not anxiety.

### 1.4 Instant Feedback, Zero Ambiguity

Every action must produce visible, immediate feedback:
- Saving a field: inline spinner, then the saved value appears.
- Copying a link: button text changes to "Copied!" with a checkmark for 2 seconds.
- Deleting an item: the row disappears with a fade-out; a toast confirms with an undo option.
- Errors: inline red text below the relevant field, never a generic alert.

The user should never wonder "did that work?"

### 1.5 Mobile-Native, Desktop-Ready

Design for a phone held in one hand first. Then let it breathe on desktop. This means:
- Touch targets are 44px minimum.
- Primary actions live at the bottom of the screen or within thumb reach.
- Cards stack vertically; nothing sits side-by-side below 640px.
- The header collapses icon labels on mobile (icon-only buttons).

---

## 2. User Flows

### 2.1 Onboarding / First Use

```
Landing Page (/)
  |
  v
[Get Started] button --> Register Page (/register)
  |                        - Email field
  |                        - Password field
  |                        - Confirm password field
  |                        - "Create Vault" button
  |
  v
Auto-sign-in --> Vault Page (/vault)
  |
  v
Empty State:
  - Centered illustration or icon (Shield)
  - Headline: "Your vault is empty"
  - Subtitle: "Add your first piece of data to get started"
  - Single prominent [+ Add Field] button
  - NO tutorial carousel, NO onboarding wizard, NO tooltip tour
```

**Key rules:**
- Registration auto-signs the user in and redirects to `/vault`. No extra "check your email" step (credentials auth, not email verification).
- The empty vault state IS the onboarding. One button. One action. The product teaches itself through use.
- The login page links to register; the register page links to login. One line of text, one link. Nothing more.

### 2.2 Adding a Vault Item

```
Vault Page (/vault)
  |
  [+ Add Field] button (top-right, always visible)
  |
  v
Dialog opens (not a new page):
  1. Category select (pre-filled with last used or "Identity")
  2. Label input (placeholder shows contextual example: "Full Name", "Passport Number")
  3. Value input (placeholder shows contextual example: "John Doe", "AB1234567")
  4. [Add Field] primary button / [Cancel] ghost button
  |
  v
Dialog closes. New field appears in its category card with a slide-up animation.
Toast: "Field added" (subtle, bottom-right, auto-dismiss 3s).
```

**Key rules:**
- The dialog has exactly 3 fields. No description field, no tags, no "type" selector for text vs number vs URL. The value is always a string. Simplicity over taxonomy.
- When the user picks a category, the label placeholder updates to show common examples for that category (e.g., picking "Documents" shows "Passport Number" as the placeholder). This guides without constraining.
- Pressing Enter in the value field submits the form. No need to reach for the button.
- The dialog should trap focus and be fully keyboard-navigable.

### 2.3 Sharing Items (Generating a Link)

```
Vault Page (/vault)
  |
  [Share] button (header)
  |
  v
Create Share Page (/vault/share)
  |
  Step 1: Select fields
    - Each category is a card
    - Each field has a toggle switch (on/off)
    - "Select all" toggle per category
    - Selected count shown in sticky bottom bar
  |
  Step 2: Configure (same page, below field selection)
    - Expiry dropdown: 1h / 24h (default) / 7d / 30d
    - Password field (optional, collapsed by default)
  |
  Step 3: Generate
    - Sticky bottom bar shows: "[N] fields selected | Expires in [X]"
    - [Generate Link] primary button
  |
  v
Success state (same page, replaces form):
  - Green card: "Share Link Created!"
  - Read-only input with the full URL
  - [Copy] button (one-click, changes to "Copied!" with checkmark)
  - [Create Another] secondary button
  - [View All Shares] ghost button
```

**Key rules:**
- This is ONE page, not a multi-step wizard. The user scrolls down naturally: select fields, pick expiry, generate. No "Next" buttons.
- The sticky bottom bar is critical for mobile. It anchors the user's progress ("3 fields selected") and keeps the generate action always reachable.
- After generating, the share URL auto-selects on focus so the user can Cmd+C immediately.
- Password protection is optional and visually de-emphasized. Most shares will not use it.

### 2.4 Recipient Viewing a Shared Link

```
Share URL (/s/[id])
  |
  +--> If password-protected:
  |      Password entry screen
  |        - Centered card
  |        - Lock icon
  |        - "This share requires a password"
  |        - Password input (autofocused)
  |        - [View Data] button
  |        - Wrong password: inline error, field shakes
  |
  +--> If expired/revoked:
  |      Expired screen
  |        - Warning icon
  |        - "This share has expired"
  |        - [Create Your Own Vault] CTA (subtle acquisition)
  |
  +--> If valid:
         Shared data view
           - "Shared via Vaultr" pill at top
           - Live countdown timer: "Expires in 23h 14m 52s"
           - Fields grouped by category in cards (read-only)
           - Each field value is selectable text (easy copy)
           - Footer: "Shared securely via Vaultr" + [Create Your Own Vault] CTA
```

**Key rules:**
- This page has NO header navigation, NO sign-in links in the header. It is a clean, focused data view. The Vaultr branding is minimal -- a small pill at the top and a soft footer CTA.
- The countdown timer ticks in real-time (every second). This creates urgency and reinforces the ephemeral nature of the share.
- Field values must be easily selectable and copyable by the recipient. Consider adding a small copy icon on hover/tap for each value.
- The page works without JavaScript for the initial render (server-side render the field data). The countdown timer hydrates client-side.
- On mobile, the cards should fill the screen width with comfortable padding (16px sides).

---

## 3. Component Guidelines

All components use **shadcn/ui** (Radix primitives + Tailwind CSS). Below are specific usage rules for Vaultr's key UI patterns.

### 3.1 Dead-Simple Item Creation

**Component:** `Dialog` (Radix Dialog via shadcn)

```
Dialog
  DialogContent
    DialogHeader
      DialogTitle        --> "Add Vault Field"
      DialogDescription  --> "Add a new piece of personal data to your vault."
    div.space-y-4
      Select             --> Category (pre-filled, 4 options + custom)
      Input              --> Label (dynamic placeholder based on category)
      Input              --> Value (dynamic placeholder based on category)
    DialogFooter
      Button variant="outline"  --> Cancel
      Button variant="default"  --> Add Field (disabled until label+value filled)
```

**Rules:**
- Max 3 form fields. If you are tempted to add a fourth, stop and reconsider.
- The dialog is max-width 425px (`sm:max-w-[425px]`). It should feel compact.
- Disable the submit button until both label and value have content. Show no validation errors until the user tries to submit with empty fields.
- Use `autoFocus` on the label input when the dialog opens.
- When a category is pre-selected from an empty-state "Add some" link, auto-focus the value input instead (since label may also be pre-filled).

### 3.2 One-Click Copy/Share UX

**Component:** `Button` + `Input` (read-only) composition

```
div.flex.items-center.gap-2
  Input value={shareLink} readOnly className="font-mono text-sm"
  Button variant="outline" onClick={copyToClipboard}
    {copied ? <Check /> : <Copy />}
    {copied ? "Copied!" : "Copy"}
```

**Rules:**
- The copy button changes state for exactly 2 seconds, then reverts. Use `setTimeout`.
- The input is `readOnly`, styled with `font-mono` for URL legibility.
- On the shares list page, use an icon-only button (`size="icon"`) for copy to save space.
- Use `navigator.clipboard.writeText()`. If the clipboard API is unavailable (rare), fall back to selecting the input text.
- Consider adding a toast as a secondary confirmation: "Link copied to clipboard" (auto-dismiss 2s).

### 3.3 Clear Expiry Indicators

**Components:** `Badge` + live countdown text

| State   | Badge Variant    | Icon            | Text Example        |
|---------|------------------|-----------------|---------------------|
| Active  | `success`        | `CheckCircle2`  | "Active"            |
| Expired | `secondary`      | `Clock`         | "Expired"           |
| Revoked | `destructive`    | `XCircle`       | "Revoked"           |

**Countdown format:**
- More than 1 day: `3d 12h left`
- Less than 1 day: `5h 23m left`
- Less than 1 hour: `14m 32s left` (update every second)
- On the recipient view: always show seconds for urgency

**Rules:**
- On the shares list (`/vault/shares`), expired and revoked shares render at 60% opacity. They are visually de-emphasized but not hidden -- users need to see their history.
- The countdown on the public share page (`/s/[id]`) uses a `setInterval` at 1-second resolution. When it hits zero, the page transitions to the expired state without a reload.
- Color coding: active shares use a subtle green tint on the card border (`border-emerald-500/30`). Expired shares use default muted styling.

### 3.4 Mobile-First Responsive Layout

**Layout structure:**

```
div.min-h-screen.bg-gradient-to-b.from-background.to-muted/20
  header.border-b.bg-background/95.backdrop-blur.sticky.top-0.z-50
    div.container.max-w-4xl   --> constrained width, centered
  main.container.max-w-4xl.py-8.space-y-6
    Cards stack vertically
```

**Breakpoint rules:**
- `max-w-4xl` (896px) for all authenticated pages. Content never stretches wider.
- `max-w-2xl` (672px) for the public share view. Narrower = more focused reading.
- `max-w-md` (448px) for auth forms (login/register). Centered, compact.
- Below `sm` (640px): hide text labels on header buttons, show icons only. Use the `hidden sm:inline` pattern.
- Cards use `px-4` padding on mobile, growing to `px-6` on `sm:` and above.

**Header responsive behavior:**
```
Desktop (>=640px):  [Logo]  ................  [Share] [Shares] [Theme] [Logout]
Mobile  (<640px):   [Logo]  ................  [icon]  [icon]   [icon]  [icon]
```

All header action buttons use `size="sm"` on desktop and `size="icon"` on mobile via the `hidden sm:inline` class on text spans.

---

## 4. Interaction Patterns

### 4.1 Toast Notifications

**Component:** `@radix-ui/react-toast` (already in dependencies)

| Action                | Toast Message              | Duration | Type    |
|-----------------------|----------------------------|----------|---------|
| Field added           | "Field added"              | 3s       | success |
| Field updated         | "Changes saved"            | 3s       | success |
| Field deleted         | "Field deleted" + [Undo]   | 5s       | neutral |
| Link copied           | "Link copied to clipboard" | 2s       | success |
| Share created         | (no toast -- inline state) | --       | --      |
| Share revoked         | "Share revoked"            | 3s       | success |
| Error (any)           | Specific error message     | 5s       | error   |
| Network failure       | "Connection lost. Retry?"  | sticky   | error   |

**Rules:**
- Toasts appear in the **bottom-right** on desktop, **bottom-center** on mobile.
- Maximum 1 toast visible at a time. New toasts replace old ones.
- Success toasts auto-dismiss. Error toasts persist until dismissed or until the user retries.
- Delete operations show an **Undo** action in the toast. Undo has a 5-second window. After 5 seconds, the deletion is final and the toast disappears.
- Never use toasts for confirmations that require a decision. Use a `Dialog` for destructive confirmations.

### 4.2 Inline Editing vs. Modals

**Rule: Inline for editing, Dialog for creating.**

- **Editing a vault field value:** Inline. Click the pencil icon, the value turns into an `Input`, Save/Cancel buttons appear. No dialog, no page navigation. The edit happens in-place within the category card.
- **Creating a new vault field:** Dialog. The `Dialog` component captures category + label + value. This is the only time a modal is used for vault data.
- **Deleting a vault field:** Inline with toast confirmation. Click the trash icon, the field disappears immediately, a toast with Undo appears. No "Are you sure?" dialog -- that adds friction to a low-risk action (the data can be re-added).
- **Revoking a share:** Inline. Click the revoke icon, the share badge changes to "Revoked", opacity drops. A toast confirms. No confirmation dialog -- revocation is reversible by creating a new share.

**Why this split:** Editing is a quick, focused action on a single value. The user's eyes are already on the field. Pulling them into a dialog would be disorienting. Creation requires multiple inputs (category, label, value), which justifies a dedicated container.

### 4.3 Empty States

Every list/collection in the app must have a designed empty state. No blank white screens.

| Screen              | Empty State                                                      |
|---------------------|------------------------------------------------------------------|
| Vault (no fields)   | Shield icon (48px) + "Your vault is empty" + "Add your first piece of data" + [+ Add Field] button |
| Share creation (no fields in vault) | "No fields in your vault yet" + [Add Fields First] button (links to /vault) |
| Shares list (no shares) | Share2 icon (48px) + "No shares yet" + [Create Your First Share] button |
| Category card (no fields in category) | "No [category] data yet. [Add some]" (inline text link) |

**Rules:**
- Empty states use a **large muted icon** (48px), a **headline**, a **one-line subtitle**, and a **single action button**.
- The action button is always a primary button with a clear verb: "Add Field", "Create Share", not "Get Started" or "Learn More".
- Empty states never show error styling. They are invitations, not warnings.
- Category-level empty states (inside a card) are compact: just a line of muted text with an inline "Add some" link that opens the add dialog with the category pre-selected.

### 4.4 Loading States

| Scope              | Pattern                                                       |
|---------------------|---------------------------------------------------------------|
| Full page load      | Centered: pulsing Shield icon + "Loading your vault..."      |
| Button action       | Button text changes: "Add Field" --> "Saving..." (disabled)   |
| Inline save         | Small spinner next to the Save icon (or replace the icon)     |
| Share generation    | Button text: "Generate Link" --> "Generating..." (disabled)   |

**Rules:**
- Full-page loading states use `animate-pulse` on the Shield icon and descriptive text. They are centered vertically and horizontally.
- Button loading states disable the button and change the label to a gerund ("Saving...", "Generating..."). Never show a separate spinner overlay.
- Skeleton screens are NOT used. The data set is small enough (typically under 20 fields) that a simple pulse animation is sufficient and less visually noisy.
- Loading states last at most 2-3 seconds in normal conditions. If an operation takes longer than 5 seconds, show a secondary message: "This is taking longer than usual..."

---

## 5. Information Architecture

### 5.1 Screen Inventory

Vaultr has exactly **6 screens**. No more.

| #  | Route              | Purpose                        | Auth Required |
|----|--------------------|---------------------------------|---------------|
| 1  | `/`                | Landing page / marketing        | No            |
| 2  | `/register`        | Create account                  | No            |
| 3  | `/login`           | Sign in                         | No            |
| 4  | `/vault`           | View & manage vault fields      | Yes           |
| 5  | `/vault/share`     | Create a share link             | Yes           |
| 6  | `/vault/shares`    | View & manage active shares     | Yes           |

Plus one **public route**:

| Route              | Purpose                                   | Auth Required |
|--------------------|-------------------------------------------|---------------|
| `/s/[id]`          | Recipient views shared data               | No            |

**There is no settings page.** Theme toggle is in the header. Account management (password change, delete account) can be added as a simple dialog triggered from the header, never as a dedicated screen.

**There is no search page.** With a max of ~50 vault fields, the categorized card layout IS the search. If the vault grows beyond this, add a filter input at the top of `/vault`, not a separate screen.

### 5.2 Navigation Structure

**Authenticated Navigation (header bar):**

```
[Shield Logo + "Vaultr"]     [Share]  [Shares]  [Theme Toggle]  [Logout]
```

- **Logo:** Links to `/vault` (not `/`). For authenticated users, the vault IS home.
- **Share:** Links to `/vault/share`. Outlined button with Share2 icon. This is the primary action.
- **Shares:** Links to `/vault/shares`. Ghost button with ListChecks icon. Secondary.
- **Theme Toggle:** Sun/Moon icon button. Ghost variant.
- **Logout:** LogOut icon button. Ghost variant. No confirmation dialog -- just sign out and redirect to `/`.

**Unauthenticated Navigation (landing + auth pages):**

```
[Shield Logo + "Vaultr"]     [Theme Toggle]  [Sign In]  [Get Started]
```

- **Sign In:** Ghost button linking to `/login`.
- **Get Started:** Primary button linking to `/register`.

**Back Navigation:**
- `/vault/share` and `/vault/shares` show a back arrow (`ArrowLeft` icon button) that links to `/vault`.
- The browser back button should always work correctly. No history manipulation.

### 5.3 URL Design

URLs are short, human-readable, and memorable:

| URL Pattern          | Notes                                        |
|----------------------|----------------------------------------------|
| `/vault`             | Not `/dashboard`, not `/home`, not `/app`    |
| `/vault/share`       | Verb: creating a share                       |
| `/vault/shares`      | Noun: list of shares                         |
| `/s/[id]`            | Short for shareability. IDs are cuid-length. |
| `/login`             | Not `/auth/login`, not `/signin`             |
| `/register`          | Not `/auth/register`, not `/signup`          |

### 5.4 What NOT to Build

The following features are explicitly out of scope. They would add complexity without proportional value:

- **Folders or nested organization.** Categories are flat. Four predefined + custom is enough.
- **Tags or search.** The vault is small by design. Scroll and scan.
- **Bulk import/export.** This is not a database tool. Items are entered one at a time.
- **Activity log / audit trail.** View counts on shares are sufficient.
- **Team features or multi-user vaults.** Vaultr is personal. One user, one vault.
- **Notifications or reminders.** No emails, no push notifications, no "your share is about to expire" alerts.
- **A settings page.** Theme is a toggle. Everything else is per-action (expiry, password).

---

## 6. Visual Language Summary

| Element           | Specification                                              |
|-------------------|------------------------------------------------------------|
| Font              | Inter (already configured)                                 |
| Max content width | 896px (`max-w-4xl`) for app, 672px (`max-w-2xl`) for share view |
| Border radius     | 0.5rem (`--radius`) -- rounded but not bubbly              |
| Card style        | `bg-card` with subtle border, no drop shadow by default    |
| Background        | Gradient: `from-background to-muted/20` -- barely visible  |
| Header            | Sticky, blurred backdrop (`backdrop-blur`), border-bottom  |
| Animations        | `fade-in` (0.5s) for page entry, `slide-up` (0.6s, staggered 80ms) for cards |
| Dark mode         | Full support via CSS variables. Default theme: dark.       |
| Iconography       | Lucide React. 16px (`h-4 w-4`) for inline, 20px (`h-5 w-5`) for card headers, 48px for empty states |
| Spacing rhythm    | `space-y-6` between major sections, `space-y-4` within cards, `space-y-2` between form fields |

---

## 7. Accessibility Checklist

- All interactive elements must be keyboard-navigable (tab order, Enter/Space activation).
- Dialogs trap focus and return focus to the trigger on close (Radix handles this by default).
- Form inputs have associated `<Label>` elements (use `htmlFor`).
- Color is never the sole indicator of state (badges include icons alongside color).
- Contrast ratios meet WCAG 2.1 AA (4.5:1 for text, 3:1 for large text).
- Touch targets are minimum 44x44px on mobile.
- The app is fully usable without JavaScript for the initial share view render (progressive enhancement).
- Screen reader announcements for toast notifications via `aria-live="polite"`.

---

*This document is the source of truth for Vaultr's user experience. When in doubt, choose the simpler option. When torn between two features, ship neither until the simpler one is obvious.*
