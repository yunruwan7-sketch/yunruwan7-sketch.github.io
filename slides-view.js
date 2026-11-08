(() => {
  'use strict';

  const mounted = new WeakMap();
  let nextId = 0;
  const string = (value) => value == null ? '' : String(value);

  function element(tag, className, text) {
    const item = document.createElement(tag);
    if (className) item.className = className;
    if (text != null) item.textContent = string(text);
    return item;
  }

  function safeUrl(value, remoteOnly = false) {
    const raw = string(value).trim();
    if (!raw || /[\u0000-\u001f\u007f\\]/.test(raw) || raw.startsWith('//')) return '';
    if (/^https?:\/\//i.test(raw)) {
      try {
        const parsed = new URL(raw);
        return parsed.hostname && !parsed.username && !parsed.password ? parsed.href : '';
      } catch (_) { return ''; }
    }
    if (remoteOnly || /^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('#')) return '';
    return raw;
  }

  function button(label, className) {
    const item = element('button', `slides-button${className ? ` ${className}` : ''}`, label);
    item.type = 'button';
    return item;
  }

  function sourceLink(url) {
    const item = element('a', 'slides-source', '打开原报告');
    item.href = url;
    item.target = '_blank';
    item.rel = 'noopener noreferrer';
    return item;
  }

  function render(target, project = {}) {
    if (typeof target === 'string') target = document.querySelector(target);
    if (!target || typeof target.replaceChildren !== 'function') {
      throw new TypeError('PortfolioSlides.render 需要一个有效的容器。');
    }
    const previous = mounted.get(target);
    if (previous) previous.destroy();

    const deck = project.slideDeck || {};
    const title = string(project.title || project.shortTitle || '报告阅读');
    const intro = string(project.intro || project.summary).trim();
    const sourceUrl = safeUrl(deck.sourceUrl);
    const id = `portfolio-slides-${++nextId}`;
    const root = element('section', 'slides-view');
    root.setAttribute('aria-labelledby', `${id}-title`);
    const header = element('header', 'slides-heading');
    const headingCopy = element('div', 'slides-heading-copy');
    const titleNode = element('h1', 'slides-title', title);
    titleNode.id = `${id}-title`;
    headingCopy.append(titleNode);
    if (intro) headingCopy.append(element('p', 'slides-intro', intro));
    header.append(headingCopy);
    if (sourceUrl && deck.mode !== 'embed') header.append(sourceLink(sourceUrl));
    root.append(header);
    target.replaceChildren(root);

    const listeners = [];
    let activePage = 0;
    let showPage = null;
    let isDestroyed = false;

    function listen(item, type, callback) {
      item.addEventListener(type, callback);
      listeners.push(() => item.removeEventListener(type, callback));
    }

    const controller = {
      destroy() {
        if (isDestroyed) return;
        isDestroyed = true;
        listeners.forEach((remove) => remove());
        if (mounted.get(target) === controller) mounted.delete(target);
        root.remove();
      },
      goTo(pageNumber) {
        if (showPage && Number.isFinite(Number(pageNumber))) showPage(Number(pageNumber) - 1);
      },
      getPage() { return showPage ? activePage + 1 : null; }
    };
    mounted.set(target, controller);

    const reader = element('div', 'slides-reader');
    const status = element('p', 'slides-status');
    status.setAttribute('role', 'status');
    status.hidden = true;
    const fullscreenButton = button('全屏阅读', 'slides-fullscreen');

    function currentFullscreen() {
      return document.fullscreenElement || document.webkitFullscreenElement;
    }

    function syncFullscreen() {
      const enabled = currentFullscreen() === reader;
      fullscreenButton.textContent = enabled ? '退出全屏' : '全屏阅读';
      fullscreenButton.setAttribute('aria-pressed', String(enabled));
    }

    const requestFullscreen = reader.requestFullscreen || reader.webkitRequestFullscreen;
    fullscreenButton.hidden = !requestFullscreen;
    fullscreenButton.setAttribute('aria-pressed', 'false');
    listen(fullscreenButton, 'click', async () => {
      try {
        if (currentFullscreen() === reader) {
          const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
          if (exitFullscreen) await exitFullscreen.call(document);
        } else if (requestFullscreen) {
          await requestFullscreen.call(reader);
        }
      } catch (_) {
        status.textContent = '全屏未能打开，可以继续在此阅读。';
        status.hidden = false;
      }
      syncFullscreen();
    });
    listen(document, 'fullscreenchange', syncFullscreen);
    listen(document, 'webkitfullscreenchange', syncFullscreen);

    if (deck.mode === 'embed') {
      const embedUrl = safeUrl(deck.embedUrl, true);
      if (!embedUrl) {
        root.append(element('p', 'slides-empty', '报告预览暂未接入。'));
        return controller;
      }
      reader.classList.add('slides-reader--embed');
      const stage = element('div', 'slides-stage slides-stage--embed');
      const frame = element('iframe', 'slides-embed-frame');
      frame.src = embedUrl;
      frame.title = title;
      frame.allow = 'fullscreen';
      frame.allowFullscreen = true;
      stage.append(frame);
      const toolbar = element('div', 'slides-toolbar slides-toolbar--embed');
      if (sourceUrl) toolbar.append(sourceLink(sourceUrl));
      toolbar.append(fullscreenButton);
      reader.append(stage, toolbar, status);
      root.append(reader);
      return controller;
    }

    const pages = deck.mode === 'images' && Array.isArray(deck.pages) ? deck.pages : [];
    if (!pages.length) {
      root.append(element('p', 'slides-empty', '报告页面暂未接入。'));
      return controller;
    }

    const stage = element('div', 'slides-stage');
    stage.tabIndex = 0;
    stage.setAttribute('role', 'region');
    stage.setAttribute('aria-label', '报告页面，可用键盘左右键翻页');
    const slideImage = element('img', 'slides-image');
    slideImage.decoding = 'async';
    const imageMessage = element('p', 'slides-image-message');
    imageMessage.setAttribute('role', 'status');
    stage.append(slideImage, imageMessage);

    const toolbar = element('div', 'slides-toolbar');
    const paging = element('div', 'slides-paging');
    const previousButton = button('上一页');
    const nextButton = button('下一页', 'slides-button--primary');
    const count = element('span', 'slides-page-count');
    count.setAttribute('aria-live', 'polite');
    count.setAttribute('aria-atomic', 'true');
    paging.append(previousButton, count, nextButton);
    const tools = element('div', 'slides-tools');
    const jumpLabel = element('label', 'slides-jump', '跳至');
    const jump = element('select', 'slides-page-select');
    jump.setAttribute('aria-label', '跳转到指定页');
    pages.forEach((page, index) => {
      const option = element('option', '', `第 ${index + 1} 页`);
      option.value = String(index);
      jump.append(option);
    });
    jumpLabel.append(jump);
    tools.append(jumpLabel, fullscreenButton);
    toolbar.append(paging, tools);

    const caption = element('div', 'slides-caption');
    const pageCaption = element('p', 'slides-page-caption');
    const readingHint = element('p', 'slides-reading-hint', '可用键盘左右键翻页');
    caption.append(pageCaption, readingHint);
    if (deck.complete !== true) {
      caption.append(element('p', 'slides-excerpt-note', sourceUrl ? '当前展示已接入页面，完整内容可查看原报告。' : '当前展示已接入页面。'));
    }

    const previews = element('details', 'slides-previews');
    previews.open = false;
    const previewsSummary = element('summary', 'slides-previews-label', '页面预览');
    const strip = element('div', 'slides-thumbnail-strip');
    strip.setAttribute('aria-label', '选择报告页面');
    const thumbnails = pages.map((page, index) => {
      const thumbnail = element('button', 'slides-thumbnail');
      thumbnail.type = 'button';
      thumbnail.setAttribute('aria-label', `跳到第 ${index + 1} 页`);
      const image = element('img', 'slides-thumbnail-image');
      const src = safeUrl(page && page.src);
      if (src) image.src = src;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      thumbnail.append(image, element('span', 'slides-thumbnail-number', String(index + 1)));
      listen(thumbnail, 'click', () => showPage(index));
      strip.append(thumbnail);
      return thumbnail;
    });
    previews.append(previewsSummary, strip);
    reader.append(toolbar, stage, caption, previews, status);
    root.append(reader);

    function revealThumbnail(index) {
      if (!previews.open) return;
      const thumbnail = thumbnails[index];
      const start = thumbnail.offsetLeft;
      const end = start + thumbnail.offsetWidth;
      if (start < strip.scrollLeft) strip.scrollLeft = start;
      else if (end > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = end - strip.clientWidth;
    }

    showPage = (requested) => {
      if (isDestroyed) return;
      activePage = Math.max(0, Math.min(pages.length - 1, Math.trunc(requested)));
      const page = pages[activePage] || {};
      const src = safeUrl(page.src);
      const alt = string(page.alt).trim();
      slideImage.hidden = !src;
      slideImage.alt = alt || `${title} 第 ${activePage + 1} 页`;
      const unavailableMessage = sourceUrl ? '这一页暂时无法显示，可打开原报告查看。' : '这一页暂时无法显示，请稍后重试。';
      imageMessage.textContent = src ? `正在载入第 ${activePage + 1} 页` : unavailableMessage;
      imageMessage.hidden = false;
      slideImage.onload = () => {
        if (!isDestroyed) imageMessage.hidden = true;
      };
      slideImage.onerror = () => {
        if (isDestroyed) return;
        slideImage.hidden = true;
        imageMessage.textContent = unavailableMessage;
        imageMessage.hidden = false;
      };
      if (src) slideImage.src = src;
      else slideImage.removeAttribute('src');
      if (src && slideImage.complete && slideImage.naturalWidth) imageMessage.hidden = true;
      previousButton.disabled = activePage === 0;
      nextButton.disabled = activePage === pages.length - 1;
      count.textContent = `第 ${activePage + 1} / ${pages.length} 页`;
      jump.value = String(activePage);
      pageCaption.textContent = alt;
      pageCaption.hidden = !alt;
      thumbnails.forEach((thumbnail, index) => {
        if (index === activePage) thumbnail.setAttribute('aria-current', 'page');
        else thumbnail.removeAttribute('aria-current');
      });
      revealThumbnail(activePage);
    };

    listen(previousButton, 'click', () => showPage(activePage - 1));
    listen(nextButton, 'click', () => showPage(activePage + 1));
    listen(jump, 'change', () => showPage(Number(jump.value)));
    listen(previews, 'toggle', () => revealThumbnail(activePage));
    listen(document, 'keydown', (event) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !root.getClientRects().length) return;
      const focused = document.activeElement;
      if (focused && focused.matches('input, select, textarea, [contenteditable="true"]')) return;
      if (focused && focused !== document.body && !root.contains(focused)) return;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPage(activePage - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showPage(activePage + 1);
      }
    });
    showPage(0);
    return controller;
  }

  window.PortfolioSlides = { render };
})();
