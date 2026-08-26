let songsData = [];
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;
  const topBar = document.querySelector('.top-bar');
  const controls = document.querySelector('.controls');

  // 防止手機端彈跳捲動 (Bounce effect / Elastic scrolling) 產生負值
  if (currentScrollY < 0) return;

  // 1. 當「向下捲動」且捲動超過一定距離時 (例如 50px)
  if (currentScrollY > lastScrollY && currentScrollY > 50) {
    topBar.classList.add('hide-header');
    controls.classList.add('hide-header');
  } 
  // 2. 當「向上捲動」時，立刻顯示第一區塊與第二區塊
  else if (currentScrollY < lastScrollY) {
    topBar.classList.remove('hide-header');
    controls.classList.remove('hide-header');
  }

  // 更新上一次的捲動位置
  lastScrollY = currentScrollY;
});

// 解析 YouTube Video ID 與時間秒數 (t=1m20s 或 t=80)
function parseYouTubeUrl(url) {
  if (!url) return { id: '', start: 0 };
  const idMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|v\/|live\/))([a-zA-Z0-9_-]{11})/);
  const id = idMatch ? idMatch[1] : '';
  
  let start = 0;
  const timeMatch = url.match(/[?&]t=([^&]+)/);
  if (timeMatch) {
    const timeStr = timeMatch[1];
    if (/^\d+$/.test(timeStr)) {
      start = parseInt(timeStr, 10);
    } else {
      const m = timeStr.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
      if (m) {
        start = (parseInt(m[1]||0,10)*3600) + (parseInt(m[2]||0,10)*60) + parseInt(m[3]||0,10);
      }
    }
  }
  return { id, start };
}

function getYouTubeThumbnail(url) {
  const { id } = parseYouTubeUrl(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
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

    card.dataset.streamUrl = song.latestStreamUrl || '';
    card.dataset.title = song.title || '';
    
    card.innerHTML = `
      <details>
        <summary>
          <div class="summary-header">
            <div class="row-1">
              <span class="order-badge"># ${song.order}</span>
              <span class="song-title">${song.title}</span>
            </div>
            <div class="row-2">
              <span> 最新直播: ${song.latestStreamDate}</span>
              <span> 唱過 ${song.singCount} 次</span>
            </div>
          </div>
          <span class="expand-icon">▼</span>
        </summary>

        <div class="card-details">
          <div class="details-info">
            <p><strong>原唱：</strong> ${song.artist}</p>
            <p class="vod-link-p"></p>
            <p><strong>カラオケ (伴奏)：</strong> 
              ${song.karaokeUrl 
                ? `<a href="${song.karaokeUrl}" target="_blank" class="btn-link">${song.karaokeTitle || '點我看 YT 伴奏'} </a>` 
                : '<span style="color: #888;">(待補)</span>'}
            </p>
            <p><strong>備註：</strong> ${song.note || '無'}</p>
          </div>
          <div class="details-preview"></div>
        </div>
      </details>
    `;
    // 監聽手風琴展開/收合事件，實現獨占播放與動態加載
    const detailsEl = card.querySelector('details');
    detailsEl.addEventListener('toggle', () => {
      if (detailsEl.open) {
        // 自動關閉其他展開的卡片，實現「一次只看一支影片」
        document.querySelectorAll('.song-card details[open]').forEach(other => {
          if (other !== detailsEl) other.open = false;
        });
        updateCardMedia(card);
      } else {
        // 收合時直接清空，達到停掉影片的效果
        const preview = card.querySelector('.details-preview');
        if (preview) preview.innerHTML = '';
      }
    });
    container.appendChild(card);
    updateCardMedia(card);
  });
}

// 根據 Toggle Switch 狀態切換單一卡片內容 (無須重繪整個 HTML)
function updateCardMedia(card) {
  const isEmbed = document.getElementById('embedPlayerToggle')?.checked || false;
  const streamUrl = card.dataset.streamUrl;
  const title = card.dataset.title;
  const vodP = card.querySelector('.vod-link-p');
  const preview = card.querySelector('.details-preview');
  const detailsEl = card.querySelector('details');

  if (vodP) {
    vodP.style.display = isEmbed ? 'none' : 'block';
    vodP.innerHTML = `<strong>最新直播 VOD：</strong> <a href="${streamUrl}" target="_blank" class="btn-link">點我看當次直播 </a>`;
  }

  if (!preview) return;

  // 僅當卡片處於展開狀態時才加載 <iframe>
  if (detailsEl && detailsEl.open) {
    const { id, start } = parseYouTubeUrl(streamUrl);
    if (id) {
      if (isEmbed) {
        // Toggle 開啟：外層是控制寬度的 .details-preview，內層包覆 16:9 的 .embed-container
        preview.innerHTML = `
          <div class="embed-container">
            <iframe src="https://www.youtube.com/embed/${id}${start ? `?start=${start}` : ''}" title="${title}" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        `;
      } else {
        // Toggle 關閉：顯示圖片縮圖
        preview.innerHTML = `<a href="${streamUrl}" target="_blank" title="點擊前往直播"><img src="${getYouTubeThumbnail(streamUrl)}" class="stream-thumb" loading="lazy"></a>`;
      }
    } else {
      preview.innerHTML = '';
    }
  } else {
    preview.innerHTML = '';
  }
}

// 排序與搜尋邏輯
function handleSortAndRender() {
  const keyword = document.getElementById('searchInput').value.toLowerCase().trim();
  const [field, direction] = document.getElementById('sortSelect').value.split('-');

  // 1. 關鍵字過濾 (根據是否有 # 進行分流搜尋)
  let filtered = songsData.filter(song => {
    // 若關鍵字以 # 開頭，僅檢索備註欄位 (note)
    if (keyword.startsWith('#')) {
      return (song.note || '').toLowerCase().includes(keyword);
    }

    // 無 # 時，僅檢索歌名與原唱
    return String(song.title).toLowerCase().includes(keyword) || 
           String(song.artist).toLowerCase().includes(keyword);
  });

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

const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const menuToggleBtn = document.getElementById('menuToggleBtn');
const menuNav = document.getElementById('menuNav');
const embedPlayerToggle = document.getElementById('embedPlayerToggle');

// 事件監聽
document.getElementById('sortSelect').addEventListener('change', handleSortAndRender);

// 初始化開關狀態 (讀取 localStorage)
if (embedPlayerToggle) {
  embedPlayerToggle.checked = false;

  embedPlayerToggle.addEventListener('change', (e) => {
  // 切換開關時，僅更新卡片 DOM，保持原本的展開狀態
    document.querySelectorAll('.song-card').forEach(updateCardMedia);    
  });
}

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
