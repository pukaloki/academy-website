# Surgical patch path

If `deploy.sh` shows a diff between the production `lib/render.mjs` and the
local copy, do not blindly overwrite production. The renderers have already
diverged once (Oct 7 navbar-glass deploy).

## Recommended path

1. Run `./deploy.sh` and stop at the diff output.
2. Note which sections of the production `render.mjs` actually need to change
   to land the new hero layout.
3. Edit `render.mjs.production` (the file the script already pulled) to keep
   everything production-side intact and only:
   - Replace the `<section class="hero supplied-hero" id="home">` block.
   - Bump `ringview.css?v=...` and `ringview.js?v=...` to `?v=hero1` (or any
     new cache-bust token).
4. Re-run `./deploy.sh` and it will upload your edited
   `render.mjs.production` instead of the local copy.

## If the production hero doesn't have a `ringview-stage` block at all

That is fine — the surgical replacement is still just the hero HTML plus
the asset script/stylesheet references. Nothing else in render.mjs needs to
change. The deploy script already handles adding `public/assets/ringview.css`
and `public/assets/ringview.js` to the release.

## If the production hero references `cohort-hero.png` instead of `.webp`

That is also fine. The new hero block keeps the same `<div class="hero-background">`
shape, only the inner contents (kicker, h1, ringview, description, actions,
points) change. The background image element is left alone.