/* ==========================================================================
   NOVA JOURNAL — app.js
   Shared behaviour for every page: theme, navigation, toasts, scroll effects,
   safe content rendering and the reusable post-card builder.
   Depends on data.js (global `NOVA`). Exposes global `UI`.
   ========================================================================== */

var UI = (function () {
  'use strict';

  /* ----------------------------------------------------------------------
     Small DOM helpers
     ---------------------------------------------------------------------- */

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }

  /* Static, developer-authored SVG markup. No user data ever reaches this,
     so assigning innerHTML here cannot introduce an injection point. */
  var ICON_PATHS = {
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowLeft: '<path d="M19 12H5M11 18l-6-6 6-6"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="M6 6l12 12M18 6L6 18"/>',
    sun: '<circle cx="12" cy="12" r="4.2"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/>',
    moon: '<path d="M20 14.5A8.2 8.2 0 019.5 4 8.3 8.3 0 1020 14.5z"/>',
    bookmark: '<path d="M6 4h12v16l-6-4.2L6 20z"/>',
    trash: '<path d="M4 7h16M9 7V5h6v2M7 7l1 13h8l1-13"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 1.8"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    image: '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><circle cx="8.5" cy="10" r="1.8"/><path d="M21 16l-5-5-9 8.5"/>',
    upload: '<path d="M12 16V4M7 9l5-5 5 5M4 17v2.5h16V17"/>',
    check: '<path d="M4.5 12.5l5 5 10-11"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.3v.2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.7v.2"/>',
    sparkle: '<path d="M12 3l2.1 5.6L20 11l-5.9 2.4L12 19l-2.1-5.6L4 11l5.9-2.4z"/>',
    pen: '<path d="M4 20l4-1 10-10-3-3L5 16z"/><path d="M14 6l3 3"/>',
    link: '<path d="M10 13.5a4 4 0 005.7 0l3-3a4 4 0 00-5.7-5.7l-1.3 1.3"/><path d="M14 10.5a4 4 0 00-5.7 0l-3 3a4 4 0 005.7 5.7l1.3-1.3"/>',
    inbox: '<path d="M3.5 13h5l1.5 3h4l1.5-3h5"/><path d="M5.5 5h13l2 8v6H3.5v-6z"/>',
    github: '<path d="M12 2.4a9.6 9.6 0 00-3 18.7c.5.1.6-.2.6-.5v-1.7c-2.6.6-3.2-1.2-3.2-1.2-.5-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.1-.2-4.3-1-4.3-4.6 0-1 .4-1.9 1-2.5-.1-.3-.4-1.3.1-2.6 0 0 .8-.3 2.6 1a9 9 0 014.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.6.6.6 1 1.5 1 2.5 0 3.6-2.2 4.4-4.3 4.6.3.3.6.9.6 1.8v2.7c0 .3.2.6.7.5A9.6 9.6 0 0012 2.4z"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.5 10.5V17M7.5 7.6v.1M11.5 17v-3.6a2 2 0 014 0V17"/>',
    x: '<path d="M4 4l16 16M20 4L4 20"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 6.5L12 13l8.5-6.5"/>',
    mapPin: '<path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.6"/>',
    facebook: '<path d="M14.5 8.5h2.5V5.2h-2.6c-2.3 0-3.7 1.4-3.7 3.8v1.8H8.2v3.3h2.5V21h3.3v-6.9h2.5l.4-3.3h-2.9V9.4c0-.6.2-.9.9-.9z"/>'
  };

  function icon(name, size) {
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.9');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    if (size) { svg.style.width = size + 'px'; svg.style.height = size + 'px'; }
    svg.innerHTML = ICON_PATHS[name] || '';
    if (name === 'bookmark' || name === 'facebook' || name === 'github' || name === 'sparkle') {
      svg.setAttribute('stroke-width', '1.6');
    }
    return svg;
  }

  /* ----------------------------------------------------------------------
     Safe rich-text rendering
     A tiny, strictly-whitelisted mini-markup. Every node is created with
     the DOM API and text set via textContent, so stored post content can
     never execute script — even if a user typed raw HTML into the form.
     Supported: "## heading", "> quote", "- bullet", "1. item",
                **bold**, *italic*, `code`
     ---------------------------------------------------------------------- */

  function appendInline(parent, text) {
    var parts = String(text).split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g);
    parts.forEach(function (part) {
      if (!part) return;
      var node;
      if (part.length > 4 && part.slice(0, 2) === '**' && part.slice(-2) === '**') {
        node = el('strong', null, part.slice(2, -2));
      } else if (part.length > 2 && part[0] === '`' && part.slice(-1) === '`') {
        node = el('code', null, part.slice(1, -1));
      } else if (part.length > 2 && part[0] === '*' && part.slice(-1) === '*') {
        node = el('em', null, part.slice(1, -1));
      } else {
        node = document.createTextNode(part);
      }
      parent.appendChild(node);
    });
  }

  function renderRichText(container, raw) {
    container.textContent = '';
    var blocks = String(raw || '').split(/\n{2,}/);

    blocks.forEach(function (block) {
      var trimmed = block.trim();
      if (!trimmed) return;
      var lines = trimmed.split('\n');

      if (trimmed.indexOf('## ') === 0) {
        var h = el('h2');
        appendInline(h, trimmed.slice(3).trim());
        container.appendChild(h);
        return;
      }

      if (trimmed.indexOf('> ') === 0) {
        var bq = el('blockquote');
        appendInline(bq, lines.map(function (l) {
          return l.replace(/^>\s?/, '');
        }).join(' ').trim());
        container.appendChild(bq);
        return;
      }

      var allBullets = lines.every(function (l) { return /^[-*]\s+/.test(l.trim()); });
      if (allBullets) {
        var ul = el('ul');
        lines.forEach(function (l) {
          var li = el('li');
          appendInline(li, l.trim().replace(/^[-*]\s+/, ''));
          ul.appendChild(li);
        });
        container.appendChild(ul);
        return;
      }

      var allNumbers = lines.every(function (l) { return /^\d+\.\s+/.test(l.trim()); });
      if (allNumbers) {
        var ol = el('ol');
        lines.forEach(function (l) {
          var li2 = el('li');
          appendInline(li2, l.trim().replace(/^\d+\.\s+/, ''));
          ol.appendChild(li2);
        });
        container.appendChild(ol);
        return;
      }

      var p = el('p');
      appendInline(p, lines.join(' '));
      container.appendChild(p);
    });
  }

  /* ----------------------------------------------------------------------
     Images — fallback chain, never a broken-image icon
     ---------------------------------------------------------------------- */

  function attachImageFallback(img) {
    img.addEventListener('error', function handle() {
      // Guard so a missing fallback file cannot loop forever.
      if (img.dataset.fallbackApplied === '1') {
        img.removeEventListener('error', handle);
        var ph = buildPlaceholder(img.dataset.category || 'NOVA Journal');
        if (img.parentNode) img.parentNode.replaceChild(ph, img);
        return;
      }
      img.dataset.fallbackApplied = '1';
      img.src = NOVA.FALLBACK_IMAGE;
    });
  }

  function buildPlaceholder(categoryName) {
    var ph = el('div', 'cover-placeholder');
    ph.appendChild(icon('sparkle'));
    ph.appendChild(el('span', null, categoryName || 'NOVA Journal'));
    return ph;
  }

  /* Builds the cover block for a post. `tagName` is 'a' for clickable cards. */
  function buildCover(post, tagName, href, extraClass) {
    var wrap = document.createElement(tagName || 'div');
    wrap.className = 'cover' + (extraClass ? ' ' + extraClass : '');
    if (tagName === 'a') {
      wrap.href = href;
      wrap.setAttribute('tabindex', '-1');
      wrap.setAttribute('aria-hidden', 'true');
    }

    if (post.image) {
      var img = el('img');
      img.src = post.image;
      img.alt = post.imageAlt || ('Cover image for ' + post.title);
      img.loading = 'lazy';
      img.decoding = 'async';
      img.width = 1200;
      img.height = 675;
      img.dataset.category = post.category;
      attachImageFallback(img);
      wrap.appendChild(img);
    } else {
      wrap.appendChild(buildPlaceholder(post.category));
    }
    return wrap;
  }

  /* ----------------------------------------------------------------------
     Post meta + card builders (shared by home and blog listing)
     ---------------------------------------------------------------------- */

  function buildMeta(post, withAvatar) {
    var meta = el('div', 'post-meta');

    if (withAvatar) {
      var av = el('span', 'avatar', NOVA.getInitials(post.author));
      av.setAttribute('aria-hidden', 'true');
      meta.appendChild(av);
      meta.appendChild(el('span', null, post.author));
      meta.appendChild(el('span', 'dot'));
    }

    var dateItem = el('span', 'meta-item');
    dateItem.appendChild(icon('calendar'));
    var time = el('time', null, NOVA.formatDate(post.date));
    time.setAttribute('datetime', post.date);
    dateItem.appendChild(time);
    meta.appendChild(dateItem);

    meta.appendChild(el('span', 'dot'));

    var readItem = el('span', 'meta-item');
    readItem.appendChild(icon('clock'));
    readItem.appendChild(el('span', null, post.readingTime + ' min read'));
    meta.appendChild(readItem);

    return meta;
  }

  function buildBadge(post) {
    var badge = el('span', 'badge', post.category);
    badge.setAttribute('data-cat', post.category);
    return badge;
  }

  /* Shared so the blog listing, home cards and the article page all behave
     identically — one implementation, one set of labels. */
  function bookmarkButton(post, onToggle) {
    var btn = el('button', 'btn-icon');
    btn.type = 'button';
    btn.appendChild(icon('bookmark'));

    function sync(marked) {
      btn.classList.toggle('is-active', marked);
      btn.setAttribute('aria-pressed', marked ? 'true' : 'false');
      btn.setAttribute('aria-label',
        (marked ? 'Remove bookmark from' : 'Bookmark') + ': ' + post.title);
      btn.setAttribute('title', marked ? 'Remove bookmark' : 'Bookmark');
    }
    sync(NOVA.isBookmarked(post.id));

    btn.addEventListener('click', function () {
      var now = NOVA.toggleBookmark(post.id);
      sync(now);
      toast(now ? 'Saved to your bookmarks.' : 'Bookmark removed.', 'info');
      if (typeof onToggle === 'function') onToggle(now);
    });
    return btn;
  }

  function deleteButton(post, onDelete) {
    var btn = el('button', 'btn-icon danger');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Delete post: ' + post.title);
    btn.setAttribute('title', 'Delete post');
    btn.appendChild(icon('trash'));

    btn.addEventListener('click', function () {
      confirmDialog({
        title: 'Delete this post?',
        message: '“' + NOVA.truncate(post.title, 60) + '” will be permanently removed from this browser. This cannot be undone.',
        confirmLabel: 'Delete post',
        danger: true
      }, function () {
        var res = NOVA.deletePost(post.id);
        if (!res.ok && res.reason === 'quota') {
          toast('Your browser storage is full. Try deleting older posts.', 'error');
        } else {
          toast('Post deleted.', 'success');
        }
        if (typeof onDelete === 'function') onDelete(res.posts);
      });
    });
    return btn;
  }

  /* Topic entry for "Explore Our Topics" — deliberately a different shape
     from an article card, so the two sections do not read as the same grid. */
  function topicCard(info, count) {
    var link = el('a', 'topic-card reveal');
    link.href = 'blog.html?category=' + encodeURIComponent(info.name);

    link.appendChild(el('h3', 'topic-name', info.name));
    link.appendChild(el('p', 'topic-blurb', info.blurb));

    var foot = el('span', 'topic-count');
    foot.textContent = count === 0
      ? 'No articles yet'
      : count + (count === 1 ? ' article' : ' articles');
    link.appendChild(foot);
    return link;
  }

  function buildBreadcrumbs(post) {
    var nav = el('nav', 'breadcrumbs');
    nav.setAttribute('aria-label', 'Breadcrumb');
    var list = el('ol');

    function crumb(label, href, isCurrent) {
      var li = el('li');
      if (href && !isCurrent) {
        var a = el('a', null, label);
        a.href = href;
        li.appendChild(a);
      } else {
        var span = el('span', null, label);
        if (isCurrent) span.setAttribute('aria-current', 'page');
        li.appendChild(span);
      }
      return li;
    }

    list.appendChild(crumb('Home', 'index.html'));
    list.appendChild(crumb('Blog', 'blog.html'));
    list.appendChild(crumb(post.category, 'blog.html?category=' + encodeURIComponent(post.category)));
    list.appendChild(crumb(NOVA.truncate(post.title, 44), null, true));

    nav.appendChild(list);
    return nav;
  }

  /* opts: { showTools:Boolean, onDelete:Function, reveal:Boolean } */
  function postCard(post, opts) {
    opts = opts || {};
    var href = 'post.html?id=' + encodeURIComponent(post.id);

    var card = el('article', 'post-card' + (opts.reveal === false ? '' : ' reveal'));
    card.dataset.id = post.id;

    card.appendChild(buildCover(post, 'a', href));

    var body = el('div', 'post-card-body');

    var top = el('div');
    top.appendChild(buildBadge(post));
    body.appendChild(top);

    var h3 = el('h3');
    var titleLink = el('a', null, post.title);
    titleLink.href = href;
    h3.appendChild(titleLink);
    body.appendChild(h3);

    body.appendChild(el('p', 'post-excerpt', NOVA.truncate(post.excerpt || post.content, 140)));
    body.appendChild(buildMeta(post, true));

    var foot = el('div', 'post-card-foot');

    var read = el('a', 'read-link');
    read.href = href;
    read.appendChild(document.createTextNode('Read Article'));
    read.appendChild(icon('arrowRight'));
    foot.appendChild(read);

    if (opts.showTools || opts.showBookmark) {
      var tools = el('div', 'card-tools');
      tools.appendChild(bookmarkButton(post, opts.onBookmark));
      if (opts.showTools) tools.appendChild(deleteButton(post, opts.onDelete));
      foot.appendChild(tools);
    }

    body.appendChild(foot);
    card.appendChild(body);
    return card;
  }

  function featuredCard(post) {
    var href = 'post.html?id=' + encodeURIComponent(post.id);
    var card = el('article', 'featured-card reveal');

    card.appendChild(buildCover(post, 'a', href));

    var body = el('div', 'featured-body');

    var top = el('div', 'post-meta');
    var feat = el('span', 'badge badge-featured', 'Featured');
    top.appendChild(feat);
    top.appendChild(buildBadge(post));
    body.appendChild(top);

    var h2 = el('h2');
    var link = el('a', null, post.title);
    link.href = href;
    h2.appendChild(link);
    body.appendChild(h2);

    body.appendChild(el('p', 'post-excerpt', NOVA.truncate(post.excerpt || post.content, 220)));
    body.appendChild(buildMeta(post, true));

    var cta = el('a', 'btn btn-primary');
    cta.href = href;
    cta.style.alignSelf = 'flex-start';
    cta.appendChild(document.createTextNode('Read Featured Story'));
    cta.appendChild(icon('arrowRight'));
    body.appendChild(cta);

    card.appendChild(body);
    return card;
  }

  function emptyState(opts) {
    var wrap = el('div', 'empty-state reveal');
    var art = el('div', 'art');
    art.appendChild(icon(opts.icon || 'inbox'));
    wrap.appendChild(art);
    wrap.appendChild(el('h3', null, opts.title));
    wrap.appendChild(el('p', null, opts.message));
    if (opts.actionLabel) {
      var a = el('a', 'btn btn-primary');
      a.href = opts.actionHref || 'create-post.html';
      a.appendChild(icon('pen'));
      a.appendChild(document.createTextNode(opts.actionLabel));
      wrap.appendChild(a);
    }
    return wrap;
  }

  /* ----------------------------------------------------------------------
     Toasts
     ---------------------------------------------------------------------- */

  function toastRegion() {
    var region = qs('.toast-region');
    if (!region) {
      region = el('div', 'toast-region');
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    return region;
  }

  function toast(message, type, duration) {
    var region = toastRegion();
    var node = el('div', 'toast ' + (type || 'info'));
    node.appendChild(icon(type === 'success' ? 'check' : type === 'error' ? 'alert' : 'info'));
    node.appendChild(el('span', null, message));
    region.appendChild(node);

    var ms = duration || (type === 'error' ? 6000 : 3800);
    setTimeout(function () {
      node.classList.add('is-leaving');
      setTimeout(function () { if (node.parentNode) node.parentNode.removeChild(node); }, 240);
    }, ms);
    return node;
  }

  /* ----------------------------------------------------------------------
     Accessible confirm dialog (replaces window.confirm)
     Focus is trapped, Escape cancels, focus returns to the trigger.
     ---------------------------------------------------------------------- */

  function confirmDialog(opts, onConfirm) {
    var lastFocused = document.activeElement;

    var backdrop = el('div', 'modal-backdrop');
    var modal = el('div', 'modal');
    modal.setAttribute('role', 'alertdialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'confirm-title');
    modal.setAttribute('aria-describedby', 'confirm-desc');

    var h = el('h3', null, opts.title || 'Are you sure?');
    h.id = 'confirm-title';
    var p = el('p', null, opts.message || '');
    p.id = 'confirm-desc';

    var actions = el('div', 'modal-actions');
    var cancel = el('button', 'btn btn-ghost', 'Cancel');
    cancel.type = 'button';
    var ok = el('button', 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary'), opts.confirmLabel || 'Confirm');
    ok.type = 'button';

    actions.appendChild(cancel);
    actions.appendChild(ok);
    modal.appendChild(h);
    modal.appendChild(p);
    modal.appendChild(actions);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    var focusables = [cancel, ok];
    ok.focus();

    function close() {
      document.removeEventListener('keydown', onKey);
      if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      // Simple two-button focus trap
      var i = focusables.indexOf(document.activeElement);
      e.preventDefault();
      var next = e.shiftKey ? (i <= 0 ? focusables.length - 1 : i - 1)
                            : (i === focusables.length - 1 ? 0 : i + 1);
      focusables[next].focus();
    }

    document.addEventListener('keydown', onKey);
    cancel.addEventListener('click', close);
    backdrop.addEventListener('mousedown', function (e) { if (e.target === backdrop) close(); });
    ok.addEventListener('click', function () { close(); if (onConfirm) onConfirm(); });
  }

  /* ----------------------------------------------------------------------
     Theme
     The inline bootstrap script in each <head> applies the stored theme
     before first paint; this only wires the toggle button.
     ---------------------------------------------------------------------- */

  function initThemeToggle() {
    var btn = qs('.theme-toggle');
    if (!btn) return;

    function label() {
      var dark = document.documentElement.getAttribute('data-theme') !== 'light';
      btn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
      btn.setAttribute('title', dark ? 'Light mode' : 'Dark mode');
    }
    label();

    btn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', next);
      NOVA.writeStore(NOVA.KEYS.theme, next);
      label();
    });
  }

  /* ----------------------------------------------------------------------
     Mobile navigation drawer
     ---------------------------------------------------------------------- */

  function initMobileMenu() {
    var toggle = qs('.nav-toggle');
    var nav = qs('.site-nav');
    if (!toggle || !nav) return;

    var scrim = qs('.nav-scrim');
    if (!scrim) {
      scrim = el('div', 'nav-scrim');
      document.body.appendChild(scrim);
    }

    function focusable() {
      return qsa('a[href], button:not([disabled])', nav);
    }

    function open() {
      nav.classList.add('is-open');
      scrim.classList.add('is-open');
      document.body.classList.add('nav-open');
      toggle.setAttribute('aria-expanded', 'true');
      document.addEventListener('keydown', onKey);

      // The drawer transitions from visibility:hidden, and focus() is a no-op
      // while an element is still hidden — so move focus on the next frame.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          var f = focusable();
          if (f.length && nav.classList.contains('is-open')) f[0].focus();
        });
      });
    }

    function close(returnFocus) {
      nav.classList.remove('is-open');
      scrim.classList.remove('is-open');
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onKey);
      if (returnFocus !== false) toggle.focus();
    }

    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = focusable();
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }

    toggle.addEventListener('click', function () {
      if (nav.classList.contains('is-open')) close(); else open();
    });

    scrim.addEventListener('click', function () { close(); });

    qsa('a', nav).forEach(function (link) {
      link.addEventListener('click', function () { close(false); });
    });

    // Reset state if the viewport grows past the drawer breakpoint
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 900 && nav.classList.contains('is-open')) close(false);
    });
  }

  /* ----------------------------------------------------------------------
     Active nav link
     ---------------------------------------------------------------------- */

  function initActiveNav() {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    qsa('.site-nav a[data-page]').forEach(function (link) {
      var pages = link.dataset.page.split(' ');
      if (pages.indexOf(path) > -1) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });
  }

  /* ----------------------------------------------------------------------
     Scroll behaviour: header state, reveal animations, back-to-top, progress
     ---------------------------------------------------------------------- */

  function initHeaderScroll() {
    var header = qs('.site-header');
    if (!header) return;
    function update() {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  function initScrollAnimations(root) {
    var targets = qsa('.reveal:not(.is-visible)', root || document);
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.classList.add('is-visible'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });

    targets.forEach(function (t, i) {
      // Stagger cards within a grid for a sequenced reveal
      if (t.parentElement && t.parentElement.classList.contains('grid')) {
        t.style.transitionDelay = Math.min(i % 6, 5) * 70 + 'ms';
      }
      io.observe(t);
    });
  }

  function initScrollToTop() {
    var btn = qs('.scroll-top');
    if (!btn) return;
    function update() { btn.classList.toggle('show', window.scrollY > 520); }
    update();
    window.addEventListener('scroll', update, { passive: true });
    btn.addEventListener('click', function () {
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }

  function initReadingProgress() {
    var bar = qs('.read-progress');
    if (!bar) return;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  /* ----------------------------------------------------------------------
     Newsletter (used on home + footer)
     ---------------------------------------------------------------------- */

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

  function isValidEmail(value) {
    return EMAIL_RE.test(String(value).trim());
  }

  function setFieldError(field, message) {
    if (!field) return;
    field.classList.add('has-error');
    var err = qs('.field-error', field);
    if (err) err.textContent = message;
    var input = qs('input, textarea, select', field);
    if (input) input.setAttribute('aria-invalid', 'true');
  }

  function clearFieldError(field) {
    if (!field) return;
    field.classList.remove('has-error');
    var input = qs('input, textarea, select', field);
    if (input) input.removeAttribute('aria-invalid');
  }

  function initNewsletter() {
    qsa('form[data-newsletter]').forEach(function (form) {
      var input = qs('input[type="email"]', form);
      var field = input ? input.closest('.field') : null;

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        clearFieldError(field);

        var value = input ? input.value.trim() : '';
        if (!value) { setFieldError(field, 'Please enter your email address.'); input.focus(); return; }
        if (!isValidEmail(value)) { setFieldError(field, 'That does not look like a valid email address.'); input.focus(); return; }

        var result = NOVA.addSubscriber(value);
        if (result === 'duplicate') {
          toast('You are already subscribed with that address.', 'info');
          return;
        }
        if (result === 'failed') {
          toast('Could not save your subscription — browser storage is full.', 'error');
          return;
        }
        form.reset();
        toast('Thanks for subscribing to NOVA Journal!', 'success');
      });

      if (input) {
        input.addEventListener('input', function () { clearFieldError(field); });
      }
    });
  }

  /* ----------------------------------------------------------------------
     Static image fallbacks (logo, portraits placed directly in HTML)
     ---------------------------------------------------------------------- */

  function initStaticImageFallbacks() {
    qsa('img[data-fallback]').forEach(function (img) {
      img.addEventListener('error', function handle() {
        img.removeEventListener('error', handle);
        img.src = img.dataset.fallback;
      });
    });
  }

  /* ----------------------------------------------------------------------
     Footer year
     ---------------------------------------------------------------------- */

  function initFooterYear() {
    qsa('[data-year]').forEach(function (n) {
      n.textContent = new Date().getFullYear();
    });
  }

  /* ----------------------------------------------------------------------
     Boot — every init is guarded so shared code is safe on all pages
     ---------------------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    initThemeToggle();
    initMobileMenu();
    initActiveNav();
    initHeaderScroll();
    initScrollToTop();
    initReadingProgress();
    initNewsletter();
    initStaticImageFallbacks();
    initFooterYear();
    initScrollAnimations();

    if (!NOVA.storageWorks) {
      toast('Browser storage is unavailable, so new posts will not be saved after you leave.', 'error', 7000);
    }
  });

  /* ---------------------------------------------------------------------- */

  return {
    el: el, qs: qs, qsa: qsa, icon: icon,
    renderRichText: renderRichText,
    buildCover: buildCover,
    buildMeta: buildMeta,
    buildBadge: buildBadge,
    buildPlaceholder: buildPlaceholder,
    buildBreadcrumbs: buildBreadcrumbs,
    attachImageFallback: attachImageFallback,
    bookmarkButton: bookmarkButton,
    deleteButton: deleteButton,
    postCard: postCard,
    featuredCard: featuredCard,
    topicCard: topicCard,
    emptyState: emptyState,
    toast: toast,
    confirmDialog: confirmDialog,
    isValidEmail: isValidEmail,
    setFieldError: setFieldError,
    clearFieldError: clearFieldError,
    initScrollAnimations: initScrollAnimations
  };
})();
