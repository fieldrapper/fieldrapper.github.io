// ===== FIELD Official Website - App Logic =====

const COMMUNITY_PASSWORD = '102710jf-00';

// State
let currentUser = null;
let posts = [];
let communityFiles = [];
let selectedFiles = [];
let currentCategory = 'all';

// DOM Elements
const authModal = document.getElementById('authModal');
const postModal = document.getElementById('postModal');
const passModal = document.getElementById('passModal');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userMenu = document.getElementById('userMenu');
const userDisplay = document.getElementById('userDisplay');
const toast = document.getElementById('toast');

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    loadFromStorage();
    updateAuthUI();
    renderPosts();
    renderCommunityFiles();
    setupEventListeners();
    updateStats();
});

// ===== Storage =====
function loadFromStorage() {
    try {
        currentUser = JSON.parse(localStorage.getItem('field_user')) || null;
        posts = JSON.parse(localStorage.getItem('field_posts')) || getDefaultPosts();
        communityFiles = JSON.parse(localStorage.getItem('field_files')) || [];
    } catch (e) {
        posts = getDefaultPosts();
        communityFiles = [];
    }
}

function saveToStorage() {
    localStorage.setItem('field_user', JSON.stringify(currentUser));
    localStorage.setItem('field_posts', JSON.stringify(posts));
    localStorage.setItem('field_files', JSON.stringify(communityFiles));
}

function getDefaultPosts() {
    return [
        {
            id: 1,
            author: 'Field',
            title: 'Welcome to The Field',
            content: 'This is the official community. Keep it real. Drop bars. Support each other. The field is yours.',
            category: 'general',
            timestamp: Date.now() - 86400000 * 2
        },
        {
            id: 2,
            author: 'StreetPoet',
            title: 'Midnight Grind hits different',
            content: 'Been looping that track for 3 days straight. The beat switch at 1:42 is pure fire. Who else feels this one?',
            category: 'music',
            timestamp: Date.now() - 86400000
        },
        {
            id: 3,
            author: 'BarKing99',
            title: 'Freestyle challenge',
            content: 'Drop your best 4 bars about the grind. No prep, just pure energy. I\'ll start:\n\n"Clock say 3AM still writing in the dark / Dreams in the notebook, scars on my heart / They said I couldn\'t, I said watch me spark / Field goals only, aiming for the stars"',
            category: 'bars',
            timestamp: Date.now() - 3600000 * 5
        }
    ];
}

// ===== Auth UI =====
function updateAuthUI() {
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

// ===== Event Listeners =====
function setupEventListeners() {
    // Auth buttons
    loginBtn.addEventListener('click', () => openAuthModal('login'));
    registerBtn.addEventListener('click', () => openAuthModal('register'));
    logoutBtn.addEventListener('click', handleLogout);

    // Modal close
    document.getElementById('closeModal').addEventListener('click', () => authModal.classList.add('hidden'));
    document.getElementById('closePostModal').addEventListener('click', () => postModal.classList.add('hidden'));
    document.getElementById('closePassModal').addEventListener('click', () => passModal.classList.add('hidden'));

    // Overlay click close
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.add('hidden');
        });
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchAuthTab(tab);
        });
    });

    // Form switch links
    document.querySelectorAll('[data-switch]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchAuthTab(link.dataset.switch);
        });
    });

    // Forms
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('postForm').addEventListener('submit', handleNewPost);
    document.getElementById('passForm').addEventListener('submit', handlePasswordSubmit);

    // New post
    document.getElementById('newPostBtn').addEventListener('click', () => {
        if (!currentUser) {
            showToast('You need to login first to post.', 'error');
            openAuthModal('login');
            return;
        }
        postModal.classList.remove('hidden');
    });

    // Categories
    document.querySelectorAll('.cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.cat;
            renderPosts();
        });
    });

    // Upload
    document.getElementById('uploadTrigger').addEventListener('click', () => {
        passModal.classList.remove('hidden');
        document.getElementById('communityPass').value = '';
        document.getElementById('communityPass').focus();
    });

    // File handling
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFileSelect(e.target.files));

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFileSelect(e.dataTransfer.files);
    });

    document.getElementById('submitUpload').addEventListener('click', handleUploadSubmit);

    // Nav active state
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Mobile toggle (basic)
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

// ===== Auth Functions =====
function openAuthModal(tab) {
    authModal.classList.remove('hidden');
    switchAuthTab(tab);
}

function switchAuthTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === tab);
    });
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
        authModal.classList.add('hidden');
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

    if (password !== password2) {
        showToast('Passwords do not match.', 'error');
        return;
    }

    if (username.length < 3) {
        showToast('Username must be at least 3 characters.', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('field_users')) || {};
    
    if (users[username]) {
        showToast('Username already taken.', 'error');
        return;
    }

    users[username] = { email, password };
    localStorage.setItem('field_users', JSON.stringify(users));

    currentUser = { username, email };
    saveToStorage();
    updateAuthUI();
    authModal.classList.add('hidden');
    showToast(`Welcome to The Field, ${username}!`, 'success');
    document.getElementById('registerForm').reset();
    updateStats();
}

function handleLogout() {
    currentUser = null;
    saveToStorage();
    updateAuthUI();
    showToast('Logged out successfully.', 'success');
}

// ===== Forum =====
function handleNewPost(e) {
    e.preventDefault();
    if (!currentUser) return;

    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const category = document.getElementById('postCat').value;

    const newPost = {
        id: Date.now(),
        author: currentUser.username,
        title,
        content,
        category,
        timestamp: Date.now()
    };

    posts.unshift(newPost);
    saveToStorage();
    renderPosts();
    updateStats();
    postModal.classList.add('hidden');
    document.getElementById('postForm').reset();
    showToast('Post published!', 'success');
}

function renderPosts() {
    const list = document.getElementById('postsList');
    const empty = document.getElementById('emptyForum');
    
    let filtered = currentCategory === 'all' 
        ? posts 
        : posts.filter(p => p.category === currentCategory);

    if (filtered.length === 0) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');
    list.innerHTML = filtered.map(post => `
        <div class="post-card">
            <div class="post-header">
                <div class="post-author">
                    <div class="author-avatar">${post.author.charAt(0).toUpperCase()}</div>
                    <div class="author-info">
                        <h4>${escapeHtml(post.author)}</h4>
                        <span>${formatTime(post.timestamp)}</span>
                    </div>
                </div>
                <span class="post-cat">${post.category}</span>
            </div>
            <h3 class="post-title">${escapeHtml(post.title)}</h3>
            <p class="post-content">${escapeHtml(post.content).replace(/\n/g, '<br>')}</p>
        </div>
    `).join('');
}

function updateStats() {
    const users = JSON.parse(localStorage.getItem('field_users')) || {};
    const memberCount = Object.keys(users).length + 1; // +1 for Field
    document.getElementById('memberCount').textContent = memberCount;
    document.getElementById('postCount').textContent = posts.length;
}

// ===== Upload / Password =====
function handlePasswordSubmit(e) {
    e.preventDefault();
    const pass = document.getElementById('communityPass').value;

    if (pass === COMMUNITY_PASSWORD) {
        passModal.classList.add('hidden');
        document.getElementById('uploadArea').classList.remove('hidden');
        document.getElementById('uploadTrigger').classList.add('hidden');
        showToast('Access granted! You can now upload files.', 'success');
    } else {
        showToast('Incorrect password. Try again.', 'error');
        document.getElementById('communityPass').value = '';
        document.getElementById('communityPass').focus();
    }
}

function handleFileSelect(files) {
    selectedFiles = Array.from(files);
    renderFileList();
    document.getElementById('submitUpload').disabled = selectedFiles.length === 0;
}

function renderFileList() {
    const list = document.getElementById('fileList');
    list.innerHTML = selectedFiles.map((file, i) => `
        <div class="file-item">
            <span><i class="fas fa-file"></i> ${escapeHtml(file.name)} (${formatSize(file.size)})</span>
            <button class="file-remove" onclick="removeFile(${i})"><i class="fas fa-times"></i></button>
        </div>
    `).join('');
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
    document.getElementById('submitUpload').disabled = selectedFiles.length === 0;
}

function handleUploadSubmit() {
    if (selectedFiles.length === 0) return;

    selectedFiles.forEach(file => {
        communityFiles.unshift({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedBy: currentUser ? currentUser.username : 'Anonymous',
            timestamp: Date.now()
        });
    });

    saveToStorage();
    renderCommunityFiles();
    selectedFiles = [];
    renderFileList();
    document.getElementById('submitUpload').disabled = true;
    document.getElementById('fileInput').value = '';
    
    // Reset upload area (require password again next time)
    document.getElementById('uploadArea').classList.add('hidden');
    document.getElementById('uploadTrigger').classList.remove('hidden');
    
    showToast(`${communityFiles.length > 0 ? 'Files uploaded to community!' : 'Upload complete!'}`, 'success');
}

function renderCommunityFiles() {
    const grid = document.getElementById('communityFiles');
    
    if (communityFiles.length === 0) {
        grid.innerHTML = '<p style="color: var(--text-muted); grid-column: 1/-1; text-align: center;">No files uploaded yet. Be the first!</p>';
        return;
    }

    grid.innerHTML = communityFiles.map(file => {
        const icon = getFileIcon(file.type || file.name);
        return `
            <div class="file-card">
                <i class="${icon}"></i>
                <div class="file-card-info">
                    <h5 title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</h5>
                    <span>${formatSize(file.size)} • ${escapeHtml(file.uploadedBy)}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ===== Helpers =====
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function formatTime(ts) {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString();
}

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function getFileIcon(type) {
    if (type.includes('audio') || /\.(mp3|wav|flac|m4a)$/i.test(type)) return 'fas fa-music';
    if (type.includes('video') || /\.(mp4|mov|avi|mkv)$/i.test(type)) return 'fas fa-film';
    if (type.includes('image') || /\.(jpg|jpeg|png|gif|webp)$/i.test(type)) return 'fas fa-image';
    if (type.includes('pdf')) return 'fas fa-file-pdf';
    return 'fas fa-file';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make removeFile global for onclick
window.removeFile = removeFile;
