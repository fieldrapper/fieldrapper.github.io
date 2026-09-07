const NEWS_PASSWORD = '102710jf-00';

const store = {
  user: null,
  users: {},
  posts: [],
  channels: [],
  channelPosts: {},
  tracks: [],
  news: [],
  dms: {}
};

// ---------- init ----------
document.addEventListener('DOMContentLoaded', () => {
  load();
  seed();
  bind();
  route('home');
  refreshAll();
});

function load() {
  try {
    store.user = JSON.parse(localStorage.getItem('f_user'));
    store.users = JSON.parse(localStorage.getItem('f_users')) || {};
    store.posts = JSON.parse(localStorage.getItem('f_posts')) || [];
    store.channels = JSON.parse(localStorage.getItem('f_channels')) || [];
    store.channelPosts = JSON.parse(localStorage.getItem('f_cposts')) || {};
    store.tracks = JSON.parse(localStorage.getItem('f_tracks')) || [];
    store.news = JSON.parse(localStorage.getItem('f_news')) || [];
    store.dms = JSON.parse(localStorage.getItem('f_dms')) || {};
  } catch (_) {}
}

function save() {
  localStorage.setItem('f_user', JSON.stringify(store.user));
  localStorage.setItem('f_users', JSON.stringify(store.users));
  localStorage.setItem('f_posts', JSON.stringify(store.posts));
  localStorage.setItem('f_channels', JSON.stringify(store.channels));
  localStorage.setItem('f_cposts', JSON.stringify(store.channelPosts));
  localStorage.setItem('f_tracks', JSON.stringify(store.tracks));
  localStorage.setItem('f_news', JSON.stringify(store.news));
  localStorage.setItem('f_dms', JSON.stringify(store.dms));
}

function seed() {
  if (store.posts.length === 0) {
    store.posts = [{
      id: 1, author: 'Field', text: 'Welcome to the official Field hub.\nChannels · Music · News · DMs — it all lives here.',
      ts: Date.now() - 86400000, media: null, isNews: false
    }];
  }
  if (store.channels.length === 0) {
    store.channels = [
      { id: 'bars', name: 'bars', desc: 'Drop freestyles and punchlines', creator: 'Field' },
      { id: 'shows', name: 'shows', desc: 'Tour dates, tickets, afterparties', creator: 'Field' },
      { id: 'beats', name: 'beats', desc: 'Instrumentals and production talk', creator: 'Field' }
    ];
    store.channelPosts = {
      bars: [{ id: 1, author: 'Field', text: 'Channel open. Drop your best 4 bars.', ts: Date.now() - 3600000 }],
      shows: [],
      beats: []
    };
  }
  save();
}

// ---------- routing ----------
function route(id) {
  document.querySelectorAll('.section-panel').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(a => {
    a.classList.toggle('active', a.dataset.section === id);
  });
  window.scrollTo(0, 0);
}

// ---------- bind ----------
function bind() {
  // nav
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => route(b.dataset.go)));
  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      route(a.dataset.section);
    });
  });
  document.querySelectorAll('.footer-links a').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      if (a.dataset.go) route(a.dataset.go);
    });
  });

  // mobile
  document.getElementById('mobileToggle').addEventListener('click', () => {
    const links = document.querySelector('.nav-links');
    const open = links.style.display === 'flex';
    links.style.display = open ? 'none' : 'flex';
    if (!open) {
      Object.assign(links.style, {
        flexDirection: 'column', position: 'absolute', top: '60px', left: 0, right: 0,
        background: 'rgba(7,7,12,0.97)', padding: '1rem', gap: '0.75rem', zIndex: 99
      });
    }
  });

  // auth
  document.getElementById('loginBtn').onclick = () => openModal('authModal', 'login');
  document.getElementById('registerBtn').onclick = () => openModal('authModal', 'register');
  document.getElementById('logoutBtn').onclick = () => {
    store.user = null; save(); updateAuth(); toast('Logged out');
  };
  document.querySelectorAll('.tab').forEach(t => t.onclick = () => switchTab(t.dataset.tab));
  document.getElementById('loginForm').onsubmit = handleLogin;
  document.getElementById('registerForm').onsubmit = handleRegister;

  // modals close
  document.querySelectorAll('[data-close]').forEach(b => {
    b.onclick = () => document.getElementById(b.dataset.close).classList.add('hidden');
  });
  document.querySelectorAll('.modal-backdrop').forEach(b => {
    b.onclick = () => b.parentElement.classList.add('hidden');
  });

  // feed post
  document.getElementById('newPostBtn').onclick = () => {
    if (!requireAuth()) return;
    document.getElementById('postPreview').innerHTML = '';
    document.getElementById('postForm').reset();
    openModal('postModal');
  };
  document.getElementById('postForm').onsubmit = handlePost;
  document.getElementById('postImage').onchange = e => previewFile(e.target.files[0], 'image');
  document.getElementById('postAudio').onchange = e => previewFile(e.target.files[0], 'audio');
  document.getElementById('postFile').onchange = e => previewFile(e.target.files[0], 'file');

  // channels
  document.getElementById('newChannelBtn').onclick = () => {
    if (!requireAuth()) return;
    openModal('channelModal');
  };
  document.getElementById('channelForm').onsubmit = handleCreateChannel;
  document.getElementById('channelPostForm').onsubmit = handleChannelPost;

  // music
  document.getElementById('uploadMusicBtn').onclick = () => {
    if (!requireAuth()) return;
    document.getElementById('musicFileInput').click();
  };
  document.getElementById('musicFileInput').onchange = handleMusicUpload;

  // news
  document.getElementById('newsUnlockBtn').onclick = () => openModal('passModal');
  document.getElementById('passForm').onsubmit = handleNewsPass;
  document.getElementById('publishNewsBtn').onclick = handlePublishNews;

  // dms
  document.getElementById('newDmBtn').onclick = () => {
    if (!requireAuth()) return;
    openModal('dmModal');
  };
  document.getElementById('dmForm').onsubmit = handleNewDm;
}

// ---------- auth ----------
function openModal(id, tab) {
  document.getElementById(id).classList.remove('hidden');
  if (tab) switchTab(tab);
}
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === tab));
  document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
  document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
}
function requireAuth() {
  if (store.user) return true;
  toast('Login first', 'err');
  openModal('authModal', 'login');
  return false;
}
function updateAuth() {
  const login = document.getElementById('loginBtn');
  const reg = document.getElementById('registerBtn');
  const menu = document.getElementById('userMenu');
  if (store.user) {
    login.classList.add('hidden'); reg.classList.add('hidden');
    menu.classList.remove('hidden');
    document.getElementById('userDisplay').textContent = store.user.username;
  } else {
    login.classList.remove('hidden'); reg.classList.remove('hidden');
    menu.classList.add('hidden');
  }
}
function handleLogin(e) {
  e.preventDefault();
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  if (store.users[u] && store.users[u].password === p) {
    store.user = { username: u, email: store.users[u].email };
    save(); updateAuth();
    document.getElementById('authModal').classList.add('hidden');
    toast('Welcome back, ' + u);
    e.target.reset();
  } else toast('Wrong username or password', 'err');
}
function handleRegister(e) {
  e.preventDefault();
  const u = document.getElementById('regUser').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const p = document.getElementById('regPass').value;
  const p2 = document.getElementById('regPass2').value;
  if (p !== p2) return toast('Passwords do not match', 'err');
  if (store.users[u]) return toast('Username taken', 'err');
  store.users[u] = { email, password: p };
  store.user = { username: u, email };
  save(); updateAuth();
  document.getElementById('authModal').classList.add('hidden');
  toast('Welcome to The Field, ' + u);
  e.target.reset();
  refreshStats();
}

// ---------- file helpers ----------
function readAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
function formatSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}
function timeAgo(ts) {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000), h = Math.floor(d / 3600000), days = Math.floor(d / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return m + 'm ago';
  if (h < 24) return h + 'h ago';
  if (days < 7) return days + 'd ago';
  return new Date(ts).toLocaleDateString();
}
function esc(s) {
  const d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}
function toast(msg, type = 'ok') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  setTimeout(() => t.classList.add('hidden'), 2800);
}

// ---------- post media preview ----------
let pendingMedia = null;
async function previewFile(file, kind) {
  if (!file) return;
  const box = document.getElementById('postPreview');
  if (kind === 'image') {
    const url = await readAsDataURL(file);
    pendingMedia = { type: 'image', name: file.name, size: file.size, data: url };
    box.innerHTML = `<img src="${url}" alt="preview">`;
  } else if (kind === 'audio') {
    const url = await readAsDataURL(file);
    pendingMedia = { type: 'audio', name: file.name, size: file.size, data: url };
    box.innerHTML = `<audio controls src="${url}"></audio><div class="muted" style="margin-top:0.4rem;font-size:0.85rem">${esc(file.name)}</div>`;
  } else {
    const url = await readAsDataURL(file);
    pendingMedia = { type: 'file', name: file.name, size: file.size, data: url };
    box.innerHTML = `<div class="post-file"><i class="fas fa-file"></i> ${esc(file.name)} (${formatSize(file.size)})</div>`;
  }
}

// ---------- feed ----------
async function handlePost(e) {
  e.preventDefault();
  if (!store.user) return;
  const text = document.getElementById('postText').value.trim();
  if (!text && !pendingMedia) return toast('Write something or add media', 'err');

  store.posts.unshift({
    id: Date.now(),
    author: store.user.username,
    text,
    media: pendingMedia,
    ts: Date.now(),
    isNews: false
  });
  pendingMedia = null;
  save();
  renderFeed();
  refreshStats();
  document.getElementById('postModal').classList.add('hidden');
  document.getElementById('postForm').reset();
  document.getElementById('postPreview').innerHTML = '';
  toast('Posted to Feed');
}

function renderFeed() {
  const list = document.getElementById('feedList');
  const empty = document.getElementById('feedEmpty');
  if (!store.posts.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  list.innerHTML = store.posts.map(p => {
    let media = '';
    if (p.media) {
      if (p.media.type === 'image') {
        media = `<div class="post-media"><img src="${p.media.data}" alt="${esc(p.media.name)}"></div>`;
      } else if (p.media.type === 'audio') {
        media = `<div class="post-media"><audio controls src="${p.media.data}"></audio></div>`;
      } else if (p.media.type === 'file') {
        media = `<a class="post-file" href="${p.media.data}" download="${esc(p.media.name)}"><i class="fas fa-download"></i> ${esc(p.media.name)} (${formatSize(p.media.size)})</a>`;
      }
    }
    return `<article class="post-card">
      <div class="post-top">
        <div class="post-user">
          <div class="avatar">${p.author.charAt(0).toUpperCase()}</div>
          <div><strong>${esc(p.author)}</strong><span>${timeAgo(p.ts)}</span></div>
        </div>
        ${p.isNews ? '<span class="badge-news">News</span>' : ''}
      </div>
      ${p.text ? `<div class="post-body">${esc(p.text)}</div>` : ''}
      ${media}
    </article>`;
  }).join('');
}

// ---------- channels ----------
function renderChannels() {
  const list = document.getElementById('channelList');
  list.innerHTML = store.channels.map(c =>
    `<button class="channel-item" data-id="${c.id}">f/${esc(c.name)}</button>`
  ).join('') || '<p class="muted" style="padding:0.5rem">No channels yet</p>';

  list.querySelectorAll('.channel-item').forEach(btn => {
    btn.onclick = () => openChannel(btn.dataset.id);
  });
}

function openChannel(id) {
  const ch = store.channels.find(c => c.id === id);
  if (!ch) return;
  document.querySelectorAll('.channel-item').forEach(b => b.classList.toggle('active', b.dataset.id === id));
  const posts = store.channelPosts[id] || [];
  const view = document.getElementById('channelView');
  view.innerHTML = `
    <div class="channel-head">
      <div>
        <h3>f/${esc(ch.name)}</h3>
        <p>${esc(ch.desc || '')}</p>
      </div>
      <button class="btn-primary sm" id="chPostBtn"><i class="fas fa-plus"></i> Post</button>
    </div>
    <div class="channel-posts">
      ${posts.length ? posts.map(p => `
        <div class="post-card">
          <div class="post-top">
            <div class="post-user">
              <div class="avatar">${p.author.charAt(0).toUpperCase()}</div>
              <div><strong>${esc(p.author)}</strong><span>${timeAgo(p.ts)}</span></div>
            </div>
          </div>
          <div class="post-body">${esc(p.text)}</div>
        </div>
      `).join('') : '<div class="empty-state"><p>No posts in this channel yet.</p></div>'}
    </div>`;
  document.getElementById('chPostBtn').onclick = () => {
    if (!requireAuth()) return;
    document.getElementById('channelPostId').value = id;
    document.getElementById('channelPostText').value = '';
    openModal('channelPostModal');
  };
}

function handleCreateChannel(e) {
  e.preventDefault();
  if (!store.user) return;
  const name = document.getElementById('channelName').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const desc = document.getElementById('channelDesc').value.trim();
  if (!name) return toast('Name required', 'err');
  if (store.channels.some(c => c.id === name)) return toast('Channel exists', 'err');
  store.channels.unshift({ id: name, name, desc, creator: store.user.username });
  store.channelPosts[name] = [];
  save();
  renderChannels();
  refreshStats();
  document.getElementById('channelModal').classList.add('hidden');
  e.target.reset();
  toast('Channel f/' + name + ' created');
  openChannel(name);
}

function handleChannelPost(e) {
  e.preventDefault();
  if (!store.user) return;
  const id = document.getElementById('channelPostId').value;
  const text = document.getElementById('channelPostText').value.trim();
  if (!text) return;
  if (!store.channelPosts[id]) store.channelPosts[id] = [];
  store.channelPosts[id].unshift({
    id: Date.now(), author: store.user.username, text, ts: Date.now()
  });
  save();
  openChannel(id);
  document.getElementById('channelPostModal').classList.add('hidden');
  toast('Posted in f/' + id);
}

// ---------- music ----------
async function handleMusicUpload(e) {
  const files = Array.from(e.target.files || []);
  if (!files.length || !store.user) return;
  for (const file of files) {
    if (!file.type.startsWith('audio/')) continue;
    const data = await readAsDataURL(file);
    store.tracks.unshift({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      data,
      by: store.user.username,
      ts: Date.now()
    });
    // also drop a feed post
    store.posts.unshift({
      id: Date.now() + Math.random(),
      author: store.user.username,
      text: '🎵 New track: ' + file.name,
      media: { type: 'audio', name: file.name, size: file.size, data },
      ts: Date.now(),
      isNews: false
    });
  }
  save();
  renderMusic();
  renderFeed();
  refreshStats();
  e.target.value = '';
  toast('Track uploaded & playable');
}

function renderMusic() {
  const grid = document.getElementById('musicGrid');
  const empty = document.getElementById('musicEmpty');
  if (!store.tracks.length) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  grid.innerHTML = store.tracks.map(t => `
    <div class="track-card">
      <div class="track-top">
        <div class="track-icon"><i class="fas fa-music"></i></div>
        <div class="track-meta">
          <strong title="${esc(t.name)}">${esc(t.name)}</strong>
          <span>${esc(t.by)} · ${formatSize(t.size)}</span>
        </div>
      </div>
      <audio controls preload="metadata" src="${t.data}"></audio>
      <a class="post-file" href="${t.data}" download="${esc(t.name)}"><i class="fas fa-download"></i> Download</a>
    </div>
  `).join('');
}

// ---------- news ----------
function handleNewsPass(e) {
  e.preventDefault();
  const pass = document.getElementById('newsPass').value;
  if (pass === NEWS_PASSWORD) {
    document.getElementById('passModal').classList.add('hidden');
    document.getElementById('newsFormWrap').classList.remove('hidden');
    document.getElementById('newsUnlockBtn').classList.add('hidden');
    toast('News desk unlocked');
  } else {
    toast('Wrong password', 'err');
    document.getElementById('newsPass').value = '';
  }
}

function handlePublishNews() {
  const title = document.getElementById('newsTitle').value.trim();
  const body = document.getElementById('newsBody').value.trim();
  const toFeed = document.getElementById('newsToFeed').checked;
  if (!title || !body) return toast('Title and body required', 'err');

  store.news.unshift({
    id: Date.now(),
    title, body,
    author: store.user ? store.user.username : 'Field',
    ts: Date.now()
  });
  if (toFeed) {
    store.posts.unshift({
      id: Date.now() + 1,
      author: store.user ? store.user.username : 'Field',
      text: '📰 ' + title + '\n\n' + body,
      media: null,
      ts: Date.now(),
      isNews: true
    });
  }
  // re-lock
  document.getElementById('newsFormWrap').classList.add('hidden');
  document.getElementById('newsUnlockBtn').classList.remove('hidden');
  document.getElementById('newsTitle').value = '';
  document.getElementById('newsBody').value = '';
  save();
  renderNews();
  renderFeed();
  toast(toFeed ? 'News published + Feed' : 'News published');
}

function renderNews() {
  const list = document.getElementById('newsList');
  const empty = document.getElementById('newsEmpty');
  if (!store.news.length) {
    list.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  list.innerHTML = store.news.map(n => `
    <article class="news-card">
      <h3>${esc(n.title)}</h3>
      <div class="meta">${esc(n.author)} · ${timeAgo(n.ts)}</div>
      <p>${esc(n.body)}</p>
    </article>
  `).join('');
}

// ---------- DMs ----------
let activeDm = null;

function dmKey(a, b) {
  return [a, b].sort().join('__');
}

function handleNewDm(e) {
  e.preventDefault();
  if (!store.user) return;
  const to = document.getElementById('dmTo').value.trim();
  const text = document.getElementById('dmText').value.trim();
  if (!to || !text) return;
  if (to === store.user.username) return toast('Cannot message yourself', 'err');
  // allow messaging even if user not registered yet (local demo)
  const key = dmKey(store.user.username, to);
  if (!store.dms[key]) store.dms[key] = { users: [store.user.username, to], messages: [] };
  store.dms[key].messages.push({
    from: store.user.username, text, ts: Date.now()
  });
  save();
  document.getElementById('dmModal').classList.add('hidden');
  e.target.reset();
  activeDm = key;
  renderDms();
  openDmThread(key);
  toast('Message sent');
}

function renderDms() {
  const box = document.getElementById('dmThreads');
  if (!store.user) {
    box.innerHTML = '<p class="muted" style="padding:0.5rem">Login to see DMs</p>';
    return;
  }
  const threads = Object.entries(store.dms).filter(([, v]) => v.users.includes(store.user.username));
  if (!threads.length) {
    box.innerHTML = '<p class="muted" style="padding:0.5rem">No messages yet</p>';
    return;
  }
  box.innerHTML = threads.map(([key, thr]) => {
    const other = thr.users.find(u => u !== store.user.username) || 'Unknown';
    const last = thr.messages[thr.messages.length - 1];
    return `<button class="dm-item ${activeDm === key ? 'active' : ''}" data-key="${key}">
      <strong>${esc(other)}</strong><br>
      <span style="font-size:0.75rem;opacity:0.7">${esc((last && last.text) || '').slice(0, 40)}</span>
    </button>`;
  }).join('');
  box.querySelectorAll('.dm-item').forEach(b => {
    b.onclick = () => { activeDm = b.dataset.key; openDmThread(b.dataset.key); renderDms(); };
  });
}

function openDmThread(key) {
  const thr = store.dms[key];
  const chat = document.getElementById('dmChat');
  if (!thr || !store.user) return;
  const other = thr.users.find(u => u !== store.user.username) || 'Unknown';
  chat.innerHTML = `
    <div style="margin-bottom:0.75rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border)">
      <strong>${esc(other)}</strong>
    </div>
    <div class="dm-messages" id="dmMsgs">
      ${thr.messages.map(m => `
        <div class="bubble ${m.from === store.user.username ? 'me' : 'them'}">${esc(m.text)}</div>
      `).join('')}
    </div>
    <form class="dm-compose" id="dmReplyForm">
      <input id="dmReply" placeholder="Type a message..." autocomplete="off">
      <button class="btn-primary sm" type="submit">Send</button>
    </form>`;
  const msgs = document.getElementById('dmMsgs');
  msgs.scrollTop = msgs.scrollHeight;
  document.getElementById('dmReplyForm').onsubmit = e => {
    e.preventDefault();
    const input = document.getElementById('dmReply');
    const text = input.value.trim();
    if (!text) return;
    store.dms[key].messages.push({ from: store.user.username, text, ts: Date.now() });
    save();
    openDmThread(key);
    renderDms();
  };
}

// ---------- stats + refresh ----------
function refreshStats() {
  document.getElementById('statUsers').textContent = Object.keys(store.users).length + 1;
  document.getElementById('statPosts').textContent = store.posts.length;
  document.getElementById('statTracks').textContent = store.tracks.length;
  document.getElementById('statChannels').textContent = store.channels.length;
}

function refreshAll() {
  updateAuth();
  renderFeed();
  renderChannels();
  renderMusic();
  renderNews();
  renderDms();
  refreshStats();
}
