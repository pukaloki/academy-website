const fs = require('fs');
let render = fs.readFileSync('lib/render.mjs', 'utf8');

render = render.replace(/ringview\.js\?v=[a-zA-Z0-9_-]+/g, 'ringview.js?v=hero-loop-5');
render = render.replace(/ringview\.css\?v=[a-zA-Z0-9_-]+/g, 'ringview.css?v=hero-loop-5');

fs.writeFileSync('lib/render.mjs', render);
