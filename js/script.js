/* =================================================================
   GÖRSEL İLETİŞİM TASARIMI — PORTFOLYO / CV SİTESİ
   Paylaşılan etkileşim katmanı
   ================================================================= */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------
     1) MOBİL MENÜ
     --------------------------------------------------------------- */
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      menuToggle.classList.toggle('is-open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        menuToggle.classList.remove('is-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------------------------------------------------------------
     2) SCROLL-REVEAL (IntersectionObserver)
     --------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal, .rule');
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------------------------------------------------------------
     3) ÖZEL İMLEÇ — sadece ince işaretçili (mouse) cihazlarda
     --------------------------------------------------------------- */
  const cursor = document.getElementById('custom-cursor');
  const supportsFinePointer = window.matchMedia('(pointer: fine)').matches;
  if (cursor && supportsFinePointer && !prefersReducedMotion) {
    let mouseX = 0, mouseY = 0, curX = 0, curY = 0;
    let started = false;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!started) { curX = mouseX; curY = mouseY; started = true; cursor.classList.add('is-active'); }
    });

    const followLoop = () => {
      curX += (mouseX - curX) * 0.18;
      curY += (mouseY - curY) * 0.18;
      cursor.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
      requestAnimationFrame(followLoop);
    };
    requestAnimationFrame(followLoop);

    document.querySelectorAll('a, button, .proje-kart').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });

    document.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
    document.addEventListener('mouseenter', () => cursor.classList.add('is-active'));
  } else if (cursor) {
    cursor.remove();
  }

  /* ---------------------------------------------------------------
     4) PROJE FİLTRESİ (projeler.html)
     --------------------------------------------------------------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projeKartlari = document.querySelectorAll('[data-category]');
  if (filterBtns.length && projeKartlari.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterBtns.forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        const cat = btn.dataset.filter;
        projeKartlari.forEach((card) => {
          const show = cat === 'tum' || card.dataset.category === cat;
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ---------------------------------------------------------------
     5) ANASAYFA GİRİŞ ANİMASYONU İÇİN KELİME SARGI
        (her .word içindeki metni <span> ile sarar, CSS animasyonu
        yukarıdan kaydırarak gösterir)
     --------------------------------------------------------------- */
  document.querySelectorAll('.hero-load h1 .word').forEach((wordEl, i) => {
    const text = wordEl.textContent;
    wordEl.innerHTML = `<span style="animation-delay:${0.15 + i * 0.09}s">${text}</span>`;
  });

  /* ---------------------------------------------------------------
     6) ETKİN NAV BAĞLANTISINI İŞARETLE
     --------------------------------------------------------------- */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a:not(.nav-cta-mobile)').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ---------------------------------------------------------------
     7) İLETİŞİM FORMU (iletisim.html) — backend bağlanana kadar
        sayfanın yeniden yüklenmesini engelle, bilgilendirme göster.
        Formspree/Getform gibi bir servise bağladığında bu engelleme
        kodunu kaldırabilir veya formun action'ına yönlendirebilirsin.
     --------------------------------------------------------------- */
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  if (contactForm && !contactForm.hasAttribute('action')) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (formStatus) {
        formStatus.textContent = 'Bu form henüz bir gönderim servisine bağlı değil — şimdilik en hızlı yol yukarıdaki e-posta adresinden ulaşman. (README.md → "İletişim formunu aktif etme")';
      }
    });
  }
});
