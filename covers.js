let coversData = [];

// 解析 YouTube Video ID 取得縮圖
function getYouTubeThumbnail(url) {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|v\/))([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : '';
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

// 渲染翻唱卡片列表
function renderCovers(covers) {
  const container = document.getElementById('coverList');
  if (covers.length === 0) {
    container.innerHTML = '<p class="no-result">查無相關翻唱歌曲</p>';
    return;
  }

  container.innerHTML = covers.map(cover => `
    <details class="song-card">
      <summary class="cover-summary">
        <span class="cover-order">#${cover.order}</span>
        ${getYouTubeThumbnail(cover.coverUrl) ? `
          <img src="${getYouTubeThumbnail(cover.coverUrl)}" alt="縮圖" class="cover-thumb-first-layer">
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
      </div>
    </details>
  `).join('');
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

  // 初始化載入
  fetchCovers();
});
