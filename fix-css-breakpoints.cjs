const fs = require('fs');
let css = fs.readFileSync('public/assets/ringview.css', 'utf8');

css = css.replace(/@media \(max-width: 1100px\) \{[\s\S]*?@media \(max-width: 768px\)/, `@media (max-width: 1100px) {
  .ringview-stage { height: 280px; }
  .ringview-rail { gap: 24px; }
  .panel-tall { width: 135px; height: 240px; border-radius: 14px; }
  .panel-wide { width: 426px; height: 240px; border-radius: 14px; }
}
@media (max-width: 768px)`);

css = css.replace(/@media \(max-width: 768px\) \{[\s\S]*?@media \(max-width: 600px\)/, `@media (max-width: 768px) {
  .ringview-stage { height: 240px; }
  .ringview-rail { gap: 20px; }
  .panel-tall { width: 112px; height: 200px; border-radius: 12px; }
  .panel-wide { width: 355px; height: 200px; border-radius: 12px; }
  .supplied-hero.hero { padding-top: 110px !important; }
}
@media (max-width: 600px)`);

css = css.replace(/@media \(max-width: 600px\) \{[\s\S]*?\}/, `@media (max-width: 600px) {
  .ringview-stage { height: 200px; }
  .ringview-rail { gap: 16px; }
  .panel-tall { width: 90px; height: 160px; border-radius: 10px; }
  .panel-wide { width: 284px; height: 160px; border-radius: 10px; }
  .supplied-hero .hero-actions { flex-direction: column; align-items: stretch; width: 100%; max-width: 320px; }
}`);

fs.writeFileSync('public/assets/ringview.css', css);
