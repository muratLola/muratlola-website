/* Dil sözlüğü — yalnızca her sayfada tekrarlanan arayüz metinleri.
   Sayfaların kendi düzyazısı burada DEĞİL: bir tanıtım metnini kelime
   ikamesiyle çevirmek kötü metin üretir, o yüzden /en sayfaları kendi
   metinlerini taşır. Burası menü, footer, imleç etiketi gibi kısa
   ve tekrar eden şeyler için. */

export const DILLER = ['tr', 'en'];

/** Adresten dili çıkarır: /en ile başlıyorsa İngilizce. */
export function dilBul(pathname) {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'tr';
}

/* Aynı sayfanın diğer dildeki karşılığı. hreflang ve dil değiştirici
   bunu kullanır; eşleşme bulunamazsa ana sayfaya düşer. */
const ESLESME = [
  ['/',            '/en/'],
  ['/projeler/',   '/en/projects/'],
  ['/formalar/',   '/en/kits/'],
  ['/hizmetler/',  '/en/services/'],
  ['/hakkimda/',   '/en/about/'],
  ['/iletisim/',   '/en/contact/'],
];

const duzelt = (p) => (p.endsWith('/') ? p : p + '/');

export function digerDil(pathname) {
  const p = duzelt(pathname);
  for (const [tr, en] of ESLESME) {
    if (p === tr) return { lang: 'en', href: en };
    if (p === en) return { lang: 'tr', href: tr };
  }
  // Proje detayı: /proje/slug/ <-> /en/project/slug/
  let m = p.match(/^\/proje\/([^/]+)\/$/);
  if (m) return { lang: 'en', href: `/en/project/${m[1]}/` };
  m = p.match(/^\/en\/project\/([^/]+)\/$/);
  if (m) return { lang: 'tr', href: `/proje/${m[1]}/` };

  return dilBul(pathname) === 'en' ? { lang: 'tr', href: '/' } : { lang: 'en', href: '/en/' };
}

export const T = {
  tr: {
    htmlLang: 'tr',
    nav: [
      { href: '/projeler',  label: 'Projeler' },
      { href: '/formalar',  label: 'Formalar' },
      { href: '/hizmetler', label: 'Hizmetler' },
      { href: '/hakkimda',  label: 'Hakkımda' },
      { href: '/iletisim',  label: 'İletişim' },
    ],
    cta: 'Birlikte Çalışalım',
    ctaHref: '/iletisim',
    rol: 'Art Director',
    menuAria: 'Menü',
    temaAria: 'Aydınlık / karanlık mod',
    dilAria: 'Switch to English',
    dilEtiket: 'EN',
    imlecGor: 'Gör',
    imlecYaz: 'Yaz',
    bosProje: 'Henüz iş eklenmedi.',
    bosForma: 'Henüz forma eklenmedi.',
    geriProjeler: 'Projeler',
    projeKok: '/proje',
  },
  en: {
    htmlLang: 'en',
    nav: [
      { href: '/en/projects', label: 'Work' },
      { href: '/en/kits',     label: 'Kits' },
      { href: '/en/services', label: 'Services' },
      { href: '/en/about',    label: 'About' },
      { href: '/en/contact',  label: 'Contact' },
    ],
    cta: "Let's Work Together",
    ctaHref: '/en/contact',
    rol: 'Art Director',
    menuAria: 'Menu',
    temaAria: 'Light / dark mode',
    dilAria: 'Türkçeye geç',
    dilEtiket: 'TR',
    imlecGor: 'View',
    imlecYaz: 'Write',
    bosProje: 'No work added yet.',
    bosForma: 'No kits added yet.',
    geriProjeler: 'Work',
    projeKok: '/en/project',
  },
};
