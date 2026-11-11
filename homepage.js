(function () {
  'use strict';

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function image(src, alt, className, eager) {
    const node = element('img', className);
    node.src = src;
    node.alt = alt;
    node.loading = eager ? 'eager' : 'lazy';
    node.decoding = 'async';
    return node;
  }

  function link(text, href, className, external) {
    const node = element('a', className, text);
    node.href = href;
    if (external) {
      node.target = '_blank';
      node.rel = 'noopener noreferrer';
    }
    return node;
  }

  function action(text, className, eventName, id) {
    const node = element('button', className, text);
    node.type = 'button';
    node.addEventListener('click', function () {
      window.dispatchEvent(new CustomEvent(eventName, { detail: { id: id } }));
    });
    return node;
  }

  function tags(values, className) {
    const group = element('div', className || 'home-tags');
    values.forEach(function (value) {
      group.append(element('span', 'home-tag', value));
    });
    return group;
  }

  function sectionHeading(title, description, index, english) {
    const header = element('header', 'home-section-heading');
    const titleGroup = element('div', 'home-section-heading-copy');
    if (index) titleGroup.append(element('p', 'home-section-index', index + ' / ' + english));
    titleGroup.append(element('h2', 'home-section-title', title));
    header.append(titleGroup);
    if (description) header.append(element('p', 'home-section-description', description));
    return header;
  }

  function figure(src, alt, caption, className, eager) {
    const node = element('figure', className);
    node.append(image(src, alt, 'home-image', eager));
    if (caption) node.append(element('figcaption', 'home-image-caption', caption));
    return node;
  }

  function projectActions(project, primaryText) {
    const actions = element('div', 'home-actions');
    const open = link(primaryText || '查看项目', '#work/' + project.id + '/overview', 'home-project-link');
    open.setAttribute('aria-label', '查看' + project.title);
    actions.append(open);
    if (project.playUrl) actions.append(element('span', 'home-play-status', '可试玩'));
    return actions;
  }

  function renderHero(data) {
    const hero = element('header', 'home-hero');
    const main = element('div', 'home-hero-main');
    const identity = element('div', 'home-identity');
    identity.append(element('p', 'home-eyebrow', 'GAME DESIGN PORTFOLIO'));
    identity.append(element('p', 'home-author', (data.name || '万韵如') + ' · ' + (data.focus || '系统／玩法方向')));
    const heading = element('h1', 'home-title');
    heading.append(element('span', 'home-title-line', '游戏策划'), element('span', 'home-title-line home-title-accent', '作品集'));
    identity.append(heading);
    main.append(identity);
    const showcase = element('nav', 'home-showcase');
    showcase.setAttribute('aria-label', '游戏作品预览');
    ['workplace-oasis', 'band-rhythm', 'train-rescue', 'sheep-castle'].forEach(function (id, index) {
      const project = (data.projects || []).find(function (item) { return item.id === id; });
      if (!project || !project.coverImage) return;
      const item = link('', '#work/' + id + '/overview', 'home-showcase-item home-showcase-' + id);
      item.setAttribute('aria-label', '查看' + project.title);
      item.append(image(project.coverImage, '', 'home-showcase-image', true));
      const label = element('span', 'home-showcase-label');
      label.append(element('span', 'home-showcase-number', '0' + (index + 1)), element('strong', '', project.title));
      item.append(label);
      showcase.append(item);
    });
    main.append(showcase);
    hero.append(main);
    const introduction = element('div', 'home-introduction');
    if (data.introHighlights && data.introHighlights.length) {
      const highlights = element('ul', 'home-highlights');
      data.introHighlights.forEach(function (highlight, index) {
        const item = element('li', 'home-highlight');
        item.append(element('span', 'home-highlight-index', '0' + (index + 1)));
        item.append(element('strong', 'home-highlight-title', highlight.title));
        item.append(element('p', 'home-highlight-text', highlight.text));
        highlights.append(item);
      });
      introduction.append(highlights);
    } else if (data.intro) {
      introduction.append(element('p', 'home-intro', data.intro));
    }
    hero.append(introduction);
    return hero;
  }

  const gamePresentation = {
    'workplace-oasis': {
      className: 'home-game-oasis',
      label: '元素合成 · 植物养成',
      caption: '游戏封面',
      summary: '围绕“生长”，将元素获取、天气合成与植物养成串联成一次完整的单局体验。'
    },
    'band-rhythm': {
      className: 'home-game-band',
      label: '节奏战斗',
      caption: '作品封面',
      summary: '按谱面移动，拾取并消耗音符，在 Boss 预警中选择跳跃、攻击与反弹。'
    },
    'train-rescue': {
      className: 'home-game-train',
      label: '悬疑解谜',
      caption: '工作车厢 · 项目场景画面',
      summary: '围绕列车上的危机，设计搜证、昼夜分支、行动准备与事件状态规则。'
    },
    'sheep-castle': {
      className: 'home-game-sheep',
      label: '跑酷解谜',
      caption: '作品封面',
      summary: '将自动跑酷与城堡解谜结合，通过能力解锁、跨关回访与隐藏路线组织逃脱。'
    }
  };

  function renderGameCard(project) {
    const content = gamePresentation[project.id];
    const card = element('article', 'home-game-card ' + content.className);
    card.dataset.project = project.id;
    if (project.coverImage) {
      const art = element('figure', 'home-game-art');
      art.append(image(project.coverImage, project.coverAlt || project.title + '作品封面', 'home-image', false));
      card.append(art);
    } else {
      const art = element('figure', 'home-game-art home-game-art-empty');
      art.append(element('div', 'home-game-placeholder', '正式封面待补充'));
      art.append(element('figcaption', 'home-image-caption', '作品封面'));
      card.append(art);
    }
    const copy = element('div', 'home-game-copy');
    copy.append(element('p', 'home-game-type', [project.engine, content.label].filter(Boolean).join(' · ')));
    copy.append(element('h3', 'home-game-title', project.title));
    const eventLabel = project.eventLabel || project.team;
    if (eventLabel || project.period) {
      const event = element('p', 'home-game-event');
      if (eventLabel) event.append(element('span', 'home-game-event-name', eventLabel));
      if (project.period) event.append(element('span', 'home-game-period', project.period));
      copy.append(event);
    }
    copy.append(element('p', 'home-game-summary', content.summary));
    if (project.role) copy.append(element('p', 'home-project-role', project.role));
    copy.append(projectActions(project));
    card.append(copy);
    return card;
  }

  function renderGames(projects) {
    const section = element('section', 'home-section home-games');
    section.id = 'games';
    section.append(sectionHeading('游戏项目', '玩法、系统与可玩的原型。', '01', 'GAME PROJECTS'));
    const grid = element('div', 'home-games-grid');
    ['workplace-oasis', 'band-rhythm', 'train-rescue', 'sheep-castle'].forEach(function (id) {
      if (projects.has(id)) grid.append(renderGameCard(projects.get(id)));
    });
    section.append(grid);
    return section;
  }

  function renderAnalysis(project) {
    const section = element('section', 'home-section home-analysis');
    section.id = 'analysis';
    section.append(sectionHeading('游戏拆解', '从规则出发，理解体验。', '02', 'DESIGN ANALYSIS'));
    const panel = element('article', 'home-analysis-panel');
    const copy = element('div', 'home-analysis-copy');
    copy.append(element('p', 'home-eyebrow', '独立拆解 · 42页报告'));
    copy.append(element('h3', 'home-analysis-title', '《三国志幻想大陆2：枭之歌》'));
    copy.append(element('p', 'home-analysis-subtitle', '战斗、养成与付费结构'));
    copy.append(element('p', 'home-analysis-summary', '梳理系统之间的关联，结合玩家反馈分析养成深度与追赶压力，并提出调整建议。'));
    copy.append(tags(['战斗系统', '养成结构', '付费设计']));
    copy.append(link('阅读拆解', '#work/' + project.id + '/overview', 'home-button home-button-primary'));
    panel.append(copy);
    const pages = element('div', 'home-analysis-pages');
    pages.append(figure('./assets/work/sanhuan-cover.jpg', '三国志幻想大陆2枭之歌拆解原报告第1页封面，保留完整标题',
      '报告封面', 'home-report-page home-report-cover'));
    pages.append(figure('./assets/work/sanhuan-page05.jpg', '三国志幻想大陆2枭之歌拆解 · 原报告第5页',
      '原报告 · 第5页', 'home-report-page'));
    pages.append(figure('./assets/work/sanhuan-page06.jpg', '三国志幻想大陆2枭之歌拆解 · 原报告第6页',
      '原报告 · 第6页', 'home-report-page'));
    panel.append(pages);
    section.append(panel);
    return section;
  }

  function renderAigc(project) {
    const section = element('section', 'home-section home-aigc');
    section.id = 'aigc';
    section.append(sectionHeading('AIGC 影像', '从文字、分镜，到影像。', '03', 'MOVING IMAGE'));
    section.append(window.PortfolioFilm.create(project, { headingLevel: 3 }));
    return section;
  }

  function render() {
    const mount = document.getElementById('home-content');
    const data = window.PORTFOLIO_DATA;
    if (!mount || !data) return false;
    const projects = new Map((data.projects || []).map(function (project) {
      return [project.id, project];
    }));
    const page = element('div', 'home-page');
    page.append(renderHero(data), renderGames(projects));
    if (projects.has('sanhuan-analysis')) page.append(renderAnalysis(projects.get('sanhuan-analysis')));
    if (projects.has('aruna-story')) page.append(renderAigc(projects.get('aruna-story')));
    mount.replaceChildren(page);
    return true;
  }

  window.PortfolioHome = { render: render };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render, { once: true });
  } else {
    render();
  }
}());
