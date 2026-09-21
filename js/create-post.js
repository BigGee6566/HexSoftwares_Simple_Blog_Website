/* ==========================================================================
   NOVA JOURNAL — create-post.js
   New post form: validation, canvas image compression, live preview,
   and quota-safe saving to localStorage.
   ========================================================================== */

(function () {
  'use strict';

  var MAX_IMAGE_WIDTH = 1200;      // resize cap before Base64 encoding
  var JPEG_QUALITY = 0.82;
  var WARN_BYTES = 2 * 1024 * 1024; // ~2MB — warn before attempting to save

  var form = document.getElementById('post-form');
  if (!form) return;

  /* ----------------------------------------------------------------------
     Element references
     ---------------------------------------------------------------------- */

  var f = {
    title: document.getElementById('post-title'),
    author: document.getElementById('post-author'),
    category: document.getElementById('post-category'),
    excerpt: document.getElementById('post-excerpt'),
    content: document.getElementById('post-content'),
    date: document.getElementById('post-date'),
    readingTime: document.getElementById('post-reading-time'),
    tags: document.getElementById('post-tags'),
    imageFile: document.getElementById('post-image'),
    imageUrl: document.getElementById('post-image-url'),
    imageAlt: document.getElementById('post-image-alt'),
    extraImage: document.getElementById('post-extra-image'),
    featured: document.getElementById('post-featured')
  };

  var dropZone = document.getElementById('upload-zone');
  var previewWrap = document.getElementById('image-preview');
  var previewImg = document.getElementById('image-preview-img');
  var previewClear = document.getElementById('image-preview-clear');
  var resetBtn = document.getElementById('reset-form');
  var formAlert = document.getElementById('form-alert');

  /* uploadedImage holds the compressed Base64 string from a file upload.
     It always wins over the URL field when both are present. */
  var uploadedImage = '';
  var readingTimeTouched = false;

  /* ----------------------------------------------------------------------
     Helpers
     ---------------------------------------------------------------------- */

  function fieldOf(input) { return input ? input.closest('.field') : null; }

  function showAlert(type, message) {
    if (!formAlert) return;
    formAlert.className = 'form-alert show ' + type;
    formAlert.textContent = '';
    formAlert.appendChild(UI.icon(type === 'success' ? 'check' : 'alert'));
    formAlert.appendChild(UI.el('span', null, message));
  }

  function hideAlert() {
    if (formAlert) formAlert.className = 'form-alert';
  }

  function base64Bytes(dataUrl) {
    var comma = dataUrl.indexOf(',');
    var body = comma > -1 ? dataUrl.slice(comma + 1) : dataUrl;
    var padding = (body.match(/=+$/) || [''])[0].length;
    return Math.round(body.length * 3 / 4) - padding;
  }

  function prettyBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  }

  /* ----------------------------------------------------------------------
     Character counters
     ---------------------------------------------------------------------- */

  function bindCounter(input, counterId, max) {
    var counter = document.getElementById(counterId);
    if (!input || !counter) return;
    function update() {
      var len = input.value.length;
      counter.textContent = len + ' / ' + max;
      counter.classList.toggle('over', len > max);
    }
    input.addEventListener('input', update);
    update();
  }

  bindCounter(f.title, 'title-counter', 80);
  bindCounter(f.excerpt, 'excerpt-counter', 160);
  bindCounter(f.content, 'content-counter', 20000);

  /* ----------------------------------------------------------------------
     Reading time — auto-calculated until the user edits it manually
     ---------------------------------------------------------------------- */

  if (f.readingTime) {
    f.readingTime.addEventListener('input', function () { readingTimeTouched = true; });
  }

  function syncReadingTime() {
    if (!f.content) return;

    var words = NOVA.countWords(f.content.value);
    var minutes = NOVA.calculateReadingTime(f.content.value);

    var wordCounter = document.getElementById('word-counter');
    if (wordCounter) {
      wordCounter.textContent = words + (words === 1 ? ' word' : ' words') +
                                ' · ' + minutes + ' min read';
    }

    // Stop overwriting the field once the author has set it by hand.
    if (readingTimeTouched || !f.readingTime) return;
    f.readingTime.value = minutes;
  }

  /* ----------------------------------------------------------------------
     Image handling — compress with canvas, then Base64
     ---------------------------------------------------------------------- */

  function compressImage(file, callback) {
    if (!/^image\//.test(file.type)) {
      UI.toast('That file is not an image. Please choose a JPG, PNG, WebP or GIF.', 'error');
      return;
    }

    var reader = new FileReader();

    reader.onerror = function () {
      UI.toast('Could not read that file. Please try a different image.', 'error');
    };

    reader.onload = function (e) {
      var img = new Image();

      img.onerror = function () {
        UI.toast('That image could not be opened. It may be corrupt.', 'error');
      };

      img.onload = function () {
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;

        if (w > MAX_IMAGE_WIDTH) {
          h = Math.round(h * (MAX_IMAGE_WIDTH / w));
          w = MAX_IMAGE_WIDTH;
        }

        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        // Flatten onto white so transparent PNGs do not turn black as JPEG
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        var dataUrl;
        try {
          dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        } catch (err) {
          UI.toast('This image could not be processed by your browser.', 'error');
          return;
        }

        callback(dataUrl, base64Bytes(dataUrl), w, h);
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  }

  function setPreview(src) {
    if (!previewWrap || !previewImg) return;
    if (!src) {
      previewWrap.classList.remove('show');
      previewImg.removeAttribute('src');
      return;
    }
    previewImg.src = src;
    previewWrap.classList.add('show');
  }

  function handleImageUpload(file) {
    if (!file) return;

    compressImage(file, function (dataUrl, bytes, w, h) {
      uploadedImage = dataUrl;
      setPreview(dataUrl);
      updatePreview();

      if (bytes > WARN_BYTES) {
        UI.toast(
          'Image is large (' + prettyBytes(bytes) + ' after compression). ' +
          'Browser storage may reject it — consider a smaller image.',
          'error', 7000
        );
      } else {
        UI.toast('Image ready — resized to ' + w + '×' + h + ' (' + prettyBytes(bytes) + ').', 'success');
      }
    });
  }

  if (f.imageFile) {
    f.imageFile.addEventListener('change', function () {
      if (f.imageFile.files && f.imageFile.files[0]) handleImageUpload(f.imageFile.files[0]);
    });
  }

  /* Drag & drop onto the upload zone */
  if (dropZone) {
    dropZone.addEventListener('click', function () { if (f.imageFile) f.imageFile.click(); });

    dropZone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (f.imageFile) f.imageFile.click(); }
    });

    ['dragenter', 'dragover'].forEach(function (evt) {
      dropZone.addEventListener(evt, function (e) {
        e.preventDefault();
        dropZone.classList.add('is-dragover');
      });
    });

    ['dragleave', 'drop'].forEach(function (evt) {
      dropZone.addEventListener(evt, function (e) {
        e.preventDefault();
        dropZone.classList.remove('is-dragover');
      });
    });

    dropZone.addEventListener('drop', function (e) {
      var dt = e.dataTransfer;
      if (dt && dt.files && dt.files[0]) handleImageUpload(dt.files[0]);
    });
  }

  if (previewClear) {
    previewClear.addEventListener('click', function () {
      uploadedImage = '';
      if (f.imageFile) f.imageFile.value = '';
      if (f.imageUrl) f.imageUrl.value = '';
      setPreview('');
      updatePreview();
      UI.toast('Image removed.', 'info');
    });
  }

  /* Image URL field — preview once the URL looks plausible and actually loads */
  if (f.imageUrl) {
    var urlDebounce;
    f.imageUrl.addEventListener('input', function () {
      clearTimeout(urlDebounce);
      urlDebounce = setTimeout(function () {
        var value = f.imageUrl.value.trim();
        if (!value) {
          if (!uploadedImage) setPreview('');
          updatePreview();
          return;
        }
        if (uploadedImage) return; // uploaded file takes priority

        var test = new Image();
        test.onload = function () { setPreview(value); updatePreview(); };
        test.onerror = function () {
          setPreview('');
          updatePreview();
        };
        test.src = value;
      }, 400);
    });
  }

  function currentImage() {
    if (uploadedImage) return uploadedImage;
    if (f.imageUrl && f.imageUrl.value.trim()) return f.imageUrl.value.trim();
    return '';
  }

  /* ----------------------------------------------------------------------
     Live preview panel
     ---------------------------------------------------------------------- */

  function draftPost() {
    return NOVA.normalisePost({
      id: 'preview',
      title: (f.title && f.title.value.trim()) || 'Your post title appears here',
      author: (f.author && f.author.value.trim()) || 'Author name',
      category: (f.category && f.category.value) || 'Digital Innovation',
      date: (f.date && f.date.value) || NOVA.todayISO(),
      excerpt: (f.excerpt && f.excerpt.value.trim()) ||
               'Your summary will appear here — it is what readers see on the home and blog pages.',
      content: (f.content && f.content.value) || '',
      image: currentImage(),
      imageAlt: (f.imageAlt && f.imageAlt.value.trim()) || '',
      readingTime: f.readingTime ? Number(f.readingTime.value) || 1 : 1,
      tags: parseTags()
    }, 0);
  }

  function updatePreview() {
    var host = document.getElementById('live-preview');
    if (!host) return;
    host.textContent = '';
    host.appendChild(UI.postCard(draftPost(), { showTools: false, reveal: false }));
  }

  function parseTags() {
    if (!f.tags) return [];
    return f.tags.value.split(',')
      .map(function (t) { return t.trim().replace(/^#/, ''); })
      .filter(Boolean)
      .slice(0, 6);
  }

  ['title', 'author', 'category', 'excerpt', 'content', 'date', 'readingTime', 'tags', 'imageAlt']
    .forEach(function (key) {
      var input = f[key];
      if (!input) return;
      input.addEventListener('input', function () {
        if (key === 'content') syncReadingTime();
        updatePreview();
      });
      input.addEventListener('change', updatePreview);
    });

  /* ----------------------------------------------------------------------
     Validation
     ---------------------------------------------------------------------- */

  function validatePostForm() {
    var errors = [];

    function check(input, condition, message) {
      var field = fieldOf(input);
      if (condition) {
        UI.setFieldError(field, message);
        errors.push({ input: input, message: message });
        return false;
      }
      UI.clearFieldError(field);
      return true;
    }

    check(f.title, !f.title.value.trim(), 'Please enter a title for your post.') &&
      check(f.title, f.title.value.trim().length > 80, 'Title must be 80 characters or fewer.');

    check(f.author, !f.author.value.trim(), 'Please enter an author name.');

    check(f.category, !f.category.value, 'Please choose a category.');

    check(f.excerpt, !f.excerpt.value.trim(), 'Please write a short excerpt.') &&
      check(f.excerpt, f.excerpt.value.trim().length > 160, 'Excerpt must be 160 characters or fewer.');

    check(f.content, !f.content.value.trim(), 'Please write the post content.') ||
      check(f.content, f.content.value.trim().length < 40, 'Content is very short — write at least 40 characters.');

    /* Date: required, parseable, and not in the future */
    var dateField = fieldOf(f.date);
    var dateValue = f.date.value;
    if (!dateValue) {
      UI.setFieldError(dateField, 'Please choose a publication date.');
      errors.push({ input: f.date });
    } else {
      var parsed = new Date(dateValue + 'T00:00:00');
      var today = new Date();
      today.setHours(23, 59, 59, 999);
      if (isNaN(parsed.getTime())) {
        UI.setFieldError(dateField, 'That date is not valid.');
        errors.push({ input: f.date });
      } else if (parsed > today) {
        UI.setFieldError(dateField, 'The date cannot be in the future.');
        errors.push({ input: f.date });
      } else {
        UI.clearFieldError(dateField);
      }
    }

    check(f.tags, parseTags().length === 0, 'Add at least one tag, separated by commas.');

    /* Alt text is required whenever an image is present — accessibility */
    if (currentImage()) {
      check(f.imageAlt, !f.imageAlt.value.trim(), 'Describe the image so screen-reader users know what it shows.');
    } else {
      UI.clearFieldError(fieldOf(f.imageAlt));
    }

    return errors;
  }

  /* Clear a field's error as soon as the user starts fixing it */
  Object.keys(f).forEach(function (key) {
    var input = f[key];
    if (!input || input.type === 'file') return;
    input.addEventListener('input', function () { UI.clearFieldError(fieldOf(input)); });
  });

  /* ----------------------------------------------------------------------
     Submit
     ---------------------------------------------------------------------- */

  function handleAddPost(e) {
    e.preventDefault();
    hideAlert();

    var errors = validatePostForm();
    if (errors.length) {
      showAlert('error', errors.length === 1
        ? 'One field needs attention before you can publish.'
        : errors.length + ' fields need attention before you can publish.');
      var first = form.querySelector('.field.has-error input, .field.has-error textarea, .field.has-error select');
      if (first) { first.focus(); first.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      UI.toast('Please fix the highlighted fields.', 'error');
      return;
    }

    var image = currentImage();

    // Warn (but still attempt) when the payload is unusually large
    if (image && image.indexOf('data:') === 0 && base64Bytes(image) > WARN_BYTES) {
      UI.toast('Saving a large image — this may fail if storage is full.', 'info');
    }

    var content = f.content.value.trim();

    var post = {
      // Unique even if two posts are created within the same millisecond
      id: String(Date.now()) + '-' + Math.random().toString(36).slice(2, 8),
      title: f.title.value.trim(),
      author: f.author.value.trim(),
      category: f.category.value,
      date: f.date.value,
      excerpt: f.excerpt.value.trim(),
      content: content,
      image: image,
      imageAlt: f.imageAlt ? f.imageAlt.value.trim() : '',
      extraImage: f.extraImage ? f.extraImage.value.trim() : '',
      readingTime: f.readingTime && Number(f.readingTime.value) > 0
        ? Number(f.readingTime.value)
        : NOVA.calculateReadingTime(content),
      tags: parseTags(),
      featured: !!(f.featured && f.featured.checked),
      createdAt: Date.now()
    };

    var result = NOVA.addPost(post);

    if (!result.ok) {
      // IMPORTANT: the form is never cleared on failure, so nothing is lost.
      if (result.reason === 'quota') {
        showAlert('error', 'Your browser storage is full. Try using a smaller image or delete older posts. Your text has been kept.');
        UI.toast('Your browser storage is full. Try using a smaller image or delete older posts.', 'error', 8000);
      } else {
        showAlert('error', 'Your browser is blocking storage, so this post could not be saved. Your text has been kept.');
        UI.toast('Could not save — browser storage is unavailable.', 'error', 8000);
      }
      return;
    }

    UI.toast('Post published successfully!', 'success');
    showAlert('success', 'Published. Taking you to your new post…');

    // Let the toast register before navigating
    setTimeout(function () {
      window.location.href = 'post.html?id=' + encodeURIComponent(post.id);
    }, 700);
  }

  form.addEventListener('submit', handleAddPost);

  /* ----------------------------------------------------------------------
     Reset
     ---------------------------------------------------------------------- */

  function resetPostForm() {
    form.reset();
    uploadedImage = '';
    readingTimeTouched = false;
    setPreview('');
    hideAlert();
    UI.qsa('.field', form).forEach(function (field) { UI.clearFieldError(field); });
    if (f.date) f.date.value = NOVA.todayISO();
    syncReadingTime();
    updatePreview();
    ['title-counter', 'excerpt-counter', 'content-counter'].forEach(function (id) {
      var c = document.getElementById(id);
      if (c) c.classList.remove('over');
    });
    if (f.title) f.title.focus();
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      UI.confirmDialog({
        title: 'Clear the form?',
        message: 'Everything you have typed will be removed. This cannot be undone.',
        confirmLabel: 'Clear form',
        danger: true
      }, function () {
        resetPostForm();
        UI.toast('Form cleared.', 'info');
      });
    });
  }

  /* ----------------------------------------------------------------------
     Init
     ---------------------------------------------------------------------- */

  document.addEventListener('DOMContentLoaded', function () {
    if (f.date && !f.date.value) f.date.value = NOVA.todayISO();
    if (f.date) f.date.max = NOVA.todayISO();   // block future dates in the picker
    syncReadingTime();
    updatePreview();

    // Counters need a second pass once values are in place
    ['title-counter', 'excerpt-counter', 'content-counter'].forEach(function (id) {
      var c = document.getElementById(id);
      if (c && c.textContent.indexOf('/') === -1) c.textContent = '0 / 0';
    });
  });
})();
