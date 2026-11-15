const fs = require('fs');
const path = './lib/render.mjs';
let content = fs.readFileSync(path, 'utf8');

const newHeroHtml = `<section class="hero clipcut-hero" id="home">
<div class="hero-background" aria-hidden="true">
  <div class="hero-mist"></div>
  <canvas class="rain-canvas" data-scene="rain"></canvas>
  <div class="hero-glass"></div><div class="hero-glass-sweep"></div>
  <div class="hero-vignette"></div>
</div>
<div class="hero-content wrap clipcut-layout">
  <div class="clipcut-copy">
    <span class="hero-kicker">FULLY LIVE · INTERACTIVE · 10 WEEKS</span>
    <h1>Learn the craft.<br>Make the <i>cut.</i></h1>
    <p class="hero-description">Live video editing classes with professional editors.<br>Master the timeline, tell better stories, and learn how to turn your skills into client work.</p>
    <div class="hero-actions">\${button('Enroll now','/login')}<a class="button secondary" href="/#studio">\${icon('play')} Inside the edit</a></div>
    <div class="hero-points"><span>\${icon('monitor')} Fully live & interactive</span><span>\${icon('chat')} Placement support</span><span>\${icon('group')} Editing community</span></div>
  </div>
  <div class="clipcut-visual">
    <div class="clipcut-frame">
      <div class="clipcut-media-container">
        <!-- We use the existing hero image but framed properly in 9:16 -->
        <img src="/assets/cohort-hero.webp" alt="Video Placeholder" class="clipcut-media">
        <div class="clipcut-glare"></div>
        <div class="clipcut-inner-curve"></div>
      </div>
    </div>
    <div class="clipcut-shadow"></div>
  </div>
</div>
<a class="hero-scroll mono" href="/#studio">THE PROCESS STARTS BELOW \${icon('arrow')}</a>
</section>`;

// Replace the old hero string with the new one
// The string we are replacing starts with `<section class="hero supplied-hero" id="home">` and ends right before `${studioSection()}`
const regex = /<section class="hero supplied-hero" id="home">.*?<\/section>/s;

content = content.replace(regex, newHeroHtml);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched render.mjs");
