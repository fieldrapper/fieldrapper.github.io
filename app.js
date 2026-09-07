// FIELD Official Hub - App Logic
const NEWS_PASSWORD = '102710jf-00';

let currentUser = null;
let posts = [];
let musicFiles = [];
let communityFiles = [];
let newsItems = [];
let selectedMusic = [];
let selectedFiles = [];

document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    updateAuthUI();
    renderPosts();
    renderMusic();
    renderFiles();
    renderNews();
    setupEventListeners();
});

function loadFromStorage() {
    try {
        currentUser = JSON.parse(localStorage.getItem('field_user')) || null;
        posts = JSON.parse(localStorage.getItem('field_posts')) || getDefaultPosts();
        musicFiles = JSON.parse(localStorage.getItem('field_music')) || [];
        communityFiles = JSON.parse(localStorage.getItem('field_files')) || [];
        newsItems = JSON.parse(localStorage.getItem('field_news')) || [];
    } catch (e) {
        posts = getDefaultPosts();
    }
}

function saveToStorage() {
    localStorage.setItem('field_user', JSON.stringify(currentUser));
    localStorage.setItem('field_posts', JSON.stringify(posts));
    localStorage.setItem('field_music', JSON.stringify(musicFiles));
    localStorage.setItem('field_files', JSON.stringify(communityFiles));
    localStorage.setItem('field_news', JSON.stringify(newsItems));
}

function getDefaultPosts() {
    return [
        {
            id: 1,
            author: 'Field',
            content: 'The Field is open. Upload your music. Drop your bars. This is the official hub.',
            timestamp: Date.now() - 86400000 * 2,
            isNews: false
        },
        {
            id: 2,
            author: 'StreetPoet',
            content: 'Just dropped a new freestyle in the music section. Go check it out 🔥',
            timestamp: Date.now() - 3600000 * 8,
            isNews: false
        }
    ];
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userMenu = document.getElementById('userMenu');
    const userDisplay = document.getElementById('userDisplay');

    if (currentUser) {
        loginBtn.classList.add('hidden');
        registerBtn.classList.add('hidden');
        userMenu.classList.remove('hidden');
        userDisplay.textContent = currentUser.username;
    } else {
        loginBtn.classList.remove('hidden');
        registerBtn.classList.remove('hidden');
        userMenu.classList.add('hidden');
    }
}

function setupEventListeners() {
    // Auth
    document.getElementById('loginBtn').addEventListener('click', () => openAuthModal('login'));
    document.getElementById('registerBtn').addEventListener('click', () => openAuthModal('register'));
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('closeModal').addEventListener('click', () => document.getElementById('authModal').classList.add('hidden'));
    document.getElementById('closePostModal').addEventListener('click', () => document.getElementById('postModal').classList.add('hidden'));
    document.getElementById('closePassModal').addEventListener('click', () => document.getElementById('passModal').classList.add('hidden'));

    document.querySelectorAll('.modal-overlay').forEach(o => {
        o.addEventListener('click', e => e.target.closest('.modal').classList.add('hidden'));
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchAuthTab(btn.dataset.tab));
    });

    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('postForm').addEventListener('submit', handleNewPost);
    document.getElementById('passForm').addEventListener('submit', handlePasswordSubmit);

    // Post media preview
    document.getElementById('postMediaInput').addEventListener('change', e => {
        const files = Array.from(e.target.files || []);
        const list = document.getElementById('postMediaList');
        list.innerHTML = files.map(f => `
            <div class="file-item">
                <span><i class="fas fa-file"></i> ${escapeHtml(f.name)} (${formatSize(f.size)})</span>
            </div>
        `).join('');
    });

    // New Post
    document.getElementById('newPostBtn').addEventListener('click', () => {
        if (!currentUser) {
            showToast('Login first to post.', 'error');
            openAuthModal('login');
            return;
        }
        document.getElementById('postMediaList').innerHTML = '';
        document.getElementById('postModal').classList.remove('hidden');
    });

    // Music Upload (open to everyone)
    document.getElementById('musicUploadBtn').addEventListener('click', () => {
        if (!currentUser) {
            showToast('Login first to upload music.', 'error');
            openAuthModal('login');
            return;
        }
        document.getElementById('musicInput').click();
    });
    document.getElementById('musicInput').addEventListener('change', e => {
        selectedMusic = Array.from(e.target.files);
        renderSelectedList('musicFileList', selectedMusic, 'music');
        const btn = document.getElementById('submitMusicBtn');
        btn.classList.toggle('hidden', selectedMusic.length === 0);
        btn.disabled = selectedMusic.length === 0;
    });
    document.getElementById('submitMusicBtn').addEventListener('click', handleMusicUpload);

    // File Upload (open)
    document.getElementById('fileUploadBtn').addEventListener('click', () => {
        if (!currentUser) {
            showToast('Login first to upload files.', 'error');
            openAuthModal('login');
            return;
        }
        document.getElementById('fileInput').click();
    });
    document.getElementById('fileInput').addEventListener('change', e => {
        selectedFiles = Array.from(e.target.files);
        renderSelectedList('fileList', selectedFiles, 'file');
        const btn = document.getElementById('submitFileBtn');
        btn.classList.toggle('hidden', selectedFiles.length === 0);
        btn.disabled = selectedFiles.length === 0;
    });
    document.getElementById('submitFileBtn').addEventListener('click', handleFileUpload);

    // News (password protected)
    document.getElementById('newsUnlockBtn').addEventListener('click', () => {
        document.getElementById('passModal').classList.remove('hidden');
        document.getElementById('communityPass').value = '';
        document.getElementById('communityPass').focus();
    });
    document.getElementById('submitNewsBtn').addEventListener('click', handleNewsSubmit);

    // Nav
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    document.getElementById('mobileToggle').addEventListener('click', () => {
        const links = document.querySelector('.nav-links');
        if (links.style.display === 'flex') {
            links.style.display = 'none';
        } else {
            links.style.display = 'flex';
            links.style.flexDirection = 'column';
            links.style.position = 'absolute';
            links.style.top = '70px';
            links.style.left = '0';
            links.style.right = '0';
            links.style.background = 'rgba(10,10,15,0.95)';
            links.style.padding = '1rem';
            links.style.gap = '1rem';
        }
    });
}

function openAuthModal(tab) {
    document.getElementById('authModal').classList.remove('hidden');
    switchAuthTab(tab);
}

function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    document.getElementById('loginForm').classList.toggle('hidden', tab !== 'login');
    document.getElementById('registerForm').classList.toggle('hidden', tab !== 'register');
}

function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;
    const users = JSON.parse(localStorage.getItem('field_users')) || {};

    if (users[username] && users[username].password === password) {
        currentUser = { username, email: users[username].email };
        saveToStorage();
        updateAuthUI();
        document.getElementById('authModal').classList.add('hidden');
        showToast(`Welcome back, ${username}!`, 'success');
        document.getElementById('loginForm').reset();
    } else {
        showToast('Invalid username or password.', 'error');
    }
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('regUser').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPass').value;
    const password2 = document.getElementById('regPass2').value;

    if (password !== password2) { showToast('Passwords do not match.', 'error'); return; }
    if (username.length < 3) { showToast('Username too short.', 'error'); return; }

    const users = JSON.parse(localStorage.getItem('field_users')) || {};
    if (users[username]) { showToast('Username taken.', 'error'); return; }

    users[username] = { email, password };
    localStorage.setItem('field_users', JSON.stringify(users));
    currentUser = { username, email };
    saveToStorage();
    updateAuthUI();
    document.getElementById('authModal').classList.add('hidden');
    showToast(`Welcome to The Field, ${username}!`, 'success');
    document.getElementById('registerForm').reset();
}

function handleLogout() {
    currentUser = null;
    saveToStorage();
    updateAuthUI();
    showToast('Logged out.', 'success');
}

function handleNewPost(e) {
    e.preventDefault();
    if (!currentUser) return;
    const content = document.getElementById('postContent').value.trim();
    const mediaInput = document.getElementById('postMediaInput');
    const mediaFiles = Array.from(mediaInput.files || []);

    if (!content && mediaFiles.length === 0) {
        showToast('Write something or add media.', 'error');
        return;
    }

    // Store media as name + type (localStorage can't hold real files long-term)
    const media = mediaFiles.map(f => ({
        name: f.name,
        type: f.type,
        size: f.size
    }));

    posts.unshift({
        id: Date.now(),
        author: currentUser.username,
        content: content || '',
        media: media,
        timestamp: Date.now(),
        isNews: false
    });
    saveToStorage();
    renderPosts();
    document.getElementById('postModal').classList.add('hidden');
    document.getElementById('postForm').reset();
    document.getElementById('postMediaList').innerHTML = '';
    showToast(media.length ? 'Posted with media!' : 'Posted!', 'success');
}

function handlePasswordSubmit(e) {
    e.preventDefault();
    const pass = document.getElementById('communityPass').value;
    if (pass === NEWS_PASSWORD) {
        document.getElementById('passModal').classList.add('hidden');
        document.getElementById('newsUploadArea').classList.remove('hidden');
        document.getElementById('newsUnlockBtn').classList.add('hidden');
        showToast('News upload unlocked.', 'success');
    } else {
        showToast('Wrong password.', 'error');
        document.getElementById('communityPass').value = '';
    }
}

function handleNewsSubmit() {
    const title = document.getElementById('newsTitle').value.trim();
    const content = document.getElementById('newsContent').value.trim();
    const alsoCommunity = document.getElementById('alsoCommunity').checked;
    const files = document.getElementById('newsFileInput').files;

    if (!title || !content) {
        showToast('Title and content required.', 'error');
        return;
    }

    const newsItem = {
        id: Date.now(),
        title,
        content,
        author: currentUser ? currentUser.username : 'Field',
        timestamp: Date.now(),
        files: Array.from(files).map(f => f.name)
    };
    newsItems.unshift(newsItem);

    if (alsoCommunity) {
        posts.unshift({
            id: Date.now() + 1,
            author: newsItem.author,
            content: `📰 NEWS: ${title}\n\n${content}`,
            timestamp: Date.now(),
            isNews: true
        });
    }

    // Reset news form and lock again
    document.getElementById('newsTitle').value = '';
    document.getElementById('newsContent').value = '';
    document.getElementById('newsFileInput').value = '';
    document.getElementById('newsUploadArea').classList.add('hidden');
    document.getElementById('newsUnlockBtn').classList.remove('hidden');

    saveToStorage();
    renderNews();
    renderPosts();
    showToast(alsoCommunity ? 'News published + posted to Feed!' : 'News published!', 'success');
}

function handleMusicUpload() {
    if (selectedMusic.length === 0) return;
    selectedMusic.forEach(file => {
        musicFiles.unshift({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            uploadedBy: currentUser.username,
            timestamp: Date.now()
        });
        // Also create a post about it
        posts.unshift({
            id: Date.now() + Math.random(),
            author: currentUser.username,
            content: `🎵 Just dropped: ${file.name}`,
            timestamp: Date.now(),
            isNews: false
        });
    });
    saveToStorage();
    renderMusic();
    renderPosts();
    selectedMusic = [];
    document.getElementById('musicFileList').innerHTML = '';
    document.getElementById('submitMusicBtn').classList.add('hidden');
    document.getElementById('musicInput').value = '';
    showToast('Music uploaded to community!', 'success');
}

function handleFileUpload() {
    if (selectedFiles.length === 0) return;
    selectedFiles.forEach(file => {
        communityFiles.unshift({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedBy: currentUser.username,
            timestamp: Date.now()
        });
    });
    saveToStorage();
    renderFiles();
    selectedFiles = [];
    document.getElementById('fileList').innerHTML = '';
    document.getElementById('submitFileBtn').classList.add('hidden');
    document.getElementById('fileInput').value = '';
    showToast('Files uploaded!', 'success');
}

function renderPosts() {
    const list = document.getElementById('postsList');
    const empty = document.getElementById('emptyFeed');
    if (posts.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');
    list.innerHTML = posts.map(p => {
        let mediaHtml = '';
        if (p.media && p.media.length > 0) {
            mediaHtml = `<div class="post-media">${p.media.map(m => {
                const icon = m.type.startsWith('image/') ? 'fa-image' :
                             m.type.startsWith('video/') ? 'fa-film' :
                             m.type.startsWith('audio/') ? 'fa-music' : 'fa-file';
                return `<div class="media-item"><i class="fas ${icon}"></i> <span>${escapeHtml(m.name)}</span></div>`;
            }).join('')}</div>`;
        }
        return `
        <div class="post-card">
            <div class="post-header">
                <div class="post-author">
                    <div class="author-avatar">${p.author.charAt(0).toUpperCase()}</div>
                    <div class="author-info">
                        <h4>${escapeHtml(p.author)}</h4>
                        <span>${formatTime(p.timestamp)}</span>
                    </div>
                </div>
                ${p.isNews ? '<span class="post-badge">News</span>' : ''}
            </div>
            <div class="post-content">${escapeHtml(p.content || '')}</div>
            ${mediaHtml}
        </div>`;
    }).join('');
}

function renderMusic() {
    const grid = document.getElementById('musicGrid');
    if (musicFiles.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">No music uploaded yet. Be the first!</p>';
        return;
    }
    grid.innerHTML = musicFiles.map(f => `
        <div class="file-card">
            <i class="fas fa-music"></i>
            <div class="file-card-info">
                <h5 title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</h5>
                <span>${formatSize(f.size)} • ${escapeHtml(f.uploadedBy)}</span>
            </div>
        </div>
    `).join('');
}

function renderFiles() {
    const grid = document.getElementById('communityFiles');
    if (communityFiles.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">No files yet.</p>';
        return;
    }
    grid.innerHTML = communityFiles.map(f => `
        <div class="file-card">
            <i class="fas fa-file"></i>
            <div class="file-card-info">
                <h5 title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</h5>
                <span>${formatSize(f.size)} • ${escapeHtml(f.uploadedBy)}</span>
            </div>
        </div>
    `).join('');
}

function renderNews() {
    const list = document.getElementById('newsList');
    const empty = document.getElementById('emptyNews');
    if (newsItems.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');
    list.innerHTML = newsItems.map(n => `
        <div class="news-card">
            <h3>${escapeHtml(n.title)}</h3>
            <div class="news-meta">${escapeHtml(n.author)} • ${formatTime(n.timestamp)}</div>
            <p>${escapeHtml(n.content)}</p>
        </div>
    `).join('');
}

function renderSelectedList(containerId, files, type) {
    const el = document.getElementById(containerId);
    el.innerHTML = files.map((f, i) => `
        <div class="file-item">
            <span><i class="fas fa-file"></i> ${escapeHtml(f.name)} (${formatSize(f.size)})</span>
            <button class="file-remove" onclick="removeSelected('${type}', ${i})"><i class="fas fa-times"></i></button>
        </div>
    `).join('');
}

function removeSelected(type, index) {
    if (type === 'music') {
        selectedMusic.splice(index, 1);
        renderSelectedList('musicFileList', selectedMusic, 'music');
        document.getElementById('submitMusicBtn').disabled = selectedMusic.length === 0;
        if (selectedMusic.length === 0) document.getElementById('submitMusicBtn').classList.add('hidden');
    } else {
        selectedFiles.splice(index, 1);
        renderSelectedList('fileList', selectedFiles, 'file');
        document.getElementById('submitFileBtn').disabled = selectedFiles.length === 0;
        if (selectedFiles.length === 0) document.getElementById('submitFileBtn').classList.add('hidden');
    }
}

function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = `toast ${type}`;
    setTimeout(() => t.classList.add('hidden'), 3000);
}

function formatTime(ts) {
    const d = Date.now() - ts;
    const m = Math.floor(d / 60000);
    const h = Math.floor(d / 3600000);
    const days = Math.floor(d / 86400000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    if (h < 24) return `${h}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
}

function formatSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
}

function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

window.removeSelected = removeSelected;
