const fs = require('fs');
let render = fs.readFileSync('lib/render.mjs', 'utf8');

// Replace cache busters to absolutely force a cache refresh
render = render.replace(/ringview\.css\?v=[a-zA-Z0-9_-]+/g, 'ringview.css?v=hero-compact-v3');
render = render.replace(/ringview\.js\?v=[a-zA-Z0-9_-]+/g, 'ringview.js?v=hero-compact-v3');

fs.writeFileSync('lib/render.mjs', render);
