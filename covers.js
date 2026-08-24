let coversData = [];
let currentlyOpenOrder = null;

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
  try {
    const res = await fetch('covers.json');
    coversData = await res.json();
    handleSortAndRender();
  } catch (err) {
    console.error('載入 covers.json 失敗：', err);
  }
}

// 2. 修改：渲染函數加入狀態維持與 iframe 動態生成
function renderCovers(covers) {
  const container = document.getElementById('coverList');
  const isEmbedEnabled = document.getElementById('embedToggle')?.checked || false;

  if (covers.length === 0) {
    container.innerHTML = '<p class="no-result">查無相關翻唱歌曲</p>';
    return;
  }

  container.innerHTML = covers.map(cover => {
    const videoId = getYouTubeId(cover.coverUrl);
    const isOpen = (currentlyOpenOrder === cover.order.toString());
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : '';

    // 關鍵修改 1：將播放網址存於 data-src，僅在預設展開時填入 src
    const embedHtml = (isEmbedEnabled && videoId) ? `
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
    ` : '';

    return `
    <details class="song-card" data-order="${cover.order}" ${isOpen ? 'open' : ''}>
      <summary class="cover-summary">
        <span class="cover-order">#${cover.order}</span>
        ${getYouTubeThumbnail(cover.coverUrl) ? `
          <img src="${getYouTubeThumbnail(cover.coverUrl)}" alt="縮圖" class="cover-thumb-first-layer" loading="lazy">
        ` : ''}
        <a href="${cover.coverUrl}" target="_blank" class="cover-title-link" onclick="event.stopPropagation();">
          ${cover.title} 
        </a>
        <span class="cover-date">發布日期：${cover.releaseDate}</span>
        <div class="details-hint">
          詳細資訊 <span class="triangle-icon">▼</span>
        </div>
      </summary>

      <div class="card-details">
        <div class="details-info">
          <p><strong>本家樣：</strong> 
            <a href="${cover.originalUrl}" target="_blank" class="btn-link">${cover.originalTitle || '點我看本家樣'} </a>
          </p>
          <p><strong>カラオケ (伴奏)：</strong> 
            ${cover.karaokeUrl 
              ? `<a href="${cover.karaokeUrl}" target="_blank" class="btn-link">${cover.karaokeTitle || '點我看 YT 伴奏'} </a>` 
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

  // 3. 新增：綁定展開事件 (手風琴與停止播放邏輯)
function bindDetailsEvents() {
  const detailsList = document.querySelectorAll('.song-card');
  detailsList.forEach(details => {
    details.addEventListener('toggle', function() {
      const iframe = this.querySelector('iframe');

      if (this.open) {
        currentlyOpenOrder = this.dataset.order;

        // 關鍵修改 2：卡片於「可見狀態」展開時，才從 data-src 載入影片，確保元件初始化成功
        if (iframe && iframe.dataset.src && iframe.src !== iframe.dataset.src) {
          iframe.src = iframe.dataset.src;
        }

        // 手風琴效果：關閉其他卡片
        detailsList.forEach(other => {
          if (other !== this && other.open) {
            other.open = false;
          }
        });
      } else {
        // 關鍵修改 3：卡片關閉時直接清空 src，順暢停止播放且不破壞隱藏狀態下的渲染
        if (iframe) {
          iframe.src = '';
        }

        if (currentlyOpenOrder === this.dataset.order) {
          currentlyOpenOrder = null;
        }
      }
    });
  });
}

// 處理排序與搜尋過濾
function handleSortAndRender() {
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
  const menuBtn = document.getElementById('menuToggleBtn');
  const menuNav = document.getElementById('menuNav');
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menuNav.classList.toggle('hidden');
  });
  document.addEventListener('click', () => menuNav.classList.add('hidden'));

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
