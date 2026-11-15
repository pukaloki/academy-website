const fs = require('fs');
let css = fs.readFileSync('public/assets/ringview.css', 'utf8');

// Change left: 50% to left: 0, and transform: translate(-50%, -50%) to translateY(-50%)
css = css.replace(/left: 50%;\s*top: 50%;\s*display: flex;\s*align-items: center;\s*gap: 28px;\s*transform: translate\(-50%, -50%\);/, 
  'left: 0; top: 50%; display: flex; align-items: center; gap: 16px; transform: translateY(-50%);');

fs.writeFileSync('public/assets/ringview.css', css);

let js = fs.readFileSync('public/assets/ringview.js', 'utf8');
// computeBounds needs to be resilient to being called multiple times.
// If it measures while transform is already translate3d(offset), firstRect is shifted by offset!
// So before measuring, we must reset the transform!
js = js.replace(/function computeBounds\(\) \{/, `function computeBounds() {
    rail.style.transform = 'translate3d(0px, -50%, 0)'; // Reset before measure
`);
fs.writeFileSync('public/assets/ringview.js', js);
