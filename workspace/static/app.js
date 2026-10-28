let allVideos = [];
let currentVideo = null;
let isSubscribed = false;

async function loadVideos() {
  try {
    const res = await fetch('/api/videos');
    allVideos = await res.json();
    renderGrid(allVideos);
  } catch (err) {
    console.error('Failed to load videos:', err);
  }
}

function renderGrid(videos) {
  const grid = document.getElementById('videoGrid');
  grid.innerHTML = '';
  if (!videos || videos.length === 0) {
    grid.innerHTML = '<div style="color: #aaa; padding: 40px;">No videos found matching your search.</div>';
    return;
  }

  videos.forEach(v => {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.onclick = () => openWatchView(v.id);
    card.innerHTML = `
      <div class="thumb-wrap">
        <img src="${v.thumbnail}" alt="${v.title}">
        <span class="duration-pill">${v.duration}</span>
      </div>
      <div class="card-details">
        <div class="channel-icon">${v.channel.charAt(0)}</div>
        <div class="video-meta">
          <div class="video-title">${v.title}</div>
          <div class="channel-title">${v.channel}</div>
          <div class="meta-stats">${v.views} • ${v.timestamp}</div>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function openWatchView(videoId) {
  currentVideo = allVideos.find(v => v.id === videoId);
  if (!currentVideo) return;

  document.getElementById('videoGrid').style.display = 'none';
  document.getElementById('chipsBar').style.display = 'none';
  const watchView = document.getElementById('watchView');
  watchView.classList.remove('hidden');

  const player = document.getElementById('mainVideoPlayer');
  player.src = currentVideo.videoUrl;
  player.play();

  document.getElementById('watchTitle').textContent = currentVideo.title;
  document.getElementById('watchChannel').textContent = currentVideo.channel;
  document.getElementById('watchSubs').textContent = currentVideo.subscribers + ' subscribers';
  document.getElementById('watchAvatar').textContent = currentVideo.channel.charAt(0);
  document.getElementById('likeCount').textContent = currentVideo.likes.toLocaleString();
  document.getElementById('watchDescription').textContent = `${currentVideo.views} • Uploaded ${currentVideo.timestamp}

${currentVideo.description}`;

  renderComments(currentVideo.comments);
  renderRelated(allVideos.filter(v => v.id !== videoId));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function loadHome() {
  const player = document.getElementById('mainVideoPlayer');
  player.pause();
  document.getElementById('watchView').classList.add('hidden');
  document.getElementById('videoGrid').style.display = 'grid';
  document.getElementById('chipsBar').style.display = 'flex';
  renderGrid(allVideos);
}

function renderComments(comments) {
  document.getElementById('commentCount').textContent = comments.length;
  const list = document.getElementById('commentsList');
  list.innerHTML = '';
  comments.forEach(c => {
    const item = document.createElement('div');
    item.className = 'comment-item';
    item.innerHTML = `
      <div class="avatar comment-avatar">${c.avatar || c.user.charAt(0)}</div>
      <div class="comment-body">
        <div class="comment-user-row">
          <span class="comment-user">@${c.user}</span>
          <span class="comment-time">${c.time}</span>
        </div>
        <div class="comment-text">${c.text}</div>
      </div>
    `;
    list.appendChild(item);
  });
}

function renderRelated(relatedVideos) {
  const list = document.getElementById('relatedList');
  list.innerHTML = '';
  relatedVideos.forEach(v => {
    const item = document.createElement('div');
    item.className = 'related-item';
    item.onclick = () => openWatchView(v.id);
    item.innerHTML = `
      <div class="related-thumb">
        <img src="${v.thumbnail}" alt="${v.title}">
        <span class="duration-pill">${v.duration}</span>
      </div>
      <div>
        <div class="related-title">${v.title}</div>
        <div class="related-channel">${v.channel}</div>
        <div class="meta-stats">${v.views}</div>
      </div>
    `;
    list.appendChild(item);
  });
}

async function likeCurrentVideo() {
  if (!currentVideo) return;
  currentVideo.likes += 1;
  document.getElementById('likeCount').textContent = currentVideo.likes.toLocaleString();
  try {
    await fetch(`/api/videos/${currentVideo.id}/like`, { method: 'POST' });
  } catch(e) {}
}

function toggleSubscribe() {
  isSubscribed = !isSubscribed;
  const btn = document.getElementById('subBtn');
  btn.textContent = isSubscribed ? 'Subscribed' : 'Subscribe';
  btn.classList.toggle('subscribed', isSubscribed);
}

async function submitComment() {
  const input = document.getElementById('commentInput');
  const text = input.value.trim();
  if (!text || !currentVideo) return;
  const newC = { user: 'You', avatar: 'Y', time: 'Just now', text };
  currentVideo.comments.unshift(newC);
  renderComments(currentVideo.comments);
  input.value = '';
  try {
    await fetch(`/api/videos/${currentVideo.id}/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  } catch(e) {}
}

async function searchVideos() {
  const q = document.getElementById('searchInput').value.trim();
  if (!q) {
    loadHome();
    return;
  }
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const results = await res.json();
    document.getElementById('watchView').classList.add('hidden');
    document.getElementById('videoGrid').style.display = 'grid';
    renderGrid(results);
  } catch(e) {}
}

function filterByCategory(category) {
  document.querySelectorAll('.chip').forEach(c => {
    c.classList.toggle('active', c.textContent === category);
  });
  if (category === 'All') {
    renderGrid(allVideos);
  } else {
    renderGrid(allVideos.filter(v => v.category === category));
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', loadVideos);
