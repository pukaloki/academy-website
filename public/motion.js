'use strict';
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new Set();
  let paused = false;
  const motionAllowed = () => !paused && !reduced.matches && !document.hidden;
  const button = document.getElementById('motion-control');
  function sync() {
    const stopped = paused || reduced.matches;
    document.documentElement.classList.toggle('motion-paused', stopped);
    document.documentElement.classList.toggle('motion-hidden', document.hidden);
    button?.setAttribute('aria-pressed', String(stopped));
    button?.setAttribute('aria-label', stopped ? 'Resume decorative motion' : 'Pause decorative motion');
    if(button?.querySelector('span')) button.querySelector('span').textContent = stopped ? 'Motion paused' : 'Motion on';
    listeners.forEach(fn => fn());
  }
  button?.addEventListener('click', () => { paused = !paused; sync(); });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  const progress = document.querySelector('.reading-progress');
  let progressFrame = 0;
  function updateProgress(){progressFrame=0;const h=document.documentElement.scrollHeight-innerHeight;progress?.style.setProperty('transform',`scaleX(${h>0?Math.max(0,Math.min(1,scrollY/h)):0})`);}
  function schedule(){if(!progressFrame)progressFrame=requestAnimationFrame(updateProgress);}
  addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);new ResizeObserver(schedule).observe(document.body);updateProgress();
  const links=[...document.querySelectorAll('[data-section-link]')];
  const navObserver=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)links.forEach(link=>{if(link.dataset.sectionLink===entry.target.id)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});});},{rootMargin:'-15% 0px -50% 0px'});
  new Set(links.map(link=>document.getElementById(link.dataset.sectionLink)).filter(Boolean)).forEach(section=>navObserver.observe(section));
  document.querySelectorAll('.glass-card').forEach(card=>{
    const reset=()=>{card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg');};
    card.addEventListener('pointermove',event=>{if(!motionAllowed()||!matchMedia('(pointer:fine)').matches)return;const r=card.getBoundingClientRect(),x=(event.clientX-r.left)/r.width,y=(event.clientY-r.top)/r.height;card.style.setProperty('--mx',`${x*100}%`);card.style.setProperty('--my',`${y*100}%`);card.style.setProperty('--rx',`${-(y-.5)*4}deg`);card.style.setProperty('--ry',`${(x-.5)*4}deg`);});card.addEventListener('pointerleave',reset);listeners.add(reset);
  });
  document.querySelectorAll('.supplied-hero,#curriculum,#journey,#batches,.dusk-section').forEach(section=>{
    let visible=false;const update=()=>{const stopped=!visible||!motionAllowed();section.classList.toggle('effect-paused',stopped);section.querySelectorAll('svg').forEach(svg=>{if(svg.pauseAnimations)stopped?svg.pauseAnimations():svg.unpauseAnimations();});};
    new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();}).observe(section);listeners.add(update);
  });
  document.querySelectorAll('canvas[data-scene]').forEach(canvas=>{
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const terrain=canvas.dataset.scene==='terrain';let w=0,h=0,drops=[],splashes=[],particles=[],frame=0,last=0,time=0,visible=false;
    function resize(){const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;const dpr=Math.min(devicePixelRatio||1,w<600?1:1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);splashes=[];drops=Array.from({length:Math.min(650,Math.floor(w*.34))},()=>({x:Math.random()*w,y:Math.random()*h,z:Math.random(),floor:h*(.86+Math.random()*.13)}));particles=Array.from({length:Math.floor(w/9)},()=>({x:Math.random()*w,y:h*.45+Math.random()*h*.55,r:.4+Math.random()*1.4,speed:6+Math.random()*12,phase:Math.random()*6.28}));draw(0);}
    function noise(x,t,s){return Math.sin(x*1.7+t*.9+s)*.5+Math.sin(x*3.9-t*.6+s*2.1)*.25+Math.sin(x*8.3+t*1.4+s*.7)*.125+Math.sin(x*17.1-t*.35+s*3.3)*.0625;}
    function draw(dt){ctx.clearRect(0,0,w,h);if(terrain){
      for(let i=0;i<26;i++){const depth=i/25,base=h*.52+depth*depth*h*.48*.95,amp=18+depth*110,flow=time*(.08+depth*.45),segments=Math.max(90,Math.floor(w/7));ctx.beginPath();for(let s=0;s<=segments;s++){const n=noise(s/segments*4+flow,time*.3,i*1.37),peak=Math.pow(Math.max(0,n),1.6)*1.6+n*.35,x=s/segments*w,y=base-peak*amp;s?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.strokeStyle=`rgba(255,${Math.round(180+depth*40)},${Math.round(60+depth*30)},${.12+depth*.5})`;ctx.shadowColor='rgba(255,110,35,.45)';ctx.shadowBlur=6+depth*10;ctx.lineWidth=.7+depth*.7;ctx.stroke();}
      ctx.shadowBlur=0;particles.forEach(p=>{ctx.beginPath();ctx.arc((p.x+time*p.speed)%w,p.y+Math.sin(time*.8+p.phase)*6,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(255,190,130,${(.35+.65*Math.abs(Math.sin(time*1.3+p.phase)))*.9})`;ctx.fill();});
    }else if(motionAllowed()){
      drops.forEach(p=>{
        const len=18+p.z*30,speed=1050+p.z*1050;
        p.y+=speed*dt;p.x+=speed*.12*dt;
        if(p.x>w+len)p.x=-len;
        if(p.y>p.floor){
          if(splashes.length<100)splashes.push({x:p.x,y:p.floor,z:p.z,age:0});
          p.y=-len;p.x=Math.random()*w;p.floor=h*(.86+Math.random()*.13);
        }
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-len*.12,p.y-len);
        ctx.strokeStyle=`rgba(205,220,245,${.16+p.z*.38+(p.y>h*.8?.16:0)})`;ctx.lineWidth=.6+p.z;ctx.stroke();
      });
      splashes=splashes.filter(p=>p.age<.48);
      splashes.forEach(p=>{
        p.age+=dt;const fade=Math.max(0,1-p.age/.48),radius=2+p.age*(22+p.z*18);
        ctx.beginPath();ctx.ellipse(p.x,p.y,radius,radius*.23,0,0,Math.PI*2);
        ctx.strokeStyle=`rgba(215,225,255,${fade*.48})`;ctx.lineWidth=.7;ctx.stroke();
      });
    }canvas.dataset.renderTick=String(Math.round(time*1000));}
    function tick(now){frame=0;if(!visible||!motionAllowed())return;if(!last)last=now;const delta=now-last;if(delta>=1000/60){const dt=Math.min(delta/1000,.06);last=now-(delta%(1000/60));time+=dt;draw(dt);}frame=requestAnimationFrame(tick);}
    function update(){cancelAnimationFrame(frame);frame=0;last=0;if(!terrain&&visible&&motionAllowed())frame=requestAnimationFrame(tick);else if(!terrain)ctx.clearRect(0,0,w,h);}
    new ResizeObserver(resize).observe(canvas);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();}).observe(canvas);listeners.add(update);resize();
  });
  // The studio has three real visual states and a single source of playback time.
  const play = document.getElementById('play-study');
  const scrub = document.getElementById('timeline-scrub');
  if (play && scrub) {
    const editor=document.querySelector('.editor');
    const stage=document.querySelector('.preview-stage');
    const chapterButtons=[...document.querySelectorAll('.studio-chapter')];
    const messages={story:'Story first: choose the shots, find the rhythm, and give each moment room.',color:'Color with intent: balance the image, shape the light, and build a consistent look.',motion:'Details in motion: introduce type with timing, then bring the whole sequence together.'};
    let previousChapter='',previousLook='',trackWidth=scrub.clientWidth;
    new ResizeObserver(()=>{trackWidth=scrub.clientWidth;}).observe(scrub);
    const playhead=document.getElementById('playhead'),timecode=document.getElementById('timecode'),explanation=document.getElementById('study-explanation'),lookButtons=[...document.querySelectorAll('.look-toggle button')];
    let elapsed=reduced.matches?14:0,frame=0,last=0,playing=false,inView=false,userPaused=false,manualLook=false;
    function draw(){
      const chapter=elapsed<6.7?'story':elapsed<13.4?'color':'motion';
      if(chapter!==previousChapter){editor.dataset.chapter=chapter;stage.dataset.chapter=chapter;explanation.textContent=messages[chapter];chapterButtons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.chapter===chapter)));previousChapter=chapter;}
      if(!manualLook)stage.dataset.look=chapter==='story'?'raw':'graded';
      playhead.style.transform=`translate3d(${elapsed/20*trackWidth}px,0,0)`;
      timecode.textContent=`00:${String(Math.floor(elapsed)).padStart(2,'0')}:${String(Math.floor(elapsed%1*24)).padStart(2,'0')}`;
      scrub.value=elapsed;
      const localProgress=(elapsed-(chapter==='story'?0:chapter==='color'?6.7:13.4))/(chapter==='motion'?6.6:6.7);
      chapterButtons.forEach(button=>{const active=button.dataset.chapter===chapter;button.style.setProperty('--chapter-progress',active?String(localProgress):'0');});
      
      if(previousLook!==stage.dataset.look){lookButtons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.look===stage.dataset.look)));previousLook=stage.dataset.look;}
    }
    function setButton(){play.setAttribute('aria-label',playing?'Pause editing study':'Play editing study');play.innerHTML=playing?'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M9 5v14m6-14v14"/></svg>':'<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m9 5 11 7-11 7z"/></svg>';editor.classList.toggle('is-playing',playing);}
    function stop(){playing=false;cancelAnimationFrame(frame);frame=0;last=0;setButton();}
    function tick(time){if(!playing)return;if(last){elapsed+=(time-last)/1000;if(elapsed>=20)elapsed=0;draw();}last=time;frame=requestAnimationFrame(tick);}
    function start(){if(playing)return;playing=true;last=0;setButton();frame=requestAnimationFrame(tick);}
    function syncEditor(){if(motionAllowed()&&inView&&!userPaused)start();else stop();}
    play.addEventListener('click',()=>{if(playing){userPaused=true;stop();}else{userPaused=false;start();}});
    scrub.addEventListener('input',()=>{userPaused=true;stop();manualLook=false;elapsed=Number(scrub.value);draw();});
    chapterButtons.forEach(button=>button.addEventListener('click',()=>{userPaused=true;stop();manualLook=false;elapsed=button.dataset.chapter==='story'?0:button.dataset.chapter==='color'?7:14;draw();}));
    document.querySelectorAll('.look-toggle button').forEach(button=>button.addEventListener('click',()=>{manualLook=true;stage.dataset.look=button.dataset.look;document.querySelectorAll('.look-toggle button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
    new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;syncEditor();},{threshold:.2}).observe(editor);
    listeners.add(syncEditor);draw();
  }


  sync();
})();
