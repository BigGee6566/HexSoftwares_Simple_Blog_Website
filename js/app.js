'use strict';

var STORAGE_KEY = 'hexsoftwares_blog_posts';

/* ── localStorage helpers ─────────────────────────────── */

function getPosts() {
  try {
    var data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function savePosts(posts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch (e) {
    // localStorage may be full or unavailable
  }
}

/* ── Date formatting ──────────────────────────────────── */

function formatDate(dateString) {
  var d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;
  var months = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec'
  ];
  return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

function getTodayString() {
  var d = new Date();
  var yyyy = d.getFullYear();
  var mm = String(d.getMonth() + 1).padStart(2, '0');
  var dd = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

/* ── XSS-safe text helper ─────────────────────────────── */

function escapeHTML(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ── Sample posts (seeded on first visit) ─────────────── */

function seedSamplePosts() {
  var samples = [
    {
      id: Date.now() - 200000,
      title: 'Getting Started with HTML',
      author: 'Yongama',
      date: '2026-09-19',
      content: 'HTML is the backbone of every web page. Today I learned about semantic elements like header, main, section, and footer. Using the right tags makes the page more accessible and easier to style.'
    },
    {
      id: Date.now() - 100000,
      title: 'CSS Variables Changed My Workflow',
      author: 'Yongama',
      date: '2026-09-20',
      content: 'Instead of repeating colour values everywhere, CSS custom properties let me define them once on :root and reuse them across the stylesheet. Changing the accent colour updates the entire site in one place.'
    },
    {
      id: Date.now(),
      title: 'localStorage for Beginners',
      author: 'Yongama',
      date: '2026-09-21',
      content: 'localStorage stores key-value pairs in the browser. I used JSON.stringify to save my blog posts array and JSON.parse to read it back. Data survives page reloads but is limited to this browser only.'
    }
  ];
  savePosts(samples);
  return samples;
}

/* ── Truncate long text for preview ───────────────────── */

function truncate(text, limit) {
  if (text.length <= limit) return text;
  return text.substring(0, limit).trimEnd() + '...';
}

/* ── Render a single post card (returns HTML string) ──── */

function createPostCard(post, showDelete) {
  var preview = truncate(post.content, 140);
  var html = '<article class="card">';
  html += '<div class="card-meta">';
  html += '<span>' + escapeHTML(post.author) + '</span>';
  html += '<span class="dot-sep">' + formatDate(post.date) + '</span>';
  html += '</div>';
  html += '<h3>' + escapeHTML(post.title) + '</h3>';
  html += '<p>' + escapeHTML(preview) + '</p>';
  if (showDelete) {
    html += '<div class="card-actions">';
    html += '<button class="btn btn-danger" data-delete-id="' + post.id + '">Delete</button>';
    html += '</div>';
  }
  html += '</article>';
  return html;
}

/* ── Render posts into a container ────────────────────── */

function renderPosts(containerId, posts, showDelete) {
  var container = document.getElementById(containerId);
  if (!container) return;

  if (posts.length === 0) {
    container.innerHTML =
      '<div class="empty-state">' +
      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">' +
      '<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>' +
      '</svg>' +
      '<p>No posts yet. Be the first to write one!</p>' +
      '<a href="blog.html" class="btn btn-primary">Create a Post</a>' +
      '</div>';
    return;
  }

  var html = '';
  for (var i = 0; i < posts.length; i++) {
    html += createPostCard(posts[i], showDelete);
  }
  container.innerHTML = html;

  if (showDelete) {
    var buttons = container.querySelectorAll('[data-delete-id]');
    for (var j = 0; j < buttons.length; j++) {
      buttons[j].addEventListener('click', handleDeleteClick);
    }
  }
}

/* ── Delete a post ────────────────────────────────────── */

function deletePost(id) {
  var posts = getPosts();
  var filtered = [];
  for (var i = 0; i < posts.length; i++) {
    if (posts[i].id !== id) {
      filtered.push(posts[i]);
    }
  }
  savePosts(filtered);
  return filtered;
}

function handleDeleteClick(e) {
  var id = Number(e.currentTarget.getAttribute('data-delete-id'));
  if (!confirm('Are you sure you want to delete this post?')) return;
  var remaining = deletePost(id);
  remaining.sort(function(a, b) { return b.id - a.id; });
  renderPosts('post-list', remaining, true);
  showToast('Post deleted.');
}

/* ── Add a post (form handler) ────────────────────────── */

function handleAddPost(e) {
  e.preventDefault();

  var titleEl = document.getElementById('post-title');
  var authorEl = document.getElementById('post-author');
  var dateEl = document.getElementById('post-date');
  var contentEl = document.getElementById('post-content');

  var valid = true;

  valid = validateField(titleEl, 'title-error', titleEl.value.trim() === '') && valid ? true : false;
  valid = validateField(authorEl, 'author-error', authorEl.value.trim() === '') ? valid : false;
  valid = validateField(dateEl, 'date-error', dateEl.value === '') ? valid : false;
  valid = validateField(contentEl, 'content-error', contentEl.value.trim() === '') ? valid : false;

  if (!valid) return;

  var post = {
    id: Date.now(),
    title: titleEl.value.trim(),
    author: authorEl.value.trim(),
    date: dateEl.value,
    content: contentEl.value.trim()
  };

  var posts = getPosts();
  posts.push(post);
  savePosts(posts);

  e.target.reset();
  dateEl.value = getTodayString();
  clearAllErrors(e.target);

  posts.sort(function(a, b) { return b.id - a.id; });
  renderPosts('post-list', posts, true);
  showToast('Post published!');
}

/* ── Form validation helpers ──────────────────────────── */

function validateField(input, errorId, hasError) {
  var group = input.closest('.form-group');
  if (hasError) {
    group.classList.add('has-error');
    return false;
  }
  group.classList.remove('has-error');
  return true;
}

function clearAllErrors(form) {
  var groups = form.querySelectorAll('.form-group');
  for (var i = 0; i < groups.length; i++) {
    groups[i].classList.remove('has-error');
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ── Contact form handler ─────────────────────────────── */

function handleContactSubmit(e) {
  e.preventDefault();

  var nameEl = document.getElementById('contact-name');
  var emailEl = document.getElementById('contact-email');
  var messageEl = document.getElementById('contact-message');

  var valid = true;

  valid = validateField(nameEl, 'name-error', nameEl.value.trim() === '') ? valid : false;
  valid = validateField(emailEl, 'email-error', emailEl.value.trim() === '' || !isValidEmail(emailEl.value.trim())) ? valid : false;
  valid = validateField(messageEl, 'message-error', messageEl.value.trim() === '') ? valid : false;

  if (!valid) return;

  e.target.reset();
  clearAllErrors(e.target);

  var successEl = document.getElementById('contact-success');
  if (successEl) {
    successEl.style.display = 'block';
    setTimeout(function() {
      successEl.style.display = 'none';
    }, 5000);
  }
}

/* ── Toast notification ───────────────────────────────── */

function showToast(message) {
  var existing = document.querySelector('.toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'toast success';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(function() {
    toast.classList.add('removing');
    setTimeout(function() {
      if (toast.parentNode) toast.remove();
    }, 260);
  }, 3000);
}

/* ── Mobile nav toggle ────────────────────────────────── */

function initMobileNav() {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.site-nav');
  var close = document.querySelector('.nav-close');

  if (!toggle || !nav) return;

  toggle.addEventListener('click', function() {
    nav.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
    if (close) close.focus();
  });

  if (close) {
    close.addEventListener('click', function() {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    });
  }

  var links = nav.querySelectorAll('a');
  for (var i = 0; i < links.length; i++) {
    links[i].addEventListener('click', function() {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }
}

/* ── Initialise on DOM ready ──────────────────────────── */

document.addEventListener('DOMContentLoaded', function() {
  initMobileNav();

  var posts = getPosts();
  if (posts.length === 0) {
    posts = seedSamplePosts();
  }

  // Home page: show 3 most recent
  var recentContainer = document.getElementById('recent-posts');
  if (recentContainer) {
    var sorted = posts.slice().sort(function(a, b) { return b.id - a.id; });
    var recent = sorted.slice(0, 3);
    renderPosts('recent-posts', recent, false);
  }

  // Blog page: show all posts + wire up form
  var postList = document.getElementById('post-list');
  if (postList) {
    var allSorted = posts.slice().sort(function(a, b) { return b.id - a.id; });
    renderPosts('post-list', allSorted, true);
  }

  var postForm = document.getElementById('post-form');
  if (postForm) {
    var dateInput = document.getElementById('post-date');
    if (dateInput && !dateInput.value) {
      dateInput.value = getTodayString();
    }
    postForm.addEventListener('submit', handleAddPost);
  }

  // Contact form
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }
});
