(function () {
  'use strict';

  const AUTO_SPEED = 18; // pixels per second for the gentle drift
  const DAMPING = 0.92;
  const DRAG_SENSITIVITY = 1;

  const stage = document.querySelector('.ringview-stage');
  if (!stage) return;
  const rail = stage.querySelector('.ringview-rail');
  const panels = rail ? rail.querySelectorAll('.ringview-panel') : [];
  if (!rail || !panels.length) return;

  const state = {
    offset: 0,        // rail translateX, in px (0 = first panel centered)
    velocity: 0,      // px / s
    auto: 0,          // smoothed auto-rotation value
    dragging: false,
    lastInteraction: -Infinity,
    snapTo: null
  };
  let drag = { x: 0, t: 0, moved: 0, id: -1 };
  let lastTime = 0;
  let raf = 0;
  let minOffset = 0;   // most negative offset allowed (rail shifted so last panel is centered)
  let maxOffset = 0;   // most positive offset allowed (default 0)
  let ready = false;

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function computeBounds() {
    const stageRect = stage.getBoundingClientRect();
    const firstRect = panels[0].getBoundingClientRect();
    const lastRect = panels[panels.length - 1].getBoundingClientRect();
    // Center of stage relative to first panel center
    const stageCenter = stageRect.left + stageRect.width / 2;
    const firstCenter = firstRect.left + firstRect.width / 2;
    const lastCenter = lastRect.left + lastRect.width / 2;
    // offset is rail translateX (negative pulls rail left, panels slide right)
    maxOffset = stageCenter - firstCenter;          // default start: first panel centered
    minOffset = stageCenter - lastCenter;           // end: last panel centered
    if (minOffset > maxOffset) minOffset = maxOffset; // safety if content < stage width
    if (state.offset === 0 && !state.dragging) state.offset = maxOffset;
    state.offset = clamp(state.offset, minOffset, maxOffset);
  }

  function apply() {
    rail.style.transform = `translate3d(${state.offset.toFixed(2)}px, -50%, 0)`;
  }

  function tick(now) {
    if (!lastTime) lastTime = now;
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;

    if (!state.dragging) {
      state.velocity *= Math.pow(DAMPING, dt * 60);
      if (Math.abs(state.velocity) < 0.5) state.velocity = 0;
    }

    const idle = now - state.lastInteraction > 1600;
    const targetAuto = (!state.dragging && idle && state.snapTo === null) ? -AUTO_SPEED : 0;
    state.auto += (targetAuto - state.auto) * Math.min(1, dt * 2.2);

    if (state.snapTo !== null) {
      const diff = state.snapTo - state.offset;
      state.offset += diff * Math.min(1, dt * 7);
      if (Math.abs(diff) < 0.3) {
        state.offset = state.snapTo;
        state.snapTo = null;
        state.lastInteraction = now;
      }
    } else if (!state.dragging) {
      state.offset += (state.velocity + state.auto) * dt;
    }

    if (state.snapTo === null) {
      if (state.offset > maxOffset) {
        state.offset = maxOffset;
        state.velocity = 0;
      } else if (state.offset < minOffset) {
        state.offset = minOffset;
        state.velocity = 0;
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
    state.snapTo = null;
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
    state.dragging = false;
    state.lastInteraction = performance.now();
    stage.style.cursor = 'grab';

    if (drag.moved < 6) {
      // tap: snap to the panel nearest the center
      let nearest = panels[0];
      let bestDist = Infinity;
      const stageRect = stage.getBoundingClientRect();
      const stageCenter = stageRect.left + stageRect.width / 2;
      panels.forEach((p) => {
        const r = p.getBoundingClientRect();
        const c = r.left + r.width / 2;
        const d = Math.abs(c - stageCenter);
        if (d < bestDist) { bestDist = d; nearest = p; }
      });
      const r = nearest.getBoundingClientRect();
      const panelCenter = r.left + r.width / 2;
      const stageRectNow = stage.getBoundingClientRect();
      const stageCenterNow = stageRectNow.left + stageRectNow.width / 2;
      state.snapTo = clamp(state.offset + (stageCenterNow - panelCenter), minOffset, maxOffset);
      state.velocity = 0;
    }
  }

  stage.addEventListener('pointerdown', onPointerDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('resize', () => { computeBounds(); apply(); }, { passive: true });

  function init() {
    computeBounds();
    state.offset = maxOffset; // start with first panel centered
    apply();
    ready = true;
    lastTime = performance.now();
    raf = requestAnimationFrame(tick);
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(init, { timeout: 300 });
  } else {
    setTimeout(init, 0);
  }
})();