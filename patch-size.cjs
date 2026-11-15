const fs = require('fs');
let css = fs.readFileSync('public/assets/ringview.css', 'utf8');

// Stage height
css = css.replace(/height: 400px;/, 'height: 320px;'); 
// Desktop panels (280px height)
css = css.replace(/\.panel-tall \{ width: 214px; height: 380px; \}/, '.panel-tall { width: 158px; height: 280px; }');
css = css.replace(/\.panel-wide \{ width: 676px; height: 380px; \}/, '.panel-wide { width: 498px; height: 280px; }');

// 1100px panels (240px height)
css = css.replace(/\.ringview-stage \{ height: 360px; \}/, '.ringview-stage { height: 280px; }');
css = css.replace(/\.panel-tall \{ width: 180px; height: 320px; border-radius: 14px; \}/, '.panel-tall { width: 135px; height: 240px; border-radius: 14px; }');
css = css.replace(/\.panel-wide \{ width: 568px; height: 320px; border-radius: 14px; \}/, '.panel-wide { width: 426px; height: 240px; border-radius: 14px; }');

// 768px panels (200px height)
css = css.replace(/\.ringview-stage \{ height: 300px; \}/, '.ringview-stage { height: 240px; }');
css = css.replace(/\.panel-tall \{ width: 146px; height: 260px; border-radius: 12px; \}/, '.panel-tall { width: 112px; height: 200px; border-radius: 12px; }');
css = css.replace(/\.panel-wide \{ width: 462px; height: 260px; border-radius: 12px; \}/, '.panel-wide { width: 355px; height: 200px; border-radius: 12px; }');

// 600px panels (160px height)
css = css.replace(/\.ringview-stage \{ height: 240px; \}/, '.ringview-stage { height: 200px; }');
css = css.replace(/\.panel-tall \{ width: 112px; height: 200px; border-radius: 10px; \}/, '.panel-tall { width: 90px; height: 160px; border-radius: 10px; }');
css = css.replace(/\.panel-wide \{ width: 355px; height: 200px; border-radius: 10px; \}/, '.panel-wide { width: 284px; height: 160px; border-radius: 10px; }');

fs.writeFileSync('public/assets/ringview.css', css);

let js = fs.readFileSync('public/assets/ringview.js', 'utf8');
// Increase speed
js = js.replace(/const AUTO_SPEED = 18;/, 'const AUTO_SPEED = 45;');
fs.writeFileSync('public/assets/ringview.js', js);

let render = fs.readFileSync('lib/render.mjs', 'utf8');
// Bump cache string
render = render.replace(/ringview\.css\?v=[a-zA-Z0-9_-]+/g, 'ringview.css?v=hero-compact-v4');
render = render.replace(/ringview\.js\?v=[a-zA-Z0-9_-]+/g, 'ringview.js?v=hero-compact-v4');
fs.writeFileSync('lib/render.mjs', render);
