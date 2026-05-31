# CLAUDE.md — Wedding Website (Perez–Domingo Nuptials)

## Purpose

Personal wedding website for the Perez–Domingo nuptials on June 13, 2026. A minimalist, static, single-page site that serves as the digital companion to the physical invitation — same aesthetic, same content. Guests visit on mobile to get event details, view the prenup gallery, check dress code, see the entourage, and RSVP via Google Forms.

- **Client:** Personal (Rodolfo Perez III)
- **Primary users:** Wedding guests (~150), mobile-first, non-technical
- **Core goal:** Static site deployed on AWS Amplify — zero backend, zero auth, fully public

---

## Stack

| Layer | Technology | Version / Notes |
|-------|-----------|-----------------|
| Frontend | Next.js | v14, App Router, `output: 'export'` (static) |
| Styling | Tailwind CSS | v3, mobile-first |
| Hosting | AWS Amplify | Static site deploy |
| Language | TypeScript | Strict mode |
| Package manager | npm | |
| RSVP | Native form → Google Sheet (Apps Script append, per ADR-0003); Google Form as fallback | No Next.js backend — writes via a public Apps Script `/exec` web app |

---

## Structure

```
wedding-website/
  src/
    app/
      page.tsx              # Single-page layout — all sections rendered here
      layout.tsx            # Root layout, font imports, metadata
      globals.css           # Global styles, Tailwind base
    components/
      Navbar.tsx            # Sticky nav with anchor links
      Hero.tsx              # Full-screen landing, video (or photo fallback) + names
      Gallery.tsx           # Prenup photo grid with lightbox
      EventDetails.tsx      # Ceremony + reception cards with Google Maps links
      DressCode.tsx         # Dress code per guest type, adults-only note
      Entourage.tsx         # Principal sponsors + wedding party
      Gifts.tsx             # Monetary gift message
      RSVP.tsx              # Native RSVP form → RSVP Sheet; falls back to Google Form link if write endpoint unset; closes after deadline
    lib/
      constants.ts          # ALL wedding content — single source of truth
  public/
    photos/                 # Prenup photos (downloaded from Pixieset)
    video/                  # Save-the-date video — add when available
    invitation/             # Invitation images (design reference)
  .env.example
  next.config.js            # output: 'export'
```

---

## Design System

Match the invitation images in `public/invitation/` exactly.

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FEF0EC` | Page background |
| Primary accent | `#8B4A3A` | Text, icons, borders |
| Secondary bg | `#C49A8A` | Card backgrounds (dress code, entourage) |
| Script font | Pinyon Script | Names, section headings |
| Body font | Cormorant Garamond | Body text, labels |

Load both fonts via `next/font/google` in `layout.tsx`. Never use a `<link>` tag.

---

## Conventions

### Code Style
- TypeScript strict — `tsc --noEmit` must pass, no `any`
- Tailwind mobile-first — base classes for mobile, `sm:`/`md:` for larger
- No UI libraries — Tailwind only, no shadcn/MUI/Chakra

### Naming
- Components: `PascalCase`
- Files: `PascalCase` for components, `camelCase` for lib files
- CSS: Tailwind utility classes only — no custom CSS unless unavoidable

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_RSVP_FORM_URL` | No | Google Form fallback, used only when the native RSVP write endpoint is unset. `https://forms.gle/FiBmViyzfbf1KhKy5` |

Copy `.env.example` → `.env.local`. Never commit `.env.local`.

> **RSVP / Sheet endpoints are NOT env vars.** Following the existing
> seating/affiliations pattern, the RSVP Sheet's published-CSV URL, Apps Script
> `/exec` URL, and token are public (not secrets) and live as module constants
> in `src/lib/rsvpSheet.ts`. Empty strings mean "not configured" — RSVP.tsx then
> falls back to the Google Form link, and `/guests` treats the RSVP sheet as a
> source with no rows yet.

---

## How to Engage

1. **`constants.ts` is the only source of truth.** Never hardcode names, dates, URLs, entourage lists, or copy inside components. Always import from `constants.ts`.
2. **Static export only.** No `getServerSideProps`, server actions, or Node.js runtime APIs. `npm run build` must produce a fully static output.
3. **Video is optional.** The Hero component renders a prenup photo fallback if no video file exists in `public/video/`. Build the video slot as conditional — do not make it a hard requirement.
4. **RSVP cutoff is a hard rule.** If `new Date() > rsvpDeadline`, render the closed message — never the form link. No exceptions.
5. **Design system is fixed.** Use only the colors and fonts in the Design System table. Do not introduce new colors, fonts, or UI library components.
6. **Mobile first, always.** Test every component at 375px before marking it done.

---

## What Doesn't Belong Here

- Backend logic, databases, or server-side auth — this is a fully static site
- Any CMS integration — all content lives in `constants.ts`
- The save-the-date video committed to git — too large; add to `public/video/` locally or host externally
- Credentials or `.env` values — never commit

---

## References

- [Project Spec](project-spec.md) — full stack, sections, business rules, acceptance criteria
- [Discovery Doc](discovery.md) — background, decisions, open questions
- Church map: https://maps.app.goo.gl/AcPBurBCPgnG1Lsb9
- Venue map: https://maps.app.goo.gl/WUuY43a2Gr4vu2g2A
- Prenup photos: https://daronproject.pixieset.com/arianeandjun/
- RSVP form: https://forms.gle/FiBmViyzfbf1KhKy5
