(function () {
  'use strict';

  // 8 张轮播壁纸素材
  const bgImages = [
    '/img/bg/1779330249449.png',
    '/img/bg/1779330254465.png',
    '/img/bg/1779330264551.png',
    '/img/bg/1779331884054.png',
    '/img/bg/1779331935933.png',
    '/img/bg/1779331940722.png',
    '/img/bg/wallhaven-xepz2v.png',
    '/img/bg/wallhaven-zpz1ow.jpg'
  ];

  const BG_INTERVAL = 8000;
  const BG_TRANSITION = 1500;
  const PRELOAD_TIMEOUT = 15000;

  let bgTimer = null;
  let fadeTimer = null;
  let runToken = 0;
  let bgActive = 0;
  let bgCurrent = -1;

  function preloadImage(url, timeoutMs = PRELOAD_TIMEOUT) {
    return new Promise(resolve => {
      const img = new Image();
      let settled = false;

      const finish = ok => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        img.onload = null;
        img.onerror = null;
        resolve(ok);
      };

      const timer = setTimeout(() => finish(false), timeoutMs);

      img.onload = () => finish(img.naturalWidth > 0);
      img.onerror = () => finish(false);
      img.src = url;
    });
  }

  function shuffledIndices(excludeIdx) {
    const indices = [];
    for (let i = 0; i < bgImages.length; i++) {
      if (bgImages.length <= 1 || i !== excludeIdx) {
        indices.push(i);
      }
    }
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = indices[i];
      indices[i] = indices[j];
      indices[j] = tmp;
    }
    return indices;
  }

  async function pickValidImage(excludeIdx) {
    const candidates = shuffledIndices(excludeIdx);
    for (const idx of candidates) {
      const url = bgImages[idx];
      const ok = await preloadImage(url);
      if (ok) {
        return { idx, url };
      }
    }
    return null;
  }

  function clearTimers() {
    if (bgTimer) {
      clearTimeout(bgTimer);
      bgTimer = null;
    }
    if (fadeTimer) {
      clearTimeout(fadeTimer);
      fadeTimer = null;
    }
  }

  function scheduleNext(token) {
    if (token !== runToken) return;
    if (bgTimer) {
      clearTimeout(bgTimer);
      bgTimer = null;
    }
    bgTimer = setTimeout(() => nextBackground(token), BG_INTERVAL);
  }

  async function nextBackground(token) {
    if (token !== runToken) return;
    const layer0 = document.getElementById('hero-bg-0');
    const layer1 = document.getElementById('hero-bg-1');
    if (!layer0 || !layer1) return;

    const picked = await pickValidImage(bgCurrent);
    if (token !== runToken) return;

    if (!picked) {
      scheduleNext(token);
      return;
    }

    const active = bgActive === 0 ? layer0 : layer1;
    const inactive = bgActive === 0 ? layer1 : layer0;

    inactive.style.opacity = '0';
    active.after(inactive);
    inactive.style.backgroundImage = `url('${picked.url}')`;
    void inactive.offsetWidth;
    inactive.style.opacity = '1';

    fadeTimer = setTimeout(() => {
      fadeTimer = null;
      if (token !== runToken) return;
      active.style.opacity = '0';
      bgActive = bgActive === 0 ? 1 : 0;
      bgCurrent = picked.idx;
      scheduleNext(token);
    }, BG_TRANSITION);
  }

  async function initHeroBackground() {
    const token = ++runToken;
    clearTimers();

    let container = document.querySelector('#page-header.full_page');

    if (!container) {
      const path = window.location.pathname;
      const isFixedPage = path.includes('/about/') ||
                          path.includes('/link/') ||
                          path.includes('/archives/') ||
                          path.includes('/tags/') ||
                          path.includes('/categories/');
      if (isFixedPage) {
        container = document.getElementById('fixed-bg-container');
        if (!container) {
          container = document.createElement('div');
          container.id = 'fixed-bg-container';
          container.style.position = 'fixed';
          container.style.top = '0';
          container.style.left = '0';
          container.style.width = '100vw';
          container.style.height = '100vh';
          container.style.zIndex = '-999';
          container.style.pointerEvents = 'none';
          container.style.backgroundColor = 'transparent';
          document.body.appendChild(container);
        }
      }
    }

    if (!container) {
      return;
    }

    // 若已经创建则不重复插入
    let layer0 = document.getElementById('hero-bg-0');
    let layer1 = document.getElementById('hero-bg-1');

    if (!layer0 || !layer1) {
      layer0 = document.createElement('div');
      layer0.id = 'hero-bg-0';
      layer0.className = 'hero-bg-layer';

      layer1 = document.createElement('div');
      layer1.id = 'hero-bg-1';
      layer1.className = 'hero-bg-layer';
    }

    layer0.style.position = 'absolute';
    layer1.style.position = 'absolute';
    layer0.style.opacity = '0';
    layer1.style.opacity = '0';

    if (layer0.parentNode !== container || layer1.parentNode !== container) {
      container.insertBefore(layer1, container.firstChild);
      container.insertBefore(layer0, container.firstChild);
    } else {
      layer0.after(layer1);
    }

    bgActive = 0;
    bgCurrent = -1;

    const picked = await pickValidImage(-1);
    if (token !== runToken) return;

    if (picked) {
      layer0.style.backgroundImage = `url('${picked.url}')`;
      void layer0.offsetWidth;
      layer0.style.opacity = '1';
      bgCurrent = picked.idx;
    }

    scheduleNext(token);
  }

  // 侧边栏社交二维码 Tooltip 动态绑定
  function initSocialTooltips() {
    const qrMap = {
      'fa-weixin': { img: '/img/qr_wx.jpg', title: '微信二维码' },
      'fa-qq': { img: '/img/qr_qq.png', title: 'QQ二维码' },
      'fa-tiktok': { img: '/img/qr_douyin.png', title: '抖音二维码' },
      'fa-blog': { img: '/img/qr_csdn.png', title: 'CSDN二维码' }
    };

    const socialIcons = document.querySelectorAll('.card-info-social-icons .social-icon');
    socialIcons.forEach(icon => {
      if (icon.querySelector('.social-qr-tooltip')) return;

      for (const [key, val] of Object.entries(qrMap)) {
        if (icon.innerHTML.includes(key)) {
          const tooltip = document.createElement('div');
          tooltip.className = 'social-qr-tooltip';
          tooltip.innerHTML = `
            <img src="${val.img}" alt="${val.title}">
            <span class="qr-desc">${val.title}</span>
          `;
          icon.appendChild(tooltip);
          break;
        }
      }
    });
  }

  // 页面就绪后初始化
  function bootstrap() {
    initHeroBackground();
    initSocialTooltips();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  // 兼容 PJAX 页面切换
  document.addEventListener('pjax:complete', bootstrap);
})();
