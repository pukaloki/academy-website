import { realpath, open } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { HttpError } from './backend.mjs';
const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function byteRange(header, size) {
 if (!header) return null;
 const match = /^bytes=(\d*)-(\d*)$/.exec(header);
 if (!match || (!match[1] && !match[2])) throw new HttpError(416,'Invalid byte range.');
 let start, end;
 if (!match[1]) { const length=Number(match[2]); if(!Number.isSafeInteger(length)||length<=0)throw new HttpError(416,'Invalid byte range.');start=Math.max(0,size-length);end=size-1; }
 else { start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),size-1):size-1; }
 if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=size||end<start)throw new HttpError(416,'Invalid byte range.');
 return {start,end};
}
export function createRecordings({backend, lessons=[], root, publicRoot}) {
 const ids=new Set();
 for(const lesson of lessons){
  if(!/^[a-z0-9-]+$/.test(lesson.id)||ids.has(lesson.id)||!lesson.batchId||!lesson.title||!lesson.file||extname(lesson.file)!=='.mp4')throw Error('Invalid recorded lesson configuration.');
  ids.add(lesson.id);
 }
 const allowed=(user,lesson)=>Boolean(user&&lesson.published&&backend.enrollmentsFor(user).some(e=>e.id===lesson.batchId));
 // enrollmentsFor merges the configured batch ID into each stored paid enrollment.
 async function handle(req,res,path){
  if(path!=='/recorded-classes'&&!path.startsWith('/private-recordings/'))return false;
  res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Robots-Tag','noindex, nofollow');
  if(!['GET','HEAD'].includes(req.method))throw new HttpError(405,'Method not allowed.');
  if(req.headers['sec-fetch-site']==='cross-site')throw new HttpError(403,'Cross-site playback is not allowed.');
  const user=backend.userFor(req);
  if(!user){if(path==='/recorded-classes'){res.writeHead(302,{Location:'/login'});res.end();return true;}throw new HttpError(401,'Please sign in.');}
  const available=lessons.filter(l=>allowed(user,l));
  if(path==='/recorded-classes'){
   const cards=available.map(l=>`<article class="lesson"><h2>${escape(l.title)}</h2><div class="recording-player"><video controls controlslist="nodownload noremoteplayback" disablepictureinpicture disableremoteplayback playsinline preload="none" src="/private-recordings/${escape(l.id)}" aria-label="${escape(l.title)}"></video><span class="student-watermark">${escape(user.email)} · Student ${escape(user.id)}</span></div></article>`).join('');
   const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Recorded classes | The Shortcut Academy</title><link rel="stylesheet" href="/assets/recordings.css"></head><body><main><a href="/dashboard">← Student dashboard</a><p class="eyebrow">YOUR LEARNING LIBRARY</p><h1>Recorded classes</h1><p>Replay your lessons and practise at your own pace.</p>${cards||'<section class="lesson"><h2>No recordings available yet</h2><p>Published recordings for your enrolled course will appear here.</p></section>'}</main></body></html>`;
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(req.method==='HEAD'?undefined:html);return true;
  }
  const id=path.slice('/private-recordings/'.length);
  const lesson=lessons.find(l=>l.id===id);
  if(!lesson||!allowed(user,lesson))throw new HttpError(403,'Recording access is not available.');
  if(!root)throw new HttpError(503,'Recordings are not configured yet.');
  let base,file,handle;
  try{
   base=await realpath(root);file=await realpath(resolve(base,lesson.file));
   const publicBase=await realpath(publicRoot);
   if(base===publicBase||base.startsWith(publicBase+sep)||file===publicBase||file.startsWith(publicBase+sep)||!file.startsWith(base+sep))throw new HttpError(403,'Invalid private media path.');
   handle=await open(file,'r');
  }catch(error){if(error.status)throw error;throw new HttpError(404,'Recording file is unavailable.');}
  try{
   const info=await handle.stat();if(!info.isFile()||!info.size)throw new HttpError(404,'Recording file is unavailable.');
   let range;
   try{range=byteRange(req.headers.range,info.size);}catch(error){res.setHeader('Content-Range',`bytes */${info.size}`);throw error;}
   const start=range?.start??0,end=range?.end??info.size-1;
   res.setHeader('Content-Type','video/mp4');res.setHeader('Accept-Ranges','bytes');res.setHeader('Content-Length',end-start+1);
   res.setHeader('Content-Disposition','inline');res.setHeader('Cross-Origin-Resource-Policy','same-origin');
   if(range)res.setHeader('Content-Range',`bytes ${start}-${end}/${info.size}`);
   res.writeHead(range?206:200);
   if(req.method==='HEAD'){await handle.close();res.end();return true;}
   const stream=handle.createReadStream({start,end,highWaterMark:65536});
   // Recheck active transfers after logout or removal of a paid enrollment.
   const check=setInterval(()=>{try{const current=backend.userFor(req);if(allowed(current,lesson))return;}catch{}stream.destroy();res.destroy();},10000);check.unref();
   res.once('close',()=>{clearInterval(check);stream.destroy();});
   stream.on('error',()=>res.destroy());stream.pipe(res);return true;
  }catch(error){await handle.close();throw error;}
 }
 return {handle};
}
