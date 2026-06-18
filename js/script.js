/* ================================================
   PORTFOLYO — Etkileşim Katmanı v2
   ================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine    = window.matchMedia('(pointer: fine)').matches;

  /* ── PAGE TRANSITION OVERLAY ── */
  const overlay = document.createElement('div');
  overlay.className = 'page-transition';
  document.body.appendChild(overlay);

  // Sayfa açılışında overlay'i kapat
  requestAnimationFrame(() => {
    overlay.classList.add('in');
    setTimeout(() => overlay.classList.remove('in'), 500);
  });

  // Dahili linklerde geçiş animasyonu
  if (!reduced) {
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto') || href.includes('.pdf')) return;
      a.addEventListener('click', e => {
        e.preventDefault();
        overlay.classList.add('out');
        setTimeout(() => { window.location.href = href; }, 460);
      });
    });
  }

  /* ── HEADER SCROLL ── */
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── HERO LOAD ── */
  const hero = document.querySelector('.hero');
  if (hero) {
    requestAnimationFrame(() => {
      setTimeout(() => hero.classList.add('hero-loaded'), 80);
    });
  }

  /* ── CUSTOM CURSOR ── */
  if (fine && !reduced) {
    const dot  = document.createElement('div'); dot.id = 'cursor-dot';
    const ring = document.createElement('div'); ring.id = 'cursor-ring';
    document.body.append(dot, ring);

    let mx = 0, my = 0, rx = 0, ry = 0;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

    const lerp = (a, b, t) => a + (b - a) * t;
    let raf;
    const tick = () => {
      rx = lerp(rx, mx, 0.14);
      ry = lerp(ry, my, 0.14);
      dot.style.left = mx + 'px'; dot.style.top = my + 'px';
      ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
      raf = requestAnimationFrame(tick);
    };
    tick();

    document.querySelectorAll('.proje-kart, [data-cursor="hover"]').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-link'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-link'));
    });
  }

  /* ── SCROLL REVEAL ── */
  const revealSels = '.reveal, .reveal-left, .reveal-scale';
  const revEls = document.querySelectorAll(revealSels);
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });
    revEls.forEach(el => io.observe(el));
  } else {
    revEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ── MOBILE MENU ── */
  const toggle  = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (toggle && navLinks) {
    toggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        toggle.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ── ACTIVE NAV ── */
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a:not(.nav-cta-mobile)').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) a.classList.add('active');
  });

  /* ── PROJE FİLTRE ── */
  const filterBtns   = document.querySelectorAll('.filter-btn');
  const projeKartlari = document.querySelectorAll('[data-category]');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const cat = btn.dataset.filter;
        projeKartlari.forEach(card => {
          const show = cat === 'tum' || card.dataset.category === cat;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ── İLETİŞİM FORMU ── */
  const form   = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (form && !form.hasAttribute('action') && status) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      status.textContent = 'Form henüz bir servise bağlı değil. En hızlısı yukarıdaki e-posta ile ulaşmak.';
    });
  }

  /* ── MARQUEE: fare üzerinde dur ── */
  // Zaten CSS :hover animation-play-state: paused ile hallettik.

  /* ── MAGNETIC BUTONLAR ── */
  if (fine && !reduced) {
    document.querySelectorAll('.btn, .nav-cta').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }
});
