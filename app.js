let songsData = [];

// 解析 YouTube Video ID 並產生封面圖 URL
function getYouTubeThumbnail(url) {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
}

// 初始化：載入 JSON 資料
async function fetchSongs() {
  try {
    const response = await fetch('songList.json');
    songsData = await response.json();
    
    // 預設依「最新直播日期 (由新到舊)」排序並渲染
    handleSortAndRender();
  } catch (error) {
    console.error('資料載入失敗:', error);
  }
}

// 渲染卡片至畫面
function renderSongs(songs) {
  const container = document.getElementById('songList');
  container.innerHTML = '';

  if (songs.length === 0) {
    container.innerHTML = '<p style="text-align:center; color:#888;">找不到符合條件的歌曲</p>';
    return;
  }

  songs.forEach(song => {
    const card = document.createElement('div');
    card.className = 'song-card';
    
    card.innerHTML = `
      <details>
        <summary>
          <div class="summary-header">
            <div class="row-1">
              <span class="order-badge">序 ${song.order}</span>
              <span class="song-title">${song.title}</span>
            </div>
            <div class="row-2">
              <span>📅 最新直播: ${song.latestStreamDate}</span>
              <span>🎤 唱過 ${song.singCount} 次</span>
            </div>
          </div>
          <span class="expand-icon">▼</span>
        </summary>

        <div class="card-details">
          <div class="details-info">
            <p><strong>原唱：</strong> ${song.artist}</p>
            <p><strong>最新直播 VOD：</strong> 
              <a href="${song.latestStreamUrl}" target="_blank" class="btn-link">${song.latestStreamTitle || '點我看當次直播'} 🔗</a>
            </p>
            <p><strong>カラオケ (伴奏)：</strong> 
              <a href="${song.karaokeUrl}" target="_blank" class="btn-link">${song.karaokeTitle || '點我看 YT 伴奏'} 🔗</a>
            </p>
            <p><strong>備註：</strong> ${song.note || '無'}</p>
          </div>
          ${getYouTubeThumbnail(song.latestStreamUrl) ? `
          <div class="details-preview">
            <a href="${song.latestStreamUrl}" target="_blank" title="點擊前往直播">
              <img src="${getYouTubeThumbnail(song.latestStreamUrl)}" alt="直播預覽圖" class="stream-thumb">
            </a>
          </div>` : ''}
        </div>
      </details>
    `;
    container.appendChild(card);
  });
}

// 排序與搜尋邏輯
function handleSortAndRender() {
  const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
  const [field, direction] = document.getElementById('sortSelect').value.split('-');

  // 1. 關鍵字過濾 (歌名或原唱)
  let filtered = songsData.filter(song => 
    song.title.toLowerCase().includes(keyword) || 
    song.artist.toLowerCase().includes(keyword)
  );

  // 2. 資料排序
  filtered.sort((a, b) => {
    let valA = a[field];
    let valB = b[field];

    // 日期或字串排序轉換
    if (field === 'latestStreamDate') {
      valA = new Date(valA);
      valB = new Date(valB);
    }

    if (direction === 'asc') {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  });

  // 3. 渲染出圖
  renderSongs(filtered);
}

// 事件監聽
document.getElementById('sortSelect').addEventListener('change', handleSortAndRender);

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const menuToggleBtn = document.getElementById('menuToggleBtn');
const menuNav = document.getElementById('menuNav');

// 搜尋控制與清除按鈕邏輯
searchInput.addEventListener('input', () => {
  clearSearchBtn.classList.toggle('hidden', searchInput.value === '');
  handleSortAndRender();
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearSearchBtn.classList.add('hidden');
  searchInput.focus();
  handleSortAndRender();
});

// Menu 切換顯示邏輯
menuToggleBtn.addEventListener('click', () => {
  menuNav.classList.toggle('hidden');
});

// 頁面載入執行
fetchSongs();
