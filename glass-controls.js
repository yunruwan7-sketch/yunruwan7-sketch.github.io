(function () {
  'use strict';

  // One delegated listener also covers controls in lazily rendered project views.
  // A fine pointer gets a local reflection; keyboard and touch retain static glass.
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var controlSelector = '.main-nav a, .header-actions button, .footer-actions button, ' +
    '.home-button, .home-resume-link, .project-action, .button, .case-tabs button, ' +
    '.resource-filter, .resource-open, .resource-preview, .related-link, .gallery-arrow, ' +
    '.game-return, .resume-pdf, .resume-print, .copy-email, .email-link, ' +
    '.contact-actions > a, .document-original, .dialog-close, .home-film-project-link, ' +
    '.home-film-play-label, .gallery-zoom-label, .game-screenshot-zoom, .overview-image-hint, ' +
    '.slides-source, .slides-button, .slides-page-select, .slides-thumbnail, ' +
    '.film-view-play, .film-view-document';
  var frame = 0;
  var target = null;
  var pointerX = 0;
  var pointerY = 0;

  function resetReflection(control) {
    if (!control) return;
    ['--glass-x', '--glass-y', '--glass-tilt-x', '--glass-tilt-y'].forEach(function (property) {
      control.style.removeProperty(property);
    });
  }

  document.addEventListener('pointermove', function (event) {
    var next = event.target instanceof Element ? event.target.closest(controlSelector) : null;
    if (next && next.disabled) next = null;
    if (next !== target) {
      resetReflection(target);
      target = next;
    }
    if (!target) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (frame) return;
    frame = window.requestAnimationFrame(function () {
      frame = 0;
      if (!target || !target.isConnected) return;
      var rect = target.getBoundingClientRect();
      target.style.setProperty('--glass-x', (pointerX - rect.left).toFixed(1) + 'px');
      target.style.setProperty('--glass-y', (pointerY - rect.top).toFixed(1) + 'px');
      target.style.setProperty('--glass-tilt-x', ((.5 - (pointerY - rect.top) / rect.height) * 2.4).toFixed(2) + 'deg');
      target.style.setProperty('--glass-tilt-y', (((pointerX - rect.left) / rect.width - .5) * 2.4).toFixed(2) + 'deg');
    });
  }, { passive: true });

  document.addEventListener('pointerout', function (event) {
    if (event.relatedTarget) return;
    resetReflection(target);
    target = null;
  }, { passive: true });
}());
