# Discovery — Seating / Table Arrangement Manager

**Status:** 🟢 Ready to Promote — all decisions resolved
**Owner:** Rodel · **Client:** Personal (Rodolfo Perez III) · **Last Updated:** 2026-05-30

---

## Purpose

Use this doc when requirements are still fuzzy. It answers: *"Should we do this? What don't we know yet?"*
Promote to a Scoping Doc (or a Feature Brief — see note) once all exit criteria below are met.

> **Note on artifact type:** this is a *delta on a live system* (the `/guests` page), not a greenfield build. A `feature-brief.md` is the more fitting next artifact than a full scoping doc — flagged in Next Steps.

---

## TL;DR

Add a way for the admin (Rodel) to assign confirmed wedding guests to **numbered reception tables**, see each table's fill against its capacity, spot who's still unassigned, and produce a **printable** final seating chart. This is an **admin-only planning tool** (behind `?admin=1`), not guest-facing. It rides on top of the existing `/guests` page: the live RSVP data, theming, sync gate, and admin gate are already built. Persistence reuses the **ADR-0002 pattern** proven for Groom/Bride affiliations — working state in `localStorage`, published by Export → TSV → paste into a published Google Sheet, read back on load so the plan is **shared across the admin's own devices** (still no backend, no auth). Tables are **configurable** (count + per-table capacity editable, not hardcoded). Couples and families seat **as a unit**; individuals (including **plus-ones and "needs review" guests**) seat one by one. Because the RSVP window closed May 10 and the wedding is June 13, seating runs against an effectively **stable, near-final guest list**.

The **head / principal-sponsors table is out of scope for v1** — Rodel handles it on paper (principal sponsors live in `constants.ts` (`ENTOURAGE`), not in the RSVP sheets, so they're outside the seatable pool anyway).

---

## Exit Criteria (Definition of Done)

- [x] All client questions answered
- [x] Prerequisites identified and unblocked (or owner assigned)
- [x] Technical approach drafted (ADR-level thinking captured)
- [x] Flows mapped end-to-end
- [x] Rough team size estimated (# devs, roles)
- [x] Rough duration estimated (sprints / weeks)
- [x] Ready to promote to Scoping Doc / Feature Brief

---

## Client Questions

Resolved questions from the client (Rodel). ✅ = answered.

- [x] How many tables, and what is the seat capacity per table? ✅ **Configurable** — table count and per-table capacity are editable in the UI, not hardcoded.
- [x] Is there a special **head table** / principal-sponsors table? ✅ **Out of scope for v1** — handled on paper. Principal sponsors live in `constants.ts` (`ENTOURAGE.principalSponsors`), separate from the RSVP sheets, so they're outside the seatable pool; no head-table modeling is built in v1.
- [x] Guest-facing or admin-only? ✅ **Admin-only** planning tool (behind `?admin=1`) for now.
- [x] Interaction model — dropdown picker or drag-and-drop? ✅ **Mobile-friendly** → dropdown "assign to table" picker (Decision 5, Option A). No drag-and-drop in v1.
- [x] Are plus-ones and "needs review" guests seatable? ✅ **Yes** — the Unassigned bucket holds everyone attending, including +1s and review pairs.
- [x] Printable / exportable seating chart? ✅ **Yes** — a print/PDF-friendly view for the venue/coordinator.
- [x] Numbered or named tables? ✅ **Numbered** (Table 1, 2, …).
- [x] Published & shared across devices, or device-local? ✅ **Published and shared** (read back from the seating Sheet on load) — across *your own* devices, not guest-facing.

---

## Prerequisites

What must exist or be decided before build can start.

| Prerequisite | Owner | Status |
|-------------|-------|--------|
| A published-to-web "seating" Google Sheet (stores **table definitions + assignments**) | Rodel | 🔴 Not started |
| Existing `/guests` live data layer (`guestSheets.ts`, `guestData.ts`) | — | ✅ Done (in place) |
| Affiliation-override pattern to model the persistence on (`affiliations.ts`, ADR-0002) | — | ✅ Done (precedent exists) |
| Entourage / principal-sponsor names (`constants.ts` → `ENTOURAGE`) | — | ✅ Done (in place) |

---

## Helpful Links

- Existing guest admin page: `src/app/guests/page.tsx` → `src/components/GuestList.tsx`
- Live RSVP data layer: `src/lib/guestSheets.ts`, `src/lib/guestData.ts`
- Persistence precedent (localStorage + export-to-Sheet): `src/lib/affiliations.ts` (ADR-0002)
- Principal sponsors / entourage: `src/lib/constants.ts` → `ENTOURAGE`
- Existing discovery doc: `discovery.md`
- RSVP form: https://forms.gle/FiBmViyzfbf1KhKy5

---

## Technical Thinking (ADR-level)

### Decision 1: Persistence model — reuse the affiliations pattern ✅

- **Chosen: reuse ADR-0002.** Assignments + table definitions live in `localStorage` (working state), published by Export → TSV → paste into a published "seating" Google Sheet, read back at load. Zero backend, zero auth, consistent with the rest of the site. Confirmed by the client's "published and shared" answer.
- **Implication of configurable tables (new):** because tables are editable *and* shared across devices, the seating Sheet must persist **two payloads** — the **table definitions** (number + capacity) and the **guest→table assignments**. Model as a **two-tab sheet** (`tables`, `assignments`) or two clearly-delimited sections. Export produces both.
- Rejected: a real backend (serverless write + DB) — breaks the `output: 'export'` static-only constraint and adds auth/infra for a single-admin planning task.

### Decision 2: Where the feature lives — dedicated `/seating` route ✅ (leaning)

- **Leaning: a dedicated `/seating` route** that imports the same data layer, rather than a third view bolted onto `GuestList.tsx` (already ~1000 lines). Seating is a spatially different mental model (tables, not lists). Reuse `loadGuestSections()` and the theme / sync-gate / admin-gate primitives, but render in its own route.
- Alternative still acceptable: a third "view" toggle on `GuestList` if route-splitting proves heavier than reuse. Final call at feature-brief time.

### Decision 3: Assignment granularity — group-level, mirroring overrides ✅

- Mirror the existing **move-as-a-unit** behavior exactly: couples/families/review pairs seat together as a unit; individuals (and +1s) assign one at a time. Least-surprising given the affiliation picker already works this way.

### Decision 4: Join key — name-keyed assignments ✅

- Key assignments by `guestName` (`normName`), same as overrides, so seating composes with the existing data.
- **Risk:** a renamed or duplicate name orphans / mis-attaches an assignment (already a documented limitation for sides/affiliations).
- **Mitigation:** surface orphaned assignments (a seated name no longer in the live list) as a **flag / "needs review"** row, reusing the existing flag-note UI — never silently drop.

### Decision 5: Interaction model — dropdown picker ✅

- **Chosen: dropdown "assign to table" picker per group**, reusing the `OverridePicker` component pattern. Works at 375px — honors the mobile-first project rule and the client's "mobile-friendly" answer. No drag-and-drop in v1 (possible desktop-only enhancement later).

### Decision 6: Table model & configuration ✅

- A table = `{ number, capacity }`. Tables are **created/edited in the UI** (configurable count + capacity), persisted via the seating Sheet (Decision 1).
- Over-capacity **warns, not blocks** — consistent with the site's forgiving, admin-judgment tone (e.g. an 11th guest on a 10-seat table shows a warning badge but is allowed).
- **Head table: out of scope for v1.** Principal sponsors aren't in the RSVP-derived pool and are handled on paper, so no special head-table type is built. (A future enhancement could seed a table from `ENTOURAGE.principalSponsors`.)

### Decision 7: Printable chart — print view / PDF ✅

- Provide a **print-optimized view** (print stylesheet, or a clean printable layout) listing tables and their seated guests, suitable to hand to the venue/coordinator. Admin-triggered; no public route needed.

---

## Flows

1. **Configure tables (admin):** Rodel opens `/seating?admin=1` → creates N numbered tables, each with a capacity. (No head-table type in v1 — principal sponsors are seated on paper.)
2. **Happy path (assign):** sees the **Unassigned** bucket holding every attending guest (couples/families as units, individuals + plus-ones + review pairs singly) → picks a table per group via the dropdown picker → each table shows fill (e.g. `7 / 10`) → Export → paste into the seating Sheet to publish.
3. **Live data feeds it:** only attending guests appear (same `isAttending` filter as `/guests`). A guest who RSVPs after seating started lands in **Unassigned** on next load — never silently dropped.
4. **Group-as-a-unit:** assigning a couple/family seats all members at once; reassigning moves them together. Individuals/+1s assign one at a time.
5. **Over-capacity:** assigning past a table's capacity shows a warning badge but is allowed.
6. **Orphaned assignment:** a previously seated guest no longer in the live list (RSVP changed/removed) surfaces as a flagged row to reconcile.
7. **Cross-device:** on another device, the published seating Sheet is read back at load, restoring the plan.
8. **Print:** Rodel opens the print view → prints / saves PDF → hands the seating chart to the coordinator.

---

## Rough Estimate

- **Team:** 1 dev (Rodel, solo)
- **Duration (admin-only v1, the chosen scope):** **~2.5 days**
  - Dropdown picker + Unassigned/table buckets + live data reuse: ~1.5 days
  - Configurable tables + publish/read-back via the two-payload seating Sheet (ADR-0002): ~0.5 day
  - Print/PDF view: ~0.5 day
- **Deferred (not in v1):** head/principal-sponsors table, guest-facing table lookup, drag-and-drop board.
- **Confidence:** **High.** The data layer and persistence pattern already exist and are proven; the only remaining unknown is the seating-Sheet schema, not anything architectural.

---

## Risks & Assumptions

| Risk / Assumption | Impact | Mitigation | Owner |
|------------------|--------|-----------|-------|
| Assignments orphan when RSVPs change after seating | Wrong/empty seats | Flag orphaned names as "needs review"; never silently drop | Rodel |
| Two-payload sheet (tables + assignments) export/paste friction | Minor manual step each publish | Accepted — extends the known, proven ADR-0002 workflow | Rodel |
| Name-as-join-key collisions / renames | Mis-seated or orphaned guests | Reuse documented override-name limitation + orphan flag | Rodel |
| Scope creep into drag-and-drop / guest-facing lookup | Build balloons past the ~2-week runway to June 13 | Both explicitly deferred from v1 | Rodel |
| Assumption: guest list is final (RSVP closed May 10) | Low — late changes possible | Live re-fetch keeps it current; late adds land in Unassigned | Rodel |

---

## Priorities for Next Sprint

- [ ] Create the published-to-web **"seating" Google Sheet** with `tables` + `assignments` tabs
- [ ] Promote this to a **feature brief** for the admin-only v1 (the recommended cut)
- [x] All product decisions resolved (see Client Questions)

---

## References

- `discovery.md` — original wedding-site discovery
- `src/lib/affiliations.ts` + ADR-0002 — the persistence pattern this feature mirrors
- `src/lib/guestData.ts` / `src/lib/guestSheets.ts` — the live data layer to build on
- `src/lib/constants.ts` → `ENTOURAGE` — principal-sponsor / head-table source
- CLAUDE.md — static-only, no-backend, mobile-first constraints that bound this feature
