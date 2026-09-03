# Pattern Trainer v2

A phone-first, local-only PWA for quickly logging anger/negative-thought incidents and reviewing patterns later.

## What it does

- Fast 10–20 second incident logging
- Starting-state selector: Irritation, Anger, Anxiety, Hurt, Resentment, Shame, Stress, Self-criticism, or Other
- 1–10 intensity with emphasis on catching levels 1–3
- Quick "Catch a thought" path
- Optional deeper fields based on the supplied Monitoring Anger and ABC worksheets
- History with this week / last week / all / custom date range
- Weekly review with:
  - total entries
  - percent caught at 1–3
  - highest level
  - average level
  - common starting states, triggers, thoughts, cues, and strategies
- Edit and delete entries
- Export / restore JSON backup
- Print weekly review
- Offline support after first load

## Privacy

Entries are stored in IndexedDB in the browser on the device. No server, account, analytics, or cloud sync is included.

Important: browser storage can be cleared by the OS/browser. Use Export Backup periodically.

## Fastest way to test on a computer

From this folder, run:

python -m http.server 8080

Then open:
http://localhost:8080

## Put it on a phone

A PWA installs best from HTTPS.

Easy options:
1. Upload this folder to GitHub Pages, Netlify, Cloudflare Pages, or another static host.
2. Open the HTTPS address on the phone.
3. iPhone: Safari → Share → Add to Home Screen.
4. Android: Chrome → menu → Install app / Add to Home screen.

Once installed and opened successfully, the service worker caches the app for offline use.

## Files

- index.html — app shell and UI
- styles.css — mobile-first styling
- app.js — IndexedDB storage, forms, history, review, backup
- manifest.json — installable PWA metadata
- service-worker.js — offline caching
- icon.svg — home-screen icon
