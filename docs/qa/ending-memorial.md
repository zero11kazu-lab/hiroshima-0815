# Memorial ending insert

A 9.5-second MEMORIAL state sits between FINAL_BLACKOUT and the existing THE_END. Other scene durations, dialogue, death/grief animation, and THE_END's large type/weight/shadow remain unchanged.

The background is an original AI-generated symbolic cenotaph scene (not an archival photograph), with soft focus baked into a 1440×810 WebP, 24,644 bytes. The original generation remains in the workspace; the game packages only the optimized still. There is no video, runtime blur, flashing, new 3D model, or readable inscription.

Timing:

- Background enters over 0.9 seconds.
- Exact supplied Japanese message fades in from 0.7–1.7 seconds.
- Full opacity holds through 7.2 seconds (5.5 seconds).
- Message fades out from 7.2–8.2 seconds.
- Quiet gap, then background fades to black from 8.8–9.5 seconds.
- Existing THE_END follows, including its original 0.7-second opening pause and large 【完】 typography.

The existing music gain fades toward .018 over a .9-second time constant; the insert schedules no new notes and creates no second music bus. Reset hides the insert and clears its styling. No tap handler advances this state.

Validation: `node tests/ending-memorial.cjs` passed exact message, fade samples, automatic transitions, unchanged audio-bus identity/node count, tap resistance, reset cleanup, background loading and text containment at 844×390, 667×320, 568×320 and 390×844. Screenshots were inspected. Landscape uses two phrase-aligned lines; portrait wraps further to preserve readable 18px text.

`node tests/ending11.cjs` passed all twelve ending states from reunion through THE_END, including the existing farewell text, death timing, breathing stop, grief, shared geometry and room stability. Build, syntax and whitespace checks passed.

Tests use Chromium with mobile emulation. Physical iPhone Safari playback and audio perception remain unverified.
