# Discovery — Wedding Website

**Status:** 🟢 Ready for Scoping
**Owner:** Rodel · **Client:** Personal · **Last Updated:** 2026-04-26

---

## Purpose

Use this doc when requirements are still fuzzy. It answers: *"Should we do this? What don't we know yet?"*
Promote to a Scoping Doc once all exit criteria below are met.

---

## TL;DR

Building a personal wedding website based on the existing invitation design. Key features are a prenup photo gallery, save-the-date video, event and church location details, and a Google Forms RSVP link (deadline May 10). Design follows a minimalist aesthetic matching the invitation. Hosting on AWS Amplify. Assets (photos, video) are ready. What's still open: wedding date/venue details, guest count, go-live target, and domain registration.

---

## Exit Criteria (Definition of Done)

- [x] All client questions answered
- [x] Prerequisites identified and unblocked (or owner assigned)
- [x] Technical approach drafted (ADR-level thinking captured)
- [x] Flows mapped end-to-end
- [x] Rough team size estimated (# devs, roles)
- [x] Rough duration estimated (sprints / weeks)
- [x] Ready to promote to Scoping Doc

---

## Client Questions

Open questions we need the client to answer. Mark ✅ when resolved.

- [x] What is the wedding date and time? ✅ June 13, 4pm
- [x] What are the church and venue addresses? ✅ Church: https://maps.app.goo.gl/AcPBurBCPgnG1Lsb9 · Venue: https://maps.app.goo.gl/WUuY43a2Gr4vu2g2A
- [x] How many guests are expected? ✅ ~150
- [x] What is the RSVP deadline? ✅ May 10
- [x] Should RSVP capture meal preference or dietary restrictions, or just headcount? ✅ Headcount only
- [x] Should the site be publicly accessible, or password-protected for guests only? ✅ Public
- [x] Is there a custom domain in mind (e.g. rodel-and-[name].com)? ✅ AWS Amplify (domain TBD)
- [x] Are the prenup photos finalized and ready to upload? ✅ Ready
- [x] Is the save-the-date video finalized and ready? ✅ Ready
- [x] Is accommodation or travel info needed for out-of-town guests? ✅ Google Maps links (church + venue) cover this
- [x] When does the site need to be live (relative to the wedding date)? ✅ ASAP — target today
- [x] Any multilingual requirements (e.g. English + Filipino)? ✅ English only

---

## Prerequisites

What must exist or be decided before build can start.

| Prerequisite | Owner | Status |
|-------------|-------|--------|
| Wedding invitation images (for design reference) | Rodel | ✅ Done |
| Prenup photos finalized and exported | Rodel | ✅ Done |
| Save-the-date video finalized | Rodel | ✅ Done |
| Church and venue addresses confirmed | Rodel | ✅ Done |
| Domain name registered | Rodel | 🔴 Not started |
| RSVP approach decided | Rodel | ✅ Done |

---

## Helpful Links

- Wedding invitation images: [link]
- Prenup photos: [link]
- Save-the-date video: [link]
- Design inspiration / references: [link]

---

## Technical Thinking (ADR-level)

**Decision: Build from scratch vs. hosted wedding platform**

- Options considered:
  - Option A: Custom build (Next.js + Vercel) — full design control, matches invitation aesthetic exactly
  - Option B: Hosted platform (Zola, WithJoy, Squarespace) — faster setup, built-in RSVP, less control over design
- Leaning toward: Option A — minimalist custom design matching the invitation is the core requirement, and platforms constrain that
- Open: If RSVP complexity grows, may reconsider

**Decision: RSVP approach** ✅ Decided

- Options considered:
  - Option A: Embedded Google Form — zero dev effort, slightly off-brand visually
  - Option B: Third-party RSVP service (RSVPify, Zola standalone) — better UX, some cost
  - Option C: Custom form with email/sheet backend — full brand control, more build time
- **Chosen: Option A — Google Forms.** RSVP is not the main feature; keep it simple.
- Open: Whether to capture meal preference (still a client question)

**Decision: Hosting** ✅ Decided

- Options considered:
  - Option A: AWS Amplify — familiar, integrates with AWS ecosystem
  - Option B: Vercel — simpler for static/Next.js, free tier
  - Option C: Netlify — similar to Vercel
- **Chosen: AWS Amplify.**

---

## Flows

1. **Happy path:** Guest receives invite → visits site → sees landing with save-the-date video → scrolls through prenup gallery and event details → clicks RSVP → submits response
2. **Mobile path:** Same flow on mobile — site must be fully responsive; most guests will open on phone
3. **Late RSVP:** Guest tries to RSVP after deadline — form should be closed or show a message
4. **Direct link:** Guest lands directly on a deep section (e.g. venue map link shared in group chat) — each section should be anchor-linkable

---

## Rough Estimate

- **Team:** 1 dev (Rodel, solo)
- **Duration:** 2 days
- **Goal for Day 1:** Shippable version to show — landing page, prenup gallery, event details, RSVP link
- **Goal for Day 2:** Polish, domain setup on AWS Amplify, final review
- **Confidence:** High *(assets ready, RSVP decided, scope is tight)*

---

## Risks & Assumptions

| Risk / Assumption | Impact | Mitigation | Owner |
|------------------|--------|-----------|-------|
| Prenup photos / video not ready on time | Blocks content build | Set hard asset deadline 2 weeks before go-live | Rodel |
| RSVP scope creep (meal choices, +1 tracking) | Extends build significantly | Decide RSVP approach before build starts | Rodel |
| Domain DNS propagation delay | Site not live on schedule | Register domain at least 1 week before go-live | Rodel |
| Design fidelity to invitation harder than expected | Extra front-end time | Treat invitation as reference, not pixel-perfect spec | Rodel |

---

## Priorities for Next Sprint

- [ ] Answer remaining Client Questions (date, venue, guest count, go-live target)
- [x] Finalize RSVP approach ✅ Google Forms
- [x] Confirm asset readiness ✅ Photos and video ready
- [ ] Register domain on AWS Amplify

---

## References

- [Scoping Doc](../templates/planning/scoping-doc.md) — next step once exit criteria are met
- [ADR Template](../templates/decisions/adr-template.md)
- [Work Ahead Analysis](../templates/planning/work-ahead-analysis.md)
