// gta6-trophy-guide-01 entry program (Node 22, standard library only).
//
// The guide itself is plain static files in app/ (index.html, style.css,
// app.js, data/trophies.json) that open in a desktop browser with the
// network off. This program hands the guide in: it copies app/ and
// screenshots/ from beside this file into the output directory and writes
// output/dossier.json with the vendored make.fun library, which is the
// summary the judge reads (screenshots, first-load files and bytes, source).
// Leave vendor/makefun-frontend.ts untouched: the scorer rebuilds the
// dossier with its own copy and requires a byte-for-byte match.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// Caps mirror the scorer's own limits: at most 4 screenshots, each at most
// 256 KiB; app/ at most 993 files and directories and 48 MiB in all; the
// dossier text at most 160 KiB. The scorer refuses an entry past any of
// these, so the dossier refuses it here first, with the library's words.
// main.ts runs twice in the grader and both runs must write the same bytes:
// every step above is a plain deterministic copy plus one dossier build,
// so the two outputs are byte-identical.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
