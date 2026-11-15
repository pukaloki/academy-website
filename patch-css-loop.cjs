const fs = require('fs');
let css = fs.readFileSync('public/assets/ringview.css', 'utf8');

// Set gap: 0
css = css.replace(/gap:\s*\d+px;/g, 'gap: 0;');

// Update panel styling to be a seamless filmstrip
css = css.replace(/border-radius: 16px;/, 'border-radius: 0;');
css = css.replace(/border: 1px solid rgba\(255, 140, 58, 0\.12\);/, 'border: none; border-right: 1px solid rgba(255, 140, 58, 0.12); /* separator */');
css = css.replace(/border-radius: \d+px;/g, 'border-radius: 0;');

// Make hero layout tighter
css = css.replace('.supplied-hero .hero-content.wrap {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  text-align: center;\n  padding-bottom: 20px !important;\n  gap: 16px;\n}', 
`.supplied-hero .hero-content.wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 0 !important;
  gap: 16px;
}`);

// Increase stage size back up a tiny bit if needed, or leave it. 
// I'll leave the sizing as I just patched it (280px).
// Wait, the regex replaced ALL `border-radius: 14px;` etc to `0;`.
// Let's manually rewrite ringview.css to make sure it's perfect.
fs.writeFileSync('public/assets/ringview.css', css);
