// common.js
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;
  const topBar = document.querySelector('.top-bar');
  const controls = document.querySelector('.controls'); // about 頁面沒有 controls，會是 null

  if (!topBar) return;

  if (currentScrollY <= 0) {
    topBar.classList.remove('hide-header');
    if (controls) controls.classList.remove('hide-header');
    lastScrollY = 0;
    return;
  }

  if (currentScrollY > lastScrollY && currentScrollY > 60) {
    topBar.classList.add('hide-header');
    if (controls) controls.classList.add('hide-header');
  } else if (currentScrollY < lastScrollY) {
    topBar.classList.remove('hide-header');
    if (controls) controls.classList.remove('hide-header');
  }

  lastScrollY = currentScrollY;
});

// 確保 DOM 載入後綁定 MENU 事件
document.addEventListener('DOMContentLoaded', () => {
  const menuToggleBtn = document.getElementById('menuToggleBtn');
  const menuNav = document.getElementById('menuNav');
  
  if (menuToggleBtn && menuNav) {
    menuToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      menuNav.classList.toggle('hidden');
    });
    // 點擊畫面其他地方自動收起選單
    document.addEventListener('click', () => menuNav.classList.add('hidden'));
  }
});

// 顯示資料載入失敗訊息，提供重新載入按鈕
function showLoadError(containerId, message, retryLoad) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const errorBox = document.createElement('div');
  errorBox.className = 'no-result';
  errorBox.setAttribute('role', 'alert');

  const description = document.createElement('p');
  description.textContent = message;

  const retryButton = document.createElement('button');
  retryButton.type = 'button';
  retryButton.textContent = '重新載入';

  retryButton.addEventListener('click', () => {
    description.textContent = '正在重新載入，請稍候…';
    retryButton.disabled = true;
    retryButton.textContent = '載入中…';
    retryLoad();
  });

  errorBox.append(description, retryButton);
  container.replaceChildren(errorBox);
}
// 顯示載入中或空列表等一般狀態
function showListStatus(containerId, message) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const status = document.createElement('p');
  status.className = 'no-result';
  status.setAttribute('role', 'status');
  status.textContent = message;

  container.replaceChildren(status);
}
// 整理選填網址；未填寫時回傳空字串
function getOptionalUrl(value) {
  return typeof value === 'string' ? value.trim() : '';
}