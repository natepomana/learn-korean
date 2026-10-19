# Learn Korean

A small web app for practising Korean vocab, on desktop and phone.

- **Flashcards**: see the Korean, tap (or press Space) to flip to the English. Swipe or use ←/→ to mark "Again" or "Got it". Missed cards come back a few cards later.
- **Typing**: see the Korean and type it in Korean (great for learning the 두벌식 keyboard, with optional key hints) or type the English meaning. Feedback is live as you type, and half-composed syllables (ㄱ → 가 → 갇 on the way to 가다) count as on track.

Progress lives in memory for the current round only. Settings (deck choice, modes) are remembered per browser.

## Running locally

```bash
npm install
npm run dev
```

`npm test` runs the unit tests, `npm run build` type-checks and builds to `dist/`.

## Adding a new word list

Word lists live in `src/data/*.json`, and every file there shows up as a deck. To add one from a flashcard PDF (Korean page followed by its matching English page, as in `pdfs/week_1_words.pdf`):

```bash
python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt
.venv/bin/python scripts/extract_vocab.py pdfs/week_2_words.pdf --id week-2 --title "Week 2" -o src/data/week-2.json
```

Check the output: the script merges duplicate words but won't catch typos in the PDF. Edit the JSON by hand if needed. Each card looks like:

```json
{ "korean": "보다", "english": ["look", "see", "watch"] }
```

Any of the English meanings is accepted in typing mode.

`week-1.json` also has words added by hand from the Week 1 class slides, so don't regenerate it from the PDF (that would drop them). Use the script for new weeks only.

## Deploying

Hosted on Vercel as a static Vite site; no extra config needed. Pushing to `main` redeploys.
