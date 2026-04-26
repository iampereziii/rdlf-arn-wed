# Project Spec — Wedding Website (Perez–Domingo Nuptials)

**Owner:** Rodolfo Perez III
**Client:** Personal
**Date:** 2026-04-26
**Status:** Ready to Build

---

## Purpose

AI-ready spec for scaffolding a personal wedding website. Provides enough context to go from zero to a deployable site without clarifying questions.

---

## Goal & Context

A minimalist, publicly accessible wedding website for the Perez–Domingo nuptials on June 13, 2026. The site is the digital companion to the physical invitation — same aesthetic, same key info. Primary audience is ~150 guests who will visit on mobile after receiving the invite link. The site must be live ASAP.

- **Primary user:** Wedding guests (mobile-first, non-technical)
- **Core problem:** Guests need one URL for date, location, dress code, prenup gallery, save-the-date video, entourage, and RSVP
- **Success metric:** Guest can find venue, check dress code, and submit RSVP in under 2 minutes on mobile

---

## Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Next.js 14 | App Router, static export |
| Styling | Tailwind CSS v3 | Minimalist, matches invitation aesthetic |
| Hosting | AWS Amplify | Static site deploy |
| Language | TypeScript | Strict mode |
| Package manager | npm | |
| RSVP | Google Forms | Redirect link (not iframe — avoids mobile embed issues) |
| Photos | Next.js `<Image>` | Downloaded from Pixieset, served from `public/photos/` |
| Video | Placeholder | Not yet available — Hero falls back to static image until video is provided |

---

## Design System

Derived directly from the invitation images in `public/invitation/`.

| Token | Value | Notes |
|-------|-------|-------|
| Background | `#FEF0EC` | Light blush pink — main page background |
| Primary accent | `#8B4A3A` | Dusty rose-brown — text, icons, borders |
| Secondary bg | `#C49A8A` | Mauve — used for secondary cards (dress code, entourage) |
| Script font | Pinyon Script (Google Fonts) | Names, section headings — calligraphy style |
| Body font | Cormorant Garamond (Google Fonts) | Body text, labels — elegant serif |
| Spacing | Generous whitespace | Minimalist — err on the side of more space |
| Illustrations | Magnolia botanical line art | Use SVG or PNG from invitation as section dividers |

---

## Repo Scaffold

```
wedding-website/
  src/
    app/
      page.tsx              # Main single-page layout (all sections)
      layout.tsx            # Root layout, metadata, fonts
      globals.css           # Global styles + font imports
    components/
      Navbar.tsx            # Sticky nav with anchor links
      Hero.tsx              # Full-screen landing with video + names
      Gallery.tsx           # Prenup photo grid with lightbox
      EventDetails.tsx      # Ceremony + reception cards with map links
      DressCode.tsx         # Dress code rules per guest type
      Entourage.tsx         # Principal sponsors + wedding party
      RSVP.tsx              # CTA button to Google Form (closes May 10)
    lib/
      constants.ts          # All wedding content — single source of truth
  public/
    photos/                 # Prenup photos (downloaded from Pixieset)
    video/                  # Save-the-date video — add when available
    invitation/             # Invitation images (design reference)
  .env.example
  next.config.js            # output: 'export' for static build
  CLAUDE.md
```

---

## Content & Data

No database. All content is hardcoded in `src/lib/constants.ts`.

```ts
export const WEDDING = {
  groomName: 'Rodolfo III',
  brideName: 'Ariane',
  fullTitle: 'Perez – Domingo Nuptials',
  date: 'Saturday, June 13, 2026',
  ceremony: { time: '1:00 PM', label: 'Ceremony' },
  reception: { time: '4:00 PM', label: 'Reception' },
  church: {
    name: 'Minor Basilica and Parish of La Purísima Concepción',
    location: 'Santa Maria, Bulacan',
    mapUrl: 'https://maps.app.goo.gl/AcPBurBCPgnG1Lsb9',
  },
  venue: {
    name: "Angel Gabriel's Garden",
    location: 'Santa Maria, Bulacan',
    mapUrl: 'https://maps.app.goo.gl/WUuY43a2Gr4vu2g2A',
  },
  rsvpUrl: 'https://forms.gle/FiBmViyzfbf1KhKy5',
  rsvpDeadline: new Date('2026-05-10'),
  adultsOnly: true,
  pixiesetUrl: 'https://daronproject.pixieset.com/arianeandjun/', // source reference only
}

export const GIFTS = {
  message: 'Celebrating with you is the greatest gift we could ask for. We know how important your time is, and should you wish to bless us further, a monetary gift will help us begin our forever.',
}

export const DRESS_CODE = {
  ninong: 'Off white / Beige Barong & Black slacks',
  ninang: 'Long gown in Beige / Champagne',
  gentlemen: 'Long sleeves and slacks',
  ladies: 'Long gown or cocktail dress',
  note: 'Strictly formal. Adults-only celebration — no children except abays.',
}

export const ENTOURAGE = {
  principalSponsors: [
    'Dr. Celestine Deniña', 'Dr. Raymond Deniña',
    'Atty. Joahna Gabatino-Lim', 'Engr. Ronaldo Lim',
    'Mrs. Mariasilas Olivia Batac', 'Mr. Paul Michael Catalan',
    'Mrs. Maria Cleofas Villafuerte', 'Mr. Raoul Domingo',
    'Mrs. Kissher Rose Amurao', 'Mr. Fritz Ros Domingo',
    'Mrs. Maria Lourdes Francisco', 'Engr. Emmanuel Gener',
    'Mrs. Ana Liza Cruz', 'Engr. Eriberto Fabian',
    'Mrs. Josephine Manarang', 'Mr. Raphael Gomez',
    'Mrs. Emma Garcia', 'Architect Frederick Gimeno',
    'Mrs. Evelyn Perez', 'Engr. Lamberto Gabagat',
  ],
  bestMen: ['Rajiv Renz Cruz', 'Marcelino Francisco Jr.'],
  maidsOfHonor: ['Mikaela Serena Flores', 'Arielle Domingo'],
  groomsmen: ['John Carlo Paragas', 'Aristotle Domingo', 'Genesis Dela Cruz', 'Liandre De Castro'],
  bridesmaids: ['Stephanie Domingo', 'Mikee Alberto', 'Natsuko Watanabe', 'Mixen Rivera'],
  cord: ['Maria Allyana Villafuerte', 'John Angelo Alberto'],
  candle: ['Diana Andrea Domingo', 'Edzen Garcia'],
  veil: ['Kriz Perez-Del Prado', 'Frederick Apostol'],
  ringBearer: 'Lucas Alberto',
  bibleBearer: 'Luiz Jam Montalvo',
  coinBearer: 'Zion Catalan',
  flowerGirls: ['Alouarishel Domingo', 'Anaiah Reese Del Prado'],
  flowerLady: 'Oona Alexa Domingo',
}
```

---

## Pages & Sections

Single-page layout (`/`) with anchor-linked sections in this order:

| Section | Component | Anchor | Notes |
|---------|-----------|--------|-------|
| Navbar | `Navbar.tsx` | — | Sticky, transparent over hero, solid white on scroll |
| Hero | `Hero.tsx` | `#home` | Full-screen, save-the-date video (muted autoplay), names + date overlay |
| Gallery | `Gallery.tsx` | `#gallery` | Prenup photo grid, lightbox on click |
| Event Details | `EventDetails.tsx` | `#details` | Two cards: ceremony (1pm, church) + reception (4pm, venue), each with Google Maps button |
| Dress Code | `DressCode.tsx` | `#dresscode` | Per-category rules, adults-only note |
| Entourage | `Entourage.tsx` | `#entourage` | Principal sponsors + wedding party, two-column layout |
| Gifts | `Gifts.tsx` | `#gifts` | Monetary gift message from invitation |
| RSVP | `RSVP.tsx` | `#rsvp` | Button linking to Google Form; after May 10 show closed message |

---

## Business Rules

1. **RSVP cutoff:** If `new Date() > WEDDING.rsvpDeadline`, show "Thank you — RSVP is now closed" with no link. The Google Form link must not be accessible after the deadline.
2. **Video not yet available:** Hero section renders with a full-screen static image fallback (use a prenup photo) until the video file is added to `public/video/`. Build the video component ready but conditional — if no video file exists, show the image. Do not block launch on the video.
3. **Photos source:** Download photos from https://daronproject.pixieset.com/arianeandjun/ and place in `public/photos/`. Do not hotlink from Pixieset — serve from the repo.
4. **Mobile first:** Every section must be fully functional and visually correct at 375px. Test on mobile before marking any section done.
5. **Anchor links:** Smooth scroll to section on nav click. Each section has a matching `id`. Direct URLs like `/#gallery` must jump correctly.
6. **No auth:** Fully public — no login or password protection.
7. **Static export:** `next build` must produce a fully static output (`output: 'export'`). No server-side features.
8. **Design fidelity:** All colors, fonts, and spacing must match the design system table above. Do not introduce colors or fonts not in that table.
9. **Adults only note:** Display the adults-only notice prominently in the Dress Code section — "Strictly No Kids, except abays."

---

## Non-Functional Requirements

### Performance
- [ ] Static export — no SSR at runtime
- [ ] Hero image uses `priority` prop; all other images lazy-loaded
- [ ] Video compressed to < 10MB if served locally; prefer external hosting
- [ ] Target LCP < 2.5s on mobile (3G)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_RSVP_FORM_URL` | Yes | Google Forms URL — `https://forms.gle/FiBmViyzfbf1KhKy5` |

---

## Conventions for AI

1. **Scaffold first.** Create the full folder structure and `CLAUDE.md` before writing any component.
2. **`constants.ts` is the single source of truth.** Never hardcode names, dates, URLs, or entourage lists inside components.
3. **No UI library.** Tailwind CSS only — no shadcn, no MUI, no Chakra. Minimal dependencies.
4. **TypeScript strict.** `tsc --noEmit` must pass. No `any`.
5. **Mobile-first CSS.** Write Tailwind classes mobile-first (`sm:`, `md:` for larger breakpoints).
6. **Static export only.** No `getServerSideProps`, server actions, or Node.js runtime features.
7. **Fonts via next/font.** Load Pinyon Script and Cormorant Garamond using `next/font/google` — never via a `<link>` tag.
8. **Design system is fixed.** Use only the colors and fonts in the Design System table. Do not introduce new colors or fonts.

---

## Acceptance Criteria

- [ ] `npm run dev` starts without errors
- [ ] `npm run build` produces a static export with no errors
- [ ] `tsc --noEmit` passes
- [ ] Hero displays prenup photo fallback (video slot ready but conditional — shows video when file exists)
- [ ] Gifts section shows monetary gift message
- [ ] Gallery renders prenup photos; lightbox opens on click
- [ ] Event Details shows two cards: ceremony at 1pm (church) and reception at 4pm (venue), each with Google Maps link
- [ ] Dress Code section shows per-category rules and adults-only note
- [ ] Entourage section shows principal sponsors + wedding party in readable two-column layout
- [ ] RSVP button links to Google Form before May 10; shows closed message on/after May 10
- [ ] Navbar anchors scroll correctly to all sections
- [ ] Site is fully usable at 375px mobile width
- [ ] Fonts (Pinyon Script + Cormorant Garamond) render correctly
- [ ] Color palette matches invitation (blush `#FEF0EC`, dusty rose `#8B4A3A`)
- [ ] Site deploys successfully to AWS Amplify

---

## Gaps & Questions

| # | Question | Owner | Status |
|---|----------|-------|--------|
| 1 | Save-the-date video not yet available — add to `public/video/` when ready; Hero uses photo fallback until then | Rodel | Open |

---

## References

- [Discovery Doc](discovery-wedding-website.md)
- [CLAUDE.md Starter](../templates/planning/claude-md-starter.md)
- Church map: https://maps.app.goo.gl/AcPBurBCPgnG1Lsb9
- Venue map: https://maps.app.goo.gl/WUuY43a2Gr4vu2g2A
- RSVP form: https://forms.gle/FiBmViyzfbf1KhKy5
