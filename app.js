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

let pendingMedia = null;
let activeDm = null;

document.addEventListener('DOMContentLoaded', function () {
  try {
    load();
    seed();
    bind();
    route('home');
    refreshAll();
  } catch (err) {
    console.error('FIELD init error:', err);
    alert('Site error: ' + err.message + '\n\nClear site data for this page and refresh.');
  }
});

function safeParse(key, fallback) {
  try {
    var raw = localStorage.getItem(key);
    if (raw == null || raw === '' || raw === 'undefined') return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function load() {
  store.user = safeParse('f_user', null);
  store.users = safeParse('f_users', {});
  store.posts = safeParse('f_posts', []);
  store.channels = safeParse('f_channels', []);
  store.channelPosts = safeParse('f_cposts', {});
  store.tracks = safeParse('f_tracks', []);
  store.news = safeParse('f_news', []);
  store.dms = safeParse('f_dms', {});
}

function save() {
  try {
    localStorage.setItem('f_user', JSON.stringify(store.user));
    localStorage.setItem('f_users', JSON.stringify(store.users));
    localStorage.setItem('f_posts', JSON.stringify(store.posts));
    localStorage.setItem('f_channels', JSON.stringify(store.channels));
    localStorage.setItem('f_cposts', JSON.stringify(store.channelPosts));
    localStorage.setItem('f_tracks', JSON.stringify(store.tracks));
    localStorage.setItem('f_news', JSON.stringify(store.news));
    localStorage.setItem('f_dms', JSON.stringify(store.dms));
  } catch (err) {
    console.error('Save failed', err);
    toast('Storage full — try smaller files', 'err');
  }
}

function seed() {
  if (!Array.isArray(store.posts) || store.posts.length === 0) {
    store.posts = [{
      id: 1,
      author: 'Field',
      text: 'Welcome to the official Field hub.\nChannels · Music · News · DMs — it all lives here.',
      ts: Date.now() - 86400000,
      media: null,
      isNews: false
    }];
  }
  if (!Array.isArray(store.channels) || store.channels.length === 0) {
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

function route(id) {
  document.querySelectorAll('.section-panel').forEach(function (s) {
    s.classList.remove('active');
  });
  var el = document.getElementById(id);
  if (el) el.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(function (a) {
    a.classList.toggle('active', a.getAttribute('data-section') === id);
  });
  window.scrollTo(0, 0);
}

function $(id) {
  return document.getElementById(id);
}

function bind() {
  document.querySelectorAll('[data-go]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      route(btn.getAttribute('data-go'));
    });
  });

  document.querySelectorAll('.nav-link').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var sec = a.getAttribute('data-section');
      if (sec) route(sec);
    });
  });

  var mobileBtn = $('mobileToggle');
  if (mobileBtn) {
    mobileBtn.addEventListener('click', function () {
      var links = document.querySelector('.nav-links');
      if (!links) return;
      if (links.style.display === 'flex') {
        links.style.display = 'none';
      } else {
        links.style.display = 'flex';
        links.style.flexDirection = 'column';
        links.style.position = 'absolute';
        links.style.top = '60px';
        links.style.left = '0';
        links.style.right = '0';
        links.style.background = 'rgba(7,7,12,0.97)';
        links.style.padding = '1rem';
        links.style.gap = '0.75rem';
        links.style.zIndex = '99';
      }
    });
  }

  $('loginBtn').addEventListener('click', function () { openModal('authModal', 'login'); });
  $('registerBtn').addEventListener('click', function () { openModal('authModal', 'register'); });
  $('logoutBtn').addEventListener('click', function () {
    store.user = null;
    save();
    updateAuth();
    toast('Logged out');
  });

  document.querySelectorAll('.tab').forEach(function (t) {
    t.addEventListener('click', function () { switchTab(t.getAttribute('data-tab')); });
  });

  $('loginForm').addEventListener('submit', handleLogin);
  $('registerForm').addEventListener('submit', handleRegister);

  document.querySelectorAll('[data-close]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var id = btn.getAttribute('data-close');
      if ($(id)) $(id).classList.add('hidden');
    });
  });
  document.querySelectorAll('.modal-backdrop').forEach(function (bd) {
    bd.addEventListener('click', function () { bd.parentElement.classList.add('hidden'); });
  });

  $('newPostBtn').addEventListener('click', function () {
    if (!requireAuth()) return;
    pendingMedia = null;
    $('postPreview').innerHTML = '';
    $('postForm').reset();
    openModal('postModal');
  });
  $('postForm').addEventListener('submit', handlePost);
  $('postImage').addEventListener('change', function (e) { previewFile(e.target.files[0], 'image'); });
  $('postAudio').addEventListener('change', function (e) { previewFile(e.target.files[0], 'audio'); });
  $('postFile').addEventListener('change', function (e) { previewFile(e.target.files[0], 'file'); });

  $('newChannelBtn').addEventListener('click', function () {
    if (!requireAuth()) return;
    openModal('channelModal');
  });
  $('channelForm').addEventListener('submit', handleCreateChannel);
  $('channelPostForm').addEventListener('submit', handleChannelPost);

  $('uploadMusicBtn').addEventListener('click', function () {
    if (!requireAuth()) return;
    $('musicFileInput').click();
  });
  $('musicFileInput').addEventListener('change', handleMusicUpload);

  $('newsUnlockBtn').addEventListener('click', function () { openModal('passModal'); });
  $('passForm').addEventListener('submit', handleNewsPass);
  $('publishNewsBtn').addEventListener('click', handlePublishNews);

  $('newDmBtn').addEventListener('click', function () {
    if (!requireAuth()) return;
    openModal('dmModal');
  });
  $('dmForm').addEventListener('submit', handleNewDm);
}

function openModal(id, tab) {
  var m = $(id);
  if (!m) return;
  m.classList.remove('hidden');
  if (tab) switchTab(tab);
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(function (t) {
    t.classList.toggle('on', t.getAttribute('data-tab') === tab);
  });
  $('loginForm').classList.toggle('hidden', tab !== 'login');
  $('registerForm').classList.toggle('hidden', tab !== 'register');
}

function requireAuth() {
  if (store.user) return true;
  toast('Login first', 'err');
  openModal('authModal', 'login');
  return false;
}

function updateAuth() {
  if (store.user) {
    $('loginBtn').classList.add('hidden');
    $('registerBtn').classList.add('hidden');
    $('userMenu').classList.remove('hidden');
    $('userDisplay').textContent = store.user.username;
  } else {
    $('loginBtn').classList.remove('hidden');
    $('registerBtn').classList.remove('hidden');
    $('userMenu').classList.add('hidden');
  }
}

function handleLogin(e) {
  e.preventDefault();
  var u = $('loginUser').value.trim();
  var p = $('loginPass').value;
  if (store.users[u] && store.users[u].password === p) {
    store.user = { username: u, email: store.users[u].email };
    save();
    updateAuth();
    $('authModal').classList.add('hidden');
    toast('Welcome back, ' + u);
    e.target.reset();
  } else {
    toast('Wrong username or password', 'err');
  }
}

function handleRegister(e) {
  e.preventDefault();
  var u = $('regUser').value.trim();
  var email = $('regEmail').value.trim();
  var p = $('regPass').value;
  var p2 = $('regPass2').value;
  if (p !== p2) return toast('Passwords do not match', 'err');
  if (u.length < 3) return toast('Username too short', 'err');
  if (store.users[u]) return toast('Username taken', 'err');
  store.users[u] = { email: email, password: p };
  store.user = { username: u, email: email };
  save();
  updateAuth();
  $('authModal').classList.add('hidden');
  toast('Welcome to The Field, ' + u);
  e.target.reset();
  refreshStats();
}

function readAsDataURL(file) {
  return new Promise(function (resolve, reject) {
    var r = new FileReader();
    r.onload = function () { resolve(r.result); };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function formatSize(b) {
  if (!b && b !== 0) return '';
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(1) + ' MB';
}

function timeAgo(ts) {
  var d = Date.now() - ts;
  var m = Math.floor(d / 60000);
  var h = Math.floor(d / 3600000);
  var days = Math.floor(d / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return m + 'm ago';
  if (h < 24) return h + 'h ago';
  if (days < 7) return days + 'd ago';
  return new Date(ts).toLocaleDateString();
}

function esc(s) {
  var d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

function toast(msg, type) {
  var t = $('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = 'toast ' + (type === 'err' ? 'err' : 'ok');
  clearTimeout(t._timer);
  t._timer = setTimeout(function () { t.classList.add('hidden'); }, 2800);
}

function previewFile(file, kind) {
  if (!file) return;
  var box = $('postPreview');
  readAsDataURL(file).then(function (url) {
    if (kind === 'image') {
      pendingMedia = { type: 'image', name: file.name, size: file.size, data: url };
      box.innerHTML = '<img src="' + url + '" alt="preview">';
    } else if (kind === 'audio') {
      pendingMedia = { type: 'audio', name: file.name, size: file.size, data: url };
      box.innerHTML = '<audio controls src="' + url + '"></audio><div class="muted" style="margin-top:0.4rem;font-size:0.85rem">' + esc(file.name) + '</div>';
    } else {
      pendingMedia = { type: 'file', name: file.name, size: file.size, data: url };
      box.innerHTML = '<div class="post-file"><i class="fas fa-file"></i> ' + esc(file.name) + ' (' + formatSize(file.size) + ')</div>';
    }
  }).catch(function () {
    toast('Could not read file', 'err');
  });
}

function handlePost(e) {
  e.preventDefault();
  if (!store.user) return;
  var text = $('postText').value.trim();
  if (!text && !pendingMedia) return toast('Write something or add media', 'err');

  store.posts.unshift({
    id: Date.now(),
    author: store.user.username,
    text: text,
    media: pendingMedia,
    ts: Date.now(),
    isNews: false
  });
  pendingMedia = null;
  save();
  renderFeed();
  refreshStats();
  $('postModal').classList.add('hidden');
  $('postForm').reset();
  $('postPreview').innerHTML = '';
  toast('Posted to Feed');
}

function renderFeed() {
  var list = $('feedList');
  var empty = $('feedEmpty');
  if (!list) return;
  if (!store.posts.length) {
    list.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');
  list.innerHTML = store.posts.map(function (p) {
    var media = '';
    if (p.media) {
      if (p.media.type === 'image' && p.media.data) {
        media = '<div class="post-media"><img src="' + p.media.data + '" alt="' + esc(p.media.name) + '"></div>';
      } else if (p.media.type === 'audio' && p.media.data) {
        media = '<div class="post-media"><audio controls src="' + p.media.data + '"></audio></div>';
      } else if (p.media.type === 'file' && p.media.data) {
        media = '<a class="post-file" href="' + p.media.data + '" download="' + esc(p.media.name) + '"><i class="fas fa-download"></i> ' + esc(p.media.name) + ' (' + formatSize(p.media.size) + ')</a>';
      }
    }
    return '<article class="post-card">' +
      '<div class="post-top"><div class="post-user">' +
      '<div class="avatar">' + esc(p.author.charAt(0).toUpperCase()) + '</div>' +
      '<div><strong>' + esc(p.author) + '</strong><span>' + timeAgo(p.ts) + '</span></div></div>' +
      (p.isNews ? '<span class="badge-news">News</span>' : '') +
      '</div>' +
      (p.text ? '<div class="post-body">' + esc(p.text) + '</div>' : '') +
      media +
      '</article>';
  }).join('');
}

function renderChannels() {
  var list = $('channelList');
  if (!list) return;
  list.innerHTML = store.channels.map(function (c) {
    return '<button type="button" class="channel-item" data-id="' + esc(c.id) + '">f/' + esc(c.name) + '</button>';
  }).join('') || '<p class="muted" style="padding:0.5rem">No channels yet</p>';

  list.querySelectorAll('.channel-item').forEach(function (btn) {
    btn.addEventListener('click', function () { openChannel(btn.getAttribute('data-id')); });
  });
}

function openChannel(id) {
  var ch = store.channels.find(function (c) { return c.id === id; });
  if (!ch) return;
  document.querySelectorAll('.channel-item').forEach(function (b) {
    b.classList.toggle('active', b.getAttribute('data-id') === id);
  });
  var posts = store.channelPosts[id] || [];
  var view = $('channelView');
  view.innerHTML =
    '<div class="channel-head"><div><h3>f/' + esc(ch.name) + '</h3><p>' + esc(ch.desc || '') + '</p></div>' +
    '<button type="button" class="btn-primary sm" id="chPostBtn"><i class="fas fa-plus"></i> Post</button></div>' +
    '<div class="channel-posts">' +
    (posts.length ? posts.map(function (p) {
      return '<div class="post-card"><div class="post-top"><div class="post-user">' +
        '<div class="avatar">' + esc(p.author.charAt(0).toUpperCase()) + '</div>' +
        '<div><strong>' + esc(p.author) + '</strong><span>' + timeAgo(p.ts) + '</span></div></div></div>' +
        '<div class="post-body">' + esc(p.text) + '</div></div>';
    }).join('') : '<div class="empty-state"><p>No posts in this channel yet.</p></div>') +
    '</div>';

  var chBtn = $('chPostBtn');
  if (chBtn) {
    chBtn.addEventListener('click', function () {
      if (!requireAuth()) return;
      $('channelPostId').value = id;
      $('channelPostText').value = '';
      openModal('channelPostModal');
    });
  }
}

function handleCreateChannel(e) {
  e.preventDefault();
  if (!store.user) return;
  var name = $('channelName').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  var desc = $('channelDesc').value.trim();
  if (!name) return toast('Name required', 'err');
  if (store.channels.some(function (c) { return c.id === name; })) return toast('Channel exists', 'err');
  store.channels.unshift({ id: name, name: name, desc: desc, creator: store.user.username });
  store.channelPosts[name] = [];
  save();
  renderChannels();
  refreshStats();
  $('channelModal').classList.add('hidden');
  e.target.reset();
  toast('Channel f/' + name + ' created');
  openChannel(name);
}

function handleChannelPost(e) {
  e.preventDefault();
  if (!store.user) return;
  var id = $('channelPostId').value;
  var text = $('channelPostText').value.trim();
  if (!text) return;
  if (!store.channelPosts[id]) store.channelPosts[id] = [];
  store.channelPosts[id].unshift({
    id: Date.now(),
    author: store.user.username,
    text: text,
    ts: Date.now()
  });
  save();
  openChannel(id);
  $('channelPostModal').classList.add('hidden');
  toast('Posted in f/' + id);
}

function handleMusicUpload(e) {
  var files = Array.from(e.target.files || []);
  if (!files.length || !store.user) return;

  var chain = Promise.resolve();
  files.forEach(function (file) {
    if (!file.type.startsWith('audio/')) return;
    chain = chain.then(function () {
      return readAsDataURL(file).then(function (data) {
        store.tracks.unshift({
          id: Date.now() + Math.random(),
          name: file.name,
          size: file.size,
          data: data,
          by: store.user.username,
          ts: Date.now()
        });
        store.posts.unshift({
          id: Date.now() + Math.random(),
          author: store.user.username,
          text: 'New track: ' + file.name,
          media: { type: 'audio', name: file.name, size: file.size, data: data },
          ts: Date.now(),
          isNews: false
        });
      });
    });
  });

  chain.then(function () {
    save();
    renderMusic();
    renderFeed();
    refreshStats();
    e.target.value = '';
    toast('Track uploaded');
  }).catch(function () {
    toast('Upload failed', 'err');
  });
}

function renderMusic() {
  var grid = $('musicGrid');
  var empty = $('musicEmpty');
  if (!grid) return;
  if (!store.tracks.length) {
    grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');
  grid.innerHTML = store.tracks.map(function (t) {
    return '<div class="track-card"><div class="track-top">' +
      '<div class="track-icon"><i class="fas fa-music"></i></div>' +
      '<div class="track-meta"><strong title="' + esc(t.name) + '">' + esc(t.name) + '</strong>' +
      '<span>' + esc(t.by) + ' · ' + formatSize(t.size) + '</span></div></div>' +
      '<audio controls preload="metadata" src="' + t.data + '"></audio>' +
      '<a class="post-file" href="' + t.data + '" download="' + esc(t.name) + '"><i class="fas fa-download"></i> Download</a></div>';
  }).join('');
}

function handleNewsPass(e) {
  e.preventDefault();
  var pass = $('newsPass').value;
  if (pass === NEWS_PASSWORD) {
    $('passModal').classList.add('hidden');
    $('newsFormWrap').classList.remove('hidden');
    $('newsUnlockBtn').classList.add('hidden');
    toast('News desk unlocked');
  } else {
    toast('Wrong password', 'err');
    $('newsPass').value = '';
  }
}

function handlePublishNews() {
  var title = $('newsTitle').value.trim();
  var body = $('newsBody').value.trim();
  var toFeed = $('newsToFeed').checked;
  if (!title || !body) return toast('Title and body required', 'err');

  store.news.unshift({
    id: Date.now(),
    title: title,
    body: body,
    author: store.user ? store.user.username : 'Field',
    ts: Date.now()
  });
  if (toFeed) {
    store.posts.unshift({
      id: Date.now() + 1,
      author: store.user ? store.user.username : 'Field',
      text: title + '\n\n' + body,
      media: null,
      ts: Date.now(),
      isNews: true
    });
  }
  $('newsFormWrap').classList.add('hidden');
  $('newsUnlockBtn').classList.remove('hidden');
  $('newsTitle').value = '';
  $('newsBody').value = '';
  save();
  renderNews();
  renderFeed();
  toast(toFeed ? 'News published + Feed' : 'News published');
}

function renderNews() {
  var list = $('newsList');
  var empty = $('newsEmpty');
  if (!list) return;
  if (!store.news.length) {
    list.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');
  list.innerHTML = store.news.map(function (n) {
    return '<article class="news-card"><h3>' + esc(n.title) + '</h3>' +
      '<div class="meta">' + esc(n.author) + ' · ' + timeAgo(n.ts) + '</div>' +
      '<p>' + esc(n.body) + '</p></article>';
  }).join('');
}

function dmKey(a, b) {
  return [a, b].sort().join('__');
}

function handleNewDm(e) {
  e.preventDefault();
  if (!store.user) return;
  var to = $('dmTo').value.trim();
  var text = $('dmText').value.trim();
  if (!to || !text) return;
  if (to === store.user.username) return toast('Cannot message yourself', 'err');
  var key = dmKey(store.user.username, to);
  if (!store.dms[key]) store.dms[key] = { users: [store.user.username, to], messages: [] };
  store.dms[key].messages.push({ from: store.user.username, text: text, ts: Date.now() });
  save();
  $('dmModal').classList.add('hidden');
  e.target.reset();
  activeDm = key;
  renderDms();
  openDmThread(key);
  toast('Message sent');
}

function renderDms() {
  var box = $('dmThreads');
  if (!box) return;
  if (!store.user) {
    box.innerHTML = '<p class="muted" style="padding:0.5rem">Login to see DMs</p>';
    return;
  }
  var threads = Object.entries(store.dms).filter(function (entry) {
    return entry[1].users && entry[1].users.indexOf(store.user.username) !== -1;
  });
  if (!threads.length) {
    box.innerHTML = '<p class="muted" style="padding:0.5rem">No messages yet</p>';
    return;
  }
  box.innerHTML = threads.map(function (entry) {
    var key = entry[0];
    var thr = entry[1];
    var other = thr.users.find(function (u) { return u !== store.user.username; }) || 'Unknown';
    var last = thr.messages[thr.messages.length - 1];
    return '<button type="button" class="dm-item' + (activeDm === key ? ' active' : '') + '" data-key="' + esc(key) + '">' +
      '<strong>' + esc(other) + '</strong><br>' +
      '<span style="font-size:0.75rem;opacity:0.7">' + esc((last && last.text) || '').slice(0, 40) + '</span></button>';
  }).join('');
  box.querySelectorAll('.dm-item').forEach(function (b) {
    b.addEventListener('click', function () {
      activeDm = b.getAttribute('data-key');
      openDmThread(activeDm);
      renderDms();
    });
  });
}

function openDmThread(key) {
  var thr = store.dms[key];
  var chat = $('dmChat');
  if (!thr || !store.user || !chat) return;
  var other = thr.users.find(function (u) { return u !== store.user.username; }) || 'Unknown';
  chat.innerHTML =
    '<div style="margin-bottom:0.75rem;padding-bottom:0.75rem;border-bottom:1px solid var(--border)"><strong>' + esc(other) + '</strong></div>' +
    '<div class="dm-messages" id="dmMsgs">' +
    thr.messages.map(function (m) {
      return '<div class="bubble ' + (m.from === store.user.username ? 'me' : 'them') + '">' + esc(m.text) + '</div>';
    }).join('') +
    '</div>' +
    '<form class="dm-compose" id="dmReplyForm">' +
    '<input id="dmReply" placeholder="Type a message..." autocomplete="off">' +
    '<button class="btn-primary sm" type="submit">Send</button></form>';

  var msgs = $('dmMsgs');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;

  var form = $('dmReplyForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = $('dmReply');
      var text = input.value.trim();
      if (!text) return;
      store.dms[key].messages.push({ from: store.user.username, text: text, ts: Date.now() });
      save();
      openDmThread(key);
      renderDms();
    });
  }
}

function refreshStats() {
  var su = $('statUsers');
  var sp = $('statPosts');
  var st = $('statTracks');
  var sc = $('statChannels');
  if (su) su.textContent = Object.keys(store.users).length + 1;
  if (sp) sp.textContent = store.posts.length;
  if (st) st.textContent = store.tracks.length;
  if (sc) sc.textContent = store.channels.length;
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
