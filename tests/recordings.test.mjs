import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRecordings,byteRange} from '../lib/recordings.mjs';
test('recording ranges support seeking and reject malformed or unsatisfiable requests',()=>{
 assert.deepEqual(byteRange('bytes=2-5',10),{start:2,end:5});
 assert.deepEqual(byteRange('bytes=-3',10),{start:7,end:9});
 assert.deepEqual(byteRange('bytes=8-999',10),{start:8,end:9});
 for(const value of ['bytes=10-','bytes=3-2','bytes=-0','bytes=0-1,4-5','x=0-1','bytes=-'])assert.throws(()=>byteRange(value,10),e=>e.status===416);
});
test('private recordings enforce login, paid course, publication, path containment and revocation',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'academy-recordings-'));await mkdir(join(dir,'private'));await mkdir(join(dir,'public'));
 await writeFile(join(dir,'private','lesson.mp4'),'0123456789');await writeFile(join(dir,'public','public.mp4'),'public-data');await symlink(join(dir,'public','public.mp4'),join(dir,'private','escape.mp4'));
 let enrolled=true,session=true;
 const backend={userFor:req=>session&&req.headers.cookie==='session=paid'?{id:7,email:'student@example.test'}:req.headers.cookie==='session=unpaid'?{id:8,email:'unpaid@example.test'}:null,enrollmentsFor:user=>user.id===7&&enrolled?[{id:'batch-a'}]:[]};
 const lessons=[{id:'intro',title:'Intro',batchId:'batch-a',file:'lesson.mp4',published:true},{id:'draft',title:'Draft',batchId:'batch-a',file:'lesson.mp4',published:false},{id:'other',title:'Other',batchId:'batch-b',file:'lesson.mp4',published:true},{id:'escape',title:'Escape',batchId:'batch-a',file:'escape.mp4',published:true}];
 const service=createRecordings({backend,lessons,root:join(dir,'private'),publicRoot:join(dir,'public')});
 const server=http.createServer(async(req,res)=>{try{if(!await service.handle(req,res,new URL(req.url,'http://local').pathname)){res.statusCode=404;res.end();}}catch(e){res.statusCode=e.status||500;res.end(e.message);}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 const request=(path,headers={},method='GET')=>fetch(base+path,{headers,method,redirect:'manual'});
 try{
  assert.equal((await request('/recorded-classes')).status,302);
  assert.equal((await request('/private-recordings/intro')).status,401);
  assert.equal((await request('/private-recordings/intro',{cookie:'session=unpaid'})).status,403);
  const auth={cookie:'session=paid'};
  for(const id of ['draft','other','escape','unknown'])assert.equal((await request('/private-recordings/'+id,auth)).status,403);
  const part=await request('/private-recordings/intro',{...auth,range:'bytes=2-5'});assert.equal(part.status,206);assert.equal(await part.text(),'2345');assert.equal(part.headers.get('cache-control'),'private, no-store');
  const head=await request('/private-recordings/intro',auth,'HEAD');assert.equal(head.status,200);assert.equal(head.headers.get('content-length'),'10');assert.equal(await head.text(),'');
  const invalid=await request('/private-recordings/intro',{...auth,range:'bytes=99-'});assert.equal(invalid.status,416);assert.equal(invalid.headers.get('content-range'),'bytes */10');
  assert.equal((await request('/private-recordings/intro',{...auth,'sec-fetch-site':'cross-site'})).status,403);
  const page=await (await request('/recorded-classes',auth)).text();assert.match(page,/student@example.test/);assert.doesNotMatch(page,/>Draft</);
  enrolled=false;assert.equal((await request('/private-recordings/intro',auth)).status,403);
  session=false;assert.equal((await request('/private-recordings/intro',auth)).status,401);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
});

test('recorded classes integrate with real academy session and paid enrollment records',async()=>{
 const {createApp}=await import('../server.mjs');const {createHash}=await import('node:crypto');
 const app=createApp({env:{},databasePath:':memory:',batches:[{id:'paid-course',name:'Course'}],recordings:[{id:'lesson',title:'Paid lesson',batchId:'paid-course',file:'lesson.mp4',published:true}]});
 const db=app.backend.db,token='a'.repeat(64),now=Date.now();
 db.prepare('INSERT INTO users(id,email,name,created_at) VALUES(1,?,?,?)').run('test@example.test','Test Student',now);
 db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,1,?)').run(createHash('sha256').update(token).digest('hex'),now+60000);
 await new Promise(r=>app.server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${app.server.address().port}/recorded-classes`,headers={cookie:`academy_session=${token}`};
 try{
  assert.doesNotMatch(await(await fetch(url,{headers})).text(),/src="\/private-recordings\/lesson"/);
  db.prepare('INSERT INTO enrollments(user_id,batch_id,order_id,payment_id,amount,created_at) VALUES(1,?,?,?,?,?)').run('paid-course','fixture-order','fixture-payment',299900,now);
  assert.match(await(await fetch(url,{headers})).text(),/src="\/private-recordings\/lesson"/);
 }finally{app.server.closeAllConnections();await new Promise(r=>app.server.close(r));}
});
