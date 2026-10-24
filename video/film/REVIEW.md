# REVIEW — Round demo film ("The empty chair")

## Creative calls
- Built storyline A ("The empty chair") from STORYLINES.md; B ("Follow the hundred") and C ("Say it big") were not built.
- Narrated with HeyGen voice **Joanna — Warm & Conversational**, one take per scene (assets/voice/*.wav + word timestamps).
- Real product throughout: every app screen in scenes 4, 5 and 7 is a 2x capture of the actual Round app running the same contract
  on a local chain (join, pay, settle, the default being covered). Numbers on screen are from that run: 0.0056 BTC to join,
  0.001375 BTC taken, Member 2 received 200 MUSD + 0.001292 BTC.
- On-screen words never repeat the narration verbatim (scenes 8 and 9 were rewritten for that).
- Music: HeyGen's music catalog returned 401 Unauthorized for this account (TTS works; catalog music does not on the free plan).
  Used "Soft Corporate" by MusicLFiles, **CC BY 4.0**, from Openverse/Wikimedia: it MUST be credited where the video is published
  (assets/bgm/CREDITS.md). Bed under the opening, drops out as member 1 stops paying, re-enters on a strong downbeat at the reveal.
- SFX: bundled HyperFrames library (pops on payments, clicks on real cursor clicks, whooshes on cuts, a riser into the BTC impact).

## Measured vs looked at
- `check`: ok. Loudness normalised by measurement: each voice line −16 LUFS, music bed ≈ −30 LUFS.
- Looked at: review sheets (beats, every seam, phone width) and targeted snapshots after each fix.
- **The sound was measured, not heard.** Nobody has listened to the mix; listen once before submitting.

## Weakest shot / with more time
- Scene 4–5 UI cards: legible at 1080p, but the small hint text under each button is unreadable at phone width. With more time:
  punch in on the button for the click.
- The music was chosen by measurement (steady rhythm, ~122 bpm, even energy), not by ear. Swap it if it feels too corporate.

## Warnings kept on purpose
- contrast_aa_failure at 34 s: scene 5's title words start pale and darken as they are spoken (a deliberate reveal).
- content_overlap (info): coins passing into the pot.
