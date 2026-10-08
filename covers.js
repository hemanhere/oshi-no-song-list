let coversData = [];
let coversLoadState = 'idle';
let currentlyOpenOrder = null;
//let lastScrollY = window.scrollY;

/*window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;
  const topBar = document.querySelector('.top-bar');
  const controls = document.querySelector('.controls');

  if (!topBar || !controls) return;

  // 防止手機端彈跳捲動 (Elastic scrolling) 產生負值
  if (currentScrollY <= 0) {
    topBar.classList.remove('hide-header');
    controls.classList.remove('hide-header');
    return;
  }

  // 向下捲動超過 60px 時完全隱藏兩個區塊
  if (currentScrollY > lastScrollY && currentScrollY > 60) {
    topBar.classList.add('hide-header');
    controls.classList.add('hide-header');
  } 
  // 向上捲動時立刻完整恢復顯示
  else if (currentScrollY < lastScrollY) {
    topBar.classList.remove('hide-header');
    controls.classList.remove('hide-header');
  }

  lastScrollY = currentScrollY;
});*/

function getYouTubeId(url) {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

function getYouTubeThumbnail(url) {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
}

// 載入翻唱歌曲資料
async function fetchCovers() {
  coversLoadState = 'loading';
  showListStatus('coverList', '正在載入翻唱作品，請稍候…');
  try {
    const res = await fetch('covers.json');
    if (!res.ok) {
      throw new Error(`翻唱資料請求失敗：HTTP ${res.status}`);
    }
    coversData = await res.json();
    coversLoadState = 'ready';
    handleSortAndRender();
  } catch (err) {
    coversLoadState = 'error';
    console.error('載入 covers.json 失敗：', err);
    showLoadError(
      'coverList',
      '翻唱資料載入失敗，請稍後重試。',
      fetchCovers
    );
  }
}

// 2. 修改：渲染函數加入狀態維持與 iframe 動態生成
function renderCovers(covers) {
  const container = document.getElementById('coverList');
  const isEmbedEnabled = document.getElementById('embedToggle')?.checked || false;

  if (covers.length === 0) {
    //container.innerHTML = '<p class="no-result">查無相關翻唱歌曲</p>';
    showListStatus(
      'coverList',
      coversData.length === 0
        ? '目前尚無翻唱作品資料。'
        : '找不到符合條件的翻唱作品。'
    );
    return;
  }

  container.innerHTML = covers.map(cover => {
    const coverUrl = getOptionalUrl(cover.coverUrl);
    const originalUrl = getOptionalUrl(cover.originalUrl);
    const karaokeUrl = getOptionalUrl(cover.karaokeUrl);
    const videoId = getYouTubeId(coverUrl);
    const isOpen = (currentlyOpenOrder === cover.order.toString());
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : '';

    // 關鍵修改 1：將播放網址存於 data-src，僅在預設展開時填入 src
    /*const embedHtml = (isEmbedEnabled && videoId) ? `
      <div class="details-preview">
        <div class="embed-container">
          <iframe 
            data-src="${embedUrl}" 
            src="${isOpen ? embedUrl : ''}" 
            allowfullscreen 
            loading="lazy">
          </iframe>
        </div>
      </div>
    ` : '';*/
    // 先建立空容器，卡片展開時才建立播放器
    const embedHtml = (isEmbedEnabled && videoId) ? `
      <div class="details-preview" data-embed-url="${embedUrl}"></div>
    ` : '';
    return `
    <details class="song-card" data-order="${cover.order}" ${isOpen ? 'open' : ''}>
      <summary class="cover-summary">
        <span class="cover-order">#${cover.order}</span>
        ${getYouTubeThumbnail(coverUrl) ? `
          <img src="${getYouTubeThumbnail(coverUrl)}" alt="縮圖" class="cover-thumb-first-layer" loading="lazy">
        ` : ''}
        ${coverUrl
          ? `<a href="${coverUrl}" target="_blank" class="cover-title-link" onclick="event.stopPropagation();">
              ${cover.title}
            </a>`
          : `<span class="cover-title-link">
              ${cover.title} <small>（影片連結待補）</small>
            </span>`}
        <span class="cover-date">發布日期：${cover.releaseDate}</span>
        <div class="details-hint">
          詳細資訊 <span class="triangle-icon">▼</span>
        </div>
      </summary>

      <div class="card-details">
        <div class="details-info">
          <p><strong>本家樣：</strong> 
            ${originalUrl
              ? `<a href="${originalUrl}" target="_blank" class="btn-link">${cover.originalTitle || '點我看本家樣'} </a>`
              : `<span>${cover.originalTitle || ''}</span> <span style="color: #888;">(連結待補)</span>`}
          </p>
          <p><strong>カラオケ (伴奏)：</strong> 
            ${karaokeUrl
              ? `<a href="${karaokeUrl}" target="_blank" class="btn-link">${cover.karaokeTitle || '點我看 YT 伴奏'} </a>`
              : '<span style="color: #888;">(待補)</span>'}
          </p>
          <p><strong>備註：</strong> ${cover.note || '無'}</p>
        </div>
        ${embedHtml}
      </div>
    </details>
  `}).join('');
  bindDetailsEvents();
}

// 依卡片展開狀態建立或移除播放器
function updateCoverMedia(details) {
  const preview = details.querySelector('.details-preview');
  if (!preview) return;

  if (!details.open) {
    preview.replaceChildren();
    return;
  }

  const embedUrl = preview.dataset.embedUrl;
  if (!embedUrl || preview.querySelector('iframe')) return;

  const wrapper = document.createElement('div');
  wrapper.className = 'embed-container';

  const iframe = document.createElement('iframe');
  iframe.src = embedUrl;
  iframe.title =
    details.querySelector('.cover-title-link')?.textContent.trim() || '翻唱影片';
  iframe.allowFullscreen = true;
  iframe.allow =
    'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

  wrapper.append(iframe);
  preview.replaceChildren(wrapper);
}

  // 3. 新增：綁定展開事件 (手風琴與停止播放邏輯)
// 綁定卡片事件，管理展開狀態與播放器
function bindDetailsEvents() {
  const detailsList = document.querySelectorAll('.song-card');

  detailsList.forEach(details => {
    // 為重繪後仍保持展開的卡片建立播放器
    updateCoverMedia(details);

    details.addEventListener('toggle', function() {
      if (this.open) {
        currentlyOpenOrder = this.dataset.order;

        detailsList.forEach(other => {
          if (other !== this && other.open) {
            other.open = false;
            updateCoverMedia(other);
          }
        });
      } else if (currentlyOpenOrder === this.dataset.order) {
        currentlyOpenOrder = null;
      }

      updateCoverMedia(this);
    });
  });
}

// 處理排序與搜尋過濾
function handleSortAndRender() {
  if (coversLoadState !== 'ready') return;
  const keyword = document.getElementById('searchInput').value.trim().toLowerCase();
  const sortValue = document.getElementById('sortSelect').value;

  let filtered = coversData.filter(cover => 
    cover.title.toLowerCase().includes(keyword) || 
    (cover.originalTitle && cover.originalTitle.toLowerCase().includes(keyword))
  );

  filtered.sort((a, b) => {
    return sortValue === 'order-asc' ? a.order - b.order : b.order - a.order;
  });

  renderCovers(filtered);
}

// 事件綁定
document.addEventListener('DOMContentLoaded', () => {
  // MENU 開關控制
  /*const menuBtn = document.getElementById('menuToggleBtn');
  const menuNav = document.getElementById('menuNav');
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuNav.classList.toggle('hidden');
  });
  document.addEventListener('click', () => menuNav.classList.add('hidden'));*/

  // 搜尋與排序事件
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearSearchBtn');
  const sortSelect = document.getElementById('sortSelect');

  searchInput.addEventListener('input', () => {
    clearBtn.classList.toggle('hidden', searchInput.value === '');
    handleSortAndRender();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearBtn.classList.add('hidden');
    handleSortAndRender();
  });

  sortSelect.addEventListener('change', handleSortAndRender);

  // 4. 新增：監聽 Toggle 切換，觸發重繪 (會依照 currentlyOpenOrder 維持開關狀態)
  const embedToggle = document.getElementById('embedToggle');
  if (embedToggle) {
    embedToggle.addEventListener('change', handleSortAndRender);
  }

  // 初始化載入
  fetchCovers();
});
