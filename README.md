# William Doo Auditorium — Event Booking Form

A 5-step online booking form for the William Doo Auditorium at New College,
University of Toronto. Replaces the legacy PDF booking form, including a
full-screen drag-and-drop floor-plan builder.

- **Address:** 45 Willcocks St, Toronto ON M5S 1C6
- **Contact:** nc.roombookings@utoronto.ca · 416-946-0529

## Getting started

```bash
npm install
cp .env.example .env   # then fill in your EmailJS + Apps Script values
npm run dev            # http://localhost:5173
```

Build for production:

```bash
npm run build          # outputs to dist/
npm run preview        # serve the built dist/ locally
```

## Going live (deploy)

The build output in `dist/` is a plain static site — host it anywhere. Easiest paths:

- **Netlify / Vercel / Cloudflare Pages (recommended):** connect the git repo,
  set build command `npm run build` and publish directory `dist`. Add the `VITE_*`
  environment variables (below) in the host's dashboard so they're baked into the build.
- **GitHub Pages:** run `npm run build` and publish the `dist/` folder.

### Demo mode vs. live

If no backend keys are set in `.env`, the form runs in **demo mode**: you can fill
out and "submit" a booking to test the whole flow, but nothing is sent (a demo
notice is shown on the success screen). As soon as you add the keys below, real
submissions are saved and emailed.

## Project structure

```
index.html             App shell (header, landing, progress bar, form mount, toast).
                        Loads the EmailJS CDN and /src/main.js.
src/
  main.js              Entry. Imports every module and copies their exported
                       handlers onto window (the markup uses inline on* handlers),
                       then initialises EmailJS.
  config.js            CONFIG — reads VITE_* vars from .env (no hardcoded creds).
  constants.js         STEPS, CAPS, LIMITS, timeOptions().
  state.js             `state` (cur / isEditing / editingId) + `data` (booking record).
  utils.js             esc, gv, sv, showToast.
  steps.js             step1–step3, step5, payment fields, radio/AV helpers.
  floorplan.js         step4 + the entire floor-plan builder (fp* functions).
  form.js              Progress bar, validation, navigation, renderAll.
  landing.js           New booking / retrieve-existing flows.
  backend.js           buildPayload, submitForm (EmailJS + Sheets), showSuccess.
  styles/main.css      All styles.
apps-script/
  Code.gs              Google Apps Script web app (doGet/doPost) for the Sheet store.
```

### Why functions are put on `window`

The form is rendered as template-string HTML with inline handlers
(`onclick="goNext()"`, `ondragstart="fpDragStart(...)"`). Those resolve against
the global scope at event time, so `main.js` copies each module's exports onto
`window`. This kept the migration behaviour-preserving — no markup had to change.

## Backend setup

### Google Sheets (via Apps Script)

1. Create a Google Sheet; copy its ID from the URL.
2. **Extensions → Apps Script**, paste `apps-script/Code.gs`, set `SHEET_ID`.
3. **Deploy → New deployment → Web app** — *Execute as: Me*, *Access: Anyone*.
4. Put the `/exec` URL in `.env` as `VITE_SHEETS_WEBAPP_URL`.

Operations: `GET ?action=get&id=NC-XXXXXX` (edit flow), `POST {action:'create'|'update', data}`.

### EmailJS

Create two templates in the EmailJS dashboard and set the IDs in `.env`:

- `VITE_EMAILJS_TEMPLATE_ID` — office notification ("New Booking …" / "UPDATE …").
- `VITE_EMAILJS_CONFIRM_TEMPLATE` — customer confirmation with the reference number.

Also set `VITE_EMAILJS_PUBLIC_KEY` and `VITE_EMAILJS_SERVICE_ID`.

> EmailJS public keys and the Apps Script URL ship in client-side code by design;
> `.env` here keeps them out of source, not truly secret.

## Backlog

- [ ] Connect real EmailJS + Google Sheets credentials.
- [x] Demo mode: form submits end-to-end with no backend (for testing); resilient
      per-call error handling so one failed email doesn't lose a booking.
- [x] Floor-plan summary "Tables"/"Chairs" counters fixed (correct element ids).
- [x] Table chair count no longer snaps back to 6 when reduced to 0.
- [x] Event-time chronological validation (setup ≤ start < end ≤ breakdown).
- [x] Email-format + numbers-only phone validation on contact step.
- [x] "Send invoice" payment option (no extra fields).
- [x] Floor-plan base map redrawn to match the venue sketch.
- [x] Room B now has an open event floor (shrunk fixed-seating block) for placing furniture.
- [x] Drop coordinates account for canvas scroll — pieces land where dropped (incl. Room B).
- [x] Fixed double-drop bug (canvas had both inline `ondrop` and an `addEventListener`).
- [x] Bulk loose chairs render as a labelled grid of chair icons (one per seat, any count).
- [x] Base map redrawn to match the venue sketch: room shifted right with a left wing
      (Main entrance + STAIRS outside the room), Screen, Podium A ellipse, partition
      divider line, Room B with balcony, entrances with door arcs, and bottom double doors.
- [x] Fixed seating drawn as one tiered-bleacher unit with the staircases running up
      each side (matching the real venue), instead of separate floating stairs.
- [x] Fixed seating spans the full room width, stairs at the far edges.
- [x] Floor-plan instructions strip restyled as a highlighted amber callout with a
      "How to use this builder" badge so it's clearly noticeable.
- [ ] Floor-plan canvas scaling — pieces use absolute px and don't reposition on resize.
- [ ] Mobile responsiveness of the floor-plan toolbar.
- [ ] Print/export of the floor plan as image or PDF.
- [ ] Confirmation/approval `status` field the office can update (column exists in Code.gs).
```
