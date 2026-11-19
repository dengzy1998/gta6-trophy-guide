// gta6-trophy-guide-01 entry program (Node 22, standard library only).
//
// The guide itself is plain static files: app/index.html opens in a desktop
// browser and works with the network off, its trophy list and per-trophy
// guides live in app/data/trophies.json, and screenshots/ holds four real
// renders of the app. This program is only the hand-in step: it copies app/
// and screenshots/ from this repository into the output directory and writes
// output/dossier.json with the vendored make.fun library, so the judge can
// read the screenshots, the first load's files and bytes, and the source.
//
// Run it locally like this:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output; inside the
// grader it is unset and the program writes to /output. Both runs must write
// the same bytes, so there is no timestamp or random value anywhere here.
//
// vendor/makefun-frontend.ts must stay exactly as the kit shipped it: the
// sealed scorer rebuilds the dossier with its own copy of the same library
// and compares the two byte for byte.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The caps match the sealed gate's own limits (reference/gate.json): at most
// 4 screenshots of at most 256 KiB each, app/ at most 993 files and
// directories and 48 MiB in all, and the dossier text at most 160 KiB. The
// library refuses an entry past those caps instead of writing a dossier the
// scorer would refuse.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
