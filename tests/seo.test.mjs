import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../lib/render.mjs';
test('production homepage identifies academy and course without fabricated claims',()=>{
 const html=render('/',{publicOrigin:'https://theshortcutacademy.in'});
 const graph=JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])['@graph'];
 assert.equal(graph.find(x=>x['@type']==='WebSite').url,'https://theshortcutacademy.in/');
 assert.equal(graph.find(x=>x['@type']==='Course').offers.price,2999);
 assert.equal(graph.find(x=>x['@type']==='EducationalOrganization').email,'info@theshortcutacademy.in');
 assert.ok(graph.every(x=>!x.aggregateRating));
 assert.match(html,/<title>The Shortcut Academy \| Live Video Editing Classes<\/title>/);
 assert.match(html,/rel="canonical" href="https:\/\/theshortcutacademy.in\/"/);
 assert.match(html,/content="index,follow,max-image-preview:large"/);
 for(const route of ['/login','/profile','/dashboard','/enroll','/404']){
  const page=render(route,{publicOrigin:'https://theshortcutacademy.in'});
  assert.match(page,/content="noindex,follow"/);
  assert.doesNotMatch(page,/application\/ld\+json/);
 }
 assert.doesNotMatch(render('/'),/application\/ld\+json/);
});
