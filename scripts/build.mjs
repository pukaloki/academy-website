import { mkdir, cp, writeFile, rm } from 'node:fs/promises';
import { render } from '../lib/render.mjs';
import { batches } from '../config/content.mjs';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
await cp('public','dist',{recursive:true,filter:source=>!['motion.css','editorial.css','hero-three.js','studio-architecture.svg','animations.css','editing-studio.webp','editing-studio-800.webp','cinema-camera.webp'].includes(source.split('/').at(-1))});
const staticHtml=html=>html.replaceAll(/href="\/enroll\?batch=([a-z]+)"/g,'href="/enroll/$1/"');
const routes=['/','/batches','/about','/login','/signup','/profile','/enroll','/contact','/privacy','/terms','/refunds'];
for(const route of routes){const dir=route==='/'?'dist':`dist${route}`;await mkdir(dir,{recursive:true});await writeFile(`${dir}/index.html`,staticHtml(render(route)));}
for(const batch of batches){const dir=`dist/enroll/${batch.id}`;await mkdir(dir,{recursive:true});await writeFile(`${dir}/index.html`,staticHtml(render('/enroll',{batchId:batch.id})));}
await mkdir('dist/dashboard',{recursive:true});
await writeFile('dist/dashboard/index.html',render('/login'));
await writeFile('dist/404.html',render('/404'));
console.log('Review site built in dist/. Deploy with netlify/functions for Google sign-in and saved profiles. Razorpay payments remain disabled.');
