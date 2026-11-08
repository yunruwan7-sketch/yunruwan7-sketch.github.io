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

  function sectionHeading(title, description) {
    const header = element('header', 'home-section-heading');
    header.append(element('h2', 'home-section-title', title));
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
    if (project.playUrl) {
      actions.append(link(project.playLabel || '立即试玩', project.playUrl, 'home-button home-button-primary', true));
    }
    actions.append(link(primaryText || '作品介绍', '#work/' + project.id + '/overview',
      project.playUrl ? 'home-button home-button-secondary' : 'home-button home-button-outline'));
    return actions;
  }

  function renderHero(data) {
    const hero = element('header', 'home-hero');
    const identity = element('div', 'home-identity');
    identity.append(element('p', 'home-eyebrow', data.focus || '系统／玩法方向'));
    const heading = element('h1', 'home-title', data.name || '万韵如');
    heading.append(element('span', 'home-title-role', '游戏策划作品集'));
    identity.append(heading);
    hero.append(identity);
    const introduction = element('div', 'home-introduction');
    if (data.intro) introduction.append(element('p', 'home-intro', data.intro));
    const meta = [data.graduation, data.location].filter(Boolean).join(' · ');
    if (meta) introduction.append(element('p', 'home-person-meta', meta));
    if (data.resumePdf) {
      introduction.append(link('查看简历', data.resumePdf, 'home-resume-link', true));
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
      caption: '车厢美术素材',
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
      card.append(figure(project.coverImage, project.coverAlt || project.title + '作品封面',
        content.caption, 'home-game-art', project.id === 'workplace-oasis'));
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
    section.append(sectionHeading('游戏项目', '从玩法与关卡规则，到协作落地的策划和制作资料。'));
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
    section.append(sectionHeading('游戏拆解', '从实际产品出发，梳理系统结构与体验问题。'));
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
    section.append(sectionHeading('AIGC 影像', '短片、视觉叙事与创作过程。'));
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
