(() => {
  'use strict';
  const stage = document.querySelector('.ringview-stage');
  const rail = stage?.querySelector('.ringview-rail');
  if (!rail?.children.length) return;
  const originals = [...rail.children];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let offset = 0, width = 0, last = 0, visible = true;
  const paused = () => document.hidden || reduced.matches || !visible || document.documentElement.classList.contains('motion-paused');
  originals.forEach(panel => {
    const clone = panel.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    rail.append(clone);
  });
  const panels = [...rail.children];
  const active = new Set();
  function syncVideos() {
    panels.forEach(panel => {
      const video = panel.querySelector('video');
      if (!video) return;
      if (!paused() && active.has(panel)) video.play().catch(() => {});
      else video.pause();
    });
  }
  const videoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => entry.isIntersecting ? active.add(entry.target) : active.delete(entry.target));
    syncVideos();
  }, { root: stage, rootMargin: '0px 80px' });
  panels.forEach(panel => videoObserver.observe(panel));
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; syncVideos(); }).observe(stage);
  new ResizeObserver(() => {
    width = rail.children[originals.length].offsetLeft - rail.children[0].offsetLeft;
    if (width) offset %= width;
  }).observe(stage);
  new MutationObserver(syncVideos).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', syncVideos);
  reduced.addEventListener('change', syncVideos);
  function tick(now) {
    const dt = last ? Math.min((now - last) / 1000, .05) : 0;
    last = now;
    if (!paused() && width) {
      offset = (offset + dt * 56) % width;
      rail.style.transform = `translate3d(${-offset}px,-50%,0)`;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
