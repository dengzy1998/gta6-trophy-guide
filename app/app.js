// Leonida Nights — the GTA 6 trophy tracker.
// Loads app/data/trophies.json (a local file, no network), renders the
// checklist, saves progress in localStorage, and offers export/import.
// URL parameters are initial state only: ?view=roadmap, ?trophy=<id>,
// ?filter=<kind|grade>, ?spoilers=on|off, ?earned=<id,id,...>.

const STORE_KEY = 'leonida-nights-progress-v1';
const HIDDEN_NAME = 'Hidden story trophy';
const HIDDEN_DESC = 'Hidden story trophy — earn it to reveal';

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

const ROADMAP_STAGES = [
  {
    n: 1,
    title: 'Stage 1 — The story, chapters 1–4 + final mission',
    blurb: 'Play the story straight through, about 60–80 hours. Chapter trophies, the mission trophies and the final mission all unlock here and none can be missed. Do the meditation spots NOW: one is only open in Chapter 1.',
    stage: 1,
  },
  {
    n: 2,
    title: 'Stage 2 — Stranger & side-mission strands',
    blurb: 'Follow the stranger strands across Leonida: Andy, Kenton, Billy, Randy, Tyrone, Bret and Cal. Finish any 8 strands to their final missions.',
    stage: 2,
  },
  {
    n: 3,
    title: 'Stage 3 — Activities & counts',
    blurb: 'The long grind: 250 stunts, gold in all 42 Shooting Range challenges, drone race wins at every location, 20 races, 50 challenges, 100 vehicles, 100 WAiNK locations, 3 card sets, 10 Scooter Bros registrations.',
    stage: 3,
  },
  {
    n: 4,
    title: 'Stage 4 — Crime & robberies',
    blurb: 'Bank vaults, the armored truck, the jewelry store, the shops, the illegal operations and the marked-bill laundering. Keep your getaway planned before each job.',
    stage: 4,
  },
  {
    n: 5,
    title: 'Stage 5 — Cleanup + 100% completion',
    blurb: 'Explore every area of Leonida, finish the last collectibles, then check the in-game completion tracker until it reads 100% — that earns A Long Road, and the Platinum follows.',
    stage: 5,
  },
];

// --- State -------------------------------------------------------------------
const params = new URLSearchParams(location.search);
let earned = new Set();
try {
  earned = new Set(JSON.parse(localStorage.getItem(STORE_KEY) ?? '[]'));
} catch {
  earned = new Set();
}
if (params.get('earned')) {
  earned = new Set(
    params.get('earned').split(',').map((s) => Number(s.trim())).filter((n) => Number.isInteger(n)),
  );
  saveProgress();
}
let spoilersOn = params.get('spoilers') ? params.get('spoilers') !== 'off' : true;
let selectedId = params.get('trophy') ? Number(params.get('trophy')) : null;
let view = params.get('view') === 'roadmap' ? 'roadmap' : 'checklist';
let filterKind = 'all';
let filterGrade = 'all';
if (params.get('filter')) {
  const f = params.get('filter');
  const kinds = ['story', 'missable', 'collectibles', 'activities', 'crime', 'hidden'];
  const grades = ['platinum', 'gold', 'silver', 'bronze'];
  if (kinds.includes(f)) filterKind = f;
  if (grades.includes(f)) filterGrade = f;
}

// --- Elements ----------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const detailEl = $('detail');
const searchEl = $('search');
const kindEl = $('kindFilter');
const gradeEl = $('gradeFilter');
const earnedEl = $('earnedFilter');
const spoilerEl = $('spoilerToggle');

kindEl.value = filterKind;
gradeEl.value = filterGrade;
spoilerEl.checked = spoilersOn;

function saveProgress() {
  localStorage.setItem(STORE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function isHidden(t) {
  return spoilersOn && t.kind === 'story' && !earned.has(t.id);
}

function displayName(t) {
  return isHidden(t) ? HIDDEN_NAME : t.name;
}

function displayDesc(t) {
  return isHidden(t) ? HIDDEN_DESC : t.description;
}

// --- Progress ------------------------------------------------------------------
function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  $('earnedCount').textContent = done;
  $('progressFill').style.width = `${Math.round((done / total) * 100)}%`;
  const byGrade = {};
  for (const t of trophies) {
    if (!byGrade[t.grade]) byGrade[t.grade] = [0, 0];
    byGrade[t.grade][1] += 1;
    if (earned.has(t.id)) byGrade[t.grade][0] += 1;
  }
  $('perGrade').textContent = ['platinum', 'gold', 'silver', 'bronze']
    .map((g) => `${byGrade[g][0]}/${byGrade[g][1]} ${g}`)
    .join(' · ');
}

// --- Checklist -----------------------------------------------------------------
function visibleTrophies() {
  const q = searchEl.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (filterKind !== 'all' && t.kind !== filterKind) return false;
    if (filterGrade !== 'all' && t.grade !== filterGrade) return false;
    if (earnedEl.value === 'earned' && !earned.has(t.id)) return false;
    if (earnedEl.value === 'unearned' && earned.has(t.id)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function gradeBadge(t) {
  const b = document.createElement('span');
  b.className = `grade-badge grade-${t.grade}`;
  b.textContent = t.grade;
  return b;
}

function renderList() {
  const shown = visibleTrophies();
  listEl.replaceChildren();
  $('emptyNote').hidden = shown.length !== 0;
  for (const t of shown) {
    const li = document.createElement('li');
    if (earned.has(t.id)) li.classList.add('earned');
    if (selectedId === t.id) li.classList.add('selected');

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Mark ${displayName(t)} as earned`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id);
      else earned.delete(t.id);
      saveProgress();
      renderProgress();
      renderList();
      renderDetail();
    });
    box.addEventListener('click', (e) => e.stopPropagation());

    const body = document.createElement('div');
    body.className = 'trophy-body';
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = displayName(t);
    if (t.missable) {
      const tag = document.createElement('span');
      tag.className = 'missable-tag';
      tag.textContent = 'Missable';
      name.append(tag);
    }
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = displayDesc(t);
    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    const bits = [`#${t.id}`, t.kind];
    if (t.chapter) bits.push(typeof t.chapter === 'number' ? `Chapter ${t.chapter}` : 'Final mission');
    if (t.missable) bits.push('only missable trophy');
    meta.textContent = bits.join(' · ');
    body.append(name, desc, meta);

    li.append(box, body, gradeBadge(t));
    li.addEventListener('click', () => {
      selectedId = selectedId === t.id ? null : t.id;
      renderList();
      renderDetail();
    });
    listEl.append(li);
  }
}

// --- Detail panel --------------------------------------------------------------
function renderDetail() {
  const t = trophies.find((x) => x.id === selectedId);
  if (!t) {
    detailEl.hidden = true;
    detailEl.replaceChildren();
    return;
  }
  detailEl.hidden = false;
  detailEl.replaceChildren();

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'close-btn';
  close.textContent = 'Close';
  close.addEventListener('click', () => {
    selectedId = null;
    renderList();
    renderDetail();
  });

  const title = document.createElement('h2');
  title.textContent = displayName(t);
  const desc = document.createElement('p');
  desc.className = 'detail-desc';
  desc.textContent = displayDesc(t);
  const meta = document.createElement('div');
  meta.className = 'detail-meta';
  meta.append(gradeBadge(t));
  meta.append(document.createTextNode(`  #${t.id} · ${t.kind}`));
  if (t.missable) meta.append(document.createTextNode(' · MISSABLE — do it in Chapter 1'));

  detailEl.append(close, title, desc, meta);

  if (isHidden(t)) {
    const note = document.createElement('p');
    note.textContent = 'The guide for this story trophy is hidden while the spoiler setting is on. Earn the trophy, or switch spoilers off, to read it.';
    detailEl.append(note);
  } else {
    const h = document.createElement('h3');
    h.textContent = 'Guide';
    const guide = document.createElement('p');
    guide.textContent = t.guide;
    const sh = document.createElement('h3');
    sh.textContent = 'Sources';
    const ul = document.createElement('ul');
    for (const s of t.sources ?? []) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.name;
      a.target = '_blank';
      a.rel = 'noopener';
      li.append(a);
      ul.append(li);
    }
    detailEl.append(h, guide, sh, ul);
  }

  const earnBtn = document.createElement('button');
  earnBtn.type = 'button';
  earnBtn.className = 'earn-btn';
  earnBtn.textContent = earned.has(t.id) ? 'Mark as not earned' : 'Mark as earned';
  earnBtn.addEventListener('click', () => {
    if (earned.has(t.id)) earned.delete(t.id);
    else earned.add(t.id);
    saveProgress();
    renderProgress();
    renderList();
    renderDetail();
  });
  detailEl.append(earnBtn);
}

// --- Roadmap -------------------------------------------------------------------
function renderRoadmap() {
  const wrap = $('roadmapStages');
  wrap.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const card = document.createElement('div');
    card.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = stage.title;
    const p = document.createElement('p');
    p.textContent = stage.blurb;
    const ul = document.createElement('ul');
    const members = trophies.filter((t) => t.stage === stage.n);
    for (const t of members) {
      const li = document.createElement('li');
      li.textContent = `${earned.has(t.id) ? '✓ ' : ''}${displayName(t)} (${t.grade})`;
      ul.append(li);
    }
    const count = document.createElement('p');
    count.className = 'stage-count';
    count.textContent = `${members.filter((t) => earned.has(t.id)).length} of ${members.length} earned in this stage`;
    card.append(h, p, ul, count);
    wrap.append(card);
  }
}

// --- Views -----------------------------------------------------------------------
function setView(v) {
  view = v;
  $('checklistView').hidden = v !== 'checklist';
  $('roadmapView').hidden = v !== 'roadmap';
  $('viewChecklistBtn').classList.toggle('active', v === 'checklist');
  $('viewRoadmapBtn').classList.toggle('active', v === 'roadmap');
  if (v === 'roadmap') renderRoadmap();
}

$('viewChecklistBtn').addEventListener('click', () => setView('checklist'));
$('viewRoadmapBtn').addEventListener('click', () => setView('roadmap'));

// --- Controls --------------------------------------------------------------------
searchEl.addEventListener('input', renderList);
kindEl.addEventListener('change', () => {
  filterKind = kindEl.value;
  renderList();
});
gradeEl.addEventListener('change', () => {
  filterGrade = gradeEl.value;
  renderList();
});
earnedEl.addEventListener('change', renderList);
spoilerEl.addEventListener('change', () => {
  spoilersOn = spoilerEl.checked;
  renderList();
  renderDetail();
  renderRoadmap();
});

$('exportBtn').addEventListener('click', () => {
  const payload = {
    game: 'Grand Theft Auto VI',
    exported: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
  };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

$('importInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned;
    const valid = new Set(trophies.map((t) => t.id));
    earned = new Set(ids.filter((n) => valid.has(n)));
    saveProgress();
    renderProgress();
    renderList();
    renderDetail();
    renderRoadmap();
  } catch {
    alert('That file is not a valid Leonida Nights progress export.');
  }
  e.target.value = '';
});

// --- Boot ------------------------------------------------------------------------
renderProgress();
renderList();
renderDetail();
renderRoadmap();
setView(view);
