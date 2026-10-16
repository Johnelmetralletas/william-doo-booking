# William Doo Auditorium Booking — Handoff & Porting Guide

This document is the authoritative description of the app so it can be **re-built
or ported to another stack** (e.g. React + Supabase via Lovable) without losing any
behaviour. It records *what the app does and the exact business rules*, not just how
the current code is written.

- **Venue:** William Doo Auditorium, New College, University of Toronto
- **Address:** 45 Willcocks St, Toronto ON M5S 1C6 · nc.roombookings@utoronto.ca · 416-946-0529
- **Purpose:** replace the PDF rental form with a guided online booking + floor-plan builder.

---

## 1. Current status

- **Front end: complete and working** (vanilla JS + Vite). Runs in "demo mode" end to
  end — you can fill out and submit a booking with nothing wired to a backend.
- **Back end: designed, not built.** Submissions, the approval workflow, emails and PDF
  export are specified in §6–§7 but not implemented, pending the data platform decision.

## 2. Current tech stack (to be ported)

Plain **HTML + CSS + vanilla JavaScript (ES modules)**, bundled with **Vite**. No
framework. The whole form is rendered as template strings into a single mount point.
A port to React/TypeScript keeps all the logic below — it just re-expresses the
rendering as components and the shared `data` object as state.

```
index.html              App shell (header, landing, progress bar, mount point, toast)
src/
  main.js               Entry — wires module exports onto window for inline handlers
  config.js             Backend credentials (from env vars; currently empty → demo mode)
  constants.js          STEPS, CAPS, LIMITS, time-option generator
  state.js              `data` (the whole booking record) + `state` (step index, edit flags)
  utils.js              esc, field get/save, toast, pop-up modal
  steps.js              Steps 1–3 + 5 rendering, cost calculator, group logic, validation helpers
  floorplan.js          Step 4 — the full drag-and-drop floor-plan builder
  form.js               Progress bar, validation, navigation, renderAll
  landing.js            New booking / retrieve-existing flows
  backend.js            buildPayload + submitForm (demo-mode aware) + success screen
  styles/main.css       All styles
apps-script/Code.gs     A Google Apps Script backend sketch (superseded — see §6)
```

## 3. The 5-step flow

1. **Event details** — title, date (+ "lasts more than one day" → end date), attendees,
   setup/start/end/breakdown times, description, group type, and a **Room + capacity +
   live cost estimate** card.
2. **Contact** — group/dept name, up to 3 organizers (name/phone/email), primary email.
3. **AV, food & payment** — AV equipment quantities, atrium/food/alcohol, payment method.
4. **Floor plan** — full-screen drag-and-drop builder (see §5).
5. **Review & submit** — summary, signature, policy-acceptance gate, submit.

A landing screen offers **New booking** or **Edit existing** (enter an `NC-XXXXXX`
reference to load and update a prior booking).

## 4. Business rules (must be reproduced exactly)

### Group types (3)
`NC Group`, `NC Sponsored`, `External`. A **"recognized student group"** toggle is shown
for NC Group / NC Sponsored only; when checked it flags the booking as requiring ORSL
approval (see §7).

### Capacity
- Room A: up to **105** seated.
- Room A + B: up to **250** seated (up to **465** with no tables/chairs).

### Rental rates — per day, by group
| | Room A | Room A+B |
|---|---|---|
| NC Group | waived ($0) | waived ($0) |
| NC Sponsored | $350 | $500 |
| External | $350 | **$700** |

### Deposit
- **External only:** $150/day non-refundable deposit **due with the application**; balance due two weeks before the event.
- **NC Group / NC Sponsored:** no deposit — payment is collected **after** the event (within one business day).

### Custodial estimate (auto, assumes the default "Setup 1")
Per event day, by day of week: **Saturday +$180**, **Sunday/Holiday +$240**,
**Friday +$180 if the event ends after 2:00 pm**. (Custom "Setup 2" doubles these; not
auto-applied. Holidays can't be auto-detected — billed at the Sunday rate.)

### Taxes & other charges
- **HST 13%** on the subtotal. **No HST** if paid by internal UofT debit memo.
- **Overtime** (before 9am Mon–Fri, or two bookings same day): $45/hr (1 staff) or
  $90/hr (2 staff); Sunday $60/$120; min 4 hrs. **Not auto-calculated** — shown as
  "calculated later".
- **AV tech support:** $45/hr regular hours, $65/hr after hours, min 4 hrs.
- **Cancellation:** $150/day if >14 days notice; full fee if <14 days.
- Multi-day bookings multiply the per-day rental and custodial across the inclusive date range.

### Furniture limits (floor plan)
| | Round tables | Rect tables | Chairs/table | Loose chairs | Cruisers |
|---|---|---|---|---|---|
| Room A | 8 | 5 | 6 | 105 | 9 |
| Room A + B | 10 | 5 | 6 | 120 | 9 |

Round and rectangle tables have **independent** limits (rect tables can still be added
after the round-table limit is reached).

### AV equipment max quantities
Podium mic **1** · Lavalier/lapel **0 (currently unavailable)** · ClickShare **2** ·
Handheld **3** · Assistive listening **2**.

### Validation
- **Times** must be chronological: setup ≤ start < end ≤ breakdown. Dropdowns run 8:00am–
  10:00pm in 15-min steps; each later dropdown only offers times after the earlier one.
- **Email** must match an email pattern. **Phone** accepts digits/spaces/`+ - ( )` only, max 20 chars.
- **Multi-day:** end date must be on/after the start date; a pop-up warns the setup must be
  identical across days (separate form per setup).
- **Policy gate:** the user must tick "I have read and accept the policies, rates & rules"
  before they can submit.
- A capacity reminder pop-up appears on the attendees field.

## 5. Floor-plan builder (step 4)

Full-screen overlay with a highlighted instructions strip (above the toolbar), a toolbar,
and a scrollable canvas with an SVG base map of the venue (Room A, partition wall,
Room B with the tiered "Fixed seating for 130" flanked by stairs).

- **Room selector** (A / A+B) — shared with the cost estimate in step 1.
- **Presets:** "8 tables × 6 chairs", "105 loose chairs", **"A+B: 10 tables + 120 chairs"
  (sets A+B, removes the partition wall)**, "Clear".
- **Drag palette:** Round table, Rect table, **Rect (no chairs)**, Loose chair, Cruiser.
- **Bulk loose chairs:** type a number → "+ Add"; rendered as a **grid of chair icons**
  with the count labelled (e.g. "48 chairs").
- **Text labels**, **partition-wall toggle**.
- **Per-piece controls appear only when the piece is clicked (selected):** chair count
  −/+, rotate ↺/↻ (15° steps), **rectangle chair-side toggle (both sides / one side)**,
  and delete ×.
- Pieces are draggable; drop coordinates account for canvas scroll. Live capacity badge
  and a Tables/Chairs/Loose/Cruisers summary.

## 6. Data model (what a submission contains)

`src/backend.js → buildPayload()` is the single source of truth for the record shape.
Each booking has a `bookingId` (`NC-` + 6 digits) and includes: event details (title,
date, dateEnd, multiDay, attendees, times, description), group type + studentGroup +
requiresApproval, contact (group name, 3 organizers, emails/phones), AV quantities,
atrium/food/alcohol, payment method + debit-memo fields, room, floor-plan summary +
full `fpPieces` JSON, estimated cost breakdown (days, rental, custodial, HST, total,
deposit), signature fields, policyAccepted, submittedAt, and isUpdate.

→ Port this to **one table / SharePoint list / Supabase table** of the same fields, plus
a **Status** column (`Pending` / `Approved` / `Declined`) and approver-signature columns.

## 7. Backend design (to implement in the target stack)

The agreed design (Microsoft 365) — adapt to whatever platform IT/Lovable choose:

1. **On submit:** save the record as **Status = Pending**; generate a **PDF** of the form +
   floor plan; store it (named by booking ID); send emails — receipt to the organizer,
   notice to the Summer Residence Office, and (NC recognized student groups only) an
   approval request to ORSL.
2. **Approval (NC student groups):** ORSL gets a **secure, single-use, expiring link**
   (ideally **UofT SSO-gated**, limited to ORSL) that opens the booking **pre-filled and
   read-only**; they type **name/title/signature** and **Approve** or **Decline**. Approve
   flips Status → Approved and records the signer + timestamp; Decline notifies the organizer.
3. **Non-NC / External** skip approval and go straight to the office.
4. **Office** works from an **"Approved" view** and an email that fires only on approval.
5. **Edit flow:** retrieving a booking by `NC-XXXXXX` loads the stored record and re-submits
   as an update.

### ⚠️ Data-residency requirement
UofT requires **all booking data and email on UofT infrastructure**. Lovable's default
**Supabase is a third-party host and does NOT meet this** — either **self-host Supabase on
UofT servers**, or point the Lovable front end at a **UofT-hosted / Microsoft 365** backend.
Confirm this with IT before building the backend.

## 8. Running the current app

```bash
npm install
npm run dev        # local dev server
npm run build      # static production build in dist/ (relative paths, host anywhere)
```

Backend credentials would come from `.env` (`VITE_*`, see `.env.example`). With none set,
the app runs in demo mode (submits succeed locally; nothing is sent).

> Note: this folder lives under OneDrive, which corrupts `node_modules` symlinks. If
> `npm run dev/build` errors with "vite: No such file or directory", run
> `node node_modules/vite/bin/vite.js <dev|build>`, or move the project out of OneDrive.

## 9. Design system (to preserve in the port)
Fonts: DM Serif Display (headings) + DM Sans (body). Primary blue `#1a3d6b`; green
`#2d6a2d`; gold `#b8860b`; red `#c0392b`; amber `#e67e00`. Cards white, 16px radius,
hairline borders. Radio options as pill toggles. Left-border coloured notices.
Sticky 5-step progress bar. Amber highlighted instructions strip. Bottom-centre toasts.
