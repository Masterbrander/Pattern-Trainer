# Pattern Trainer V7: Calm Mode

Build: **7.0.0-calm1** · September 17, 2026

## Upgrade the existing app

1. Export one backup from your current app before updating.
2. Extract this ZIP on your computer.
3. Open your existing GitHub repository: `Masterbrander/Pattern-Trainer`.
4. Choose **Add file → Upload files**. Upload **every file inside this folder**, not the ZIP or enclosing folder. There are more files than the earlier seven-file releases.
5. Commit to `main` and wait for the GitHub Pages deployment to finish.
6. Open the existing live app and look for **v7.0.0 · Calm Mode** under the heading. Close all Pattern Trainer windows and reopen online if it still shows the old version. Desktop Chrome can use Ctrl+Shift+R. Do not clear site data or uninstall.

The app address, installed identity, existing account session key, and incident database remain unchanged. Calm adds a separate local database and a new owner-protected Supabase table. That table has already been added to the connected Emotional Pattern Recognition project. Existing authentication, rant-analysis, and incident-sync functions were not replaced for this update.

Do not create another repository, change your app URL, or paste database secrets into GitHub. Only a public/publishable key is used by this frontend.

## First test on your Fold

While safely stationary, open **CALM DOWN → Voice and playback → Test voice**. Check media volume, then tap **RANDOM**. The first spoken instruction starts immediately. The guide deliberately leaves quiet time after instructions.

Try **Pause**, **Resume**, **Try another**, and **Stop / I'm good now**. Resume repeats the current instruction. It does not attempt to resume in the middle of a word. Check-ins are optional: use **Skip ratings & return** to leave without answering anything.

Do one rated test while signed in, then open the same account on your computer. Under **Review**, the date-range report should include a separate **Calm sessions** section. Account & backup shows **Calm synced** separately from incident sync. Use Sync now to request both checks.

Before trusting offline audio, open a guide online once, then test it in airplane mode. A downloaded local text-to-speech voice may work offline; some voices need the internet. Keep Pattern Trainer on screen. It requests a screen wake lock where supported, but leaving the app pauses the guide. Lock-screen or background narration is not promised.

## What is included

- **CALM DOWN** on Home, Rant, and the incident editor.
- **Random** starts one of four categories without a required rating or confirmation. **Try another** chooses a different category.
- **Ground me**: contact, sound, or visual orientation.
- **Bring me down**: comfortable breathing and releasing muscle tension.
- **Get me unstuck**: step back from the repeating thought and choose one controllable action.
- **Make me laugh**: benign absurdity, not insults or mandatory positivity.
- Four original variants per category, 16 total, approximately 2–4 minutes at typical voice speeds.
- Device voice selection, visible captions, intentional pauses, stop/cancel, and a manual **Read instead** fallback.
- Before and after intensity plus feedback, all optional. Recalled baseline ratings are explicitly labeled.
- Separate account-scoped Calm history, automatic online sync, date-range review, printable report, and JSON backup/restore.
- An in-app **Research, limitations, and safety notes** page with the sources and every complete script.

Calm does not record your voice or submit your rant to an AI. It stops any active dictation before speaking and preserves the current rant text. On return, your rant is still there; its microphone does not restart automatically.

## Ratings and reporting

The report shows attempts, completion/early-stop status, Random usage, optional feedback and paired before/after changes. It does not count Calm usage as another anger incident. Missing ratings are not replaced with zero or a guessed score. Recalled, interrupted, and switched-session rating pairs are excluded from the prospective before/after average.

These are your observations, not a scientific treatment comparison. The app does not claim that a drop was caused by the guide, rank the four techniques, or automatically retrain an AI from your ratings. Random remains random.

## Storage and backup

Calm uses `patternTrainerCalmDB`; existing entries remain in `patternTrainerDB`. Saved Calm records are queued locally, then synchronized using your existing account token. Network or authentication failures remain visible and retryable. Sync occurs after writes, when connectivity returns, when the app becomes visible, and about every 60 seconds while open. Nothing depends on a new Sync ID.

The V7 JSON export includes `calmSessions` alongside `entries`. V7 can still import older entry-only backups. Guest use plays the guides but does not keep personal session history. Cloud sync is not a versioned backup: an occasional exported backup remains useful.

Removing a Calm history item uses a synced deletion marker. This is not a claim of immediate erasure from provider backups. This update does not change the existing rant-deletion system.

## Research and limits

Read **CALM-RESEARCH.md** or **calm-evidence.html**. The underlying techniques have different levels of support. Arousal reduction is more directly supported for anger than humorous audio. Grounding is supported by clinical self-help guidance, but a specific sensory checklist is not established as a universal anger treatment.

The exact scripts and this app have not been clinically validated, and are not a replacement for your therapist. No promised drop from a particular intensity, diagnosis, or successful outcome is built in. The scripts are for adult self-use, not a separately validated children's program.

Use only while stationary and away from driving or machinery. Closing the eyes is optional. Breathing should remain easy; stop pacing and breathe normally if dizzy, breathless, or more distressed. Stop or choose another guide if it makes things worse. Immediate danger or inability to stay safe calls for immediate human help, not an app exercise.

## Testing and device limits

The release includes tested guide selection, speech queue cancellation, error/fallback behavior, rating calculations, storage serialization and transaction-handler behavior, UI interaction, and account isolation. Automated browser tests simulate the speech engine and local storage adapter. They do not prove that a particular Samsung voice audibly plays or that native Android offline storage behaves identically. Test the voice, an offline session, and phone-to-computer Calm sync on your devices after installing.

Live Supabase policy tests verified owner read/write and denied anonymous/cross-account access to the new table. Synthetic test records were rolled back. An existing project warning about leaked-password protection being disabled remains; it is unrelated to Calm and was not changed automatically. Reference: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

## Files to upload

`index.html`, `app.js`, `styles.css`, `manifest.json`, `service-worker.js`, `icon.svg`, `calm-content.js`, `calm-core.js`, `calm-store.js`, `calm.js`, `calm.css`, `calm-evidence.html`, `version.json`, `README.md`, `CALM-RESEARCH.md`.

No new OpenAI API key or paid audio service is required for Calm Mode. The pre-existing AI rant-analysis feature retains its own key requirement.
