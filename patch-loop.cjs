const fs = require('fs');

// 1. Update render.mjs HTML
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

// Replace the current ringview-rail contents
render = render.replace(/<div class="ringview-rail">.*?<\/div>\s*<\/div>\s*<\/div>/s, `<div class="ringview-rail">${panelsHtml}</div></div></div>`);

// Update cache busters
render = render.replace(/ringview\.css\?v=[a-zA-Z0-9_-]+/g, 'ringview.css?v=hero-loop-1');
render = render.replace(/ringview\.js\?v=[a-zA-Z0-9_-]+/g, 'ringview.js?v=hero-loop-1');

fs.writeFileSync('lib/render.mjs', render);
console.log("Updated render.mjs");
