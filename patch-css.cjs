const fs = require('fs');
let css = fs.readFileSync('public/assets/ringview.css', 'utf8');

// 1. Reduce top padding of the hero to tighten it up
css = css.replace('padding-top: 130px !important;', 'padding-top: 100px !important;');

// 2. Reduce gap between text sections and the carousel rail
css = css.replace('gap: 28px;', 'gap: 16px;');

// 3. Reduce stage height slightly to tighten spacing (400px is enough for a 380px panel + 20px shadow)
css = css.replace('height: 420px;', 'height: 400px;');
css = css.replace('margin-top: 4px;', 'margin-top: -10px;');
css = css.replace('margin-bottom: 4px;', 'margin-bottom: -10px;');

fs.writeFileSync('public/assets/ringview.css', css);
