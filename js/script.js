/* muratLola v4 — dark/light + fütüristik etkileşimler */
document.addEventListener('DOMContentLoaded', () => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine    = window.matchMedia('(pointer: fine)').matches;

  /* ── THEME ── */
  const root = document.documentElement;
  const saved = localStorage.getItem('ml-theme') ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  root.setAttribute('data-theme', saved);

  document.querySelectorAll('.theme-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('ml-theme', next);
    });
  });

  /* ── PAGE TRANSITION ── */
  const pt = document.createElement('div'); pt.id = 'pt';
  document.body.appendChild(pt);
  requestAnimationFrame(() => {
    pt.classList.add('in');
    setTimeout(() => pt.classList.remove('in'), 520);
  });
  if (!reduced) {
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.includes('.pdf')) return;
      a.addEventListener('click', e => {
        e.preventDefault();
        pt.classList.add('out');
        setTimeout(() => { window.location.href = href; }, 520);
      });
    });
  }

  /* ── HEADER SCROLL ── */
  const hdr = document.querySelector('.site-header');
  if (hdr) {
    const fn = () => hdr.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', fn, { passive: true }); fn();
  }

  /* ── HERO ── */
  const hero = document.querySelector('.hero');
  if (hero) requestAnimationFrame(() => setTimeout(() => hero.classList.add('hero-loaded'), 80));

  /* ── CURSOR ── */
  if (fine && !reduced) {
    const dot  = document.createElement('div'); dot.id = 'c-dot';
    const ring = document.createElement('div'); ring.id = 'c-ring';
    document.body.append(dot, ring);
    let mx=0,my=0,rx=0,ry=0;
    window.addEventListener('mousemove', e => { mx=e.clientX; my=e.clientY; });
    const lerp=(a,b,t)=>a+(b-a)*t;
    const tick=()=>{
      rx=lerp(rx,mx,.13); ry=lerp(ry,my,.13);
      dot.style.cssText=`left:${mx}px;top:${my}px`;
      ring.style.cssText=`left:${rx}px;top:${ry}px`;
      requestAnimationFrame(tick);
    }; tick();
    document.querySelectorAll('.proje-kart').forEach(el=>{
      el.addEventListener('mouseenter',()=>ring.classList.add('hover'));
      el.addEventListener('mouseleave',()=>ring.classList.remove('hover'));
    });
    document.querySelectorAll('a,button').forEach(el=>{
      el.addEventListener('mouseenter',()=>ring.classList.add('link'));
      el.addEventListener('mouseleave',()=>ring.classList.remove('link'));
    });
  }

  /* ── SCROLL REVEAL ── */
  const revEls = document.querySelectorAll('.reveal,.reveal-left,.reveal-scale');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }});
    },{threshold:.1,rootMargin:'0px 0px -40px 0px'});
    revEls.forEach(el=>io.observe(el));
  } else { revEls.forEach(el=>el.classList.add('is-visible')); }

  /* ── MOBILE MENU ── */
  const toggle = document.querySelector('.menu-toggle');
  const nav    = document.querySelector('.nav-links');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      nav.classList.remove('is-open'); toggle.classList.remove('is-open');
      document.body.style.overflow='';
    }));
  }

  /* ── ACTIVE NAV ── */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a:not(.nav-cta-mobile)').forEach(a=>{
    const href = a.getAttribute('href');
    if(href===page||(page===''&&href==='index.html')) a.classList.add('active');
  });

  /* ── FILTER ── */
  const fBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('[data-category]');
  if(fBtns.length){
    fBtns.forEach(btn=>btn.addEventListener('click',()=>{
      fBtns.forEach(b=>b.classList.remove('is-active'));
      btn.classList.add('is-active');
      const cat=btn.dataset.filter;
      cards.forEach(c=>{ c.style.display=(cat==='tum'||c.dataset.category===cat)?'':'none'; });
    }));
  }

  /* ── COUNTER ANIMATION ── */
  document.querySelectorAll('[data-count]').forEach(el=>{
    const target=parseInt(el.dataset.count);
    const suffix=el.dataset.suffix||'';
    const io2=new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting){
        let c=0;
        const step=()=>{ c=Math.min(c+Math.ceil(target/40),target); el.textContent=c+suffix; if(c<target) requestAnimationFrame(step); };
        requestAnimationFrame(step); io2.disconnect();
      }
    }); io2.observe(el);
  });

  /* ── TYPING BADGE ── */
  const badge = document.querySelector('.badge-text');
  if(badge && !reduced){
    const full=badge.textContent; badge.textContent='';
    let i=0;
    const type=()=>{ if(i<full.length){ badge.textContent+=full[i++]; setTimeout(type,45); }};
    setTimeout(type,500);
  }

  /* ── MAGNETIC BUTTONS ── */
  if(fine && !reduced){
    document.querySelectorAll('.btn,.nav-cta').forEach(btn=>{
      btn.addEventListener('mousemove',e=>{
        const r=btn.getBoundingClientRect();
        const x=(e.clientX-r.left-r.width/2)*.2;
        const y=(e.clientY-r.top-r.height/2)*.2;
        btn.style.transform=`translate(${x}px,${y}px)`;
      });
      btn.addEventListener('mouseleave',()=>{ btn.style.transform=''; });
    });
  }

  /* ── FORM ── */
  const form=document.getElementById('contact-form');
  const status=document.getElementById('form-status');
  if(form && !form.hasAttribute('action') && status){
    form.addEventListener('submit',e=>{
      e.preventDefault();
      status.textContent='Form henüz bir servise bağlı değil. muratlola0526@gmail.com adresine doğrudan yazabilirsin.';
      status.style.color='var(--accent)';
    });
  }
});
