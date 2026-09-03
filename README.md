# Pattern Trainer v4

Phone-first emotional-pattern awareness PWA with offline capture, weekly review, cloud sync, and real user accounts.

## V4 changes
- Username + password accounts using Supabase Auth.
- Each account has a separate private cloud history.
- Same login works across phone and desktop, so Sync IDs are no longer needed.
- Existing V3 local/cloud entries are automatically claimed by the first V4 account used on the upgraded device.
- Automatic sync on save, app resume, reconnect, app open, and roughly every 60 seconds while the app is active.
- Local IndexedDB data remains available for offline capture.
- Service worker now cleans up old Pattern Trainer caches and prefers fresh deployed files when online.

## Upgrade
Upload all files in this folder to the root of the GitHub Pages repository, replacing files with the same names. Do not clear app/site data before first V4 sign-in if you want V3 local history migrated automatically.
