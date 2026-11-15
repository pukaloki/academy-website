import {Scene,PerspectiveCamera,WebGLRenderer,BufferGeometry,Float32BufferAttribute,ShaderMaterial,Line,Points,Group,Mesh,PlaneGeometry,OrthographicCamera,AdditiveBlending,Vector2,SRGBColorSpace} from 'three';


const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const coarse=matchMedia('(pointer: coarse)');
const canAnimate=()=>!reduced.matches&&!document.hidden&&!document.documentElement.classList.contains('motion-paused');
document.querySelectorAll('.hero-webgl,.footer-webgl').forEach(host=>initialize(host,host.classList.contains('footer-webgl')));
function initialize(host,isFooter){
 const readyClass=isFooter?'footer-three-ready':'hero-three-ready';
 let renderer;
 try{
  const canvas=document.createElement('canvas');
  const context=canvas.getContext('webgl2',{alpha:true,antialias:false,powerPreference:'low-power'});
  if(!context){host.dataset.status='fallback';return;}
  renderer=new WebGLRenderer({canvas,context,alpha:true,antialias:false,powerPreference:'low-power'});
 }catch{host.dataset.status='fallback';return;}
 renderer.setClearColor(0x000000,0);renderer.outputColorSpace=SRGBColorSpace;
 host.append(renderer.domElement);renderer.domElement.setAttribute('aria-hidden','true');
 const scene=new Scene(),camera=new PerspectiveCamera(42,1,.1,70);
 camera.position.set(0,1.6,11);camera.lookAt(0,0,0);
 const group=new Group();scene.add(group);
 const pointer=new Vector2(),smoothed=new Vector2();
 const uniforms={uTime:{value:0},uPointer:{value:new Vector2()}};
 const vertex=`uniform float uTime;varying float vAlpha;varying float vHeat;attribute float aProgress;attribute float aDepth;
 void main(){vec3 p=position;float t=uTime;float wave=sin(p.x*.65+t*.38+aDepth*3.0)*.17+sin(p.x*1.25-t*.24+aDepth*4.0)*.08;
 p.y+=wave;p.z+=sin(aProgress*6.283+t*.2+aDepth*2.0)*.22;
 vAlpha=pow(sin(aProgress*3.14159),.55)*(.28+aDepth*.6)*mix(.28,1.,smoothstep(.08,.35,abs(aProgress-.5)));vHeat=.5+.5*sin(aProgress*5.0-t*.3+aDepth);
 gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);}`;
 const fragment=`varying float vAlpha;varying float vHeat;void main(){vec3 color=mix(vec3(0.24, 0.06, 0.0), vec3(1.0, 0.42, 0.17), vHeat);gl_FragColor=vec4(color,vAlpha*1.3);}`;
 const material=new ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,blending:AdditiveBlending});
 const small=innerWidth<650,lineCount=small?38:70,segments=small?115:180;
 if(!isFooter) for(let j=0;j<lineCount;j++){
  const d=j/(lineCount-1),positions=[],progress=[],depth=[];
  for(let i=0;i<=segments;i++){
   const u=i/segments,angle=u*Math.PI*2;
   // An open cinematic ribbon curls around the lower horizon and rises at both edges.
   const x=(u-.5)*19;
   const y=-1.65+Math.pow(Math.abs(u-.5)*2,2.0)*2.8+Math.sin(u*6.28+d*2.0)*(.4+d*.6)+d*.85;
   const z=Math.cos(angle)*1.6+d*2.3;
   positions.push(x,y,z);progress.push(u);depth.push(d);
  }
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('aProgress',new Float32BufferAttribute(progress,1));geometry.setAttribute('aDepth',new Float32BufferAttribute(depth,1));
  group.add(new Line(geometry,material));
 }
 // A second, elevated ribbon fills the sky behind the floating navigation.
 if(!isFooter) for(let j=0;j<(small?20:35);j++){
  const d=j/35,positions=[],progress=[],depth=[];
  for(let i=0;i<=segments;i++){
   const u=i/segments;
   positions.push((u-.5)*23,3.9+Math.sin(u*5+d)*.8+d*.55,Math.sin(u*6+d)*1.2-1.5);
   progress.push(u);depth.push(d*.7);
  }
  const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(positions,3));geo.setAttribute('aProgress',new Float32BufferAttribute(progress,1));geo.setAttribute('aDepth',new Float32BufferAttribute(depth,1));group.add(new Line(geo,material));
 }
 // Footer: a dimensional aperture, formed from nested elliptical light paths.
 if(isFooter) for(let j=0;j<(small?26:42);j++){
  const d=j/(small?26:42),positions=[],progress=[],depth=[];
  for(let i=0;i<=180;i++){
   const u=i/180,a=u*Math.PI*2,r=1.55+d*1.25;
   positions.push(Math.cos(a)*r,Math.sin(a)*r,Math.sin(a*3+d*4)*.18+(d-.5)*1.4);
   progress.push(u);depth.push(.35+d*.65);
  }
  const geo=new BufferGeometry();geo.setAttribute('position',new Float32BufferAttribute(positions,3));geo.setAttribute('aProgress',new Float32BufferAttribute(progress,1));geo.setAttribute('aDepth',new Float32BufferAttribute(depth,1));group.add(new Line(geo,material));
 }
 const particleCount=small?110:230,pp=[],seeds=[];
 for(let i=0;i<particleCount;i++){const rnd=n=>((Math.sin(n*127.1+17.3)*43758.5453)%1+1)%1;pp.push((rnd(i+1)-.5)*23,(rnd(i+91)-.5)*9,(rnd(i+381)-.5)*6);seeds.push(rnd(i+75));}
 const particleGeometry=new BufferGeometry();particleGeometry.setAttribute('position',new Float32BufferAttribute(pp,3));particleGeometry.setAttribute('aSeed',new Float32BufferAttribute(seeds,1));
 const particles=new ShaderMaterial({uniforms,vertexShader:`uniform float uTime;attribute float aSeed;varying float vAlpha;void main(){vec3 p=position;p.y+=sin(uTime*.16+aSeed*30.0)*.15;p.x+=sin(uTime*.1+aSeed*20.0)*.2;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(1.0+aSeed*2.4)*min(1.8,9.0/-mv.z);vAlpha=.15+.4*pow(.5+.5*sin(uTime*.5+aSeed*40.0),3.);}`,fragmentShader:`varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d)*vAlpha;gl_FragColor=vec4(1.,.79,.56,a);}`,transparent:true,depthWrite:false,blending:AdditiveBlending});
 group.add(new Points(particleGeometry,particles));
 const atmosphere=new Scene(),ortho=new OrthographicCamera(-1,1,1,-1,0,1);
 const skyUniforms={uTime:uniforms.uTime,uAspect:{value:1},uPointer:uniforms.uPointer};
 const sky=new ShaderMaterial({uniforms:skyUniforms,vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`precision highp float;varying vec2 vUv;uniform float uTime;uniform float uAspect;uniform vec2 uPointer;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 void main(){vec2 uv=vUv;vec2 p=(uv-.5)*vec2(uAspect,1.);p+=uPointer*.012;float t=uTime*.12;
 float halo=exp(-length((p-vec2(0.,-.16))*vec2(.85,3.2))*3.0);
 float beam=0.;for(int i=0;i<4;i++){float f=float(i);float center=-.32+sin(p.x*1.8+t+f*.7)*.045;float band=exp(-abs(p.y-center-f*.008)*80.);beam+=band*(.2+f*.1);}
 float crown=exp(-length((p-vec2(sin(t)*.35,.47))*vec2(.7,3.8))*3.);
 vec3 col=vec3(.85,.34,.10)*crown*.18+vec3(.95,.36,.08)*halo*.25+vec3(.85,.49,.21)*beam*.075;
 float vignette=1.-smoothstep(.2,1.,length((uv-.5)*1.15));col*=vignette;col+=vec3(hash(gl_FragCoord.xy)*.009);
 float protect=1.-exp(-length(p*vec2(1.3,2.))*4.)*.5;gl_FragColor=vec4(col*protect,1.);}`,depthTest:false,depthWrite:false});
 atmosphere.add(new Mesh(new PlaneGeometry(2,2),sky));
 let visible=false,frame=0,last=0,time=0,ticks=0,lost=false;
 function resize(){const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<650?1:1.5));renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;if(isFooter)group.scale.setScalar(Math.min(1,camera.aspect/.95));camera.updateProjectionMatrix();skyUniforms.uAspect.value=camera.aspect;draw();}
 function draw(){if(lost)return;uniforms.uTime.value=time;smoothed.lerp(pointer,.035);uniforms.uPointer.value.copy(smoothed);camera.position.x=smoothed.x*.3;camera.position.y=1.6+smoothed.y*.16;camera.lookAt(0,0,0);group.rotation.z=isFooter?time*.035+smoothed.x*.08:smoothed.x*.015;group.rotation.y=isFooter?.48+Math.sin(time*.19)*.24:0;group.rotation.x=isFooter?.45+Math.cos(time*.15)*.12:0;if(isFooter){camera.position.set(smoothed.x*.25,.4+smoothed.y*.15,10);camera.lookAt(0,0,0);}renderer.autoClear=true;renderer.render(atmosphere,ortho);renderer.autoClear=false;renderer.render(scene,camera);host.dataset.renderTick=String(++ticks);}
 function tick(now){if(!visible||!canAnimate()||lost){frame=0;last=0;return;}if(now-last>=33){time+=Math.min(now-last||33,80)/1000;last=now;draw();}frame=requestAnimationFrame(tick);}
 function sync(){cancelAnimationFrame(frame);frame=0;last=0;if(lost)return;if(visible&&canAnimate())frame=requestAnimationFrame(tick);else draw();}
 const ro=new ResizeObserver(resize);ro.observe(host);
 const io=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0});io.observe(host);
 const mo=new MutationObserver(sync);mo.observe(document.documentElement,{attributes:true,attributeFilter:['class']});
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);
 host.closest(isFooter?'.footer':'.hero').addEventListener('pointermove',e=>{if(coarse.matches||!canAnimate())return;const r=host.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1));});
 host.closest(isFooter?'.footer':'.hero').addEventListener('pointerleave',()=>pointer.set(0,0));
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(frame);document.documentElement.classList.remove(readyClass);host.dataset.status='fallback';dispatchEvent(new Event('hero-renderer-change'));});
 renderer.domElement.addEventListener('webglcontextrestored',()=>{lost=false;resize();document.documentElement.classList.add(readyClass);host.dataset.status='ready';dispatchEvent(new Event('hero-renderer-change'));sync();});
 resize();host.dataset.status='ready';document.documentElement.classList.add(readyClass);dispatchEvent(new Event('hero-renderer-change'));sync();
}

// Section-specific depth feedback, only for precise pointers.
for(const card of document.querySelectorAll('.course-card,.value-card,.batch-card')){
 card.addEventListener('pointermove',event=>{if(coarse.matches||!canAnimate())return;const r=card.getBoundingClientRect(),x=(event.clientX-r.left)/r.width-.5,y=(event.clientY-r.top)/r.height-.5;card.style.setProperty('--tilt-x',`${-y*4}deg`);card.style.setProperty('--tilt-y',`${x*5}deg`);card.style.setProperty('--art-x',`${x*8}px`);card.style.setProperty('--art-y',`${y*6}px`);});
 card.addEventListener('pointerleave',()=>{for(const prop of ['--tilt-x','--tilt-y','--art-x','--art-y'])card.style.removeProperty(prop);});
}
