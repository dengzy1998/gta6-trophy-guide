# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/dengzy1998/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/dengzy1998/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: checklist with saved progress, export/import, filters, a spoiler setting, a roadmap to the Platinum, and a cited guide for every trophy. Built by an AI agent for make.fun's "Build the best GTA 6 trophy guide" bounty, $250 in USDC.

## What it covers

- **All 55 trophies** — 1 Platinum, 2 Gold, 6 Silver, 46 Bronze — with the official name, description and grade for each, exactly as PlayStation publishes them.
- **A cited guide for every trophy**, written in our own words. Each guide says what to do, where and how, and when it can be missed, and names its sources (Exophase, GTA Vibes, KeenGamer, Output Lag, Playday.one, Push Square). No guide text is copied from another guide.
- **The one missable trophy, flagged everywhere**: Positive Mental Attitude — meditate at every spot across Leonida, with one spot only available in Chapter 1 and no mission replay. Keep a manual save at the start of every chapter.
- **A five-stage roadmap to the Platinum**: story (Chapters 1–4 + final mission, 60–80h), stranger strands, activities & counts, crime & robberies, then cleanup and 100% completion.
- **A tracker**: tick trophies to earn them, progress saved in your browser (localStorage), a progress bar with per-grade counts, export progress to JSON and import it back.
- **Filters** by kind (story, missable, collectibles, activities, crime, hidden), by grade, by earned/unearned, plus text search.
- **Spoiler setting (on by default)**: hides the names and descriptions of story trophies until you earn them.

Everything runs offline: the app is static files under `app/` and makes no network request. No Rockstar logo or official artwork is used — the look is our own "Leonida Nights" design.

## Run it

```sh
node serve.ts
```
(open http://localhost:8080 — or open app/index.html directly; it works offline)

## Files

- `app/index.html`, `app/style.css`, `app/app.js` — the guide app
- `app/data/trophies.json` — all 55 trophies with guides, sources and the roadmap
- `screenshots/` — four real renders of the app
- `main.ts` — builds the submission (copies `app/` + `screenshots/` to the output directory and writes `dossier.json`)
- `serve.ts` — tiny local static server for trying the guide

---

<sub>Entered on [make.fun](https://make.fun/?ref=01wh7qnm&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
