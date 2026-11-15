/* Advanced motion engine: GSAP scroll reveals, 3D card tilt, particle spawning, and ambient effects. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  const button = document.getElementById('motion-control');
  let paused = reduced.matches;
  
  function sync() {
    const stopped = paused || reduced.matches;
    document.documentElement.classList.toggle('motion-paused', stopped);
    button?.setAttribute('aria-pressed', String(stopped));
    button?.setAttribute('aria-label', stopped ? 'Resume decorative motion' : 'Pause decorative motion');
    if (button) button.querySelector('span').textContent = stopped ? 'Motion paused' : 'Motion on';
  }
  
  button?.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; sync(); });
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('motion-hidden', document.hidden);
  });
  sync();

  // Reading progress bar
  const progress = document.querySelector('.reading-progress');
  let frame = 0;
  function update() {
    frame = 0;
    const height = document.documentElement.scrollHeight - innerHeight;
    progress?.style.setProperty('transform', `scaleX(${height > 0 ? Math.max(0, Math.min(1, scrollY / height)) : 0})`);
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  update();
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);

  // Section link active tracking
  const links = [...document.querySelectorAll('[data-section-link]')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          links.forEach(link => {
            if (link.dataset.sectionLink === entry.target.id) link.setAttribute('aria-current', 'location');
            else link.removeAttribute('aria-current');
          });
        }
      }
    }, { rootMargin: '-15% 0px -50% 0px' });
    links.forEach(link => {
      const section = document.getElementById(link.dataset.sectionLink);
      if (section) observer.observe(section);
    });
  }

  // ─── GSAP ScrollTrigger Animations ───
  function initGSAP() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Reveal elements with staggered fade-in
    gsap.utils.toArray('.reveal').forEach(elem => {
      gsap.fromTo(elem,
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: {
            trigger: elem,
            start: 'top 88%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    // Staggered grid cards
    gsap.utils.toArray('.value-grid, .live-grid, .batch-grid, .instructor-grid, .course-grid, .journey-grid').forEach(grid => {
      const children = grid.children;
      if (!children.length) return;
      gsap.fromTo(children,
        { y: 60, opacity: 0, scale: 0.95 },
        {
          y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.12, ease: 'power2.out',
          scrollTrigger: {
            trigger: grid,
            start: 'top 85%',
          }
        }
      );
    });

    // Section headings with character split feel
    gsap.utils.toArray('.section-head h2').forEach(h2 => {
      gsap.fromTo(h2,
        { y: 30, opacity: 0, skewY: 2 },
        {
          y: 0, opacity: 1, skewY: 0, duration: 1, ease: 'power3.out',
          scrollTrigger: { trigger: h2, start: 'top 88%' }
        }
      );
    });

    // Counter / number elements
    gsap.utils.toArray('.mono').forEach(mono => {
      gsap.fromTo(mono,
        { opacity: 0, x: -10 },
        {
          opacity: 1, x: 0, duration: 0.6, ease: 'power2.out',
          scrollTrigger: { trigger: mono, start: 'top 90%' }
        }
      );
    });

    // Final CTA special entrance
    const cta = document.querySelector('.final-cta');
    if (cta) {
      gsap.fromTo(cta,
        { scale: 0.94, opacity: 0 },
        {
          scale: 1, opacity: 1, duration: 1, ease: 'power2.out',
          scrollTrigger: { trigger: cta, start: 'top 85%' }
        }
      );
    }
  }

  // ─── 3D Card Tilt (Framer-like) ───
  function init3DTilt() {
    if (coarse.matches || reduced.matches) return;
    const cards = document.querySelectorAll('.gsap-3d-card, .course-card, .value-card, .batch-card, .journey-card, .live-card');
    cards.forEach(card => {
      card.addEventListener('pointermove', e => {
        if (paused) return;
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(800px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg) translateY(-4px) scale(1.02)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transform = '';
      });
    });
  }

  // ─── Spawn CSS Particles in Hero ───
  function spawnParticles() {
    const hero = document.querySelector('.hero');
    if (!hero || reduced.matches) return;
    let container = hero.querySelector('.hero-particles');
    if (!container) {
      container = document.createElement('div');
      container.className = 'hero-particles';
      container.setAttribute('aria-hidden', 'true');
      hero.prepend(container);
    }
    const count = innerWidth < 650 ? 12 : 25;
    for (let i = 0; i < count; i++) {
      const span = document.createElement('span');
      span.style.setProperty('--x', `${Math.random() * 100}%`);
      span.style.setProperty('--dur', `${6 + Math.random() * 10}s`);
      span.style.setProperty('--delay', `${Math.random() * 8}s`);
      span.style.width = span.style.height = `${1 + Math.random() * 2}px`;
      container.appendChild(span);
    }
  }

  // ─── Magnetic Button Effect ───
  function initMagneticButtons() {
    if (coarse.matches || reduced.matches) return;
    document.querySelectorAll('.button').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.setProperty('--mx', `${x * 0.15}px`);
        btn.style.setProperty('--my', `${y * 0.15}px`);
        btn.style.transform = `translate(var(--mx), var(--my)) translateY(-2px)`;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        btn.style.removeProperty('--mx');
        btn.style.removeProperty('--my');
      });
    });
  }

  // Initialize everything after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function boot() {
    requestAnimationFrame(() => {
      initGSAP();
      init3DTilt();
      spawnParticles();
      initMagneticButtons();
    });
  }
})();

// Hero Logo Floating & Magnetic Effects
function initHeroLogos() {
  const logos = document.querySelectorAll('.software-icon');
  if (logos.length === 0 || paused) return;

  // Continuous floating animation
  logos.forEach((logo, i) => {
    gsap.to(logo, {
      y: 'random(-8, 8)',
      x: 'random(-4, 4)',
      rotationZ: 'random(-5, 5)',
      duration: 'random(2.5, 4)',
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      delay: i * 0.4
    });
    
    // Magnetic hover effect
    logo.parentElement.addEventListener('mousemove', e => {
      const rect = logo.getBoundingClientRect();
      const mx = (e.clientX - rect.left - rect.width/2) * 0.4;
      const my = (e.clientY - rect.top - rect.height/2) * 0.4;
      gsap.to(logo, {
        x: mx,
        y: my,
        scale: 1.15,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    });
    logo.parentElement.addEventListener('mouseleave', () => {
      gsap.to(logo, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.6,
        ease: 'elastic.out(1, 0.3)',
        overwrite: 'auto'
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => setTimeout(initHeroLogos, 100));

