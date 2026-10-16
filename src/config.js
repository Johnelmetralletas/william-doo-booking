// Backend credentials.
//
// Values come from environment variables at build time (Vite exposes any var
// prefixed with VITE_ on import.meta.env). Copy .env.example to .env and fill
// in your real EmailJS + Apps Script values — nothing secret is committed.
//
// EmailJS public keys and the Apps Script web-app URL are *publishable* by
// design (they ship in client-side code), so .env here is about not hardcoding
// them in source rather than hiding true secrets.

const env = import.meta.env;

export const CONFIG = {
  EMAILJS_PUBLIC_KEY:       env.VITE_EMAILJS_PUBLIC_KEY       || '',
  EMAILJS_SERVICE_ID:       env.VITE_EMAILJS_SERVICE_ID       || '',
  EMAILJS_TEMPLATE_ID:      env.VITE_EMAILJS_TEMPLATE_ID      || '',
  EMAILJS_CONFIRM_TEMPLATE: env.VITE_EMAILJS_CONFIRM_TEMPLATE || '',
  SHEETS_WEBAPP_URL:        env.VITE_SHEETS_WEBAPP_URL        || '',
  OFFICE_EMAIL:             env.VITE_OFFICE_EMAIL             || 'nc.roombookings@utoronto.ca',
};
