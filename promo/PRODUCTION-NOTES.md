# Thought Orchard: "A Place for Your Thoughts" (production notes)

Promo trailer, 12 October 2026.

## Deliverables

| File | What it is |
|---|---|
| `thought-orchard-trailer-16x9.mp4` | Master trailer, 1920×1080, 30 fps, H.264 + AAC, 60 s |
| `thought-orchard-reel-9x16.mp4` | Vertical version for Reels, 1080×1920, 30 fps, 60 s, captured at the real phone layout |
| `title-card-16x9.png`, `title-card-9x16.png` | Final title card, clean |

There is no voiceover, so the master is already the version without narration. No separate file is needed.

## Where every shot comes from

**All moving pictures are real footage of the current app.** They were recorded from the running build in a browser, frame by frame. **No AI-generated or stock footage is used.** The only additions are:

- the text,
- the small warm point of light in the opening (a simple radial glow drawn over black),
- crossfades, and
- a fade to black at the end.

| Time | Shot | Source |
|---|---|---|
| 0:00–0:07 | Black, the line "What happens to the thoughts you never write down?", then a point of light | Text and drawn glow (motion graphics) |
| 0:07–0:12 | The glowing tree at the end of the path; title "Thought Orchard / A place for your thoughts to grow." | **Real:** landing page (`/`) 3D scene, interface hidden |
| 0:12–0:17 | Walking up the path into the orchard | **Real:** `/orchard`, Immersive view, walking with the keyboard, interface hidden |
| 0:17–0:30 | Plant a thought: the sheet opens, the thought is typed and planted, the view turns to the new tree and its letter opens | **Real:** `/orchard` with its interface, actual planting through the app |
| 0:30–0:34 | Water: droplets fall and the leaves brighten; "Last watered" updates | **Real:** the Water button in the thought's letter |
| 0:34–0:43 | Time-lapse: the same tree from the same spot, through all seven stages (New Thought → Fully Grown); "Some thoughts need time." | **Real renders, time compressed:** see below |
| 0:43–0:54 | Walking through a grown orchard in Immersive view, then switching to Explorer view (third-person) and orbiting | **Real:** `/orchard` with its interface |
| 0:53–1:00 | Back to the glowing tree; "Thought Orchard / Your thoughts deserve a place to grow."; slow fade | **Real:** landing page scene, interface hidden |

### About the time-lapse

The time-lapse uses the app's development-only clock (`POST /api/dev/clock`) to view the orchard 0, 1.5, 4, 9, 16, 32 and 62 days after planting. That clock exists for reviewing growth (spec 20.9). The growth model computes every stage the normal way; nothing was set by hand. It is a real depiction of how a tree grows over about two months, compressed into nine seconds.

The trailer doesn't suggest that trees wilt or that daily care is required. In the app, as in the video, growth only moves forward.

### Interface-hidden ("clean plate") shots

For the atmosphere shots, the on-screen controls were hidden with CSS so the world could be seen on its own. The scene underneath is unchanged. Every product demonstration (planting, the letter, watering, switching views) shows the real interface.

## How it was made

1. **Capture.** I ran a local copy of the app and recorded it with Playwright in Chromium, using the machine's GPU.
   - Page time (animation frames, timers, CSS animations) was virtualised. Each frame was rendered at an exact 1/30 s step and screenshotted, so motion is smooth and true to the app's own animation speed.
   - Desktop shots used a 1280×720 viewport at 1.5× (1920×1080 output).
   - Vertical shots used the phone layout, a 432×768 viewport at 2.5× (1080×1920 output). The vertical version is re-captured, not cropped.
   - The capture used a throwaway local test account and the app's own sample thoughts, planted through the development seed.
   - The Next.js development badge was hidden; it isn't part of the product.
2. **Text.** Rendered in the app's own pixel font (Pixelify Sans), using the landing page's title and tagline styles.
3. **Music.** An original score, synthesised from scratch for this trailer, so there are no licensing restrictions:
   - felt-piano-like tones and a soft pad in D major, at 72 bpm;
   - wind, leaf rustle, a few distant birds, and soft droplets under the watering shot.
   - It is quiet in the dark opening, lifts as the forest appears, builds gently before the end, then rings out.
   - Loudness is about −16 LUFS integrated, with peaks around −3 dBFS.
4. **Edit.** Frames, text, glow and audio were assembled in Python and encoded with ffmpeg (H.264 High at CRF 15, yuv420p, BT.709 colour; AAC at 192 kbps).

## Accuracy notes and limitations

- **Every feature shown exists and works in the current build:** landing, Immersive view, planting, the letter panel, watering effects, the seven growth stages, Explorer view, golden-afternoon light, mist and fireflies.
- **The tree count differs between versions.** The vertical version's orchard header shows more trees than the master because the capture account kept the trees planted in earlier takes. Both counts are true for that account at the time. The account was deleted after capture.
- **No URL is shown**, because the app has no verified public address yet.
- **Not shown:** the Notebook, Map, accounts and settings. They work, but the brief prioritised atmosphere over a feature checklist.
- **Pixel-art look:** the footage keeps the app's actual low-resolution, toon-shaded rendering. I didn't add depth of field, lens effects or a separate colour grade, so the trailer looks like the product.
- **Tools:** no AI video-generation tool was available or used in this session.
- **Not reviewed by ear:** I couldn't listen to the mix. Levels, peaks and the loudness contour were checked by measurement. Please give it a listen before publishing.
