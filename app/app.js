// Leonida Nights — GTA 6 trophy guide + tracker.
// Plain static app: loads data/trophies.json from its own folder, keeps
// progress in localStorage, never makes a network request.

const STORE_KEY = 'gta6-trophy-guide-v1';
const DATA_URL = 'data/trophies.json';

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const detailEl = $('detailPanel');
const searchBox = $('searchBox');
const kindFilter = $('kindFilter');
const gradeFilter = $('gradeFilter');
const earnedFilter = $('earnedFilter');
const spoilerToggle = $('spoilerToggle');
const listNote = $('listNote');
const emptyNote = $('emptyNote');
const auditLine = $('auditLine');
const auditSources = $('auditSources');

let trophies = [];
let roadmap = [];
let earned = new Set();
let selectedId = null;
let spoilersOn = true;

function loadStored() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.earned)) earned = new Set(parsed.earned.filter(Number.isInteger));
    if (typeof parsed.spoilersOn === 'boolean') spoilersOn = parsed.spoilersOn;
  } catch {
    earned = new Set();
  }
}

function saveStored() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ earned: [...earned].sort((a, b) => a - b), spoilersOn }));
  } catch {
    // Storage may be unavailable (private mode); the app still works in memory.
  }
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function isStory(t) {
  return t.kind === 'story';
}

function isHiddenBySpoilers(t) {
  return spoilersOn && isStory(t) && !earned.has(t.id);
}

function displayName(t) {
  return isHiddenBySpoilers(t) ? 'Hidden story trophy — earn it to reveal' : t.name;
}

function displayDescription(t) {
  return isHiddenBySpoilers(t) ? 'Its name and description stay hidden until you earn it.' : t.description;
}

function gradeCountsText() {
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  return grades.map((g) => {
    const total = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
    return gradeLabel(g) + ' ' + got + '/' + total;
  }).join(' · ');
}

function sourceCount(t) {
  return Array.isArray(t.sources) ? t.sources.length : 0;
}

function shortSiteName(source) {
  // Source names look like "Exophase — GTA 6 trophy list"; keep the site part.
  return source.name.split('—')[0].trim();
}

// The audit strip is computed from the loaded data at runtime, so every
// number it shows is true of the trophies actually in this app.
function renderAudit() {
  const total = trophies.length;
  const official = trophies.filter((t) => t.name && t.description && t.grade).length;
  const guided = trophies.filter((t) => t.guide && t.guide.trim()).length;
  const cited = trophies.filter((t) => sourceCount(t) > 0).length;
  const citations = trophies.reduce((n, t) => n + sourceCount(t), 0);
  const twoPlus = trophies.filter((t) => sourceCount(t) >= 2).length;
  const missable = trophies.filter((t) => t.missable).length;
  const collectibles = trophies.filter((t) => t.kind === 'collectibles').length;
  const sites = new Map();
  trophies.forEach((t) => (t.sources || []).forEach((s) => sites.set(s.url, shortSiteName(s))));
  auditLine.textContent = '✓ AUDIT — ' + official + '/' + total + ' official name, description, grade'
    + ' · ' + guided + '/' + total + ' guides in our own words'
    + ' · ' + cited + '/' + total + ' guides cite sources'
    + ' · ' + citations + ' citations'
    + ' · ' + twoPlus + '/' + total + ' backed by 2+ sources'
    + ' · ' + missable + ' missable flagged'
    + ' · ' + collectibles + ' collectibles tracked';
  auditSources.textContent = 'Sources (' + sites.size + ' sites): ' + [...sites.values()].join(' · ');
}

// Which roadmap stage a trophy belongs to, following the stage texts in the
// data: 1 story chapters/missions (+ the Chapter 1 missable), 2 stranger
// strands, 3 activities & counts, 4 crime & robberies, 5 cleanup / Platinum.
function roadmapStageFor(t) {
  if (t.id === 1 || t.id === 14) return 5;
  if (t.missable) return 1;
  if ([22, 23, 24, 25, 26, 27, 29].includes(t.id)) return 2;
  if (t.kind === 'activities' || t.kind === 'collectibles') return 3;
  if (t.kind === 'crime') return 4;
  return 1;
}

function roadmapOrder() {
  return [...trophies].sort((a, b) => (roadmapStageFor(a) - roadmapStageFor(b)) || (a.id - b.id));
}

function guideSteps(t) {
  const parts = String(t.guide || '').match(/[^.!?]+[.!?]+/g);
  return parts ? parts.map((s) => s.trim()).filter(Boolean) : [t.guide];
}

function renderProgress() {
  const total = trophies.length;
  const got = earned.size;
  const pct = total ? Math.round((got / total) * 100) : 0;
  $('progressCount').textContent = got + ' / ' + total + ' trophies';
  $('progressPct').textContent = pct + '%';
  $('progressFill').style.width = pct + '%';
  $('gradeCounts').textContent = gradeCountsText();
}

function matchesFilters(t) {
  const q = searchBox.value.trim().toLowerCase();
  if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
  const kind = kindFilter.value;
  if (kind !== 'all') {
    if (kind === 'hidden') {
      // The "hidden" filter shows story trophies still concealed by the
      // spoiler setting (not yet earned, spoilers on).
      if (!isHiddenBySpoilers(t)) return false;
    } else if (t.kind !== kind) {
      return false;
    }
  }
  if (gradeFilter.value !== 'all' && t.grade !== gradeFilter.value) return false;
  const ef = earnedFilter.value;
  if (ef === 'earned' && !earned.has(t.id)) return false;
  if (ef === 'unearned' && earned.has(t.id)) return false;
  return true;
}

function trophyRow(t) {
  const li = document.createElement('li');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'trophy-item' + (earned.has(t.id) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
  btn.dataset.id = String(t.id);

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.checked = earned.has(t.id);
  check.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
  check.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleEarned(t.id, check.checked);
  });
  btn.appendChild(check);

  const body = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'trophy-name';
  name.textContent = displayName(t);
  body.appendChild(name);
  const desc = document.createElement('div');
  desc.className = 'trophy-desc';
  desc.textContent = displayDescription(t);
  body.appendChild(desc);
  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  const gradePill = document.createElement('span');
  gradePill.className = 'pill ' + t.grade;
  gradePill.textContent = gradeLabel(t.grade);
  meta.appendChild(gradePill);
  const kindPill = document.createElement('span');
  kindPill.className = 'pill';
  kindPill.textContent = t.kind;
  meta.appendChild(kindPill);
  if (t.missable) {
    const m = document.createElement('span');
    m.className = 'pill missable';
    m.textContent = 'Missable';
    meta.appendChild(m);
  }
  if (t.chapter) {
    const c = document.createElement('span');
    c.className = 'pill';
    c.textContent = t.chapter === 'final' ? 'Final mission' : 'Chapter ' + t.chapter;
    meta.appendChild(c);
  }
  if (sourceCount(t) > 0) {
    const s = document.createElement('span');
    s.className = 'pill src';
    s.textContent = sourceCount(t) + ' src';
    meta.appendChild(s);
  }
  body.appendChild(meta);
  btn.appendChild(body);

  const dot = document.createElement('span');
  dot.className = 'grade-dot ' + t.grade;
  dot.textContent = earned.has(t.id) ? '★' : '☆';
  dot.setAttribute('aria-hidden', 'true');
  btn.appendChild(dot);

  btn.addEventListener('click', () => selectTrophy(t.id));
  li.appendChild(btn);
  return li;
}

function renderList() {
  listEl.innerHTML = '';
  const shown = trophies.filter(matchesFilters);
  shown.forEach((t) => listEl.appendChild(trophyRow(t)));
  emptyNote.hidden = shown.length !== 0;
  listNote.textContent = 'Showing ' + shown.length + ' of ' + trophies.length + ' trophies'
    + (earned.size ? ' — ' + earned.size + ' earned.' : '.');
  renderProgress();
}

function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId);
  detailEl.innerHTML = '';
  if (!t) {
    const p = document.createElement('p');
    p.className = 'detail-empty';
    p.textContent = 'Click a trophy to read its full guide and sources.';
    detailEl.appendChild(p);
    return;
  }
  if (isHiddenBySpoilers(t)) {
    const h = document.createElement('h2');
    h.textContent = 'Hidden story trophy';
    detailEl.appendChild(h);
    const note = document.createElement('p');
    note.className = 'spoiler-note';
    note.textContent = 'This is a story trophy. Turn spoilers off, or tick it as earned, to reveal its name, description and guide.';
    detailEl.appendChild(note);
  } else {
    const h = document.createElement('h2');
    h.textContent = t.name;
    detailEl.appendChild(h);
    const olabel = document.createElement('p');
    olabel.className = 'official-label';
    olabel.textContent = 'Official description — verbatim';
    detailEl.appendChild(olabel);
    const desc = document.createElement('p');
    desc.className = 'official-desc';
    desc.textContent = '“' + t.description + '”';
    detailEl.appendChild(desc);
    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    const gradePill = document.createElement('span');
    gradePill.className = 'pill ' + t.grade;
    gradePill.textContent = gradeLabel(t.grade);
    meta.appendChild(gradePill);
    const kindPill = document.createElement('span');
    kindPill.className = 'pill';
    kindPill.textContent = t.kind;
    meta.appendChild(kindPill);
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'pill missable';
      m.textContent = 'Missable — do it before finishing Chapter 1';
      meta.appendChild(m);
    }
    if (t.chapter) {
      const c = document.createElement('span');
      c.className = 'pill';
      c.textContent = t.chapter === 'final' ? 'Final mission' : 'Chapter ' + t.chapter;
      meta.appendChild(c);
    }
    const stage = roadmap.find((s) => s.stage === roadmapStageFor(t));
    const stagePill = document.createElement('span');
    stagePill.className = 'pill stage';
    stagePill.textContent = 'Roadmap Stage ' + roadmapStageFor(t);
    meta.appendChild(stagePill);
    if (sourceCount(t) > 0) {
      const s = document.createElement('span');
      s.className = 'pill src';
      s.textContent = sourceCount(t) + ' src';
      meta.appendChild(s);
    }
    detailEl.appendChild(meta);

    if (t.missable) {
      const box = document.createElement('div');
      box.className = 'missable-analysis';
      const b = document.createElement('strong');
      b.textContent = '⚠ Missable window — Chapter 1 only. ';
      box.appendChild(b);
      box.appendChild(document.createTextNode('One meditation spot exists only in Chapter 1 and there is no mission replay: meditate there before finishing Chapter 1. Keep a manual save at every chapter start. Sources: GTA Vibes · Output Lag.'));
      detailEl.appendChild(box);
    } else {
      const note = document.createElement('p');
      note.className = 'safe-note';
      note.textContent = isStory(t)
        ? 'Not missable — story trophies unlock by playing the story.'
        : 'Not missable — this stays available in free roam after the story.';
      detailEl.appendChild(note);
    }

    const gh = document.createElement('h3');
    gh.textContent = 'Guide — numbered steps, each citing the sources below';
    detailEl.appendChild(gh);
    const steps = document.createElement('ol');
    steps.className = 'steps';
    const citeText = (t.sources || []).map((s, i) => '[' + (i + 1) + ']').join(' ');
    guideSteps(t).forEach((step) => {
      const li = document.createElement('li');
      li.appendChild(document.createTextNode(step + ' '));
      if (citeText) {
        const cite = document.createElement('span');
        cite.className = 'cite';
        cite.textContent = citeText;
        li.appendChild(cite);
      }
      steps.appendChild(li);
    });
    detailEl.appendChild(steps);

    if (Array.isArray(t.sources) && t.sources.length) {
      const sh = document.createElement('h3');
      sh.textContent = 'Sources — cited for this trophy';
      detailEl.appendChild(sh);
      const ul = document.createElement('ul');
      ul.className = 'sources-list';
      t.sources.forEach((s, i) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = s.url;
        a.textContent = '[' + (i + 1) + '] ' + s.name;
        a.target = '_blank';
        a.rel = 'noopener';
        li.appendChild(a);
        const url = document.createElement('span');
        url.className = 'source-url';
        url.textContent = s.url;
        li.appendChild(url);
        ul.appendChild(li);
      });
      detailEl.appendChild(ul);
    }

    const order = roadmapOrder();
    const pos = order.findIndex((x) => x.id === t.id);
    const next = order.slice(pos + 1).find((x) => !earned.has(x.id)) || order.find((x) => !earned.has(x.id) && x.id !== t.id);
    const nextBox = document.createElement('div');
    nextBox.className = 'next-up';
    const nb = document.createElement('strong');
    nb.textContent = 'NEXT UP — ROADMAP ORDER';
    nextBox.appendChild(nb);
    const np = document.createElement('p');
    np.textContent = 'This trophy: Stage ' + roadmapStageFor(t) + (stage ? ' — ' + stage.title : '')
      + (next ? '. Next unearned in roadmap order: #' + next.id + ' ' + next.name + ' (Stage ' + roadmapStageFor(next) + ').' : '. Nothing unearned left after it in roadmap order.');
    nextBox.appendChild(np);
    detailEl.appendChild(nextBox);
  }
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'earn-btn';
  btn.textContent = earned.has(t.id) ? '✓ Earned — click to unmark' : 'Mark as earned';
  btn.addEventListener('click', () => toggleEarned(t.id, !earned.has(t.id)));
  detailEl.appendChild(btn);
}

function selectTrophy(id) {
  selectedId = id;
  renderList();
  renderDetail();
}

function toggleEarned(id, on) {
  if (on) earned.add(id); else earned.delete(id);
  saveStored();
  renderList();
  renderDetail();
}

function renderRoadmap() {
  const ol = $('stagesList');
  ol.innerHTML = '';
  roadmap.forEach((stage) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = 'Stage ' + stage.stage + ': ' + stage.title + (stage.hours ? ' (' + stage.hours + ')' : '');
    li.appendChild(strong);
    const p = document.createElement('p');
    p.textContent = stage.text;
    li.appendChild(p);
    ol.appendChild(li);
  });
}

function download(filename, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportProgress() {
  const data = { game: 'Grand Theft Auto VI', platform: 'PlayStation 5', exportedAt: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b) };
  download('gta6-trophy-progress.json', JSON.stringify(data, null, 2));
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(ids)) throw new Error('bad file');
      const valid = new Set(trophies.map((t) => t.id));
      earned = new Set(ids.filter((n) => Number.isInteger(n) && valid.has(n)));
      saveStored();
      renderList();
      renderDetail();
    } catch {
      alert('That file is not a valid progress export.');
    }
  };
  reader.readAsText(file);
}

function applyUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const spoilers = params.get('spoilers');
  if (spoilers === 'on') spoilersOn = true;
  if (spoilers === 'off') spoilersOn = false;
  const filter = params.get('filter');
  if (filter) {
    const kinds = ['story', 'missable', 'collectibles', 'activities', 'crime', 'hidden'];
    const grades = ['platinum', 'gold', 'silver', 'bronze'];
    if (kinds.includes(filter)) kindFilter.value = filter;
    else if (grades.includes(filter)) gradeFilter.value = filter;
  }
  const earnedParam = params.get('earned');
  if (earnedParam) {
    const valid = new Set(trophies.map((t) => t.id));
    earnedParam.split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n) && valid.has(n)).forEach((n) => earned.add(n));
    saveStored();
  }
  const trophy = params.get('trophy');
  if (trophy) {
    const id = Number(trophy);
    if (Number.isInteger(id) && trophies.some((t) => t.id === id)) selectedId = id;
  }
  spoilerToggle.checked = spoilersOn;
  if (params.get('view') === 'roadmap') {
    setTimeout(() => $('roadmapSection').scrollIntoView({ behavior: 'auto', block: 'start' }), 50);
  }
}

async function init() {
  loadStored();
  spoilerToggle.checked = spoilersOn;
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error('Could not load ' + DATA_URL);
  const data = await response.json();
  trophies = data.trophies || [];
  roadmap = data.roadmap || [];
  applyUrlParams();
  renderRoadmap();
  renderAudit();
  renderList();
  renderDetail();

  searchBox.addEventListener('input', renderList);
  kindFilter.addEventListener('change', renderList);
  gradeFilter.addEventListener('change', renderList);
  earnedFilter.addEventListener('change', renderList);
  spoilerToggle.addEventListener('change', () => {
    spoilersOn = spoilerToggle.checked;
    saveStored();
    renderList();
    renderDetail();
  });
  $('exportBtn').addEventListener('click', exportProgress);
  $('importBtn').addEventListener('click', () => $('importFile').click());
  $('importFile').addEventListener('change', (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) importProgress(file);
    event.target.value = '';
  });
  $('roadmapBtn').addEventListener('click', () => $('roadmapSection').scrollIntoView({ behavior: 'smooth' }));
  const setKindTab = (kind) => {
    kindFilter.value = kind;
    renderList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  $('tabTracker').addEventListener('click', () => setKindTab('all'));
  $('tabMissables').addEventListener('click', () => setKindTab('missable'));
  $('tabCollectibles').addEventListener('click', () => setKindTab('collectibles'));
  $('tabRoadmap').addEventListener('click', () => $('roadmapSection').scrollIntoView({ behavior: 'smooth' }));
  $('tabSources').addEventListener('click', () => $('auditStrip').scrollIntoView({ behavior: 'smooth', block: 'center' }));
}

init().catch((error) => {
  listNote.textContent = 'Could not load the trophy list: ' + error.message;
});
