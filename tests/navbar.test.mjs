import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../lib/render.mjs';

const routes = ['/', '/about', '/batches', '/contact', '/login', '/signup', '/profile', '/enroll', '/privacy', '/terms', '/refunds', '/dashboard', '/404'];
const sectionLinks = ['/#studio', '/#curriculum', '/#live-classes', '/#batches', '/#faq'];

function header(html, route) {
  const headers = html.match(/<header\b[^>]*>[\s\S]*?<\/header>/g) || [];
  assert.equal(headers.length, 1, `${route}: one shared header`);
  return headers[0];
}

test('all page types share the same labeled navigation and section links', () => {
  const expected = header(render('/'), '/');
  for (const route of routes) {
    const actual = header(render(route), route);
    assert.equal(actual, expected, `${route}: header matches the homepage`);
    for (const label of ['Main navigation', 'Mobile navigation']) {
      const navs = [...actual.matchAll(/<nav\b([^>]*)>([\s\S]*?)<\/nav>/g)]
        .filter(([, attributes]) => attributes.includes(`aria-label="${label}"`));
      assert.equal(navs.length, 1, `${route}: ${label} landmark`);
      const hrefs = [...navs[0][2].matchAll(/<a\b[^>]*\bhref="([^"]+)"/g)].map(([, href]) => href);
      for (const href of sectionLinks) assert.ok(hrefs.includes(href), `${route}: ${label} retains ${href}`);
    }
  }
});

test('navigation controls retain their accessible initial state and login destinations', () => {
  for (const route of routes) {
    const actual = header(render(route), route);
    const theme = actual.match(/<button\b(?=[^>]*\bid="theme-toggle")[^>]*>/)?.[0];
    assert.ok(theme, `${route}: theme toggle is a button`);
    assert.match(theme, /\baria-label="\s*[^"\s][^"]*"/, `${route}: theme toggle has an accessible name`);
    const menu = actual.match(/<button\b(?=[^>]*\baria-controls="mobile-nav")[^>]*>/)?.[0];
    assert.ok(menu, `${route}: menu button controls the mobile drawer`);
    assert.match(menu, /\baria-expanded="false"/, `${route}: menu starts collapsed`);
    const drawer = actual.match(/<nav\b(?=[^>]*\bid="mobile-nav")[^>]*>/)?.[0];
    assert.ok(drawer, `${route}: mobile drawer exists`);
    assert.match(drawer, /\shidden(?:\s|=|>)/, `${route}: mobile drawer starts hidden`);
    const links = [...actual.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
    for (const name of ['Log in', 'Student login', 'Enroll now']) {
      const link = links.find(([, , content]) => content.replace(/<[^>]*>/g, '').trim() === name);
      assert.ok(link, `${route}: ${name} link exists`);
      assert.match(link[1], /\bhref="\/login"/, `${route}: ${name} leads to /login`);
    }
  }
});

test('every page loads the cache-busted navbar stylesheet once after final-design.css', () => {
  const revision = '/assets/client-revision.css?v=slots-original-v8';
  for (const route of routes) {
    const stylesheets = [...render(route).matchAll(/<link\b(?=[^>]*\brel="stylesheet")[^>]*\bhref="([^"]+)"[^>]*>/g)]
      .map(([, href]) => href);
    assert.deepEqual(stylesheets.filter(href => href.split('?')[0] === '/assets/client-revision.css'), [revision], `${route}: one versioned revision stylesheet`);
    const finalDesign = stylesheets.map(href => href.split('?')[0]).lastIndexOf('/assets/final-design.css');
    assert.ok(finalDesign >= 0, `${route}: final-design stylesheet exists`);
    assert.ok(stylesheets.indexOf(revision) > finalDesign, `${route}: revision stylesheet follows final-design.css`);
  }
});
