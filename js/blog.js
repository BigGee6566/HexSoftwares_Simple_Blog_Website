/* ==========================================================================
   NOVA JOURNAL — blog.js
   Home page sections, blog listing (search / filter / sort / load more)
   and the single post view (related, prev-next, share, comments).
   Every block is guarded, so this file is safe to load on any page.
   ========================================================================== */

(function () {
  'use strict';

  var PAGE_SIZE = 6;

  /* ======================================================================
     HOME PAGE
     ====================================================================== */

  function renderFeatured(posts) {
    var host = UI.qs('#featured-post');
    if (!host) return;
    host.textContent = '';

    if (!posts.length) return;

    // Prefer an explicitly flagged post, else the newest one.
    var featured = posts.filter(function (p) { return p.featured; })[0] || posts[0];
    host.appendChild(UI.featuredCard(featured));
    host.dataset.featuredId = featured.id;
  }

  function renderLatest(posts) {
    var host = UI.qs('#latest-posts');
    if (!host) return;
    host.textContent = '';

    if (!posts.length) {
      host.appendChild(UI.emptyState({
        icon: 'pen',
        title: 'No posts yet',
        message: 'Your journal is empty. Write the first entry and it will appear here straight away.',
        actionLabel: 'Write your first post',
        actionHref: 'create-post.html'
      }));
      return;
    }

    var featuredId = (UI.qs('#featured-post') || {}).dataset
      ? UI.qs('#featured-post').dataset.featuredId : null;

    var rest = posts.filter(function (p) { return p.id !== featuredId; }).slice(0, 3);
    if (!rest.length) rest = posts.slice(0, 3);

    rest.forEach(function (post) {
      host.appendChild(UI.postCard(post, { showTools: false }));
    });
  }

  function renderCategoryChips(posts) {
    var host = UI.qs('#category-chips');
    if (!host) return;
    host.textContent = '';

    NOVA.CATEGORIES.forEach(function (cat) {
      var count = posts.filter(function (p) { return p.category === cat; }).length;
      var chip = UI.el('a', 'chip');
      chip.href = 'blog.html?category=' + encodeURIComponent(cat);
      chip.appendChild(document.createTextNode(cat));
      chip.appendChild(UI.el('span', 'count', String(count)));
      host.appendChild(chip);
    });
  }

  function renderStats(posts) {
    var host = UI.qs('#stats');
    if (!host) return;

    var authors = {};
    var tags = {};
    var cats = {};
    posts.forEach(function (p) {
      authors[p.author] = true;
      cats[p.category] = true;
      p.tags.forEach(function (t) { tags[t.toLowerCase()] = true; });
    });

    var values = {
      posts: posts.length,
      categories: Object.keys(cats).length,
      authors: Object.keys(authors).length,
      topics: Object.keys(tags).length
    };

    UI.qsa('[data-stat]', host).forEach(function (node) {
      var key = node.dataset.stat;
      node.textContent = values[key] !== undefined ? values[key] : '0';
    });
  }

  function initHome() {
    var isHome = UI.qs('#featured-post') || UI.qs('#latest-posts');
    // #stats and #category-chips also appear on other pages (e.g. About),
    // so they are rendered whenever present — not only on the home page.
    if (!isHome && !UI.qs('#stats') && !UI.qs('#category-chips')) return;

    var posts = NOVA.sortNewestFirst(NOVA.ensurePosts());
    if (isHome) {
      renderFeatured(posts);
      renderLatest(posts);
    }
    renderCategoryChips(posts);
    renderStats(posts);
    UI.initScrollAnimations();
  }

  /* ======================================================================
     BLOG LISTING PAGE
     ====================================================================== */

  function filterAndSortPosts(posts, state) {
    var term = state.search.trim().toLowerCase();

    var filtered = posts.filter(function (p) {
      if (state.category !== 'all' && p.category !== state.category) return false;
      if (!term) return true;
      var haystack = [p.title, p.excerpt, p.content, p.author, p.category, p.tags.join(' ')]
        .join(' ').toLowerCase();
      return haystack.indexOf(term) > -1;
    });

    return filtered.sort(function (a, b) {
      if (state.sort === 'oldest') {
        return (a.createdAt || new Date(a.date).getTime() || 0) -
               (b.createdAt || new Date(b.date).getTime() || 0);
      }
      if (state.sort === 'az') return a.title.localeCompare(b.title);
      if (state.sort === 'za') return b.title.localeCompare(a.title);
      return (b.createdAt || new Date(b.date).getTime() || 0) -
             (a.createdAt || new Date(a.date).getTime() || 0);
    });
  }

  function initBlogList() {
    var list = UI.qs('#post-list');
    if (!list) return;

    var searchInput = UI.qs('#search-input');
    var sortSelect = UI.qs('#sort-select');
    var filterHost = UI.qs('#category-filters');
    var countNode = UI.qs('#result-count');
    var loadMoreWrap = UI.qs('#load-more-wrap');
    var loadMoreBtn = UI.qs('#load-more');

    var params = new URLSearchParams(window.location.search);
    var initialCategory = params.get('category');

    var state = {
      search: params.get('q') || '',
      category: initialCategory && NOVA.CATEGORIES.indexOf(initialCategory) > -1 ? initialCategory : 'all',
      sort: 'newest',
      visible: PAGE_SIZE
    };

    if (searchInput && state.search) searchInput.value = state.search;

    /* ---- Filter chips ---- */
    function buildFilters(posts) {
      if (!filterHost) return;
      filterHost.textContent = '';

      var options = [{ label: 'All', value: 'all' }].concat(
        NOVA.CATEGORIES.map(function (c) { return { label: c, value: c }; })
      );

      options.forEach(function (opt) {
        var count = opt.value === 'all'
          ? posts.length
          : posts.filter(function (p) { return p.category === opt.value; }).length;

        var chip = UI.el('button', 'chip');
        chip.type = 'button';
        chip.setAttribute('aria-pressed', state.category === opt.value ? 'true' : 'false');
        chip.appendChild(document.createTextNode(opt.label));
        chip.appendChild(UI.el('span', 'count', String(count)));

        chip.addEventListener('click', function () {
          state.category = opt.value;
          state.visible = PAGE_SIZE;
          UI.qsa('.chip', filterHost).forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
          chip.setAttribute('aria-pressed', 'true');
          render();
          // Keep the URL shareable
          var url = new URL(window.location.href);
          if (opt.value === 'all') url.searchParams.delete('category');
          else url.searchParams.set('category', opt.value);
          window.history.replaceState({}, '', url);
        });

        filterHost.appendChild(chip);
      });
    }

    /* ---- Main render ---- */
    function render() {
      var all = NOVA.sortNewestFirst(NOVA.getPosts());
      var results = filterAndSortPosts(all, state);

      list.textContent = '';

      if (countNode) {
        countNode.textContent = '';
        var strong = UI.el('strong', null, String(results.length));
        countNode.appendChild(strong);
        countNode.appendChild(document.createTextNode(
          ' ' + (results.length === 1 ? 'post' : 'posts') +
          (state.category !== 'all' ? ' in ' + state.category : '') +
          (state.search.trim() ? ' matching “' + state.search.trim() + '”' : '')
        ));
      }

      if (!all.length) {
        list.appendChild(UI.emptyState({
          icon: 'pen',
          title: 'No posts yet',
          message: 'There is nothing saved in this browser. Create your first post to get started.',
          actionLabel: 'Write your first post',
          actionHref: 'create-post.html'
        }));
        if (loadMoreWrap) loadMoreWrap.hidden = true;
        return;
      }

      if (!results.length) {
        list.appendChild(UI.emptyState({
          icon: 'search',
          title: 'No matching posts',
          message: state.search.trim()
            ? 'Nothing matches “' + state.search.trim() + '”. Try a different word, or clear the filters.'
            : 'There are no posts in this category yet.',
          actionLabel: 'Clear filters',
          actionHref: 'blog.html'
        }));
        if (loadMoreWrap) loadMoreWrap.hidden = true;
        return;
      }

      results.slice(0, state.visible).forEach(function (post) {
        list.appendChild(UI.postCard(post, {
          showTools: true,
          onDelete: function () { render(); }
        }));
      });

      if (loadMoreWrap) {
        var remaining = results.length - state.visible;
        loadMoreWrap.hidden = remaining <= 0;
        if (loadMoreBtn && remaining > 0) {
          loadMoreBtn.textContent = 'Load ' + Math.min(remaining, PAGE_SIZE) + ' more';
        }
      }

      UI.initScrollAnimations(list);
      buildFilters(all);
    }

    /* ---- Events ---- */
    if (searchInput) {
      var debounce;
      searchInput.addEventListener('input', function () {
        clearTimeout(debounce);
        debounce = setTimeout(function () {
          state.search = searchInput.value;
          state.visible = PAGE_SIZE;
          render();
        }, 180);
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', function () {
        state.sort = sortSelect.value;
        state.visible = PAGE_SIZE;
        render();
      });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', function () {
        state.visible += PAGE_SIZE;
        render();
      });
    }

    NOVA.ensurePosts();
    render();
  }

  /* ======================================================================
     SINGLE POST PAGE
     ====================================================================== */

  function renderRelatedPosts(current, all) {
    var host = UI.qs('#related-posts');
    var section = UI.qs('#related-section');
    if (!host) return;

    var related = all.filter(function (p) {
      return p.id !== current.id && p.category === current.category;
    }).slice(0, 3);

    // Fall back to any other recent posts so the section is never empty-looking
    if (!related.length) {
      related = all.filter(function (p) { return p.id !== current.id; }).slice(0, 3);
    }

    if (!related.length) {
      if (section) section.hidden = true;
      return;
    }

    host.textContent = '';
    related.forEach(function (p) { host.appendChild(UI.postCard(p, { showTools: false })); });
    UI.initScrollAnimations(host);
  }

  function renderPrevNext(current, all) {
    var host = UI.qs('#prev-next');
    if (!host) return;
    host.textContent = '';

    var index = -1;
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === current.id) { index = i; break; }
    }
    if (index === -1) return;

    // `all` is newest-first: the next newer post sits at a lower index.
    var newer = index > 0 ? all[index - 1] : null;
    var older = index < all.length - 1 ? all[index + 1] : null;

    function link(post, dirLabel, isNext) {
      var a = UI.el('a', isNext ? 'next' : 'prev');
      a.href = 'post.html?id=' + encodeURIComponent(post.id);
      a.appendChild(UI.el('span', 'dir', dirLabel));
      a.appendChild(UI.el('span', 'ttl', post.title));
      return a;
    }

    if (newer) host.appendChild(link(newer, '← Newer post', false));
    if (older) host.appendChild(link(older, 'Older post →', true));
  }

  function handleShare(post) {
    var host = UI.qs('#share-row');
    if (!host) return;

    var url = window.location.href;
    var title = post.title;

    var targets = [
      { name: 'x', label: 'Share on X', href: 'https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodeURIComponent(url) },
      { name: 'linkedin', label: 'Share on LinkedIn', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url) },
      { name: 'facebook', label: 'Share on Facebook', href: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url) }
    ];

    targets.forEach(function (t) {
      var a = UI.el('a', 'btn-icon');
      a.href = t.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', t.label);
      a.setAttribute('title', t.label);
      a.appendChild(UI.icon(t.name));
      host.appendChild(a);
    });

    var copy = UI.el('button', 'btn-icon');
    copy.type = 'button';
    copy.setAttribute('aria-label', 'Copy link to this post');
    copy.setAttribute('title', 'Copy link');
    copy.appendChild(UI.icon('link'));
    copy.addEventListener('click', function () {
      function done() { UI.toast('Link copied to your clipboard.', 'success'); }
      function fail() { UI.toast('Could not copy automatically — please copy from the address bar.', 'error'); }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(done).catch(fallbackCopy);
      } else {
        fallbackCopy();
      }

      function fallbackCopy() {
        // execCommand is deprecated but still the only option on file:// pages
        try {
          var ta = UI.el('textarea');
          ta.value = url;
          ta.setAttribute('readonly', '');
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          var ok = document.execCommand('copy');
          document.body.removeChild(ta);
          if (ok) done(); else fail();
        } catch (e) { fail(); }
      }
    });
    host.appendChild(copy);

    // Bookmark toggle lives in the same row
    var bm = UI.qs('#bookmark-btn');
    if (bm) {
      function sync() {
        var marked = NOVA.isBookmarked(post.id);
        bm.classList.toggle('is-active', marked);
        bm.setAttribute('aria-pressed', marked ? 'true' : 'false');
        var label = UI.qs('.bm-label', bm);
        if (label) label.textContent = marked ? 'Bookmarked' : 'Bookmark';
      }
      sync();
      bm.addEventListener('click', function () {
        var now = NOVA.toggleBookmark(post.id);
        sync();
        UI.toast(now ? 'Saved to your bookmarks.' : 'Bookmark removed.', 'info');
      });
    }
  }

  function renderComments(post) {
    var list = UI.qs('#comment-list');
    var form = UI.qs('#comment-form');
    var countNode = UI.qs('#comment-count');
    if (!list) return;

    function draw() {
      var comments = NOVA.getComments(post.id);
      list.textContent = '';

      if (countNode) {
        countNode.textContent = comments.length === 0
          ? 'No responses yet'
          : comments.length + (comments.length === 1 ? ' response' : ' responses');
      }

      if (!comments.length) {
        var none = UI.el('p', 'field-hint', 'Be the first to respond to this post.');
        list.appendChild(none);
        return;
      }

      comments.slice().reverse().forEach(function (c) {
        var item = UI.el('article', 'comment');
        var av = UI.el('span', 'avatar', NOVA.getInitials(c.name));
        av.setAttribute('aria-hidden', 'true');
        item.appendChild(av);

        var main = UI.el('div', 'comment-main');
        var head = UI.el('div', 'comment-head');
        head.appendChild(UI.el('span', 'comment-name', c.name));
        head.appendChild(UI.el('span', 'comment-time', NOVA.formatDate(c.date)));
        main.appendChild(head);
        main.appendChild(UI.el('p', 'comment-text', c.message));
        item.appendChild(main);
        list.appendChild(item);
      });
    }

    draw();

    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var nameInput = UI.qs('#comment-name', form);
      var msgInput = UI.qs('#comment-message', form);
      var nameField = nameInput.closest('.field');
      var msgField = msgInput.closest('.field');
      var valid = true;

      UI.clearFieldError(nameField);
      UI.clearFieldError(msgField);

      if (!nameInput.value.trim()) { UI.setFieldError(nameField, 'Please enter your name.'); valid = false; }
      if (!msgInput.value.trim()) { UI.setFieldError(msgField, 'Please write a response.'); valid = false; }

      if (!valid) {
        var firstBad = UI.qs('.field.has-error input, .field.has-error textarea', form);
        if (firstBad) firstBad.focus();
        return;
      }

      var result = NOVA.addComment(post.id, {
        name: nameInput.value.trim(),
        message: msgInput.value.trim(),
        date: NOVA.todayISO()
      });

      if (!result.ok && result.reason === 'quota') {
        UI.toast('Browser storage is full, so your response was not saved.', 'error');
        return;
      }

      form.reset();
      draw();
      UI.toast('Your response has been added.', 'success');
    });
  }

  function renderSinglePost() {
    var root = UI.qs('#article-root');
    if (!root) return;

    var all = NOVA.sortNewestFirst(NOVA.ensurePosts());
    var id = new URLSearchParams(window.location.search).get('id');
    var post = id ? NOVA.getPostById(id) : null;

    // Missing or deleted post — explain rather than render a blank page
    if (!post) {
      var missing = UI.qs('#article-missing');
      var content = UI.qs('#article-content');
      if (content) content.hidden = true;
      if (missing) {
        missing.hidden = false;
      } else {
        root.appendChild(UI.emptyState({
          icon: 'alert',
          title: 'Post not found',
          message: 'This post may have been deleted, or the link is incorrect.',
          actionLabel: 'Back to all posts',
          actionHref: 'blog.html'
        }));
      }
      document.title = 'Post not found — NOVA Journal';
      return;
    }

    document.title = post.title + ' — NOVA Journal';
    var metaDesc = UI.qs('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', NOVA.truncate(post.excerpt, 155));

    /* Header */
    var badgeHost = UI.qs('#article-category');
    if (badgeHost) { badgeHost.textContent = ''; badgeHost.appendChild(UI.buildBadge(post)); }

    var titleNode = UI.qs('#article-title');
    if (titleNode) titleNode.textContent = post.title;

    var excerptNode = UI.qs('#article-excerpt');
    if (excerptNode) excerptNode.textContent = post.excerpt;

    /* Byline */
    var avatarNode = UI.qs('#article-avatar');
    if (avatarNode) avatarNode.textContent = NOVA.getInitials(post.author);

    var authorNode = UI.qs('#article-author');
    if (authorNode) authorNode.textContent = post.author;

    var bioNode = UI.qs('#article-bio');
    if (bioNode) bioNode.textContent = 'Writing about ' + post.category.toLowerCase() + ' on NOVA Journal';

    var metaHost = UI.qs('#article-meta');
    if (metaHost) { metaHost.textContent = ''; metaHost.appendChild(UI.buildMeta(post, false)); }

    /* Cover */
    var coverHost = UI.qs('#article-cover');
    if (coverHost) {
      coverHost.textContent = '';
      var cover = UI.buildCover(post, 'div');
      cover.classList.remove('cover');
      cover.style.width = '100%';
      cover.style.height = '100%';
      // Reuse the cover internals but let the wrapper control the ratio
      coverHost.appendChild(cover.firstChild ? cover : cover);
      if (cover.firstChild && cover.firstChild.tagName === 'IMG') {
        cover.firstChild.loading = 'eager';
        cover.firstChild.style.width = '100%';
        cover.firstChild.style.height = '100%';
        cover.firstChild.style.objectFit = 'cover';
      }
    }

    /* Body */
    var bodyHost = UI.qs('#article-body');
    if (bodyHost) {
      UI.renderRichText(bodyHost, post.content);

      // Optional extra image embedded after the article text
      if (post.extraImage) {
        var fig = UI.el('figure', 'article-figure');
        var img = UI.el('img');
        img.src = post.extraImage;
        img.alt = 'Additional image for ' + post.title;
        img.loading = 'lazy';
        img.dataset.category = post.category;
        UI.attachImageFallback(img);
        fig.appendChild(img);
        fig.appendChild(UI.el('figcaption', null, 'Additional image'));
        bodyHost.appendChild(fig);
      }
    }

    /* Tags */
    var tagHost = UI.qs('#article-tags');
    if (tagHost) {
      tagHost.textContent = '';
      if (post.tags.length) {
        post.tags.forEach(function (t) { tagHost.appendChild(UI.el('span', 'tag', t)); });
      } else {
        tagHost.hidden = true;
      }
    }

    handleShare(post);
    renderRelatedPosts(post, all);
    renderPrevNext(post, all);
    renderComments(post);
    UI.initScrollAnimations();
  }

  /* ======================================================================
     BOOT
     ====================================================================== */

  document.addEventListener('DOMContentLoaded', function () {
    initHome();
    initBlogList();
    renderSinglePost();
  });
})();
