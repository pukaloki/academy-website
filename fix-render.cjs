const fs = require('fs');
let render = fs.readFileSync('lib/render.mjs', 'utf8');

const types = [
    'tall', 'tall', 'wide', 'tall',
    'tall', 'wide', 'tall', 'tall',
    'wide', 'tall', 'tall', 'wide',
    'tall', 'tall', 'wide', 'tall'
];
let panelsHtml = '';
for (let i = 0; i < 16; i++) {
    let num = String(i+1).padStart(2, '0');
    panelsHtml += `<div class="ringview-panel panel-${types[i]}"><div class="ringview-placeholder"><div class="ringview-caption"><span class="rc-title"><span class="rc-num">${num}</span> · LESSON FRAME</span></div></div></div>`;
}

const fullStageHtml = `<div class="ringview-stage" aria-label="Lesson preview frames"><div class="ringview-scene"><div class="ringview-rail">${panelsHtml}</div></div></div>`;

// Replace from <div class="ringview-stage" all the way to just before <div class="hero-copy-panel hero-copy-panel-bottom">
render = render.replace(/<div class="ringview-stage".*?(?=<div class="hero-copy-panel hero-copy-panel-bottom">)/s, fullStageHtml + '\n');

// Bump cache buster just in case
render = render.replace(/ringview\.js\?v=[a-zA-Z0-9_-]+/g, 'ringview.js?v=hero-loop-2');
render = render.replace(/ringview\.css\?v=[a-zA-Z0-9_-]+/g, 'ringview.css?v=hero-loop-2');

fs.writeFileSync('lib/render.mjs', render);
