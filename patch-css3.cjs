const fs = require('fs');
let css = fs.readFileSync('public/assets/ringview.css', 'utf8');

css = css.replace('.supplied-hero.hero {', '.supplied-hero.hero {\n  justify-content: center;\n  padding-top: 80px !important;');

fs.writeFileSync('public/assets/ringview.css', css);
