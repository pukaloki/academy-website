import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, esc } from './lib/render.mjs';
import { createBackend, HttpError } from './lib/backend.mjs';
const root=fileURLToPath(new URL('./public/',import.meta.url));
const routes=new Set(['/','/batches','/about','/login','/signup','/profile','/dashboard','/enroll','/contact','/privacy','/terms','/refunds']);
export function createApp(options={}){
 const env=options.env||process.env;
 if(env.NODE_ENV==='production'&&(!env.APP_ORIGIN?.startsWith('https://')||!env.AUTH_SECRET||env.AUTH_SECRET.length<32))throw Error('Production requires an HTTPS APP_ORIGIN and an AUTH_SECRET of at least 32 characters.');
 const backend=createBackend(options);
 const origin=env.APP_ORIGIN||`http://localhost:${env.PORT||3000}`;
 const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
 const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');res.setHeader('Cross-Origin-Opener-Policy','same-origin-allow-popups');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' https://checkout.razorpay.com https://accounts.google.com/gsi/client; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; img-src 'self' data: https://*.razorpay.com; font-src 'self'; connect-src 'self' https://*.razorpay.com https://accounts.google.com/gsi/; frame-src https://*.razorpay.com https://accounts.google.com/gsi/; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'");
  if(env.NODE_ENV==='production')res.setHeader('Strict-Transport-Security','max-age=31536000; includeSubDomains');
  try{
   const url=new URL(req.url,origin),path=url.pathname.replace(/\/$/,'')||'/';
   if(path.startsWith('/api/')){
    res.setHeader('Cache-Control','no-store');
    if(req.method==='POST'&&path!=='/api/webhooks/razorpay'&&!(req.headers.origin===origin||(env.NODE_ENV!=='production'&&[`http://127.0.0.1:${env.PORT||3000}`,`http://localhost:${env.PORT||3000}`].includes(req.headers.origin))))throw new HttpError(403,'Request origin is not allowed.');
    let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>65536)throw new HttpError(413,'Request is too large.');}
    let data={};if(raw){try{data=JSON.parse(raw);}catch{throw new HttpError(400,'Invalid request body.');}}
    if(!data||typeof data!=='object'||Array.isArray(data))throw new HttpError(400,'Invalid request body.');
    const result=await backend.handle(req,path,data,raw);if(result.cookie)res.setHeader('Set-Cookie',result.cookie);json(res,200,result.data);return;
   }
   if(!['GET','HEAD'].includes(req.method))throw new HttpError(405,'Method not allowed.');
   if(path==='/health'){json(res,200,{ok:true});return;}
   const publicOrigin=/^https:\/\/[^/]+$/.test(env.PUBLIC_ORIGIN||'')?env.PUBLIC_ORIGIN:'';
   if(path==='/sitemap.xml'){
    if(!publicOrigin)throw new HttpError(404,'Sitemap becomes available when PUBLIC_ORIGIN is configured.');
    res.writeHead(200,{'Content-Type':'application/xml; charset=utf-8'});
    res.end(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/batches','/about','/contact'].map(p=>`<url><loc>${esc(publicOrigin+p)}</loc></url>`).join('')}</urlset>`);return;
   }
   if(path==='/robots.txt'){res.writeHead(200,{'Content-Type':'text/plain'});res.end(publicOrigin?`User-agent: *\nDisallow: /dashboard\nDisallow: /enroll\nDisallow: /login\nDisallow: /signup\nDisallow: /api/\nSitemap: ${publicOrigin}/sitemap.xml\n`:'User-agent: *\nDisallow: /\n');return;}
   if(path==='/favicon.ico'){res.writeHead(302,{Location:'/assets/shortcut-logo.jpg'});res.end();return;}
   if(path.startsWith('/assets/')||['/app.js','/styles.css','/fonts.css','/motion.js','/motion.css','/editorial.css'].includes(path)){
    const target=resolve(root,'.'+decodeURIComponent(path));if(!target.startsWith(root.endsWith(sep)?root:root+sep))throw new HttpError(403,'Forbidden.');
    let info;try{info=await stat(target);}catch{throw new HttpError(404,'Asset not found.');}if(!info.isFile())throw new HttpError(404,'Asset not found.');
    const types={'.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.ttf':'font/ttf','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'};
    res.writeHead(200,{'Content-Type':types[extname(target)]||'application/octet-stream','Cache-Control':env.NODE_ENV==='production'?'public, max-age=3600':'no-store'});res.end(req.method==='HEAD'?undefined:await readFile(target));return;
   }
   const user=backend.userFor(req);
   if(path==='/dashboard'&&!user){res.writeHead(302,{Location:'/login','Cache-Control':'no-store'});res.end();return;}
   if((path==='/login'||path==='/signup')&&user){res.writeHead(302,{Location:user.phone?'/enroll':'/profile','Cache-Control':'no-store'});res.end();return;}
   res.writeHead(routes.has(path)?200:404,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
   res.end(req.method==='HEAD'?undefined:render(path,{publicOrigin,emailReady:backend.emailReady,batches:backend.publicBatches(),batchId:url.searchParams.get('batch'),user,enrollments:user?backend.enrollmentsFor(user):[]}));
  }catch(error){if(!res.headersSent)json(res,error.status||500,{error:error.status?error.message:'The service is temporarily unavailable. Please try again.'});else res.end();if(!error.status)console.error('Request failed:',error.message);}
 });
 server.requestTimeout=30000;server.headersTimeout=15000;
 const timer=setInterval(()=>backend.flushMail().catch(()=>{}),15000);timer.unref();
 server.on('close',()=>{clearInterval(timer);backend.close();});
 return {server,backend};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const {server}=createApp();const port=Number(process.env.PORT||3000),host=process.env.HOST||'127.0.0.1';server.listen(port,host,()=>console.log(`Academy ready at http://${host}:${port}`));
}
