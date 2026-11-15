const fs = require('fs');
let css = fs.readFileSync('public/assets/ringview.css', 'utf8');

// Remove min-height: auto to restore the original 100vh hero height, 
// which stops the background image from becoming zoomed-in
css = css.replace(/min-height: auto !important;\s*/, 'min-height: 100vh !important;');
css = css.replace(/padding-top: 100px !important;\s*/, ''); // Let the original padding-top handle it if possible, or give it a bit more

fs.writeFileSync('public/assets/ringview.css', css);
