const fs = require('fs');
let js = fs.readFileSync('public/assets/ringview.js', 'utf8');

js = js.replace(/function computeSetWidth\(\) \{[\s\S]*?state\.setWidth = w;\n  \}/, 
`function computeSetWidth() {
    rail.style.transform = 'translate3d(0px, -50%, 0)'; // Reset before measure
    void rail.offsetHeight; // Force reflow
    const currentPanels = rail.querySelectorAll('.ringview-panel');
    let w = 0;
    const limit = Math.min(16, currentPanels.length);
    for (let i = 0; i < limit; i++) {
      w += currentPanels[i].getBoundingClientRect().width;
    }
    state.setWidth = w;
  }`);

// Make it true infinite by adding enough duplicates (just in case they have a 4K monitor)
// If setWidth is ~3900px, 4K is 3840px. 3 sets = 11700px. This prevents the user from EVER seeing the end, even when dragging wildly.
js = js.replace(/const originalHtml = rail\.innerHTML;\n\s*rail\.innerHTML = originalHtml \+ originalHtml;/, 
`const originalHtml = rail.innerHTML;
    // Triplicate the DOM panels for extreme safety on ultra-wide screens
    rail.innerHTML = originalHtml + originalHtml + originalHtml;`);

// Start in the middle of the triple-set
js = js.replace(/state\.offset = -state\.setWidth \/ 2;/, 'state.offset = -state.setWidth;');

fs.writeFileSync('public/assets/ringview.js', js);
