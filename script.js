// ===== Age Gate =====
const ageGate = document.getElementById('age-gate');
const mainContent = document.getElementById('main-content');
const btnYes = document.getElementById('btn-yes');
const btnNo = document.getElementById('btn-no');

const AGE_KEY = 'porno_online_18';

if (localStorage.getItem(AGE_KEY) === 'yes') {
  showMain();
}

btnYes.addEventListener('click', () => {
  localStorage.setItem(AGE_KEY, 'yes');
  showMain();
});

btnNo.addEventListener('click', () => {
  window.location.href = 'https://www.google.com';
});

function showMain() {
  ageGate.classList.add('hidden');
  mainContent.classList.remove('hidden');
  loadVideos();
}

// ===== Load Videos from JSON =====
let allVideos = [];
let currentCategory = 'all';

async function loadVideos() {
  try {
    const res = await fetch('videos.json?t=' + Date.now());
    allVideos = await res.json();
    buildCategories();
    renderVideos(allVideos);
  } catch (e) {
    document.getElementById('video-grid').innerHTML =
      '<p style="color:#e74c3c;grid-column:1/-1;text-align:center;padding:40px;">Ошибка загрузки videos.json. Проверьте файл.</p>';
  }
}

function buildCategories() {
  const cats = new Set();
  allVideos.forEach(v => {
    if (v.category) cats.add(v.category);
  });

  const nav = document.getElementById('categories');
  // Keep "Все"
  cats.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'cat-btn';
    btn.dataset.cat = cat;
    btn.textContent = cat;
    btn.addEventListener('click', () => filterByCategory(cat));
    nav.appendChild(btn);
  });

  // All button
  nav.querySelector('[data-cat="all"]').addEventListener('click', () => filterByCategory('all'));
}

function filterByCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.cat === cat);
  });
  applyFilters();
}

function applyFilters() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  let filtered = allVideos;

  if (currentCategory !== 'all') {
    filtered = filtered.filter(v => v.category === currentCategory);
  }
  if (query) {
    filtered = filtered.filter(v =>
      (v.title || '').toLowerCase().includes(query) ||
      (v.category || '').toLowerCase().includes(query)
    );
  }

  renderVideos(filtered);
}

document.getElementById('search-input').addEventListener('input', applyFilters);

function renderVideos(list) {
  const grid = document.getElementById('video-grid');
  const noRes = document.getElementById('no-results');

  grid.innerHTML = '';
  if (list.length === 0) {
    noRes.classList.remove('hidden');
    return;
  }
  noRes.classList.add('hidden');

  list.forEach((video, idx) => {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.index = allVideos.indexOf(video);

    const thumb = video.thumbnail
      ? `<img src="${escapeHtml(video.thumbnail)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'thumb-placeholder\\'>▶</div>'">`
      : `<div class="thumb-placeholder">▶</div>`;

    const duration = video.duration
      ? `<span class="duration">${escapeHtml(video.duration)}</span>`
      : '';

    card.innerHTML = `
      <div class="thumb-wrap">
        ${thumb}
        ${duration}
      </div>
      <div class="card-info">
        <div class="card-title">${escapeHtml(video.title || 'Без названия')}</div>
        ${video.category ? `<div class="card-cat">${escapeHtml(video.category)}</div>` : ''}
      </div>
    `;

    card.addEventListener('click', () => openPlayer(video));
    grid.appendChild(card);
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== Player =====
const modal = document.getElementById('player-modal');
const playerContainer = document.getElementById('player-container');
const playerTitle = document.getElementById('player-title');

function openPlayer(video) {
  playerTitle.textContent = video.title || 'Видео';
  playerContainer.innerHTML = '';

  const url = video.url || '';

  // Direct video file (mp4, webm, m3u8 etc.)
  if (/\.(mp4|webm|ogg|m3u8)(\?|$)/i.test(url) || video.type === 'video') {
    const videoEl = document.createElement('video');
    videoEl.src = url;
    videoEl.controls = true;
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    playerContainer.appendChild(videoEl);
  }
  // iframe embed (most porn tubes, Google Drive, etc.)
  else {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.allow = 'autoplay; fullscreen; encrypted-media';
    iframe.allowFullscreen = true;
    iframe.setAttribute('frameborder', '0');
    playerContainer.appendChild(iframe);
  }

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

document.getElementById('close-player').addEventListener('click', closePlayer);
document.querySelector('.player-overlay').addEventListener('click', closePlayer);

function closePlayer() {
  modal.classList.add('hidden');
  playerContainer.innerHTML = '';
  document.body.style.overflow = '';
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closePlayer();
});
