import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomInt, createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { site as defaultSite, batches as defaultBatches } from '../config/content.mjs';
import { verifyGoogle, normalizePhone, cookieValue, authCookie, randomToken } from './google-auth.mjs';
export class HttpError extends Error { constructor(status,message){super(message);this.status=status;} }
const hash=value=>createHash('sha256').update(value).digest('hex');
export const safeEqual=(a,b)=>{if(typeof a!=='string'||typeof b!=='string')return false;const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);};
const validEmail=email=>typeof email==='string'&&email.length<=254&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const httpsUrl=value=>{try{return new URL(value).protocol==='https:';}catch{return false;}};
export function createBackend({env=process.env,fetcher=fetch,googleVerifier=verifyGoogle,databasePath=env.DATABASE_PATH||'./data/academy.sqlite',site=defaultSite,batches=defaultBatches}={}){
 if(databasePath!==':memory:')mkdirSync(dirname(databasePath),{recursive:true,mode:0o700});
 const db=new DatabaseSync(databasePath);
 db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
 CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,created_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS challenges(email TEXT PRIMARY KEY,name TEXT NOT NULL,code_hash TEXT NOT NULL,expires_at INTEGER NOT NULL,attempts INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS rate_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires_at INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),batch_id TEXT NOT NULL,amount INTEGER NOT NULL,currency TEXT NOT NULL,status TEXT NOT NULL,created_at INTEGER NOT NULL,expires_at INTEGER NOT NULL,payment_id TEXT UNIQUE);
 CREATE TABLE IF NOT EXISTS enrollments(id INTEGER PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id),batch_id TEXT NOT NULL,order_id TEXT UNIQUE NOT NULL,payment_id TEXT UNIQUE NOT NULL,amount INTEGER NOT NULL,created_at INTEGER NOT NULL,UNIQUE(user_id,batch_id));
 CREATE TABLE IF NOT EXISTS mail_jobs(id TEXT PRIMARY KEY,recipient TEXT NOT NULL,subject TEXT NOT NULL,body TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,next_at INTEGER NOT NULL,sent_at INTEGER);
 `);
 const columns=db.prepare('PRAGMA table_info(users)').all().map(c=>c.name);
 if(!columns.includes('phone'))db.exec("ALTER TABLE users ADD COLUMN phone TEXT NOT NULL DEFAULT ''");
 if(!columns.includes('google_sub'))db.exec('ALTER TABLE users ADD COLUMN google_sub TEXT');
 db.exec('CREATE UNIQUE INDEX IF NOT EXISTS users_google_sub ON users(google_sub)');
 const googleReady=Boolean(env.GOOGLE_CLIENT_ID&&env.AUTH_SECRET?.length>=32);
 const emailReady=Boolean(env.RESEND_API_KEY&&env.EMAIL_FROM&&env.AUTH_SECRET?.length>=32);
 const gatewayReady=Boolean(env.RAZORPAY_KEY_ID&&env.RAZORPAY_KEY_SECRET&&env.RAZORPAY_WEBHOOK_SECRET);
 const paymentReady=Boolean(gatewayReady&&validEmail(env.ADMIN_EMAIL)&&env.LEGAL_APPROVED==='true'&&!site.name.includes('['));
 const secret=env.AUTH_SECRET||randomBytes(32).toString('hex');
 const digest=value=>createHmac('sha256',secret).update(value).digest('hex');
 const now=()=>Date.now();
 function rate(key,max,windowMs){const t=now();db.prepare('DELETE FROM rate_limits WHERE expires_at < ?').run(t);const item=db.prepare('SELECT * FROM rate_limits WHERE key=?').get(key);if(item&&item.count>=max)throw new HttpError(429,'Too many attempts. Please wait before trying again.');db.prepare('INSERT INTO rate_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key,t+windowMs);}
 async function sendEmail(to,subject,text,key){const response=await fetcher('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${env.RESEND_API_KEY}`,'Content-Type':'application/json',...(key?{'Idempotency-Key':key}:{})},body:JSON.stringify({from:env.EMAIL_FROM,to:[to],subject,text}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw new HttpError(503,'Email delivery is unavailable. Please try again later.');}
 function cookie(token,clear=false){return `academy_session=${clear?'':token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${clear?0:604800}${env.NODE_ENV==='production'?'; Secure':''}`;}
 function userFor(req){const match=/(?:^|;\s*)academy_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie||'');if(!match)return null;return db.prepare('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at>?').get(hash(match[1]),now())||null;}
 function requireUser(req){const user=userFor(req);if(!user)throw new HttpError(401,'Please verify your email before continuing.');return user;}
 const paidCount=id=>Number(db.prepare('SELECT COUNT(*) as n FROM enrollments WHERE batch_id=?').get(id).n);
 function publicBatches(){return batches.map(b=>{const {whatsappUrl,...safe}=b;return {...safe,seats:b.published?`${Math.max(0,b.capacity-paidCount(b.id))} seats available`:b.seats};});}
 function validBatch(b){return b&&b.published&&Number.isSafeInteger(b.amountPaise)&&b.amountPaise>0&&Number.isInteger(b.capacity)&&b.capacity>0&&(Date.parse(b.startsAt)>now()||(b.advanceEnrollment===true&&b.startsAt===null))&&['name','days','time','start','duration','price'].every(k=>typeof b[k]==='string'&&b[k].length>0&&!/[\[\]]/.test(b[k]));}
 function queue(id,recipient,subject,body){db.prepare('INSERT OR IGNORE INTO mail_jobs(id,recipient,subject,body,next_at) VALUES(?,?,?,?,?)').run(id,recipient,subject,body,now());}
 let flushing=false;
 async function flushMail(){if(flushing||!emailReady)return;flushing=true;try{const jobs=db.prepare('SELECT * FROM mail_jobs WHERE sent_at IS NULL AND attempts<24 AND next_at<=? LIMIT 10').all(now());for(const job of jobs){try{await sendEmail(job.recipient,job.subject,job.body,job.id);db.prepare('UPDATE mail_jobs SET sent_at=? WHERE id=?').run(now(),job.id);}catch{db.prepare('UPDATE mail_jobs SET attempts=attempts+1,next_at=? WHERE id=?').run(now()+Math.min(3600000,60000*2**Math.min(job.attempts,6)),job.id);}}}finally{flushing=false;}}
 async function gateway(path,body){const response=await fetcher(`https://api.razorpay.com/v1/${path}`,{method:body?'POST':'GET',headers:{Authorization:`Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(15000)});if(!response.ok)throw new HttpError(502,'The payment provider is unavailable. Please try again later.');return response.json();}
 function confirm(payment){
  const order=db.prepare('SELECT * FROM orders WHERE id=?').get(payment.order_id);
  if(!order)throw new HttpError(404,'Payment order not found.');
  if(payment.status!=='captured'||payment.amount!==order.amount||payment.currency!==order.currency||!/^pay_[A-Za-z0-9]+$/.test(payment.id||'')||(payment.amount_refunded||0)!==0)throw new HttpError(409,'Payment is not confirmed. Check your dashboard later or contact support with your payment reference.');
  if(order.status==='paid')return {confirmed:true};
  if(order.status==='review')throw new HttpError(409,'Your payment needs a manual review. The team has been notified; no seat is confirmed.');
  const batch=batches.find(b=>b.id===order.batch_id),user=db.prepare('SELECT * FROM users WHERE id=?').get(order.user_id),time=now();
  db.exec('BEGIN IMMEDIATE');
  try{
   const existing=db.prepare('SELECT id FROM enrollments WHERE user_id=? AND batch_id=?').get(user.id,batch.id);
   if(existing||paidCount(batch.id)>=batch.capacity){db.prepare('UPDATE orders SET status=?,payment_id=? WHERE id=?').run('review',payment.id,order.id);queue(`review-${order.id}`,env.ADMIN_EMAIL,'Payment requires enrollment review',`A captured payment requires review before any access is granted.\nStudent: ${user.name} (${user.email})\nBatch: ${batch.name}\nAmount: INR ${(order.amount/100).toFixed(2)}\nPayment: ${payment.id}\nReason: duplicate enrollment or capacity reached. Process a refund or contact the student.\nTimestamp: ${new Date(time).toISOString()}`);db.exec('COMMIT');throw new HttpError(409,'Your payment needs a manual review. The team has been notified; no seat is confirmed.');}
   db.prepare('INSERT INTO enrollments(user_id,batch_id,order_id,payment_id,amount,created_at) VALUES(?,?,?,?,?,?)').run(user.id,batch.id,order.id,payment.id,order.amount,time);
   db.prepare('UPDATE orders SET status=?,payment_id=? WHERE id=?').run('paid',payment.id,order.id);
   queue(`student-${order.id}`,user.email,`Enrollment confirmed: ${batch.name}`,`Hello ${user.name},\n\nYour enrollment is confirmed.\nBatch: ${batch.name}\nStarts: ${batch.start}\nSchedule: ${batch.days}, ${batch.time}, ${batch.timezone}\nDuration: ${batch.duration}\nBatch WhatsApp: ${batch.whatsappUrl||'Will appear in your dashboard when announced'}\nCommunity: ${site.communityUrl||'Will appear in your dashboard when announced'}\nStudent dashboard: ${env.APP_ORIGIN}/dashboard\nPayment: ${payment.id}\nAmount: INR ${(order.amount/100).toFixed(2)}\n\n${site.name}`);
   queue(`admin-${order.id}`,env.ADMIN_EMAIL,`PAID - ${batch.name}`,`Payment status: PAID (verified captured payment)\nStudent: ${user.name}\nEmail: ${user.email}\nPhone: ${user.phone||'Not provided'}\nBatch: ${batch.name}\nAmount: INR ${(order.amount/100).toFixed(2)}\nPayment: ${payment.id}\nTimestamp: ${new Date(time).toISOString()}`);
   db.exec('COMMIT');
  }catch(error){if(db.isTransaction)db.exec('ROLLBACK');throw error;}
  return {confirmed:true};
 }
 const enrollmentsFor=user=>db.prepare('SELECT * FROM enrollments WHERE user_id=? ORDER BY created_at DESC').all(user.id).map(e=>({...batches.find(b=>b.id===e.batch_id),paymentId:e.payment_id}));
 async function handle(req,path,data,raw){
  const address=env.TRUST_PROXY==='true'?String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',').at(-1).trim():(req.socket?.remoteAddress||'unknown');
  const ip=digest(address);
  if(path==='/api/auth/config'&&req.method==='GET'){const nonce=randomToken();return {data:{clientId:googleReady?env.GOOGLE_CLIENT_ID:'',nonce,paymentReady:paymentReady&&batches.some(validBatch)},cookie:authCookie('google_nonce',nonce,{production:env.NODE_ENV==='production'})};}
  if(path==='/api/me'&&req.method==='GET'){const user=requireUser(req);return {data:{name:user.name,email:user.email,phone:user.phone}};}
  if(req.method!=='POST')throw new HttpError(405,'Method not allowed.');
  if(path==='/api/auth/google'){
   if(!googleReady)throw new HttpError(503,'Google sign-in is not configured yet.');
   rate(`google:${ip}`,20,900000);
   const nonce=cookieValue(req.headers.cookie,'google_nonce');if(!/^[a-f0-9]{64}$/.test(nonce))throw new HttpError(400,'Refresh the sign-in page and try again.');
   let identity;try{identity=await googleVerifier(data.credential,env.GOOGLE_CLIENT_ID,nonce);}catch{throw new HttpError(401,'Google sign-in could not be verified. Please try again.');}
   if(!validEmail(identity.email)||!identity.sub)throw new HttpError(401,'A verified Google email is required.');
   let user=db.prepare('SELECT * FROM users WHERE google_sub=?').get(identity.sub);
   let isNewUser=false;
   if(!user){const existing=db.prepare('SELECT * FROM users WHERE email=?').get(identity.email);if(existing)throw new HttpError(409,'An account with this email already exists. Contact the academy to link Google sign-in.');db.prepare('INSERT INTO users(email,name,google_sub,created_at) VALUES(?,?,?,?)').run(identity.email,identity.name,identity.sub,now());user=db.prepare('SELECT * FROM users WHERE google_sub=?').get(identity.sub);isNewUser=true;}
   const token=randomToken();db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(hash(token),user.id,now()+604800000);
   if(isNewUser&&validEmail(env.ADMIN_EMAIL)){queue(`signup-${user.id}`,env.ADMIN_EMAIL,`New student signup: ${identity.name}`,`A new student has signed up.\n\nName: ${identity.name}\nEmail: ${identity.email}\nSign-in method: Google\nTimestamp: ${new Date(now()).toISOString()}\n\n${site.name}`);}
   return {data:{verified:true,profileComplete:Boolean(user.phone),enrolled:Boolean(db.prepare('SELECT id FROM enrollments WHERE user_id=?').get(user.id))},cookie:[cookie(token),authCookie('google_nonce','',{production:env.NODE_ENV==='production',age:0})]};
  }
  if(path==='/api/profile'){
   const user=requireUser(req);rate(`profile:${user.id}`,20,900000);const name=String(data.name||'').trim();if(!name||name.length>100||/[\r\n]/.test(name))throw new HttpError(400,'Enter your full name.');let phone;try{phone=normalizePhone(data.phone);}catch(error){throw new HttpError(400,error.message);}db.prepare('UPDATE users SET name=?,phone=? WHERE id=?').run(name,phone,user.id);
   if(validEmail(env.ADMIN_EMAIL)&&!db.prepare('SELECT id FROM enrollments WHERE user_id=?').get(user.id)){queue(`profile-${user.id}`,env.ADMIN_EMAIL,`NOT PAID - student details: ${name}`,`Status at submission: NOT PAID. Details submitted only; payment not implied.\n\nName: ${name}\nEmail: ${user.email}\nPhone: ${phone}\nTimestamp: ${new Date(now()).toISOString()}\n\n${site.name}`);}
   return {data:{saved:true}};
  }
  if(path==='/api/auth/request'){
   if(!emailReady)throw new HttpError(503,'Email sign-in is not available yet. No verification code has been sent.');
   const email=typeof data.email==='string'?data.email.trim().toLowerCase():'',name=typeof data.name==='string'?data.name.trim():'';
   if(!validEmail(email)||!name||name.length>100||/[\r\n]/.test(name))throw new HttpError(400,'Enter a valid name and email address.');
   rate(`login-ip:${ip}`,10,900000);rate(`login-email:${digest(email)}`,3,900000);
   const code=String(randomInt(100000,1000000));
   db.prepare('INSERT INTO challenges(email,name,code_hash,expires_at,attempts) VALUES(?,?,?,?,0) ON CONFLICT(email) DO UPDATE SET name=excluded.name,code_hash=excluded.code_hash,expires_at=excluded.expires_at,attempts=0').run(email,name,digest(`${email}:${code}`),now()+600000);
   try{await sendEmail(email,`Your ${site.name} sign-in code`,`Your verification code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`);}catch(error){db.prepare('DELETE FROM challenges WHERE email=? AND code_hash=?').run(email,digest(`${email}:${code}`));throw error;}
   return {data:{sent:true}};
  }
  if(path==='/api/auth/verify'){
   if(!emailReady)throw new HttpError(503,'Email sign-in is not available yet.');
   rate(`verify:${ip}`,25,900000);
   const email=typeof data.email==='string'?data.email.trim().toLowerCase():'',code=String(data.code||'');
   const challenge=db.prepare('SELECT * FROM challenges WHERE email=?').get(email);
   if(!challenge||challenge.expires_at<now()||challenge.attempts>=5)throw new HttpError(400,'This code is invalid or expired. Request a new code.');
   db.prepare('UPDATE challenges SET attempts=attempts+1 WHERE email=?').run(email);
   if(!/^\d{6}$/.test(code)||!safeEqual(challenge.code_hash,digest(`${email}:${code}`)))throw new HttpError(400,'This code is invalid or expired. Request a new code.');
   db.exec('BEGIN IMMEDIATE');
   let token;
   try{db.prepare('INSERT INTO users(email,name,created_at) VALUES(?,?,?) ON CONFLICT(email) DO NOTHING').run(email,challenge.name,now());const user=db.prepare('SELECT * FROM users WHERE email=?').get(email);db.prepare('DELETE FROM challenges WHERE email=?').run(email);db.prepare('DELETE FROM sessions WHERE expires_at<?').run(now());token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(hash(token),user.id,now()+604800000);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
   return {data:{verified:true},cookie:cookie(token)};
  }
  if(path==='/api/auth/logout'){const match=/academy_session=([a-f0-9]{64})/.exec(req.headers.cookie||'');if(match)db.prepare('DELETE FROM sessions WHERE token_hash=?').run(hash(match[1]));return {data:{loggedOut:true},cookie:cookie('',true)};}
  if(path==='/api/checkout'){
   const user=requireUser(req);rate(`checkout:${user.id}`,8,900000);
   if(!paymentReady)throw new HttpError(503,'Checkout is temporarily unavailable. Please contact the academy.');
   const batch=batches.find(b=>b.id===data.batchId);
   if(!validBatch(batch))throw new HttpError(409,'This batch is not open for enrollment.');
   if(db.prepare('SELECT id FROM enrollments WHERE user_id=? AND batch_id=?').get(user.id,batch.id))throw new HttpError(409,'You are already enrolled in this batch. Visit your dashboard.');
   if(db.prepare("SELECT id FROM orders WHERE user_id=? AND batch_id=? AND status='creating' AND expires_at>?").get(user.id,batch.id,now()))throw new HttpError(409,'A checkout is already being prepared. Please wait and try again.');
   const previous=db.prepare("SELECT * FROM orders WHERE user_id=? AND batch_id=? AND status='pending' AND expires_at>?").get(user.id,batch.id,now());
   if(previous)return {data:{id:previous.id,amount:previous.amount,currency:'INR',keyId:env.RAZORPAY_KEY_ID,businessName:site.name,batchName:batch.name,prefill:{name:user.name,email:user.email,contact:user.phone||''}}};
   // Reserve capacity synchronously before the outbound call, preventing races.
   const localId=`reservation_${randomBytes(12).toString('hex')}`,time=now();
   db.exec('BEGIN IMMEDIATE');
   try{const held=Number(db.prepare("SELECT COUNT(*) as n FROM orders WHERE batch_id=? AND status IN ('pending','creating') AND expires_at>?").get(batch.id,time).n);if(paidCount(batch.id)+held>=batch.capacity)throw new HttpError(409,'This batch is full or its remaining seats are in checkout. Please try another batch.');db.prepare('INSERT INTO orders(id,user_id,batch_id,amount,currency,status,created_at,expires_at) VALUES(?,?,?,?,?,?,?,?)').run(localId,user.id,batch.id,batch.amountPaise,'INR','creating',time,time+1800000);db.exec('COMMIT');}catch(error){db.exec('ROLLBACK');throw error;}
   try{const order=await gateway('orders',{amount:batch.amountPaise,currency:'INR',receipt:localId,notes:{batch:batch.id}});if(!/^order_[A-Za-z0-9]+$/.test(order.id||''))throw Error('Invalid provider order');db.prepare('UPDATE orders SET id=?,status=? WHERE id=?').run(order.id,'pending',localId);return {data:{id:order.id,amount:batch.amountPaise,currency:'INR',keyId:env.RAZORPAY_KEY_ID,businessName:site.name,batchName:batch.name,prefill:{name:user.name,email:user.email,contact:user.phone||''}}};}catch(error){db.prepare('DELETE FROM orders WHERE id=?').run(localId);throw error;}
  }
  if(path==='/api/payments/verify'){
   const user=requireUser(req);rate(`payment:${user.id}`,20,900000);
   if(!gatewayReady)throw new HttpError(503,'Payment verification is not configured.');
   if(!/^order_[A-Za-z0-9]+$/.test(data.razorpay_order_id||'')||!/^pay_[A-Za-z0-9]+$/.test(data.razorpay_payment_id||''))throw new HttpError(400,'Invalid payment reference.');
   const order=db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(data.razorpay_order_id,user.id);
   if(!order)throw new HttpError(404,'Payment order not found.');
   const signature=createHmac('sha256',env.RAZORPAY_KEY_SECRET).update(`${order.id}|${data.razorpay_payment_id}`).digest('hex');
   if(!safeEqual(signature,data.razorpay_signature))throw new HttpError(400,'Payment verification failed. No enrollment has been confirmed.');
   const payment=await gateway(`payments/${data.razorpay_payment_id}`);
   if(payment.order_id!==order.id)throw new HttpError(400,'Payment order mismatch.');
   return {data:confirm(payment)};
  }
  if(path==='/api/webhooks/razorpay'){
   if(!gatewayReady)throw new HttpError(503,'Payment processing is not configured.');
   const signature=createHmac('sha256',env.RAZORPAY_WEBHOOK_SECRET).update(raw).digest('hex');
   if(!safeEqual(signature,req.headers['x-razorpay-signature']))throw new HttpError(400,'Invalid webhook signature.');
   if(data.event==='payment.captured'||data.event==='order.paid'){
    const payment=data.payload?.payment?.entity;
    if(!payment)throw new HttpError(400,'Missing payment entity.');
    // Other merchant integrations may share this Razorpay account.
    if(!db.prepare('SELECT id FROM orders WHERE id=?').get(payment.order_id))return {data:{received:true}};
    try{confirm(payment);}catch(error){if(error.status!==409)throw error;}
   }
   return {data:{received:true}};
  }
  throw new HttpError(404,'Endpoint not found.');
 }
 return {db,emailReady,googleReady,paymentReady,userFor,publicBatches,enrollmentsFor,handle,flushMail,close:()=>db.close()};
}
