const fs = require('fs');
let css = fs.readFileSync('public/assets/ringview.css', 'utf8');

// 1. Force the background to NEVER stretch past 100vh (this prevents the zoom issue completely)
if (!css.includes('.hero-background { height: 100vh')) {
  css += `\n.supplied-hero .hero-background { height: 100vh !important; }\n`;
}

// 2. Shrink the carousel further for a hyper-concise fit
// Stage 320 -> 260
css = css.replace(/height: 320px;/g, 'height: 260px;');
// Desktop panels 280 -> 240
css = css.replace(/\.panel-tall \{ width: 158px; height: 280px; \}/g, '.panel-tall { width: 135px; height: 240px; }');
css = css.replace(/\.panel-wide \{ width: 498px; height: 280px; \}/g, '.panel-wide { width: 426px; height: 240px; }');

// 3. Close the gaps entirely between text and carousel
css = css.replace(/gap: 16px;/g, 'gap: 0 !important;');
css = css.replace(/\padding-top: 80px !important;/g, 'padding-top: 70px !important;');

// 4. Tighten margins inside copy panels
css = css.replace(/margin-bottom: 6px;/g, 'margin-bottom: 0px;'); // Kicker
css = css.replace(/margin-bottom: 12px;/g, 'margin-bottom: 16px;'); // Description (give a tiny bit of breathing room below stage)

fs.writeFileSync('public/assets/ringview.css', css);

// JS speed tweak (maybe they want it slightly slower if it's too fast? No, they said "increase the speed", I already set it to 120. Let's make it 140)
let js = fs.readFileSync('public/assets/ringview.js', 'utf8');
js = js.replace(/AUTO_SPEED = 120;/, 'AUTO_SPEED = 140;');
fs.writeFileSync('public/assets/ringview.js', js);

// Cache buster
let render = fs.readFileSync('lib/render.mjs', 'utf8');
render = render.replace(/ringview\.css\?v=[a-zA-Z0-9_-]+/g, 'ringview.css?v=hero-loop-3');
render = render.replace(/ringview\.js\?v=[a-zA-Z0-9_-]+/g, 'ringview.js?v=hero-loop-3');
fs.writeFileSync('lib/render.mjs', render);
