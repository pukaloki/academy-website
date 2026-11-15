const fs = require('fs');
let js = fs.readFileSync('public/assets/ringview.js', 'utf8');

// 1. Fix the exploding NaN physics bug by completely replacing the tick() function
js = js.replace(/function tick\(now\) \{[\s\S]*?raf = requestAnimationFrame\(tick\);\n  \}/, 
`function tick() {
    const currentNow = performance.now();
    if (!lastTime) lastTime = currentNow;
    
    // CRITICAL FIX: Math.max(0.001, ...) guarantees dt is NEVER negative or zero.
    // Negative dt causes physics to explode to NaN and freezes the carousel.
    const dt = Math.max(0.001, Math.min(0.05, (currentNow - lastTime) / 1000));
    lastTime = currentNow;

    if (!state.dragging) {
      state.velocity *= Math.pow(DAMPING, dt * 60);
      if (Math.abs(state.velocity) < 0.5) state.velocity = 0;
    }

    const idle = currentNow - state.lastInteraction > 1600;
    const targetAuto = (!state.dragging && idle) ? -AUTO_SPEED : 0;
    state.auto += (targetAuto - state.auto) * Math.min(1, dt * 2.2);

    if (!state.dragging) {
      state.offset += (state.velocity + state.auto) * dt;
    }

    // Infinite wrap logic (using while loops to guarantee containment even at extreme velocities)
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
  }`);

// 2. Add pointerleave to prevent dragging from getting stuck if mouse leaves window
js = js.replace(/stage\.addEventListener\('pointercancel', onPointerUp\);/, 
`stage.addEventListener('pointercancel', onPointerUp);
  stage.addEventListener('pointerleave', onPointerUp);`);

fs.writeFileSync('public/assets/ringview.js', js);
