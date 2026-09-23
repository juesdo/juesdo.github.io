(function () {
  'use strict';

  // 9 张轮播壁纸素材
  const bgImages = [
    '/img/bg/1779330249449.png',
    '/img/bg/1779330254465.png',
    '/img/bg/1779330264551.png',
    '/img/bg/17793315412.png',
    '/img/bg/1779331884054.png',
    '/img/bg/1779331935933.png',
    '/img/bg/1779331940722.png',
    '/img/bg/wallhaven-xepz2v.png',
    '/img/bg/wallhaven-zpz1ow.jpg'
  ];

  const BG_INTERVAL = 8000;
  const BG_TRANSITION = 1500;

  let bgTimer = null;
  let bgActive = 0;
  let bgCurrent = -1;

  function preloadImage(url) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });
  }

  function randomBgIndex(exclude) {
    let idx;
    do {
      idx = Math.floor(Math.random() * bgImages.length);
    } while (idx === exclude && bgImages.length > 1);
    return idx;
  }

  async function nextBackground() {
    const layer0 = document.getElementById('hero-bg-0');
    const layer1 = document.getElementById('hero-bg-1');
    if (!layer0 || !layer1) return;

    const nextIdx = randomBgIndex(bgCurrent);
    const inactive = bgActive === 0 ? layer1 : layer0;
    const active = bgActive === 0 ? layer0 : layer1;

    await preloadImage(bgImages[nextIdx]);
    inactive.style.backgroundImage = `url('${bgImages[nextIdx]}')`;
    inactive.style.opacity = '1';

    setTimeout(() => {
      active.style.opacity = '0';
      bgActive = bgActive === 0 ? 1 : 0;
      bgCurrent = nextIdx;
    }, BG_TRANSITION);
  }

  function initHeroBackground() {
    console.log('Hero BG initialized');
    let container = document.querySelector('#page-header.full_page');
    let isFixed = false;

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
        isFixed = true;
      }
    }

    if (!container) {
      console.log('Hero BG: Not homepage, about, or link page.');
      if (bgTimer) {
        clearInterval(bgTimer);
        bgTimer = null;
      }
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
      layer1.style.opacity = '0';
      console.log('Hero BG: Created background layers.');
    }

    if (isFixed) {
      layer0.style.position = 'absolute';
      layer1.style.position = 'absolute';
    } else {
      layer0.style.position = 'absolute';
      layer1.style.position = 'absolute';
    }

    // Move to correct container if not already there
    if (layer0.parentNode !== container) {
      container.insertBefore(layer1, container.firstChild);
      container.insertBefore(layer0, container.firstChild);
    }

    bgCurrent = randomBgIndex(-1);
    layer0.style.backgroundImage = `url('${bgImages[bgCurrent]}')`;
    layer0.style.opacity = '1';

    if (bgTimer) clearInterval(bgTimer);
    bgTimer = setInterval(nextBackground, BG_INTERVAL);
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
