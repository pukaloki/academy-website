import { OAuth2Client } from 'google-auth-library';
import { randomBytes, createHash } from 'node:crypto';
const client=new OAuth2Client();
export const tokenHash=t=>createHash('sha256').update(t).digest('hex');
export const randomToken=()=>randomBytes(32).toString('hex');
export const cookieValue=(header,name)=>String(header||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(name+'='))?.slice(name.length+1)||'';
export const authCookie=(name,value,{production=false,age=600}={})=>`${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${production?'; Secure':''}`;
export async function verifyGoogle(credential,audience,nonce){
 if(typeof credential!=='string'||credential.length>10000||!audience||!nonce)throw Error('Invalid Google sign-in.');
 const ticket=await client.verifyIdToken({idToken:credential,audience});
 const p=ticket.getPayload();
 if(!p?.sub||!p.email_verified||!p.email||p.nonce!==nonce)throw Error('Google identity could not be verified.');
 return {sub:p.sub,email:p.email.toLowerCase(),name:(p.name||p.email.split('@')[0]).slice(0,100)};
}
export function normalizePhone(value){
 let phone=String(value||'').replace(/[\s()-]/g,'');
 if(/^[6-9]\d{9}$/.test(phone))phone='+91'+phone;
 if(!/^\+[1-9]\d{7,14}$/.test(phone))throw Error('Enter a valid phone number with country code, such as +91 98765 43210.');
 return phone;
}
