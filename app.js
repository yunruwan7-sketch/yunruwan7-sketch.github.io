(() => {
  'use strict';
  const data = window.PORTFOLIO_DATA || {};
  const projects = Array.isArray(data.projects) ? data.projects : [];
  const isTemplate = data.isTemplate !== false;
  const $ = (selector) => document.querySelector(selector);
  const array = (value) => Array.isArray(value) ? value : [];
  const string = (value) => value == null ? '' : String(value);
  const clean = (value) => string(value).replace(/^待补充[：:]\s*/, '').trim();
  const pending = (value) => /待填写|待补充|^填写/.test(string(value));
  const compact = (value) => !value || pending(value) ? '—' : string(value);
  const categories = { game: '游戏项目', analysis: '游戏拆解', aigc: 'AIGC 影像' };
  const collectionAnchors = { game: 'games', analysis: 'analysis', aigc: 'aigc' };
  const tabs = ['materials', 'overview', 'media'];
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let selectedProject = null;
  let selectedTab = 'materials';
  let slideReader = null;
  const resourceGroups = new Map();
  let toastTimer;
  let navigationFrame = 0;

  function setActiveCollection(category) {
    document.querySelectorAll('.main-nav [data-collection]').forEach((anchor) => {
      if (anchor.dataset.collection === category) anchor.setAttribute('aria-current', 'location');
      else anchor.removeAttribute('aria-current');
    });
  }

  function syncSectionNavigation() {
    const home = $('#home-content');
    if (document.body.dataset.view !== 'home' || !home || home.hidden) return;
    const header = $('.site-header');
    const top = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
    const bottom = window.innerHeight;
    let active = 'game';
    let fallback = 'game';
    let largestVisibleHeight = 0;
    Object.entries(collectionAnchors).forEach(([category, id]) => {
      const section = document.getElementById(id);
      if (!section || !section.getClientRects().length) return;
      const bounds = section.getBoundingClientRect();
      if (bounds.top <= top) fallback = category;
      const visibleHeight = Math.max(0, Math.min(bounds.bottom, bottom) - Math.max(bounds.top, top));
      if (visibleHeight > largestVisibleHeight) {
        largestVisibleHeight = visibleHeight;
        active = category;
      }
    });
    setActiveCollection(largestVisibleHeight > 0 ? active : fallback);
  }

  function scheduleSectionNavigation() {
    if (navigationFrame) return;
    navigationFrame = requestAnimationFrame(() => {
      navigationFrame = 0;
      syncSectionNavigation();
    });
  }
  window.addEventListener('scroll', scheduleSectionNavigation, { passive: true });
  window.addEventListener('resize', scheduleSectionNavigation);
  window.addEventListener('load', scheduleSectionNavigation, { once: true });

  function node(tag, className, content) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content != null) element.textContent = string(content);
    return element;
  }
  function safeUrl(value) {
    const raw = string(value).trim();
    if (!raw || /[\u0000-\u0020\u007f\\]/.test(raw) || raw.startsWith('//')) return '';
    if (/^https?:\/\//i.test(raw)) {
      try {
        const parsed = new URL(raw);
        return parsed.hostname && !parsed.username && !parsed.password ? parsed.href : '';
      } catch (_) { return ''; }
    }
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('#')) return '';
    return raw;
  }
  function link(label, url, className) {
    const anchor = node('a', className, label);
    anchor.href = url;
    if (/^https?:\/\//i.test(url)) {
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
    }
    return anchor;
  }
  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((element) => { element.textContent = string(value); });
  }
  function animateIn(element) {
    if (!reducedMotion && element && typeof element.animate === 'function') {
      element.animate([{ opacity: 0, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 190, easing: 'ease-out' });
    }
  }
  setText('[data-name]', data.name || '你的名字');
  setText('[data-role]', data.role || '游戏策划');
  setText('[data-initials]', data.initials || 'WY');
  setText('#year', new Date().getFullYear());
  setText('[data-focus]', data.focus || '系统／玩法方向');
  setText('[data-education-summary]', [data.location, data.graduation].filter(Boolean).join(' · '));
  setText('#site-status', isTemplate ? '框架预览 · 项目与履历资料待接入' : '项目演示与设计材料持续整理中');

  const choiceButtons = [];
  const projectList = $('#project-list');
  if (projectList) projects.forEach((project, index) => {
    const button = node('button', 'project-choice');
    button.type = 'button';
    button.dataset.projectId = string(project.id);
    const copy = node('span', 'choice-copy');
    copy.append(node('strong', '', project.shortTitle || project.title), node('small', '', categories[project.category] || '项目案例'));
    button.append(node('span', 'choice-icon', '📁'), copy, node('span', 'choice-count', `${array(project.resources).length} 份资料`), node('span', 'choice-arrow', '打开'));
    button.setAttribute('aria-label', `查看${string(project.title)}`);
    button.addEventListener('click', () => navigate(project.id, 'materials'));
    button.addEventListener('keydown', (event) => {
      let next = index;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % projects.length;
      else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + projects.length) % projects.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = projects.length - 1;
      else return;
      event.preventDefault();
      choiceButtons[next].focus({ preventScroll: true });
      navigate(projects[next].id, 'materials');
    });
    projectList.append(button);
    choiceButtons.push(button);
  });
  setText('#project-count', String(projects.length).padStart(2, '0'));
  const supportingTarget = $('#supporting-works');
  if (supportingTarget) {
    const otherWorks = array(data.supportingWorks).filter((work) => safeUrl(work.url) && !projects.some((project) => safeUrl(project.playUrl) === safeUrl(work.url)));
    supportingTarget.hidden = !otherWorks.length;
    if (otherWorks.length) {
      supportingTarget.append(node('h3', '', '其他可试玩作品'));
      otherWorks.forEach((work) => supportingTarget.append(link(`${string(work.title)} · 试玩`, safeUrl(work.url), 'supporting-play')));
    }
  }


  function route() {
    let parts;
    try { parts = location.hash.replace(/^#/, '').split('/').map(decodeURIComponent); }
    catch (_) { parts = []; }
    return {
      project: parts[0] === 'work' ? projects.find((item) => string(item.id) === parts[1]) : null,
      section: parts[0] === 'work' ? '' : parts[0],
      tab: parts[0] === 'work' && tabs.includes(parts[2]) ? parts[2] : 'overview'
    };
  }
  function navigate(id, tab) {
    const hash = `#work/${encodeURIComponent(id)}/${tabs.includes(tab) ? tab : 'overview'}`;
    if (location.hash === hash) return;
    location.hash = hash;
  }
  function revealProjectChoice(button) {
    if (!projectList || !button || projectList.scrollWidth <= projectList.clientWidth + 1) return;
    const listBounds = projectList.getBoundingClientRect();
    const buttonBounds = button.getBoundingClientRect();
    let left = projectList.scrollLeft;
    if (buttonBounds.left < listBounds.left + 4) left += buttonBounds.left - listBounds.left - 4;
    else if (buttonBounds.right > listBounds.right - 4) left += buttonBounds.right - listBounds.right + 4;
    left = Math.max(0, Math.min(left, projectList.scrollWidth - projectList.clientWidth));
    if (Math.abs(left - projectList.scrollLeft) > 1) {
      projectList.scrollTo({ left, top: projectList.scrollTop, behavior: reducedMotion ? 'auto' : 'smooth' });
    }
  }
  function renderMetadata(project) {
    const target = $('#project-meta');
    if (!target) return;
    target.replaceChildren();
    [[project.roleLabel || '我的职责', project.role], ['项目时间', project.period], [project.category === 'game' ? '所属赛事' : '项目形式', project.team], ['赛事创作期', project.eventPeriod], [project.category === 'game' ? '开发引擎' : '工具', project.engine]].forEach(([label, value]) => {
      if (!value || pending(value)) return;
      const item = node('div', 'meta-item');
      item.append(node('span', 'meta-label', label), node('span', 'meta-value', compact(value)));
      target.append(item);
    });
  }
  function renderProject(project) {
    const index = projects.indexOf(project);
    setText('#project-kicker', categories[project.category] || '作品');
    setText('#breadcrumb-title', project.shortTitle || project.title);
    const collection = categories[project.category] || '作品';
    const collectionHash = `#${collectionAnchors[project.category] || 'home'}`;
    if ($('#collection-link')) { $('#collection-link').href = collectionHash; $('#collection-link').textContent = collection; }
    if ($('#back-to-collection')) { $('#back-to-collection').href = collectionHash; $('#back-to-collection').textContent = `返回${collection}`; }
    setText('#project-title', project.title);
    setText('#project-status', project.status || '内容待补充');
    setText('#project-summary', project.summary || '项目介绍待补充。');
    setText('#project-counter', `${String(index + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`);
    document.title = `${string(project.title)} · ${data.name || '游戏策划作品集'}`;
    choiceButtons.forEach((button, position) => {
      const current = position === index;
      button.classList.toggle('active', current);
      button.setAttribute('aria-current', current ? 'true' : 'false');
      const icon = button.querySelector('.choice-icon');
      if (icon) icon.textContent = current ? '📂' : '📁';
    });
    revealProjectChoice(choiceButtons[index]);
    const tags = $('#project-tags');
    if (tags) {
      tags.replaceChildren();
      array(project.tags).forEach((value) => tags.append(node('span', 'tag', value)));
    }
    renderMetadata(project);
    renderProjectActions(project);
    renderGallery(project);
    const related = $('#related-projects');
    if (related) {
      const peers = projects.filter((item) => item.category === project.category && item.id !== project.id);
      related.replaceChildren();
      related.hidden = !peers.length;
      if (peers.length) {
        related.append(node('p', '', `其他${collection}`));
        peers.forEach((item) => related.append(link(item.shortTitle || item.title, `#work/${item.id}/overview`, 'related-link')));
      }
    }
    animateIn($('#project-view'));
  }
  function projectMedia(project) {
    const media = array(project.gallery).map((item) => ({
      src: safeUrl(item && item.src),
      alt: string(item && item.alt) || `${string(project.title)}作品截图`,
      caption: string(item && item.caption),
      type: string(item && item.type),
      sourceUrl: safeUrl(item && item.sourceUrl)
    })).filter((item) => item.src);
    if (!media.length && safeUrl(project.coverImage)) media.push({
      src: safeUrl(project.coverImage), alt: `${string(project.title)}作品画面`, caption: string(project.coverCaption), type: ''
    });
    return media;
  }
  function renderProjectActions(project) {
    const target = $('#project-actions');
    if (!target) return;
    target.replaceChildren();
    const play = safeUrl(project.playUrl);
    const documentUrl = safeUrl(project.documentUrl);
    const reel = safeUrl(project.reelUrl);
    const originalFile = safeUrl(project.originalFileUrl);
    if (project.category === 'game') {
      const pauseDemo = () => document.querySelectorAll('#stage-host video').forEach((video) => video.pause());
      if (play) {
        const start = link(project.playLabel || '立即试玩', play, 'project-action project-action-primary project-play');
        start.setAttribute('aria-label', `${string(project.title)}：${project.playLabel || '立即试玩'}`);
        start.addEventListener('click', pauseDemo);
        target.append(start);
      } else {
        const pendingPlay = node('button', 'project-action project-play project-play-pending', '试玩待补充');
        pendingPlay.type = 'button';
        pendingPlay.disabled = true;
        target.append(pendingPlay);
      }
      // Videos and design documents each have their own content tab below.
      if (play && project.playInstructions) target.append(node('p', 'project-action-note', project.playInstructions));
      target.hidden = false;
      return;
    }
    if (play) {
      const start = link('立即试玩', play, 'project-action project-action-primary');
      start.setAttribute('aria-label', `${string(project.title)}：立即试玩`);
      start.target = '_blank'; start.rel = 'noopener noreferrer';
      target.append(start);
    }
    if (safeUrl(project.embedUrl)) {
      const embed = node('button', 'project-action project-action-embed', '在页面中试玩');
      embed.type = 'button';
      embed.addEventListener('click', () => showMedia(project, () => launchGame(project)));
      target.append(embed);
    }
    if (reel && !/^https?:\/\//i.test(reel) && /\.(?:mp4|webm|m4v|ogv)(?:[?#]|$)/i.test(reel)) {
      const watchLabel = project.category === 'aigc' ? '播放完整影片' : `播放${project.reelLabel || '作品视频'}`;
      const watch = node('button', 'project-action project-action-primary', watchLabel);
      watch.type = 'button';
      watch.setAttribute('aria-label', `${string(project.title)}：${watchLabel}`);
      watch.addEventListener('click', () => showMedia(project, () => launchVideo(project)));
      target.append(watch);
    } else if (reel) target.append(link('观看作品视频', reel, 'project-action project-action-secondary'));
    if (documentUrl) {
      const label = project.category === 'analysis' ? '打开完整拆解' : project.category === 'aigc' ? '创作说明' : project.documentLabel || '阅读设计案';
      if (projectDocumentPages(project).length) {
        const read = node('button', 'project-action project-action-secondary', label);
        read.type = 'button';
        read.setAttribute('aria-haspopup', 'dialog');
        read.addEventListener('click', () => previewDocument(project, documentUrl, read));
        target.append(read);
      } else target.append(link(label, documentUrl, 'project-action project-action-secondary'));
    }
    if (originalFile && project.category !== 'aigc') target.append(link(project.originalFileLabel || '查看原文件', originalFile, 'project-action project-action-secondary'));
    if (play && project.playInstructions) target.append(node('p', 'project-action-note', project.playInstructions));
    if (project.mediaVersionNote) target.append(node('p', 'project-action-note', project.mediaVersionNote));
    target.hidden = !target.children.length;
  }
  function showMedia(project, action) {
    navigate(project.id, 'media');
    renderRoute();
    if (action) action();
  }
  function projectResources(project) {
    return array(project.resources).filter((resource) => project.category !== 'game' || ['document', 'folder'].includes(resource.kind)).map((resource, index) => ({
      ...resource,
      id: string(resource.id) || `${project.id}-resource-${index}`,
      title: string(resource.title),
      group: string(resource.group) || '其他资料',
      kind: string(resource.kind) || 'document',
      url: safeUrl(resource.url),
      previewImage: safeUrl(resource.previewImage),
      previewPages: array(resource.previewPages)
    })).filter((resource) => resource.title && (resource.url || resource.previewImage || resource.previewPages.length));
  }
  function renderResourceBrowser(project) {
    const filters = $('#resource-filters');
    const results = $('#resource-results');
    if (!filters || !results) return;
    const resources = projectResources(project);
    const order = project.category === 'aigc' ? ['试玩与视频', '美术', '分析与创作'] : ['策划', '程序', '美术', '音频', '试玩与视频', '分析与创作'];
    const actualGroups = [...new Set(resources.map((resource) => resource.group))];
    actualGroups.sort((a, b) => (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 99 : order.indexOf(b)));
    const allLabel = project.category === 'game' ? '全部文档' : '全部资料';
    const itemLabel = project.category === 'game' ? '份文档' : '份资料';
    let current = resourceGroups.get(project.id) || allLabel;
    if (current !== allLabel && !actualGroups.includes(current)) current = allLabel;
    const kinds = { document: '文档', image: '图片', video: '视频', play: '试玩', folder: '文件夹' };
    const groupLabel = (group) => project.category === 'aigc'
      ? ({ '试玩与视频': '影片与剧照', '美术': '海报', '分析与创作': '创作说明与源文件' }[group] || group)
      : project.category === 'analysis' && group === '分析与创作' ? '拆解报告与原页' : group;
    filters.replaceChildren();
    filters.hidden = actualGroups.length <= 1;
    function show(group) {
      current = group;
      resourceGroups.set(project.id, group);
      filters.querySelectorAll('button').forEach((button) => {
        const active = button.dataset.group === group;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      const visible = group === allLabel ? actualGroups.flatMap((name) => resources.filter((resource) => resource.group === name)) : resources.filter((resource) => resource.group === group);
      setText('#resource-summary', group === allLabel ? `${resources.length} ${itemLabel}` : `${groupLabel(group)} · ${visible.length} ${itemLabel}`);
      results.replaceChildren();
      results.removeAttribute('role');
      const groupLists = new Map();
      visible.forEach((resource) => {
        if (!groupLists.has(resource.group)) {
          const section = node('section', 'resource-group');
          if (actualGroups.length > 1) section.append(node('h3', 'resource-group-heading', groupLabel(resource.group)));
          const list = node('div', 'resource-file-list');
          list.setAttribute('role', 'list');
          section.append(list);
          results.append(section);
          groupLists.set(resource.group, list);
        }
        const card = node('article', 'resource-card');
        card.setAttribute('role', 'listitem');
        const copy = node('div', 'resource-copy');
        copy.append(node('span', 'resource-kind', kinds[resource.kind] || '资料'), node('h4', 'resource-title', resource.title));
        if (resource.description) copy.append(node('p', 'resource-description', resource.description));
        const actions = node('div', 'resource-actions');
        if (project.category !== 'game' && resource.previewPages.length) {
          const preview = node('button', 'resource-preview', '在站内阅读');
          preview.type = 'button';
          preview.setAttribute('aria-label', `在站内阅读：${resource.title}`);
          preview.setAttribute('aria-haspopup', 'dialog');
          preview.addEventListener('click', () => previewDocument({
            ...project,
            documentTitle: resource.title,
            documentPages: resource.previewPages,
            documentExcerpt: resource.excerpt == null ? !!project.documentExcerpt : !!resource.excerpt
          }, resource.url || safeUrl(project.documentUrl), preview));
          actions.append(preview);
        } else if (project.category !== 'game' && resource.previewImage) {
          const preview = node('button', 'resource-preview', '查看原图');
          preview.type = 'button';
          preview.setAttribute('aria-label', `查看原图：${resource.title}`);
          preview.setAttribute('aria-haspopup', 'dialog');
          preview.addEventListener('click', () => openGallery(project, [{
            src: resource.previewImage,
            alt: resource.title,
            caption: resource.title,
            type: resource.previewImage === safeUrl(project.coverImage) && /海报/.test(resource.title) ? 'poster' : 'image',
            sourceUrl: resource.url
          }], 0, preview));
          actions.append(preview);
        } else if (project.category !== 'game' && resource.kind === 'video' && resource.url && !/^https?:\/\//i.test(resource.url)) {
          const play = node('button', 'resource-preview', '播放视频');
          play.type = 'button';
          play.setAttribute('aria-label', `播放视频：${resource.title}`);
          play.addEventListener('click', () => showMedia(project, () => launchVideo({
            ...project,
            reelUrl: resource.url,
            videoPoster: resource.videoPoster || project.videoPoster
          })));
          actions.append(play);
        }
        if (resource.url) {
          let label = resource.kind === 'folder' ? '打开文件夹' : resource.kind === 'play' ? '立即试玩' : resource.kind === 'image' ? '打开源文件' : resource.kind === 'video' ? '打开视频' : /^https?:\/\//i.test(resource.url) ? '打开原文' : '打开原文件';
          const original = link(label, resource.url, 'resource-open');
          original.setAttribute('aria-label', `${label}：${resource.title}`);
          if (!/^https?:\/\//i.test(resource.url)) { original.target = '_blank'; original.rel = 'noopener noreferrer'; }
          actions.append(original);
        }
        card.append(copy, actions);
        groupLists.get(resource.group).append(card);
      });
      if (!visible.length) results.append(node('p', 'material-note', project.category === 'game' ? '策划文档待补充。' : '该项目暂无已接入的资料。'));
    }
    [allLabel, ...actualGroups].forEach((group) => {
      const count = group === allLabel ? resources.length : resources.filter((resource) => resource.group === group).length;
      const button = node('button', 'resource-filter', groupLabel(group));
      button.append(node('span', 'resource-filter-count', count));
      button.type = 'button'; button.dataset.group = group;
      button.addEventListener('click', () => show(group));
      filters.append(button);
    });
    const summary = $('#resource-summary');
    if (summary) summary.setAttribute('aria-live', 'polite');
    show(current);
  }
  function openGallery(project, media, index, trigger) {
    const target = $('#document-content');
    if (!target || !media[index]) return;
    target.replaceChildren();
    const heading = node('h2', 'document-heading', `${string(project.title)} · ${project.category === 'game' ? project.galleryLabel || '游戏截图' : '图片与原稿'}`);
    heading.id = 'document-title';
    const image = node('img', 'gallery-lightbox-image');
    const caption = node('p', 'gallery-lightbox-caption');
    const original = node('a', 'document-original', '打开该图片的原文件');
    original.target = '_blank'; original.rel = 'noopener noreferrer';
    const controls = node('div', 'gallery-lightbox-controls');
    const count = node('span', 'gallery-count');
    let current = index;
    function show(next) {
      current = (next + media.length) % media.length;
      const item = media[current];
      image.src = item.src; image.alt = item.alt;
      image.classList.toggle('is-poster', item.type === 'poster');
      caption.textContent = item.caption || item.alt;
      original.hidden = !item.sourceUrl;
      if (item.sourceUrl) original.href = item.sourceUrl;
      count.textContent = `${current + 1} / ${media.length}`;
    }
    if (media.length > 1) {
      const previous = node('button', 'gallery-arrow', '上一张');
      const next = node('button', 'gallery-arrow', '下一张');
      previous.type = next.type = 'button';
      previous.setAttribute('aria-label', '上一张作品画面');
      next.setAttribute('aria-label', '下一张作品画面');
      previous.addEventListener('click', () => show(current - 1));
      next.addEventListener('click', () => show(current + 1));
      controls.append(previous, count, next);
    }
    target.append(heading, controls, image, caption, original);
    show(current);
    showDialog($('#document-dialog'), trigger);
  }
  function renderGallery(project) {
    const host = $('#stage-host');
    if (!host) return;
    host.querySelectorAll('video').forEach((video) => video.pause());
    host.replaceChildren();
    if (project.category === 'game') {
      host.classList.remove('has-real-media', 'is-playing');
      const reel = safeUrl(project.reelUrl);
      const reelPage = safeUrl(project.reelPageUrl);
      if (reel) {
        const player = node('section', 'game-demo-video');
        const reelTitle = project.reelTitle || '演示视频';
        player.setAttribute('aria-label', `${string(project.title)}${reelTitle}`);
        const heading = node('div', 'game-demo-heading');
        heading.append(node('h3', '', reelTitle));
        if (project.reelDuration) heading.append(node('span', '', project.reelDuration));
        const video = node('video', 'project-video');
        video.controls = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.src = reel;
        video.setAttribute('aria-label', `${string(project.title)}${reelTitle}播放器`);
        const poster = safeUrl(project.videoPoster);
        if (poster) video.poster = poster;
        const error = node('div', 'game-demo-error');
        error.hidden = true;
        error.setAttribute('role', 'status');
        error.append(node('p', '', '视频暂时无法播放。'), link('打开视频文件', reel, 'video-original'));
        video.addEventListener('error', () => { error.hidden = false; });
        player.append(heading, video, error);
        if (project.reelNote) player.append(node('p', 'game-demo-note', project.reelNote));
        host.append(player);
      } else if (reelPage) {
        const player = node('section', 'game-demo-external');
        const heading = node('div', 'game-demo-heading');
        heading.append(node('h3', '', '演示视频'), node('span', '', `${project.reelDuration || ''} · TapTap`));
        const watch = link('', reelPage, 'game-demo-watch');
        watch.setAttribute('aria-label', `${string(project.title)}：在 TapTap 观看演示`);
        const poster = safeUrl(project.videoPoster);
        if (poster) {
          const image = node('img', '');
          image.src = poster;
          image.alt = `${string(project.title)}实机演示预览`;
          watch.append(image);
        }
        watch.append(node('span', 'game-demo-watch-label', '在 TapTap 观看演示'));
        player.append(heading, watch, node('p', 'game-demo-note', '打开作品页后，选择「实机画面」观看演示视频。'));
        host.append(player);
      }
      const screenshots = array(project.gallery).filter((item) => item.type === 'screenshot' && safeUrl(item.src)).map((item) => ({
        src: safeUrl(item.src), alt: string(item.alt), caption: string(item.caption)
      }));
      if (screenshots.length) {
        const gallery = node('section', 'game-screenshots');
        const heading = node('div', 'game-demo-heading');
        heading.append(node('h3', '', project.galleryLabel || '游戏截图'), node('span', '', `${screenshots.length} 张`));
        const grid = node('div', 'game-screenshot-grid');
        screenshots.forEach((item, index) => {
          const figure = node('figure', 'game-screenshot');
          const zoom = node('button', 'game-screenshot-button');
          zoom.type = 'button';
          zoom.setAttribute('aria-label', `查看大图：${item.alt}`);
          const image = node('img', '');
          image.src = item.src; image.alt = item.alt; image.loading = 'lazy';
          zoom.append(image, node('span', 'game-screenshot-zoom', '查看大图'));
          zoom.addEventListener('click', () => openGallery(project, screenshots, index, zoom));
          figure.append(zoom, node('figcaption', '', item.caption || item.alt));
          grid.append(figure);
        });
        gallery.append(heading, grid);
        host.append(gallery);
      }
      const missing = [];
      if (!screenshots.length) missing.push('游戏截图');
      if (!reel && !reelPage) missing.push('演示视频');
      if (missing.length) {
        const placeholders = node('div', 'game-media-placeholders');
        placeholders.classList.toggle('has-video', !!reel || !!reelPage || !!screenshots.length);
        missing.forEach((title) => {
          const item = node('section', 'game-media-placeholder');
          item.append(node('h3', '', title), node('p', '', '待补充'));
          placeholders.append(item);
        });
        host.append(placeholders);
      }
      if ($('#project-tags')) $('#project-tags').hidden = true;
      return;
    }
    if ($('#project-tags')) $('#project-tags').hidden = false;
    const media = projectMedia(project);
    host.classList.toggle('has-real-media', !!media.length);
    host.classList.remove('is-playing');
    if (!media.length) {
      const empty = node('div', 'media-unavailable');
      empty.append(node('p', 'media-unavailable-label', '作品材料'), node('h3', '', safeUrl(project.playUrl) ? '打开游戏，直接体验' : '原始作品素材待补充'));
      empty.append(node('p', '', project.mediaNote || (safeUrl(project.playUrl) ? '可通过上方“立即试玩”进入游戏页面。' : '这里将展示项目本身的截图、海报或设计文档页面。')));
      if (safeUrl(project.playUrl)) empty.append(link('立即试玩', safeUrl(project.playUrl), 'project-action project-action-primary'));
      else if (safeUrl(project.documentUrl)) empty.append(link('打开原始材料', safeUrl(project.documentUrl), 'project-action project-action-secondary'));
      host.append(empty);
      return;
    }
    let current = 0;
    const gallery = node('section', 'project-gallery');
    gallery.setAttribute('aria-label', `${string(project.title)}作品画面`);
    const imageButton = node('button', 'gallery-main');
    imageButton.type = 'button';
    imageButton.setAttribute('aria-label', '放大当前作品画面');
    const image = node('img', 'real-project-image');
    image.decoding = 'async';
    imageButton.append(image, node('span', 'gallery-zoom-label', '点击查看大图'));
    const bottom = node('div', 'gallery-bottom');
    const caption = node('p', 'gallery-caption');
    const controls = node('div', 'gallery-controls');
    const count = node('span', 'gallery-count');
    const thumbs = node('div', 'gallery-thumbnails');
    const thumbButtons = [];
    function show(index) {
      current = (index + media.length) % media.length;
      const item = media[current];
      image.src = item.src; image.alt = item.alt;
      imageButton.classList.toggle('is-poster', item.type === 'poster');
      caption.textContent = item.caption || item.alt;
      count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(media.length).padStart(2, '0')}`;
      thumbButtons.forEach((button, position) => {
        button.classList.toggle('active', position === current);
        button.setAttribute('aria-pressed', String(position === current));
      });
    }
    imageButton.addEventListener('click', () => openGallery(project, media, current, imageButton));
    if (media.length > 1) {
      const previous = node('button', 'gallery-arrow', '上一张');
      const next = node('button', 'gallery-arrow', '下一张');
      previous.type = next.type = 'button';
      previous.setAttribute('aria-label', '上一张作品画面');
      next.setAttribute('aria-label', '下一张作品画面');
      previous.addEventListener('click', () => show(current - 1));
      next.addEventListener('click', () => show(current + 1));
      controls.append(previous, count, next);
      media.forEach((item, index) => {
        const button = node('button', 'gallery-thumbnail');
        button.type = 'button';
        button.setAttribute('aria-label', `查看第 ${index + 1} 张：${item.alt}`);
        button.title = item.caption || item.alt;
        const thumb = node('img', ''); thumb.src = item.src; thumb.alt = ''; thumb.loading = 'lazy';
        button.append(thumb);
        button.addEventListener('click', () => show(index));
        button.addEventListener('keydown', (event) => {
          let nextIndex = index;
          if (event.key === 'ArrowRight') nextIndex = (index + 1) % media.length;
          else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + media.length) % media.length;
          else if (event.key === 'Home') nextIndex = 0;
          else if (event.key === 'End') nextIndex = media.length - 1;
          else return;
          event.preventDefault(); show(nextIndex); thumbButtons[nextIndex].focus({ preventScroll: true });
        });
        thumbButtons.push(button); thumbs.append(button);
      });
    } else controls.append(count);
    bottom.append(caption, controls);
    gallery.append(imageButton, bottom);
    if (media.length > 1) gallery.append(thumbs);
    host.append(gallery);
    show(0);
  }
  function launchGame(project) {
    const host = $('#stage-host');
    const url = safeUrl(project.embedUrl);
    if (!host || !url) return;
    host.querySelectorAll('video').forEach((video) => video.pause());
    host.replaceChildren(); host.classList.add('is-playing');
    const player = node('section', 'game-player');
    player.setAttribute('aria-label', `${string(project.title)}在线试玩`);
    const header = node('div', 'game-player-header');
    header.append(node('strong', '', `${string(project.title)} · 在线试玩`));
    const back = node('button', 'game-return', '返回作品画面'); back.type = 'button';
    back.addEventListener('click', () => renderGallery(project)); header.append(back);
    const frame = node('iframe', 'game-frame');
    frame.src = url; frame.title = `${string(project.title)}可玩 Demo`;
    frame.allow = 'autoplay; fullscreen; gamepad';
    frame.setAttribute('allowfullscreen', '');
    player.append(header, frame);
    if (project.playInstructions) player.append(node('p', 'game-instructions', project.playInstructions));
    host.append(player);
    requestAnimationFrame(() => host.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }));
  }
  function launchVideo(project) {
    const host = $('#stage-host');
    const url = safeUrl(project.reelUrl);
    if (!host || !url) return;
    if (project.category === 'game') {
      const video = host.querySelector('video');
      if (!video) return;
      requestAnimationFrame(() => host.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }));
      const playing = video.play();
      if (playing && typeof playing.catch === 'function') playing.catch(() => {});
      return;
    }
    host.querySelectorAll('video').forEach((video) => video.pause());
    host.replaceChildren();
    host.classList.add('is-playing');
    const player = node('section', 'game-player video-player');
    player.setAttribute('aria-label', `${string(project.title)}作品视频`);
    const header = node('div', 'game-player-header');
    header.append(node('strong', '', `${string(project.title)} · ${project.reelLabel || '作品视频'}`));
    const back = node('button', 'game-return', '返回作品画面');
    back.type = 'button';
    back.addEventListener('click', () => renderGallery(project));
    header.append(back);
    const video = node('video', 'project-video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.src = url;
    video.setAttribute('aria-label', `${string(project.title)}完整作品视频`);
    const poster = safeUrl(project.videoPoster);
    if (poster) video.poster = poster;
    const footer = node('div', 'video-player-footer');
    const original = link('打开视频文件', url, 'video-original');
    original.target = '_blank'; original.rel = 'noopener noreferrer';
    const status = node('p', 'video-player-status', '视频暂时无法播放，可打开视频文件查看。');
    status.hidden = true;
    status.setAttribute('role', 'status');
    video.addEventListener('error', () => { status.hidden = false; });
    footer.append(original, status);
    player.append(header, video, footer);
    host.append(player);
    requestAnimationFrame(() => host.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }));
    const playing = video.play();
    if (playing && typeof playing.catch === 'function') playing.catch(() => {});
  }

  function caseBlock(title, content, isList) {
    const section = node('section', 'case-block');
    section.append(node('h3', '', title));
    if (isList) {
      const items = node('ul', 'case-list');
      (array(content).length ? content : ['内容待补充。']).forEach((item) => items.append(node('li', '', clean(item))));
      section.append(items);
    } else section.append(node('p', '', clean(content) || '内容待补充。'));
    return section;
  }
  function appendEvidence(target, project) {
    const evidence = node('div', 'evidence-links');
    [['观看作品视频', project.reelUrl], ['阅读文档', project.documentUrl], ['试玩 Demo', project.playUrl], ['下载项目', project.downloadUrl]].forEach(([label, value]) => {
      const url = safeUrl(value);
      if (url) evidence.append(link(label, url, 'evidence-link'));
    });
    if (evidence.children.length) target.append(evidence);
    else target.append(node('p', 'material-note', isTemplate ? '真实项目的录屏、文档与 Demo 将接入这里。当前为框架预览。' : '暂未添加公开材料；可以在个人简历中查看项目说明。'));
  }
  function renderOverview(panel, project) {
    const layout = node('div', 'overview-layout');
    const figure = node('figure', 'overview-visual');
    const cover = node('div', 'overview-cover');
    const coverUrl = safeUrl(project.coverImage);
    if (coverUrl) {
      const image = node('img', 'overview-cover-image');
      image.src = coverUrl;
      image.alt = project.coverAlt || `${string(project.title)}作品封面`;
      cover.append(image);
    } else cover.append(node('div', 'overview-cover-placeholder', '作品封面待补充'));
    figure.append(cover);
    if (project.coverCaption) figure.append(node('figcaption', 'overview-image-caption', project.coverCaption));
    layout.append(figure);
    const copy = node('div', 'overview-copy');
    const labels = project.category === 'aigc' ? ['故事与主题', '叙事与制作', '创作工作']
      : project.category === 'analysis' ? ['分析范围', '拆解重点', '分析与建议']
      : ['设计目标', '核心玩法与规则', project.contributionTitle || '我负责的部分'];
    if (project.designGoal) copy.append(caseBlock(labels[0], project.designGoal));
    if (project.coreDesign) copy.append(caseBlock(labels[1], project.coreDesign));
    if (array(project.contributions).length) copy.append(caseBlock(labels[2], project.contributions, true));
    if (project.category === 'game' && project.eventBackground) {
      const event = caseBlock('参赛背景', project.eventBackground);
      if (safeUrl(project.eventSourceUrl)) event.append(link('赛事介绍', safeUrl(project.eventSourceUrl), 'event-source'));
      copy.append(event);
    }
    layout.append(copy);
    panel.append(layout);
  }
  function renderProcess(panel, project) {
    const stepper = node('div', 'process-stepper');
    stepper.setAttribute('role', 'group');
    stepper.setAttribute('aria-label', '选择设计阶段');
    const detail = node('div', 'process-detail');
    detail.setAttribute('aria-live', 'polite');
    const steps = [
      { title: '目标定义', copy: project.designGoal },
      { title: '方案推演', copy: project.coreDesign },
      { title: '验证迭代', copy: array(project.validation).length ? project.validation : ['测试与迭代记录待补充。'], list: true }
    ];
    const controls = [];
    function showStep(index) {
      controls.forEach((button, position) => {
        button.classList.toggle('active', index === position);
        button.setAttribute('aria-pressed', String(index === position));
      });
      detail.replaceChildren(node('span', 'process-number', `STEP ${String(index + 1).padStart(2, '0')}`), caseBlock(steps[index].title, steps[index].copy, steps[index].list));
      animateIn(detail);
    }
    steps.forEach((step, index) => {
      const button = node('button', 'process-step');
      button.type = 'button';
      button.append(node('span', '', String(index + 1).padStart(2, '0')), node('strong', '', step.title));
      button.addEventListener('click', () => showStep(index));
      controls.push(button);
      stepper.append(button);
    });
    panel.append(stepper, detail);
    showStep(0);
  }
  function projectDocumentPages(project) {
    return array(project.documentPages).map((page, index) => ({
      src: safeUrl(page && page.src),
      alt: string(page && page.alt) || `${string(project.title)}原稿第${index + 1}页`,
      caption: string(page && page.caption),
      width: Number(page && page.width) || 0,
      height: Number(page && page.height) || 0
    })).filter((page) => page.src);
  }
  function previewDocument(project, url, trigger) {
    const target = $('#document-content');
    if (!target) return;
    target.replaceChildren();
    const resourceLabel = project.resourceType === 'resume' ? '个人简历' : (project.documentTitle || (project.resourceType === 'creation' ? '创作说明' : '策划文档'));
    const heading = node('h2', 'document-heading', `${string(project.title)} · ${resourceLabel}`);
    heading.id = 'document-title';
    target.append(heading, link('在新窗口打开原文件', url, 'document-original'));
    const resumePreview = project.resourceType === 'resume' && safeUrl(data.resumePreview);
    const pages = projectDocumentPages(project);
    if (pages.length) {
      const excerpt = project.documentExcerpt === true;
      if (excerpt) target.append(node('p', 'document-excerpt-note', '以下为原稿节选，完整内容请打开原文件。'));
      const stack = node('div', 'document-pages');
      stack.setAttribute('aria-label', excerpt ? '原页节选' : `${resourceLabel}完整原页`);
      pages.forEach((page, index) => {
        const figure = node('figure', 'document-page');
        const image = node('img', 'document-page-image');
        image.src = page.src; image.alt = page.alt;
        if (page.width > 0 && page.height > 0) { image.width = page.width; image.height = page.height; }
        image.loading = 'lazy'; image.decoding = 'async';
        figure.append(image, node('figcaption', 'document-page-number', page.caption || `第 ${index + 1} / ${pages.length} 页`));
        stack.append(figure);
      });
      target.append(stack);
    } else if (resumePreview) {
      const image = node('img', 'resume-page-preview');
      image.src = resumePreview;
      image.alt = `${string(project.title)}原版简历页面`;
      target.append(image);
    } else {
      const frame = node('iframe', 'document-frame');
      frame.title = `${string(project.title)}${resourceLabel}预览`;
      frame.src = url;
      frame.referrerPolicy = 'no-referrer';
      frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms');
      target.append(frame);
    }
    showDialog($('#document-dialog'), trigger);
  }
  function renderMaterials(panel, project) {
    const materials = node('div', 'material-list');
    const items = [
      ['01', '作品视频', '查看完整作品或项目演示。', project.reelUrl, false],
      ['02', project.documentTitle || (project.resourceType === 'creation' ? '创作说明' : '策划文档'), project.documentDescription || (project.resourceType === 'creation' ? '了解创作背景、叙事与制作过程。' : '查看规则、设计依据与配置说明。'), project.documentUrl, true],
      ['03', '试玩 Demo', '进入可运行的原型或游戏页面。', project.playUrl, false],
      ['04', '项目源码', '查看实现与协作记录。', project.sourceUrl, false],
      ['05', '项目下载', '下载对应平台的项目版本。', project.downloadUrl, false]
    ];
    items.forEach(([index, title, description, value, canPreview], position) => {
      const url = safeUrl(value);
      if ((!isTemplate || position > 2) && !url) return;
      const row = node('article', 'material-item');
      const copy = node('div', 'material-copy');
      copy.append(node('span', 'material-type', index), node('h4', '', title), node('p', '', description));
      row.append(copy);
      if (url) {
        const actions = node('div', 'material-actions');
        if (canPreview && /\.(?:pdf|html?)(?:[?#]|$)/i.test(url)) {
          const preview = node('button', 'material-preview', '站内预览');
          preview.type = 'button';
          preview.addEventListener('click', () => previewDocument(project, url, preview));
          actions.append(preview);
        }
        actions.append(link('打开', url, 'material-link'));
        row.append(actions);
      } else row.append(node('span', 'material-status', '未接入'));
      materials.append(row);
    });
    if (materials.children.length) panel.append(materials);
    else panel.append(node('p', 'material-note', '暂未添加公开材料。设计稿和演示整理后，可从这里直接查看。'));
  }
  function renderPanel(project, tab) {
    const panel = $('#case-panel');
    if (!panel) return;
    if ($('#resource-browser')) $('#resource-browser').hidden = tab !== 'materials';
    if ($('#media-view')) $('#media-view').hidden = tab !== 'media';
    if ($('#project-meta')) $('#project-meta').hidden = tab !== 'overview';
    panel.hidden = tab !== 'overview';
    if (tab !== 'media' && $('#stage-host')) $('#stage-host').querySelectorAll('video').forEach((video) => video.pause());
    panel.replaceChildren();
    if (tab === 'materials') renderResourceBrowser(project);
    else if (tab === 'overview') renderOverview(panel, project);
    animateIn(panel);
  }
  function renderRoute() {
    const current = route();
    const projectPage = $('#project-page');
    const homePage = $('#home-content');
    const analysisPage = $('#analysis-page');
    const filmPage = $('#film-page');
    const category = current.project && current.project.category;
    if (category !== 'analysis' && slideReader) { slideReader.destroy(); slideReader = null; }
    if (analysisPage) analysisPage.hidden = category !== 'analysis';
    if (filmPage) filmPage.hidden = category !== 'aigc';
    if (!current.project) {
      if (projectPage) projectPage.hidden = true;
      if (homePage) homePage.hidden = false;
      document.body.dataset.view = 'home';
      document.querySelectorAll('video').forEach((video) => video.pause());
      const section = current.section === 'demo' || current.section === 'plans' ? 'games' : current.section;
      setActiveCollection(Object.keys(collectionAnchors).find((key) => collectionAnchors[key] === section) || 'game');
      selectedProject = null;
      document.title = `${data.name || '个人'} · 游戏策划作品集`;
      requestAnimationFrame(() => {
        const target = document.getElementById(section);
        if (target && ['games', 'analysis', 'aigc'].includes(section)) target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
        else if (!section || section === 'home') window.scrollTo({ top: 0, behavior: 'instant' });
        scheduleSectionNavigation();
      });
      return;
    }
    if (category === 'analysis' || category === 'aigc') {
      if (projectPage) projectPage.hidden = true;
      if (homePage) homePage.hidden = true;
      document.body.dataset.view = category;
      document.body.dataset.collection = category;
      document.title = `${current.project.title} · ${data.name || '作品集'}`;
      setActiveCollection(category);
      if (selectedProject !== current.project) {
        document.querySelectorAll('video').forEach((video) => video.pause());
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
      if (category === 'analysis' && !slideReader && window.PortfolioSlides) {
        slideReader = window.PortfolioSlides.render($('#analysis-content'), current.project);
      }
      if (category === 'aigc' && window.PortfolioFilm && (selectedProject !== current.project || !$('#film-content').children.length)) {
        window.PortfolioFilm.render($('#film-content'), current.project, { headingLevel: 1 });
      }
      selectedProject = current.project;
      selectedTab = null;
      return;
    }
    if (homePage) homePage.hidden = true;
    if (projectPage) projectPage.hidden = false;
    document.body.dataset.view = 'project';
    document.body.dataset.collection = current.project.category;
    setActiveCollection(current.project.category);
    if (selectedProject !== current.project) {
      document.querySelectorAll('video').forEach((video) => video.pause());
      renderProject(current.project);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    selectedProject = current.project;
    selectedTab = current.tab;
    document.querySelectorAll('[data-case-tab]').forEach((button) => {
      const active = button.dataset.caseTab === selectedTab;
      button.classList.toggle('active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    const activeTab = document.querySelector(`[data-case-tab="${selectedTab}"]`);
    if ($('#case-panel') && activeTab && activeTab.id) $('#case-panel').setAttribute('aria-labelledby', activeTab.id);
    renderPanel(selectedProject, selectedTab);
  }
  const caseTabs = Array.from(document.querySelectorAll('[data-case-tab]'));
  caseTabs.forEach((button, index) => {
    button.addEventListener('click', () => { if (selectedProject) navigate(selectedProject.id, button.dataset.caseTab); });
    button.addEventListener('keydown', (event) => {
      let next = index;
      if (event.key === 'ArrowRight') next = (index + 1) % caseTabs.length;
      else if (event.key === 'ArrowLeft') next = (index - 1 + caseTabs.length) % caseTabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = caseTabs.length - 1;
      else return;
      event.preventDefault();
      caseTabs[next].focus({ preventScroll: true });
      if (selectedProject) navigate(selectedProject.id, caseTabs[next].dataset.caseTab);
    });
  });
  ['#project-previous', '#project-next'].forEach((selector, position) => {
    const button = $(selector);
    if (button) button.textContent = position ? '下个项目' : '上个项目';
    if (button) button.addEventListener('click', () => {
      if (!selectedProject || !projects.length) return;
      const index = (projects.indexOf(selectedProject) + (position ? 1 : -1) + projects.length) % projects.length;
      navigate(projects[index].id, 'materials');
    });
  });
  if ($('#home-button')) $('#home-button').addEventListener('click', (event) => {
    event.preventDefault();
    if (location.hash === '#home') renderRoute();
    else location.hash = '#home';
  });
  window.addEventListener('hashchange', renderRoute);

  const dialogTriggers = new WeakMap();
  function showDialog(dialog, trigger) {
    if (!dialog || dialog.open) return;
    document.querySelectorAll('video').forEach((video) => video.pause());
    dialogTriggers.set(dialog, trigger || document.activeElement);
    dialog.showModal();
    dialog.scrollTop = 0;
  }
  document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => {
    const dialog = button.closest('dialog');
    if (dialog) dialog.close();
  }));
  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
      const trigger = dialogTriggers.get(dialog);
      if (trigger && trigger.isConnected && typeof trigger.focus === 'function') trigger.focus({ preventScroll: true });
    });
  });
  const publicEmail = string(data.email).trim();
  const validEmail = /^[A-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}$/i.test(publicEmail);
  const github = safeUrl(data.githubUrl);
  const itch = safeUrl(data.itchUrl);
  const resumePdf = safeUrl(data.resumePdf);
  function renderResume() {
    const content = node('div', 'resume-document');
    const heading = node('div', 'resume-heading');
    heading.append(node('h2', '', data.name || '你的名字'), node('p', 'resume-subtitle', data.role || '游戏策划'));
    content.append(heading, node('p', 'resume-note', isTemplate ? '当前为资料框架，经历与技能需替换为真实内容。' : [data.location, data.graduation, data.availability].filter(Boolean).join(' · ')));
    if (validEmail || github) {
      const contact = node('p', 'resume-contact');
      if (validEmail) contact.append(node('span', '', publicEmail));
      if (github) contact.append(link('GitHub', github));
      content.append(contact);
    }
    [['实习经历', data.experience], ['教育背景', data.education]].forEach(([title, values]) => {
      const section = node('section', 'resume-section');
      section.append(node('h3', '', title));
      const timeline = node('div', 'timeline');
      array(values).forEach((item) => {
        const entry = node('article', 'timeline-item');
        entry.append(node('span', 'timeline-period', compact(item.period)), node('h4', '', string(item.title).replace(/待填写|待补充/g, '').trim() || '资料待补充'));
        if (item.organization && !pending(item.organization)) entry.append(node('p', 'timeline-org', item.organization));
        if (item.description && !pending(item.title)) entry.append(node('p', '', clean(item.description)));
        else entry.append(node('p', 'empty-line', '具体资料待补充。'));
        timeline.append(entry);
      });
      section.append(timeline);
      content.append(section);
    });
    const skills = node('section', 'resume-section');
    skills.append(node('h3', '', '相关能力'));
    array(data.skills).forEach((group) => {
      const section = node('div', 'skill-group');
      section.append(node('h4', '', group.group));
      const items = node('div', 'skill-tags');
      const actual = array(group.items).filter((item) => !pending(item));
      if (actual.length) actual.forEach((item) => items.append(node('span', '', item)));
      else items.append(node('span', 'empty-line', '待补充'));
      section.append(items);
      skills.append(section);
    });
    content.append(skills);
    if (array(data.supportingWorks).length) {
      const works = node('section', 'resume-section');
      works.append(node('h3', '', '其他作品'));
      array(data.supportingWorks).forEach((work) => {
        const url = safeUrl(work.url);
        if (url) works.append(link(`${string(work.title)} · ${work.type || '作品'}`, url, 'supporting-work'));
      });
      content.append(works);
    }
    if (array(data.gameExperience).length) {
      const games = node('section', 'resume-section');
      games.append(node('h3', '', '游戏经历'));
      array(data.gameExperience).forEach((group) => {
        const section = node('div', 'game-experience-group');
        section.append(node('h4', '', `${group.group || '游戏体验'}${group.hours ? ` · ${group.hours}` : ''}`), node('p', '', array(group.games).join('、')));
        games.append(section);
      });
      content.append(games);
    }
    return content;
  }
  const resumeContent = $('#resume-content');
  if (resumeContent) {
    resumeContent.append(renderResume());
    resumeContent.querySelector('h2').id = 'resume-title';
    const actions = node('div', 'resume-actions');
    if (resumePdf) {
      const preview = node('button', 'resume-pdf', '预览原版 PDF');
      preview.type = 'button';
      preview.addEventListener('click', () => previewDocument({ title: data.name || '个人', resourceType: 'resume' }, resumePdf, preview));
      actions.append(preview, link('打开原版 PDF', resumePdf, 'resume-pdf'));
    }
    else {
      const print = node('button', 'resume-print', '打印 / 保存网页简历');
      print.type = 'button'; print.id = 'print-resume';
      print.addEventListener('click', () => window.print());
      actions.append(print);
    }
    const actionAnchor = resumeContent.querySelector('.resume-contact') || resumeContent.querySelector('.resume-note');
    if (actionAnchor) actionAnchor.after(actions);
    else resumeContent.append(actions);
  }
  const printContent = $('#print-resume-content');
  if (printContent) printContent.append(renderResume());
  ['#resume-trigger', '#resume-footer'].forEach((selector) => {
    const trigger = $(selector);
    if (trigger) trigger.addEventListener('click', (event) => { event.preventDefault(); showDialog($('#resume-dialog'), trigger); });
  });
  function toast(message) {
    const target = $('#toast');
    if (!target) return;
    clearTimeout(toastTimer);
    target.textContent = message;
    target.classList.add('visible');
    toastTimer = setTimeout(() => { target.classList.remove('visible'); }, 2600);
  }
  const contactContent = $('#contact-content');
  if (contactContent) {
    const title = node('h2', '', '联系我');
    title.id = 'contact-title';
    contactContent.append(title, node('p', 'contact-label', '联系邮箱'), node('p', 'contact-email', validEmail ? publicEmail : '联系邮箱待补充'));
    const actions = node('div', 'contact-actions');
    const copy = node('button', 'copy-email', '复制邮箱');
    copy.type = 'button'; copy.disabled = !validEmail;
    copy.addEventListener('click', async () => {
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('unavailable');
        await navigator.clipboard.writeText(publicEmail);
        toast('邮箱已复制');
      } catch (_) { toast('复制未完成，请手动选择邮箱。'); }
    });
    actions.append(copy);
    if (validEmail) {
      const emailLink = node('a', 'email-link', '写邮件');
      emailLink.href = `mailto:${encodeURIComponent(publicEmail).replace(/%40/g, '@')}`;
      actions.append(emailLink);
    }
    if (github) actions.append(link('GitHub', github));
    if (itch) actions.append(link('itch.io', itch));
    contactContent.append(actions);
  }
  document.querySelectorAll('#contact-trigger, #contact-footer').forEach((trigger) => {
    trigger.addEventListener('click', (event) => { event.preventDefault(); showDialog($('#contact-dialog'), trigger); });
  });
  window.addEventListener('portfolio:document', (event) => {
    const project = projects.find((item) => item.id === (event.detail && event.detail.id));
    if (project && safeUrl(project.documentUrl)) previewDocument(project, safeUrl(project.documentUrl), document.activeElement);
  });
  window.addEventListener('portfolio:video', (event) => {
    const project = projects.find((item) => item.id === (event.detail && event.detail.id));
    if (!project || !safeUrl(project.reelUrl)) return;
    if (project.category === 'aigc' && window.PortfolioFilm) {
      navigate(project.id, 'overview');
      renderRoute();
      window.PortfolioFilm.play($('#film-content'));
    } else showMedia(project, () => launchVideo(project));
  });
  renderRoute();
})();
