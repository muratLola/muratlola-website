/* Yan etkisiz DOM yardımcıları. app.js'ten ayrı tutuluyor:
   kits.js bunları import ediyor ve app.js'i import etseydi
   kickoff gibi yan etkiler ikinci bir bundle'da tekrar çalışırdı. */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine    = matchMedia('(pointer: fine)').matches;

export function splitChars(el) {
  const text = el.textContent;
  el.textContent = '';
  el.setAttribute('aria-label', text);
  return [...text].map(ch => {
    const outer = document.createElement('span');
    // Dikey padding: line-height .85 ile kutu glifin mürekkebinden kısa kalıyor
    // ve overflow:hidden Türkçe İ'nin noktasını / Ç-Ş kuyruğunu kırpıyor.
    outer.style.cssText =
      'display:inline-block;overflow:hidden;vertical-align:top;' +
      'padding:.22em 0 .16em;margin:-.22em 0 -.16em;';
    outer.setAttribute('aria-hidden', 'true');
    const inner = document.createElement('span');
    inner.style.display = 'inline-block';
    inner.textContent = ch === ' ' ? ' ' : ch;
    outer.appendChild(inner);
    el.appendChild(outer);
    return inner;
  });
}

export function revealAll(root = document) {
  root.querySelectorAll('[data-reveal]:not([data-revealed])').forEach(el => {
    el.setAttribute('data-revealed', '');
    if (reduced) { gsap.set(el, { opacity: 1 }); return; }
    gsap.fromTo(el, { y: 40, opacity: 0 }, {
      y: 0, opacity: 1, duration: .9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });
}

/* Görsel yüklenemezse tarayıcı alt metnini kutuya basar ve tasarımı bozar. */
export function guardImages(root = document) {
  root.querySelectorAll('.kit__media img, .about__frame img').forEach(img => {
    const fail = () => img.closest('.kit__media, .about__frame')?.classList.add('no-img');
    if (img.complete && img.naturalWidth === 0) fail();
    img.addEventListener('error', fail);
  });
}

export function magnetize(root = document) {
  if (reduced || !fine) return;
  root.querySelectorAll('[data-magnet]:not([data-magnetized])').forEach(el => {
    el.setAttribute('data-magnetized', '');
    const mx = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1,.4)' });
    const my = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1,.4)' });
    el.addEventListener('mousemove', e => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - r.left - r.width / 2) * .35);
      my((e.clientY - r.top - r.height / 2) * .35);
    });
    el.addEventListener('mouseleave', () => { mx(0); my(0); });
  });
}

export { gsap, ScrollTrigger };
