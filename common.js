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