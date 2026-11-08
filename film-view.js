(function () {
  'use strict';

  const FILM_URL = './assets/video/aruna-final-film.mp4';
  const POSTER_URL = './assets/work/aruna-final-poster.png';
  const FRAME_URL = './assets/work/aruna-final-color.jpg';

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function resolveTarget(target) {
    return typeof target === 'string' ? document.querySelector(target) : target;
  }

  async function play(target) {
    const scope = resolveTarget(target);
    if (!scope) return false;
    const video = scope.tagName && scope.tagName.toLowerCase() === 'video'
      ? scope : scope.querySelector('.film-view-video');
    if (!video) return false;
    try {
      await video.play();
      return true;
    } catch (error) {
      const view = video.closest('.film-view');
      const button = view && view.querySelector('.film-view-play');
      if (button) button.hidden = false;
      return false;
    }
  }

  function create(project, options) {
    const settings = options || {};
    const level = Math.min(6, Math.max(1, Number(settings.headingLevel) || 3));
    const title = project.title || '《阿鲁纳东巴画奇遇》';
    const view = element('article', 'film-view');
    view.dataset.filmId = project.id || 'aruna-story';

    const poster = element('figure', 'film-view-poster');
    const posterImage = element('img', 'film-view-poster-image');
    posterImage.src = project.coverImage || POSTER_URL;
    posterImage.alt = title + '正式海报，完整竖版画面';
    posterImage.loading = 'lazy';
    posterImage.decoding = 'async';
    poster.append(posterImage);
    view.append(poster);

    const content = element('div', 'film-view-content');
    content.append(element('p', 'film-view-meta', 'AIGC 动画短片 · 5分13秒'));
    content.append(element('h' + level, 'film-view-title', title));
    content.append(element('p', 'film-view-summary', project.summary || '少年阿鲁纳进入东巴画中的世界，以三段史诗串联“失色、凝滴、复色”，最终回到现实参与绘画。'));

    const player = element('div', 'film-view-player');
    const video = element('video', 'film-view-video');
    video.src = project.reelUrl || FILM_URL;
    video.poster = project.videoPoster || FRAME_URL;
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.autoplay = false;
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-label', title + '完整影片');
    video.append(document.createTextNode('当前浏览器不支持播放此视频。'));
    player.append(video);

    const playButton = element('button', 'film-view-play', '播放完整影片');
    playButton.type = 'button';
    playButton.addEventListener('click', function () { play(view); });
    player.append(playButton);
    video.addEventListener('playing', function () { playButton.hidden = true; });
    video.addEventListener('ended', function () {
      playButton.textContent = '重新播放';
      playButton.hidden = false;
    });
    content.append(player);

    const actions = element('div', 'film-view-actions');
    const documentButton = element('button', 'film-view-document', '创作说明');
    documentButton.type = 'button';
    documentButton.addEventListener('click', function () {
      window.dispatchEvent(new CustomEvent('portfolio:document', {
        detail: { id: project.id || 'aruna-story' }
      }));
    });
    actions.append(documentButton);
    content.append(actions);
    view.append(content);
    return view;
  }

  function render(target, project, options) {
    const mount = resolveTarget(target);
    if (!mount) return null;
    const view = create(project, options);
    mount.replaceChildren(view);
    if (options && options.autoplay === true) play(view);
    return view;
  }

  window.PortfolioFilm = { create: create, render: render, play: play };
}());
