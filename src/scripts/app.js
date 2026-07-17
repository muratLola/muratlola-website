/* Galeri — açılış, imleç, reveal. Yan etkileri var; sadece Base.astro import eder. */
import Lenis from 'lenis';
import { gsap, ScrollTrigger, reduced, fine, splitChars, revealAll, guardImages } from './dom.js';

/* ── Smooth scroll ── */
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.2, smoothWheel: true, wheelMultiplier: 0.85 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ── İMLEÇ — mürekkep damlası ──
   Sabit bir daire cansız duruyordu. Damla artık hıza tepki veriyor:
   hareket yönünde uzayıp dikeyde inceliyor (squash & stretch), arkasında
   sönen bir kuyruk bırakıyor. difference karışımı sayesinde beyaz kâğıtta
   siyah, koyu görselin üstünde beyaz görünüyor — tek renk her zeminde okunur. */
if (fine && !reduced) {
  const dot = document.createElement('div'); dot.id = 'cur';
  const txt = document.createElement('div'); txt.id = 'cur-txt';

  // Kuyruk: her biri bir öncekinden daha yavaş takip eder
  const TAIL = 5;
  const tails = Array.from({ length: TAIL }, (_, i) => {
    const d = document.createElement('div');
    d.className = 'cur-tail';
    const k = 1 - (i + 1) / (TAIL + 1);      // uçlara doğru küçülür
    gsap.set(d, { scale: k * .8, opacity: k * .5 });
    document.body.appendChild(d);
    return { el: d, x: 0, y: 0, hiz: .18 - i * .025 };
  });
  document.body.append(dot, txt);

  let mx = innerWidth / 2, my = innerHeight / 2;
  let px = mx, py = my;          // damlanın kendi konumu
  let hedefUzama = 0, uzama = 0, aci = 0;
  let etiket = false;

  addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

  const txtX = gsap.quickTo(txt, 'x', { duration: .45, ease: 'power3' });
  const txtY = gsap.quickTo(txt, 'y', { duration: .45, ease: 'power3' });
  addEventListener('mousemove', e => { txtX(e.clientX); txtY(e.clientY); });

  gsap.ticker.add(() => {
    const ox = px, oy = py;
    px += (mx - px) * .22;
    py += (my - py) * .22;

    const dx = px - ox, dy = py - oy;
    const hiz = Math.hypot(dx, dy);
    if (hiz > .4) aci = Math.atan2(dy, dx) * 57.2958;

    // Hız → uzama. Üst sınır var, yoksa hızlı harekette çizgiye dönüşüyor.
    hedefUzama = Math.min(hiz / 34, .55);
    uzama += (hedefUzama - uzama) * .18;

    gsap.set(dot, {
      x: px, y: py, rotation: aci,
      scaleX: (etiket ? 0 : 1) + uzama,
      scaleY: (etiket ? 0 : 1) - uzama * .62,
    });

    // Kuyruk halkaları sırayla peşinden sürüklenir
    let hx = px, hy = py;
    for (const t of tails) {
      t.x += (hx - t.x) * t.hiz;
      t.y += (hy - t.y) * t.hiz;
      gsap.set(t.el, { x: t.x, y: t.y, rotation: aci, scaleX: 1 + uzama * .7, scaleY: 1 - uzama * .5 });
      hx = t.x; hy = t.y;
    }
  });

  // Bağlantı üstünde damla büyür
  document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('mouseenter', () => { if (!etiket) gsap.to(dot, { scale: 2.4, duration: .35 }); });
    el.addEventListener('mouseleave', () => { if (!etiket) gsap.to(dot, { scale: 1, duration: .35 }); });
  });

  // İşlerin üstünde damla kaybolur, yerine etiketli disk gelir
  const etiketAc = (el) => {
    etiket = true;
    txt.textContent = el.dataset.cur;
    gsap.to(txt, { opacity: 1, scale: 1, duration: .4, ease: 'back.out(1.7)' });
    gsap.to(tails.map(t => t.el), { opacity: 0, duration: .25 });
  };
  const etiketKapat = () => {
    etiket = false;
    gsap.to(txt, { opacity: 0, scale: .4, duration: .3 });
    tails.forEach((t, i) => gsap.to(t.el, { opacity: (1 - (i + 1) / (TAIL + 1)) * .5, duration: .3 }));
  };
  const baglaEtiket = (root = document) =>
    root.querySelectorAll('[data-cur]:not([data-cur-bound])').forEach(el => {
      el.setAttribute('data-cur-bound', '');
      el.addEventListener('mouseenter', () => etiketAc(el));
      el.addEventListener('mouseleave', etiketKapat);
    });
  baglaEtiket();
  // Kartlar Supabase'den sonra çiziliyor; o zaman tekrar bağlanmalı.
  window.addEventListener('kits:rendered', (e) => baglaEtiket(e.detail ?? document));

  // Tıklama — damla sıçrar
  addEventListener('mousedown', () => gsap.to(dot, { scale: etiket ? 1 : .5, duration: .12 }));
  addEventListener('mouseup', () => gsap.to(dot, { scale: etiket ? 1 : 1, duration: .5, ease: 'elastic.out(1,.4)' }));
}

/* ── AÇILIŞ ──
   Sıkı tutuluyor: perde ~1.4sn'de kalkar. Uzun açılış etkileyici değil,
   yavaş hissettiriyor. */
const veil = document.getElementById('veil');
if (veil && !reduced) {
  document.body.classList.add('is-loading');
  const line = veil.querySelector('.veil__line i');
  const word = veil.querySelector('.veil__word span');
  const tl = gsap.timeline();

  tl.from(word, { yPercent: 110, duration: .8, ease: 'expo.out' })
    .to(line, { scaleX: 1, duration: .9, ease: 'power2.inOut' }, .1)
    .to(word, { yPercent: -110, duration: .5, ease: 'power2.in' }, '+=.05')
    .to(veil, {
      yPercent: -100, duration: .8, ease: 'expo.inOut',
      onComplete: () => { veil.remove(); document.body.classList.remove('is-loading'); }
    }, '-=.3');

  // Dev tipografi — harf harf
  document.querySelectorAll('.hero__type [data-split]').forEach((el, i) => {
    const chars = splitChars(el);
    tl.from(chars, { yPercent: 115, duration: 1.0, ease: 'expo.out', stagger: .04 },
      `-=${i === 0 ? .55 : .92}`);
  });

  tl.to('.hero__rule', { scaleX: 1, duration: 1.1, ease: 'expo.out' }, '-=.7')
    .from('.hero__meta > *', { y: 18, opacity: 0, duration: .6, stagger: .1 }, '-=.8');
} else if (veil) {
  veil.remove();
  document.body.classList.remove('is-loading');
}

// Animasyon yoksa çizgi CSS'te scaleX:0 kalıyor — açıkça göster.
if (reduced) gsap.set('.hero__rule', { scaleX: 1 });

if (reduced) {
  document.querySelectorAll('[data-split], [data-split-chars]').forEach(el => {
    el.setAttribute('aria-label', el.textContent);
  });
}

/* ── TEMA ──
   İlk değer head'deki inline betikte belirlendi (FOUC olmasın diye).
   Burada yalnızca değiştirme var. */
const themeBtn = document.getElementById('theme');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const koyu = document.documentElement.getAttribute('data-theme') === 'dark';
    if (koyu) document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', 'dark');
    try { localStorage.setItem('ml-theme', koyu ? 'light' : 'dark'); } catch (e) {}
  });
}
// Kullanıcı kendi seçimini yapmadıysa sistem temasını takip et
try {
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem('ml-theme')) return;   // elle seçim varsa karışma
    if (e.matches) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  });
} catch (e) {}

/* ── Menü ── */
const burger = document.getElementById('burger');
const nav = document.getElementById('nav');
if (burger && nav) {
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    if (lenis) open ? lenis.stop() : lenis.start();
    document.body.style.overflow = open ? 'hidden' : '';
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open'); burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
    document.body.style.overflow = '';
  }));
}

/* ── Bölüm başlıkları ── */
if (!reduced) {
  document.querySelectorAll('[data-split-chars]').forEach(el => {
    const chars = splitChars(el);
    gsap.from(chars, {
      yPercent: 112, duration: 1.0, ease: 'expo.out', stagger: .025,
      scrollTrigger: { trigger: el, start: 'top 86%', once: true }
    });
  });
}

/* ── Rakamlar ──
   Gerçek değerler HTML'de; JS yalnızca animasyon ekler. */
if (!reduced) {
  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.dec || '0');
    const o = { v: 0 };
    gsap.to(o, {
      v: target, duration: 1.8, ease: 'power2.out',
      onStart:    () => { el.textContent = (0).toFixed(dec); },
      onUpdate:   () => { el.textContent = o.v.toFixed(dec); },
      onComplete: () => { el.textContent = target.toFixed(dec); },
      scrollTrigger: { trigger: el, start: 'top 92%', once: true }
    });
  });
}

revealAll();
guardImages();
