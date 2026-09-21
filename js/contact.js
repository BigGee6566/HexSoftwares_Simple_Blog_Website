/* ==========================================================================
   NOVA JOURNAL — contact.js
   Contact form validation and simulated submission.
   Nothing is transmitted anywhere — messages are stored locally only.
   (The newsletter form is handled in app.js so it works in the footer too.)
   ========================================================================== */

(function () {
  'use strict';

  var form = document.getElementById('contact-form');
  if (!form) return;

  var fields = {
    name: document.getElementById('contact-name'),
    email: document.getElementById('contact-email'),
    subject: document.getElementById('contact-subject'),
    message: document.getElementById('contact-message')
  };

  var alertBox = document.getElementById('contact-alert');
  var submitBtn = form.querySelector('button[type="submit"]');

  function fieldOf(input) { return input ? input.closest('.field') : null; }

  function showAlert(type, message) {
    if (!alertBox) return;
    alertBox.className = 'form-alert show ' + type;
    alertBox.textContent = '';
    alertBox.appendChild(UI.icon(type === 'success' ? 'check' : 'alert'));
    alertBox.appendChild(UI.el('span', null, message));
  }

  function hideAlert() {
    if (alertBox) alertBox.className = 'form-alert';
  }

  /* ----------------------------------------------------------------------
     Validation
     ---------------------------------------------------------------------- */

  function validateContactForm() {
    var errors = 0;

    function fail(input, message) {
      UI.setFieldError(fieldOf(input), message);
      errors++;
    }

    UI.clearFieldError(fieldOf(fields.name));
    UI.clearFieldError(fieldOf(fields.email));
    UI.clearFieldError(fieldOf(fields.subject));
    UI.clearFieldError(fieldOf(fields.message));

    if (!fields.name.value.trim()) {
      fail(fields.name, 'Please enter your full name.');
    } else if (fields.name.value.trim().length < 2) {
      fail(fields.name, 'That name looks too short.');
    }

    if (!fields.email.value.trim()) {
      fail(fields.email, 'Please enter your email address.');
    } else if (!UI.isValidEmail(fields.email.value)) {
      fail(fields.email, 'That does not look like a valid email address.');
    }

    if (!fields.subject.value.trim()) {
      fail(fields.subject, 'Please enter a subject.');
    }

    if (!fields.message.value.trim()) {
      fail(fields.message, 'Please write your message.');
    } else if (fields.message.value.trim().length < 10) {
      fail(fields.message, 'Please write at least 10 characters so I know how to help.');
    }

    return errors;
  }

  /* Clear each error as the user corrects it */
  Object.keys(fields).forEach(function (key) {
    var input = fields[key];
    if (!input) return;
    input.addEventListener('input', function () {
      UI.clearFieldError(fieldOf(input));
      hideAlert();
    });
  });

  /* ----------------------------------------------------------------------
     Submit — simulated, front-end only
     ---------------------------------------------------------------------- */

  function handleContactSubmit(e) {
    e.preventDefault();
    hideAlert();

    var errors = validateContactForm();

    if (errors) {
      showAlert('error', errors === 1
        ? 'One field needs attention before sending.'
        : errors + ' fields need attention before sending.');
      var first = form.querySelector('.field.has-error input, .field.has-error textarea');
      if (first) first.focus();
      UI.toast('Please fix the highlighted fields.', 'error');
      return;
    }

    // Brief pending state so the interaction feels real
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.dataset.label = submitBtn.textContent;
      submitBtn.textContent = 'Sending…';
    }

    setTimeout(function () {
      var saved = NOVA.saveMessage({
        name: fields.name.value.trim(),
        email: fields.email.value.trim(),
        subject: fields.subject.value.trim(),
        message: fields.message.value.trim(),
        received: new Date().toISOString()
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = submitBtn.dataset.label || 'Send message';
      }

      if (!saved.ok && saved.reason === 'quota') {
        showAlert('error', 'Your browser storage is full, so this message could not be stored. Your text has been kept.');
        UI.toast('Browser storage is full — message not stored.', 'error');
        return;
      }

      form.reset();
      showAlert('success',
        'Thanks ' + '— your message has been recorded in this browser. ' +
        'This is a front-end demo, so nothing was emailed or sent to a server.');
      UI.toast('Message received. Thank you for reaching out!', 'success');
    }, 600);
  }

  form.addEventListener('submit', handleContactSubmit);
})();
