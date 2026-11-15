(function () {
  'use strict';

  // Gentle, cinematic scroll speed (was 140, now 32 px/s for pleasant viewing)
  const AUTO_SPEED = 32;
  const DAMPING = 0.94;
  const DRAG_SENSITIVITY = 1;

  const stage = document.querySelector('.ringview-stage');
  if (!stage) return;
  const rail = stage.querySelector('.ringview-rail');
  const initialPanels = rail ? rail.querySelectorAll('.ringview-panel') : [];
  if (!rail || !initialPanels.length) return;

  const state = {
    offset: 0,
    velocity: 0,
    auto: 0,
    dragging: false,
    lastInteraction: -Infinity,
    setWidth: 0
  };
  let drag = { x: 0, t: 0, moved: 0, id: -1 };
  let lastTime = 0;
  let raf = 0;

  function apply() {
    rail.style.transform = `translate3d(${state.offset.toFixed(2)}px, -50%, 0)`;
  }

  function tick() {
    const currentNow = performance.now();
    if (!lastTime) lastTime = currentNow;

    const dt = Math.max(0.001, Math.min(0.05, (currentNow - lastTime) / 1000));
    lastTime = currentNow;

    if (!state.dragging) {
      state.velocity *= Math.pow(DAMPING, dt * 60);
      if (Math.abs(state.velocity) < 0.5) state.velocity = 0;
    }

    const idle = currentNow - state.lastInteraction > 1200;
    const targetAuto = (!state.dragging && idle) ? -AUTO_SPEED : 0;
    state.auto += (targetAuto - state.auto) * Math.min(1, dt * 2.0);

    if (!state.dragging) {
      state.offset += (state.velocity + state.auto) * dt;
    }

    // Infinite wrap logic
    if (state.setWidth > 0) {
      while (state.offset <= -state.setWidth) {
        state.offset += state.setWidth;
      }
      while (state.offset > 0) {
        state.offset -= state.setWidth;
      }
    }

    apply();
    raf = requestAnimationFrame(tick);
  }

  function onPointerDown(e) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    drag = {
      x: e.clientX,
      t: performance.now(),
      moved: 0,
      id: e.pointerId
    };
    state.dragging = true;
    state.velocity = 0;
    state.auto *= 0.3;
    state.lastInteraction = performance.now();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    stage.style.cursor = 'grabbing';
  }

  function onPointerMove(e) {
    if (!state.dragging || e.pointerId !== drag.id) return;
    const now = performance.now();
    const dx = e.clientX - drag.x;
    const dt = Math.max(1, now - drag.t) / 1000;
    drag.x = e.clientX;
    drag.t = now;
    drag.moved += Math.abs(dx);

    state.offset += dx * DRAG_SENSITIVITY;
    state.velocity = state.velocity * 0.6 + (dx / dt) * 0.4;
    state.lastInteraction = now;
  }

  function onPointerUp(e) {
    if (!state.dragging || e.pointerId !== drag.id) return;
    const moved = drag.moved;
    state.dragging = false;
    state.lastInteraction = performance.now();
    stage.style.cursor = 'grab';
    if (moved < 8) {
      const panel = (e.target ? e.target.closest('.ringview-panel') : null);
      if (panel && panel.dataset.video) {
        panel.click();
      }
    }
  }

  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', onPointerUp);
  stage.addEventListener('pointerleave', onPointerUp);

  function computeSetWidth() {
    const panels = rail.querySelectorAll('.ringview-panel');
    if (panels.length >= 32) {
      state.setWidth = panels[16].offsetLeft - panels[0].offsetLeft;
    } else if (panels.length > 0) {
      let w = 0;
      for (let i = 0; i < Math.min(16, panels.length); i++) {
        w += panels[i].offsetWidth + 12;
      }
      state.setWidth = w;
    }
  }

  window.addEventListener('resize', () => { 
    computeSetWidth(); 
    if (state.offset <= -state.setWidth) state.offset += state.setWidth;
    if (state.offset > 0) state.offset -= state.setWidth;
    apply(); 
  }, { passive: true });

  function setupVideo(v) {
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.loop = true;
    v.setAttribute('muted', '');
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('loop', '');
    v.setAttribute('autoplay', '');
  }

  function init() {
    const originalPanels = Array.from(rail.querySelectorAll('.ringview-panel'));
    
    // Duplicate 1 set for smooth infinite wrap
    for (const p of originalPanels) {
      const clone = p.cloneNode(true);
      rail.appendChild(clone);
    }

    const allPanels = Array.from(rail.querySelectorAll('.ringview-panel'));
    allPanels.forEach(p => {
      const v = p.querySelector('video');
      if (v) setupVideo(v);
    });

    // Use IntersectionObserver to play visible videos and pause off-screen ones
    // This keeps active decoders well below the browser limit (16) so all 16 videos play smoothly without freezing.
    if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          const v = entry.target.querySelector('video');
          if (!v) return;
          if (entry.isIntersecting) {
            if (v.paused) {
              const p = v.play();
              if (p !== undefined) p.catch(() => {});
            }
          } else {
            if (!v.paused) {
              v.pause();
            }
          }
        });
      }, {
        root: null,
        rootMargin: '100px 300px'
      });

      allPanels.forEach(p => videoObserver.observe(p));
    } else {
      // Fallback: play all muted loops
      allPanels.forEach(p => {
        const v = p.querySelector('video');
        if (v) v.play().catch(() => {});
      });
    }

    // Wakeup fallback on first user gesture (ensures autoplay restrictions don't block playback)
    const kickstartVideos = () => {
      allPanels.forEach(panel => {
        const rect = panel.getBoundingClientRect();
        if (rect.right > -100 && rect.left < window.innerWidth + 100) {
          const v = panel.querySelector('video');
          if (v && v.paused) {
            v.muted = true;
            v.play().catch(() => {});
          }
        }
      });
    };
    ['pointerdown', 'touchstart', 'scroll', 'click'].forEach(evt => {
      window.addEventListener(evt, kickstartVideos, { once: true, passive: true });
    });
    setInterval(kickstartVideos, 2500);

    computeSetWidth();
    state.offset = -state.setWidth;
    apply();
    lastTime = performance.now();
    raf = requestAnimationFrame(tick);
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(init, { timeout: 300 });
  } else {
    setTimeout(init, 0);
  }
})();
