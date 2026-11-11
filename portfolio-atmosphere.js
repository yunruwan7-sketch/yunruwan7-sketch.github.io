(function () {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: .06 });
    document.querySelectorAll('.home-game-card, .home-analysis-panel, .home-aigc .film-view').forEach(function (element) {
      element.classList.add('home-reveal-ready');
      observer.observe(element);
    });
  }

  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;
  document.addEventListener('pointermove', function (event) {
    pointerX = event.clientX;
    pointerY = event.clientY;
    if (frame) return;
    frame = requestAnimationFrame(function () {
      frame = 0;
      document.body.style.setProperty('--light-x', pointerX + 'px');
      document.body.style.setProperty('--light-y', pointerY + 'px');
    });
  }, { passive: true });
}());
