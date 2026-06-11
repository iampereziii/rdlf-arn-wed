# Discovery — Guest Waiting Game ("Catch the Hearts")

**Status:** 🟢 Resolved — decisions made in interview, built same day
**Owner:** Rodel · **Client:** Personal (Rodolfo Perez III) · **Last Updated:** 2026-06-11

---

## Purpose

Use this doc when requirements are still fuzzy. It answers: *"Should we do this? What don't we know yet?"*

> **Note on artifact type:** like the seating manager, this is a *delta on a live system* — the companion artifact is [feature-brief--guest-waiting-game.md](feature-brief--guest-waiting-game.md). With the wedding 2 days out, discovery, decision, and build were compressed into one session; this doc records the decisions for the institutional memory.

---

## TL;DR

Add a **mini game** to the wedding site so guests have something to play while waiting — primarily the ~3-hour gap between the 1:00 PM ceremony and 4:00 PM reception on June 13. A **30-second tap/reaction game** ("Catch the Hearts": tap falling ❤️ for 1 point, rarer 💍 for 3) lives at a dedicated **`/game`** route, with a teaser section and nav link on the main page. Guests enter their **name free-text** after a round; scores **append to a dedicated "Game Scores" Google Sheet** via the proven Apps Script pattern (ADR-0003), and a **public top-10 leaderboard** (best score per name, read from the published CSV) shows who's winning. **The highest score by the reception wins a prize.** Unlimited replays — replaying is the point. Ships safely unconfigured: until the Sheet endpoints are pasted into `gameSheet.ts`, the game runs in play-only mode (score shown, "show it at the reception" copy, no leaderboard).

---

## Exit Criteria (Definition of Done)

- [x] All client questions answered
- [x] Prerequisites identified and unblocked (or owner assigned)
- [x] Technical approach drafted (ADR-level thinking captured)
- [x] Flows mapped end-to-end
- [x] Rough team size estimated (# devs, roles)
- [x] Rough duration estimated (sprints / weeks)
- [x] Promoted — built the same day (see feature brief)

---

## Client Questions

Resolved in the discovery interview (2026-06-11). ✅ = answered.

- [x] What kind of game? ✅ **Tap/reaction game** — catch falling hearts in 30 seconds. (Trivia and photo-match considered; reflex game needs no content prep and replays best.)
- [x] How are players identified on the leaderboard? ✅ **Free-text name entry**, RSVP-form style; name persisted in localStorage so replays don't re-ask. "Use your full name" copy mitigates duplicate first names.
- [x] How many attempts, and which score counts? ✅ **Unlimited replays; best score per name counts.** Killing time is the goal — locking attempts would defeat it.
- [x] Is there a prize? ✅ **Yes — highest score by the reception wins a prize**, announced at the reception. Winner = leaderboard #1.
- [x] Does the game close after the wedding? ✅ **No hard cutoff** — stays playable as a keepsake; copy makes clear the prize was decided at the reception.

---

## Prerequisites

| Prerequisite | Owner | Status |
|-------------|-------|--------|
| "Game Scores" Google Sheet (`Timestamp \| Name \| Score`) + Apps Script `/exec` deployment + published CSV | Rodel | 🔴 Not started — setup steps in `game-apps-script.gs` |
| Sheet write transport (`sheetWrite.ts`, ADR-0003 append pattern) | — | ✅ Done (in place) |
| CSV read/parse helpers (`guestSheets.ts`) | — | ✅ Done (in place) |
| Standalone-route precedent (`/find-my-table`) | — | ✅ Done (precedent exists) |

---

## Helpful Links

- Sheet endpoints + leaderboard logic: `src/lib/gameSheet.ts`
- Game + leaderboard UI: `src/components/Game.tsx`, `src/components/GameLeaderboard.tsx`
- Apps Script proxy (with full setup steps): `game-apps-script.gs`
- Write-pattern precedent: `src/lib/rsvpSheet.ts` + ADR-0003
- Existing discovery docs: `discovery.md`, `discovery-seating.md`

---

## Technical Thinking (ADR-level)

**Decision 1: Where the game lives — dedicated `/game` route ✅**

- Options considered: (A) section on the single-page site; (B) standalone `/game` route.
- **Chosen: B.** A full-viewport tap arena can't share a scrolling page — taps would fight scroll. Follows the `/find-my-table` standalone pattern (own heading, no Navbar). Discovery surfaces: a `Game` nav link (plain `<a>`; the scroll-spy safely ignores route hrefs) + a teaser section after the countdown.

**Decision 2: Rendering — CSS-keyframe animation, no canvas, no dependencies ✅**

- Options considered: (A) canvas/game library; (B) rAF physics loop; (C) absolutely-positioned elements falling via one Tailwind keyframe with per-heart inline `left`/`animationDuration`.
- **Chosen: C.** Zero new dependencies (project rule), compositor-driven (smooth on mid-range phones), shippable in hours. Difficulty ramps by shrinking spawn interval (~850→380ms) and fall time (~3.2→1.6s). `onPointerDown` to score (faster than click); `touch-action: none` + body scroll-lock during play.

**Decision 3: Score persistence — append to a dedicated Sheet (ADR-0003 pattern) ✅**

- Reuses `appendRowToSheet` + honeypot, a third deployment alongside RSVP/seating (Apps Script binds per-spreadsheet). Leaderboard reads the published CSV, dedupes best-per-normalized-name, shows top 10.
- **Known wrinkle:** published CSVs lag writes by ~5 minutes → a just-submitted score is merged into the leaderboard **optimistically client-side**.
- Accepted: scores are client-reported and unverifiable on a static site — fine for a friendly prize, not for anything contested.

---

## Flows

1. **Happy path:** guest taps `Game` in the nav (or the teaser) → `/game` → Play → 3·2·1 countdown → 30s of tapping hearts → score shown → enters name (prefilled on replay) → Save → optimistic leaderboard entry appears → replays to beat it.
2. **Alt path (unconfigured):** Sheet endpoints empty → round ends with score + "show this at the reception" copy; no form, no leaderboard, no errors.
3. **Edge cases:** CSV fetch fails or sheet empty → friendly empty state, never a crash; same name submits lower score → leaderboard keeps the max; bot fills honeypot → silently dropped server-side.

---

## Rough Estimate

- **Team:** 1 dev (Rodel, solo)
- **Duration:** ~half a day build + ~15 min Sheet/Apps Script setup (manual, owner-only)
- **Confidence:** **High** — every integration piece (append transport, CSV parsing, standalone route, honeypot) already exists and is proven.

---

## Risks & Assumptions

| Risk / Assumption | Impact | Mitigation | Owner |
|------------------|--------|-----------|-------|
| Scores are client-reported (no server validation possible on a static site) | A determined guest could fake a score | Accepted — friendly stakes, honeypot deters bots; couple arbitrates ties/absurd scores at the reception | Rodel |
| Duplicate first names collide on the leaderboard (best-per-name keying) | Two "Anna"s merge into one entry | "Use your full name" hint under the name field | Rodel |
| Published CSV ~5 min lag | Fresh scores invisible to *other* guests briefly | Optimistic client-side merge for the submitter; lag accepted for others | — |
| Sheet/Apps Script not set up before June 13 | Game runs play-only, no shared leaderboard | Setup steps documented in `game-apps-script.gs`; ~15 min task | Rodel |
| Venue connectivity is poor | Submits fail | Submit shows a retry-able error; score stays on screen either way | — |

---

## Priorities for Next Sprint

- [ ] Create the **Game Scores** Sheet + deploy the Apps Script + publish CSV; paste the three values into `src/lib/gameSheet.ts` (before June 13!)
- [ ] Decide the prize
- [x] Build the game (done same-day — see feature brief)

---

## References

- [feature-brief--guest-waiting-game.md](feature-brief--guest-waiting-game.md) — the build artifact for this feature
- [decisions/0003-apps-script-write-back.md](decisions/0003-apps-script-write-back.md) — the write pattern reused here
- `discovery-seating.md` — sibling discovery for the seating manager
- CLAUDE.md — static-only, no-backend, mobile-first constraints that bound this feature
