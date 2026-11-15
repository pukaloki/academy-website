(() => {
  let theme='dark';
  try { theme=localStorage.getItem('shortcut-theme')||'dark'; } catch {}
  document.documentElement.dataset.theme=theme==='light'?'light':'dark';
  document.addEventListener('DOMContentLoaded',()=>{
    const button=document.getElementById('theme-toggle');
    const sync=()=>{const light=document.documentElement.dataset.theme==='light';button?.setAttribute('aria-label',`Switch to ${light?'dark':'light'} mode`);button?.setAttribute('title',`Switch to ${light?'dark':'light'} mode`);if(button)button.innerHTML=`<span aria-hidden="true">${light?'☾':'☀'}</span>`;document.querySelector('meta[name="theme-color"]')?.setAttribute('content',light?'#f6f3ef':'#050505');};
    button?.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='light'?'dark':'light';document.documentElement.dataset.theme=theme;try{localStorage.setItem('shortcut-theme',theme);}catch{}sync();});sync();
  });
})();
