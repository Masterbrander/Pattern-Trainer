# Pattern Trainer v3

Phone-first PWA for catching anger and negative-thought patterns early.

## V3
- Keeps the fast local/offline capture flow.
- Automatically syncs entries to the connected Supabase project when online.
- Uses a random Sync ID so phone and computer can share the same history without an account/login.
- Offline edits and deletions are retained and sync when the connection returns.
- Manual Sync Now plus visible sync status.
- JSON export/restore remains as a second backup.
- Weekly review can be opened on desktop for screen sharing.
- Export PDF opens a therapist-friendly weekly report with metrics, patterns, and incident log, then the browser's Save as PDF / Print dialog.

## Connecting another device
1. On the primary device, open the ⋯ menu and tap Copy this Sync ID.
2. On the second device, open the same menu, paste it into Sync ID, and choose Connect using this Sync ID.
3. The two devices then merge and share the same cloud history.

## Updating GitHub Pages
Replace the seven site files in the existing Pattern-Trainer repository with this V3 set. GitHub Pages will redeploy automatically. Existing local entries remain because V3 uses the same IndexedDB database and GitHub Pages origin as V2.
