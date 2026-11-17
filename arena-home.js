(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const TOURNAMENTS = 'Турнирная сетка.dc.html';
  const NEWS = 'Новости арены.dc.html#feed';
  const DISCORD = 'https://discord.com/invite/qqctMjCTeg';
  const API = 'https://fewfpimbfgxlzghfqkmc.supabase.co/rest/v1/';
  const PUBLIC_KEY = 'sb_publishable_5Pgf3aTIsP_HwmrO5RakEA_H4DF7Mny';
  const UPDATE = {
    id: 'home-bx-poster-2026-11-18',
    title: 'Обложка BX вернулась',
    text: 'Турниры и новости арены теперь под афишей BX.',
    href: '#hero'
  };

  function make(tag, text, className) {
    const node = document.createElement(tag);
    if (text != null) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function icon(name) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    const use = document.createElementNS(ns, 'use');
    svg.setAttribute('class', 'icon');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    use.setAttribute('href', '#i-' + name);
    svg.append(use);
    return svg;
  }

  function publicURL(value, fallback = '') {
    try {
      const url = new URL(value);
      if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) return url.href;
    } catch {}
    return fallback;
  }

  function setting(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch {}
  }

  // Find a section without changing the shared menu or login.
  const search = byId('section-search');
  const searchResults = byId('search-results');
  const sections = Array.from(document.querySelectorAll('#bx-navigation .nav a'));
  search.addEventListener('input', () => {
    const query = search.value.trim().toLocaleLowerCase('ru');
    searchResults.replaceChildren();
    searchResults.hidden = !query;
    if (!query) return;

    const matching = sections.filter(link => link.textContent.toLocaleLowerCase('ru').includes(query));
    for (const item of matching) {
      const link = make('a', item.textContent.trim());
      link.href = item.href;
      searchResults.append(link);
    }
    if (!matching.length) searchResults.append(make('p', 'Раздел не найден.'));
  });
  search.addEventListener('keydown', event => {
    if (searchResults.hidden) return;
    const first = searchResults.querySelector('a');
    if (!first) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      first.focus();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      first.click();
    }
  });

  function showPlayer(session) {
    const user = session?.user;
    byId('home-player').hidden = !user;
    byId('account-title').textContent = user?.user_metadata?.display_name
      || user?.user_metadata?.full_name || 'Профиль игрока';
    byId('dock-account-label').textContent = user ? 'Профиль' : 'Войти';
  }
  window.addEventListener('bx:auth', event => showPlayer(event.detail.session));
  showPlayer(window.BXArenaAuth?.session);

  const guide = byId('arena-guide');
  guide.open = setting('bxx-hub-guide-open') === '1';
  guide.addEventListener('toggle', () => setting('bxx-hub-guide-open', guide.open ? '1' : '0'));

  // Animate the existing BX art. Pause off screen and respect the OS motion setting.
  const poster = byId('hero');
  const motionButton = byId('poster-motion');
  const reducesMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let posterVisible = true;
  let userPaused = setting('bxx-poster-paused') === '1';
  let pointerFrame = 0;
  let pointerX = 0;
  let pointerY = 0;

  function clearParallax() {
    cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    poster.style.removeProperty('--bx-x');
    poster.style.removeProperty('--bx-y');
  }

  function updateMotion() {
    const paused = userPaused || reducesMotion.matches || document.hidden || !posterVisible;
    poster.dataset.motionPaused = String(paused);
    motionButton.setAttribute('aria-pressed', String(userPaused));
    // Keep the toggle's accessible name stable and expose state via aria-pressed.
    motionButton.title = userPaused ? 'Возобновить анимацию BX' : 'Пауза анимации BX';
    motionButton.hidden = reducesMotion.matches;
    if (paused) clearParallax();
  }

  motionButton.addEventListener('click', () => {
    userPaused = !userPaused;
    setting('bxx-poster-paused', userPaused ? '1' : '0');
    updateMotion();
  });
  reducesMotion.addEventListener('change', updateMotion);
  finePointer.addEventListener('change', clearParallax);
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      posterVisible = entry.isIntersecting;
      updateMotion();
    });
    observer.observe(poster);
  }
  poster.addEventListener('pointermove', event => {
    if (!finePointer.matches || event.pointerType !== 'mouse' || poster.dataset.motionPaused === 'true') return;
    const rect = poster.getBoundingClientRect();
    pointerX = 20 * ((event.clientX - rect.left) / rect.width - .5);
    pointerY = 16 * ((event.clientY - rect.top) / rect.height - .5);
    if (!pointerFrame) {
      pointerFrame = requestAnimationFrame(() => {
        poster.style.setProperty('--bx-x', pointerX.toFixed(1) + 'px');
        poster.style.setProperty('--bx-y', pointerY.toFixed(1) + 'px');
        pointerFrame = 0;
      });
    }
  }, { passive: true });
  poster.addEventListener('pointerleave', clearParallax);
  updateMotion();

  const bell = byId('notification-toggle');
  const notifications = byId('notification-panel');
  let notificationItems = [UPDATE];
  const notificationKey = 'bxx-notifications-read-v1';
  let readIds = new Set();
  try {
    const saved = JSON.parse(setting(notificationKey) || '[]');
    if (Array.isArray(saved)) readIds = new Set(saved.slice(-100));
  } catch {}

  function showNotifications(open, restoreFocus = false) {
    notifications.hidden = !open;
    bell.setAttribute('aria-expanded', String(open));
    if (open) byId('notification-close').focus();
    else if (restoreFocus) bell.focus();
  }

  function markRead(ids) {
    ids.forEach(id => readIds.add(id));
    setting(notificationKey, JSON.stringify([...readIds].slice(-100)));
    renderNotifications();
  }

  function renderNotifications() {
    const list = byId('notification-list');
    list.replaceChildren();
    for (const item of notificationItems) {
      const link = make('a', null, 'notification-item');
      link.href = item.href;
      link.classList.toggle('unread', !readIds.has(item.id));
      link.append(make('strong', item.title), make('span', item.text));
      link.addEventListener('click', () => {
        markRead([item.id]);
        showNotifications(false, true);
      });
      list.append(link);
    }
    const unread = notificationItems.filter(item => !readIds.has(item.id)).length;
    byId('notification-dot').hidden = !unread;
    byId('notification-read').disabled = !unread;
    bell.setAttribute('aria-label', unread ? 'Уведомления. Непрочитанных: ' + unread : 'Уведомления');
  }
  bell.addEventListener('click', () => showNotifications(notifications.hidden));
  byId('notification-close').addEventListener('click', () => showNotifications(false, true));
  byId('notification-read').addEventListener('click', () => {
    markRead(notificationItems.map(item => item.id));
    byId('notification-close').focus();
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.search')) searchResults.hidden = true;
    if (!event.target.closest('.notifications')) showNotifications(false);
  });
  document.addEventListener('focusin', event => {
    if (!event.target.closest('.notifications')) showNotifications(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.defaultPrevented || byId('bx-auth-dialog')?.open) return;
    if (!searchResults.hidden) {
      searchResults.hidden = true;
      search.focus();
    }
    if (!notifications.hidden) showNotifications(false, true);
  });

  const tournament = byId('next-tournament');
  const timer = byId('countdown');
  const eventDate = byId('tournament-date');
  const timestampFormat = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow'
  });
  const dayFormat = new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric', month: 'short', timeZone: 'Europe/Moscow'
  });
  let nextStart = 0;
  let featuredId = null;

  function tick() {
    const remaining = nextStart - Date.now();
    timer.hidden = remaining <= 0;
    if (timer.hidden) return;

    const minutes = Math.ceil(remaining / 60000);
    const days = Math.floor(minutes / 1440);
    const hours = Math.floor(minutes / 60) % 24;
    const rest = minutes % 60;
    byId('count-days').textContent = String(days).padStart(2, '0');
    byId('count-hours').textContent = String(hours).padStart(2, '0');
    byId('count-minutes').textContent = String(rest).padStart(2, '0');
    timer.setAttribute('aria-label', 'До старта ' + days + ' дн. ' + hours + ' ч. ' + rest + ' мин.');
  }

  function external(link, url) {
    link.href = url;
    if (/^https?:\/\//i.test(url)) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    } else {
      link.removeAttribute('target');
      link.removeAttribute('rel');
    }
  }

  function showTournament(event, failed) {
    const live = event?.status === 'live';
    const description = typeof event?.description === 'string' ? event.description.trim() : '';
    const start = Date.parse(event?.starts_at);
    const details = byId('tournament-details');
    if (event?.id !== featuredId) details.open = false;
    featuredId = event?.id;

    tournament.dataset.eventState = live ? 'live' : event ? 'upcoming' : failed ? 'error' : 'empty';
    byId('tournament-state').textContent = live ? 'Турнир идёт' : 'Ближайший турнир';
    byId('tournament-title').textContent = event?.title || (failed ? 'Расписание недоступно' : 'Дата ещё не объявлена');
    byId('tournament-description').textContent = description;
    details.hidden = !description;
    eventDate.hidden = !Number.isFinite(start);
    if (!eventDate.hidden) {
      eventDate.dateTime = event.starts_at;
      eventDate.textContent = timestampFormat.format(start) + ' МСК';
    }

    const action = byId('tournament-action');
    const url = publicURL(live ? event?.bracket_url : event?.registration_url);
    external(action, url || TOURNAMENTS);
    action.querySelector('span').textContent = url ? (live ? 'Сетка' : 'Регистрация') : 'Каталог';
    nextStart = !live && Number.isFinite(start) ? start : 0;
    tick();
  }

  const feed = byId('home-news');
  const more = byId('feed-more');
  const retry = byId('feed-retry');
  const filters = [...document.querySelectorAll('[data-feed-filter]')];
  const emptyCopy = {
    all: 'Новых публикаций пока нет.',
    tournaments: 'Новых анонсов пока нет.',
    results: 'Опубликованных результатов пока нет.',
    news: 'Новостей пока нет.'
  };
  let chosenFilter = 'all';
  let limit = 5;
  let rows = [];
  let failureKinds = [];
  let rendered = '';
  let loaded = false;
  let loading = false;
  let sources = [[], [], []];

  function postElement(row) {
    const post = make('article', null, 'hub-post');
    const link = make('a', null, 'hub-post-link');
    external(link, row.href);
    link.dataset.postId = row.key;

    const mark = make('span', null, 'hub-post-mark ' + row.kind);
    mark.setAttribute('aria-hidden', 'true');
    mark.append(icon(row.icon));
    if (row.cover) {
      const image = make('img');
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.referrerPolicy = 'no-referrer';
      image.addEventListener('error', () => image.remove(), { once: true });
      image.src = row.cover;
      mark.append(image);
    }

    const body = make('div');
    const meta = make('div', null, 'hub-post-meta');
    meta.append(make('b', row.label));
    if (Number.isFinite(row.date)) {
      const time = make('time', dayFormat.format(row.date));
      time.dateTime = new Date(row.date).toISOString();
      meta.append(time);
    }
    body.append(meta, make('h3', row.title));
    if (row.excerpt) body.append(make('p', row.excerpt, 'hub-post-excerpt'));
    link.append(mark, body, icon('arrow'));
    post.append(link);
    return post;
  }

  function renderFeed() {
    const visible = rows.filter(row => chosenFilter === 'all' || row.kind === chosenFilter);
    const current = visible.slice(0, limit);
    const failed = chosenFilter === 'all' ? failureKinds.length > 0 : failureKinds.includes(chosenFilter);
    const status = byId('feed-status');
    status.textContent = !loaded ? 'Загружаем публикации…' : failed && current.length ? 'Часть публикаций не загрузилась.' : '';
    if (!loaded) return;

    const fingerprint = JSON.stringify([chosenFilter, failed, current]);
    if (fingerprint !== rendered) {
      const focusedId = feed.contains(document.activeElement) ? document.activeElement.dataset.postId : null;
      if (current.length) {
        feed.replaceChildren(...current.map(postElement));
      } else {
        const empty = make('p', null, 'hub-empty');
        empty.append(icon('info'), make('span', failed ? 'Не удалось загрузить публикации.' : emptyCopy[chosenFilter]));
        feed.replaceChildren(empty);
      }
      if (focusedId) {
        const replacement = [...feed.querySelectorAll('[data-post-id]')].find(link => link.dataset.postId === focusedId);
        (replacement || filters.find(button => button.dataset.feedFilter === chosenFilter))?.focus();
      }
      rendered = fingerprint;
    }
    more.hidden = visible.length <= limit;
  }

  filters.forEach(button => {
    button.addEventListener('click', () => {
      chosenFilter = button.dataset.feedFilter;
      filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
      limit = 5;
      renderFeed();
    });
  });
  more.addEventListener('click', () => {
    const oldLimit = limit;
    limit += 5;
    renderFeed();
    feed.children[oldLimit]?.querySelector('a')?.focus();
  });

  function buildRows(active, news, finished) {
    const events = active.map(event => ({
      key: 'event-' + event.id,
      kind: 'tournaments',
      icon: 'trophy',
      date: Date.parse(event.starts_at),
      label: event.status === 'live' ? 'Идёт сейчас' : 'Скоро',
      title: event.title,
      href: publicURL(event.status === 'live' ? event.bracket_url : event.registration_url, TOURNAMENTS)
    }));
    const results = finished.map(event => ({
      key: 'result-' + event.id,
      kind: 'results',
      icon: 'grid',
      date: Date.parse(event.ends_at || event.starts_at),
      label: 'Завершён',
      title: event.title,
      href: publicURL(event.bracket_url, TOURNAMENTS)
    }));
    const posts = news.map(post => ({
      key: 'news-' + post.id,
      kind: 'news',
      icon: 'news',
      date: Date.parse(post.published_at),
      label: post.category || 'Новость',
      title: post.title,
      excerpt: post.excerpt,
      cover: publicURL(post.cover_image_url),
      href: NEWS
    }));
    const recent = [...results, ...posts].sort((a, b) => (b.date || 0) - (a.date || 0));
    return [...events.filter(row => row.label === 'Идёт сейчас'), ...recent, ...events.filter(row => row.label === 'Скоро')];
  }

  async function read(table, params) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(API + table + '?' + new URLSearchParams(params), {
        headers: { apikey: PUBLIC_KEY }, signal: controller.signal
      });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Unexpected response');
      return data.filter(row => row && typeof row.title === 'string' && row.title.trim());
    } finally {
      clearTimeout(timeout);
    }
  }

  async function load() {
    if (loading) return;
    loading = true;
    retry.disabled = true;
    feed.setAttribute('aria-busy', 'true');
    const now = new Date().toISOString();
    const fields = 'id,title,description,status,starts_at,ends_at,registration_url,bracket_url';
    try {
      const requests = await Promise.allSettled([
        read('tournaments', {
          select: fields, is_published: 'eq.true',
          or: '(status.eq.live,and(status.eq.upcoming,starts_at.gt.' + now + '))', order: 'starts_at.asc', limit: '20'
        }),
        read('news_posts', {
          select: 'id,title,category,excerpt,cover_image_url,published_at',
          is_published: 'eq.true', order: 'published_at.desc.nullslast', limit: '20'
        }),
        read('tournaments', {
          select: fields, is_published: 'eq.true', status: 'eq.completed', order: 'ends_at.desc.nullslast', limit: '20'
        })
      ]);

      const kinds = ['tournaments', 'news', 'results'];
      failureKinds = [];
      requests.forEach((result, index) => {
        if (result.status === 'fulfilled') sources[index] = result.value;
        else failureKinds.push(kinds[index]);
      });

      const [events, news, completed] = sources;
      const currentTime = Date.now();
      const active = events.filter(event => event.status === 'live'
        ? !event.ends_at || Date.parse(event.ends_at) > currentTime
        : event.status === 'upcoming' && Date.parse(event.starts_at) > currentTime);
      const featured = active.find(event => event.status === 'live') || active[0];
      showTournament(featured, failureKinds.includes('tournaments'));
      rows = buildRows(active, news, completed);
      loaded = true;
      renderFeed();
      retry.hidden = !failureKinds.length;

      const nextItems = news.map(post => ({
        id: 'news-' + post.id + '-' + post.published_at,
        title: post.title, text: post.excerpt || 'Новая публикация арены', href: NEWS
      }));
      if (featured) nextItems.unshift({
        id: 'tournament-' + featured.id + '-' + featured.starts_at + '-' + featured.status,
        title: featured.title, text: featured.status === 'live' ? 'Турнир идёт' : 'Опубликован анонс турнира',
        href: '#next-tournament'
      });
      nextItems.push(UPDATE);
      if (JSON.stringify(nextItems) !== JSON.stringify(notificationItems)) {
        notificationItems = nextItems;
        renderNotifications();
      }
    } finally {
      loading = false;
      retry.disabled = false;
      feed.setAttribute('aria-busy', 'false');
    }
  }

  retry.addEventListener('click', load);
  document.addEventListener('visibilitychange', () => {
    updateMotion();
    if (!document.hidden) {
      tick();
      load();
    }
  });
  setInterval(() => { if (!document.hidden) tick(); }, 15000);
  setInterval(() => { if (!document.hidden) load(); }, 300000);
  renderNotifications();
  load();
})();
