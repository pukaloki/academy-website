'use strict';
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const header = $('.site-header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 30);
onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
const menu=$('.menu-toggle'), mobile=$('#mobile-nav');
function closeMenu(){mobile.hidden=true;menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Open navigation');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';mobile.hidden=!open;menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Close navigation':'Open navigation');});
$$('a',mobile).forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!mobile.hidden){closeMenu();menu.focus();}});
window.matchMedia('(min-width:901px)').addEventListener('change',e=>{if(e.matches)closeMenu();});
const reduceMotion=window.matchMedia('(prefers-reduced-motion:reduce)');
const softwareDeck=$('#software-deck');
if(softwareDeck){
 const setDeck=open=>{softwareDeck.classList.toggle('is-open',open);softwareDeck.setAttribute('aria-expanded',String(open));};
 softwareDeck.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse')setDeck(true);});
 softwareDeck.addEventListener('pointerleave',event=>{if(event.pointerType==='mouse')setDeck(false);});
 softwareDeck.addEventListener('focus',()=>{if(softwareDeck.matches(':focus-visible'))setDeck(true);});
 softwareDeck.addEventListener('blur',()=>setDeck(false));
 softwareDeck.addEventListener('click',event=>{if(event.detail===0||event.pointerType==='touch'||event.pointerType==='pen'||matchMedia('(hover:none)').matches)setDeck(!softwareDeck.classList.contains('is-open'));});
 softwareDeck.addEventListener('keydown',event=>{if(event.key==='Escape')setDeck(false);});
 document.addEventListener('pointerdown',event=>{if(!softwareDeck.contains(event.target))setDeck(false);});
}
if('IntersectionObserver' in window&&!reduceMotion.matches){
 const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}}),{threshold:.06});
 $$('.reveal').forEach(el=>{if(el.getBoundingClientRect().top>window.innerHeight){el.classList.add('reveal-ready');observer.observe(el);}});
 reduceMotion.addEventListener('change',e=>{if(e.matches){$$('.reveal-ready').forEach(el=>el.classList.add('is-visible'));observer.disconnect();}});
}
const dialog=$('#video-dialog');
const dialogVideo=$('#dialog-video-element');
function openVideoDialog(card){
 if(!dialog)return;
 const src=card.dataset.video;
 const title=card.dataset.title||$('h3',card)?.textContent||'Inside the edit.';
 const desc=card.dataset.caption||$('.showcase-meta p',card)?.textContent||'';
 const poster=card.dataset.poster||'';
 const titleEl=$('#video-dialog-title');if(titleEl)titleEl.textContent=title;
 const descEl=$('#video-dialog-description');if(descEl)descEl.textContent=desc;
 if(dialogVideo&&src){
  dialogVideo.src=src;
  if(poster)dialogVideo.poster=poster;
  dialogVideo.currentTime=0;
  dialogVideo.play().catch(()=>{});
 }
 dialog.showModal();
}
function closeVideoDialog(){
 if(dialogVideo){dialogVideo.pause();dialogVideo.removeAttribute('src');}
 dialog?.close();
}
$$('[data-video]').forEach(btn=>btn.addEventListener('click',()=>{
 const card=btn.closest('[data-video]')||btn;
 openVideoDialog(card);
}));
$$('.dialog-close,.dialog-dismiss').forEach(btn=>btn.addEventListener('click',closeVideoDialog));
dialog?.addEventListener('close',closeVideoDialog);
dialog?.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeVideoDialog();}});
$$('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{$$('[data-filter]').forEach(b=>{b.classList.toggle('active',b===btn);b.setAttribute('aria-pressed',String(b===btn));});$$('[data-batch-type]').forEach(card=>{card.hidden=btn.dataset.filter!=='all'&&card.dataset.batchType!==btn.dataset.filter;if(!card.hidden)card.classList.add('is-visible');});}));
async function api(path,body){const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});let data;try{data=await r.json();}catch{throw Error('The service is unavailable. Please try again later.');}if(!r.ok)throw Error(data.error||'Please try again.');return data;}
const login=$('#login-form'), verify=$('#verify-form');
let loginEmail='';
if(login)login.addEventListener('submit',async e=>{e.preventDefault();const button=$('button',login),status=$('.form-status',login);button.disabled=true;status.textContent='Sending your verification code…';try{const form=new FormData(login);loginEmail=String(form.get('email'));await api('/api/auth/request',{name:form.get('name'),email:loginEmail});login.hidden=true;verify.hidden=false;$('.form-status',verify).textContent='A verification code was sent to your email. It expires in 10 minutes.';$('#code').focus();}catch(error){status.textContent=error.message;}finally{button.disabled=false;}});
if(verify){$('#change-email').addEventListener('click',()=>{verify.hidden=true;login.hidden=false;$('.form-status',login).textContent='';$('#email').focus();});verify.addEventListener('submit',async e=>{e.preventDefault();const button=$('button',verify),status=$('.form-status',verify);button.disabled=true;status.textContent='Verifying your email…';try{await api('/api/auth/verify',{email:loginEmail,code:$('#code').value});const batch=new URLSearchParams(location.search).get('batch');location.href=batch?`/enroll?batch=${encodeURIComponent(batch)}`:'/dashboard';}catch(error){status.textContent=error.message;button.disabled=false;}});}
const contact=$('#contact-form');
if(contact){contact.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(contact);$('#draft-text').value=`Name: ${d.get('name')}\nEmail: ${d.get('email')}\nTopic: ${d.get('topic')}\n\n${d.get('message')}`;$('#contact-draft').hidden=false;$('.form-status',contact).textContent='Your draft is ready below. Nothing has been sent.';$('#draft-text').focus();});$('#copy-inquiry').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('#draft-text').value);$('.form-status',contact).textContent='Inquiry copied. Nothing has been sent.';}catch{$('#draft-text').select();$('.form-status',contact).textContent='Select and copy the draft below. Nothing has been sent.';}});}
$('#logout')?.addEventListener('click',async()=>{try{await api('/api/auth/logout',{});location.href='/login';}catch(error){$('#logout').textContent=error.message;}});
$('#checkout')?.addEventListener('click',async()=>{
 const button=$('#checkout'),status=$('#checkout-status');button.disabled=true;status.textContent='Preparing secure checkout…';
 try{
  const r=await fetch('/api/me');if(r.status===401){location.href=`/login?batch=${encodeURIComponent(button.dataset.batch)}`;return;}
  const order=await api('/api/checkout',{batchId:button.dataset.batch});
  if(!window.Razorpay)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://checkout.razorpay.com/v1/checkout.js';script.onload=resolve;script.onerror=()=>reject(Error('Checkout could not load. Please try again.'));document.head.append(script);});
  const checkout=new window.Razorpay({key:order.keyId,order_id:order.id,amount:order.amount,currency:order.currency,name:order.businessName,description:order.batchName,prefill:order.prefill,theme:{color:'#ea580c'},modal:{ondismiss(){status.textContent='Checkout closed. No enrollment has been confirmed.';button.disabled=false;}},handler:async result=>{status.textContent='Verifying payment with the provider…';try{await api('/api/payments/verify',result);location.href='/dashboard';}catch(error){status.textContent=error.message;button.disabled=false;}}});
  checkout.on('payment.failed',()=>{status.textContent='Payment was not completed. Check the provider message before trying again.';button.disabled=false;});checkout.open();
 }catch(error){status.textContent=error.message;button.disabled=false;}
});
