# Pattern Trainer v5

Phone-first emotional-pattern awareness PWA with offline capture, weekly review, cloud sync, and real user accounts.

## V5 changes
- Review/report can use any custom date range, including a two-week span between therapy appointments.
- Previous/next arrows shift by the currently selected range length.
- “This week” resets the review to the normal Monday-Sunday view.
- PDF/print report uses the selected date range.

## V4 foundation
- Username + password accounts using Supabase Auth.
- Each account has a separate private cloud history.
- Same login works across phone and desktop, so Sync IDs are no longer needed.
- Existing V3 local/cloud entries are automatically claimed by the first V4/V5 account used on the upgraded device.
- Automatic sync on save, app resume, reconnect, app open, and roughly every 60 seconds while the app is active.
- Local IndexedDB data remains available for offline capture.
- Service worker now cleans up old Pattern Trainer caches and prefers fresh deployed files when online.

## Upgrade
Upload all files in this folder to the root of the GitHub Pages repository, replacing files with the same names. Do not clear app/site data before first V4 sign-in if you want V3 local history migrated automatically.


## V6 additions

- Big red RANT capture with explicit start/stop and raw transcript preservation.
- Multi-select emotions and intensity rating after a rant.
- Voice dictation buttons throughout incident text fields.
- Therapist-grounded cue pickers for physical, behavioral, and emotional cues.
- Rants reopen as normal incidents for after-the-fact reflection.
- Permanent rant deletion removes content while retaining only a content-free deletion count for Review.
- AI rant-analysis UI is wired to the Supabase `pattern-rant-analysis` Edge Function. The function requires an `OPENAI_API_KEY` secret to perform model analysis.


## Direct Rant shortcut

V6 exposes a PWA shortcut named **Rant**. It opens `./?action=rant`, which launches directly into Rant capture. On Samsung/Android, try selecting the Rant app action under the Side button's Double press settings. If Samsung does not expose PWA app actions there, the same URL is ready for a tiny native launcher fallback.


### Rant capture fix

Rant now begins listening immediately when opened, recognition hypotheses are replaced by result index instead of repeatedly appended, Stop becomes Continue Rant, and the rating controls have additional clearance above the sticky save bar.
