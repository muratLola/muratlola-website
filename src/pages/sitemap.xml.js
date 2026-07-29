/* sitemap.xml — build sırasında üretilir.
   Proje adresleri Supabase'den geldiği için elle yazılan bir sitemap
   her yeni işte bayatlar; burada listeyi build zamanında çekiyoruz. */
import { getProjects } from '../lib/store.js';

const STATIC = [
  { path: '', priority: '1.0', freq: 'monthly' },
  { path: 'projeler', priority: '0.9', freq: 'weekly' },
  { path: 'formalar', priority: '0.9', freq: 'weekly' },
  { path: 'hizmetler', priority: '0.9', freq: 'monthly' },
  { path: 'hakkimda', priority: '0.6', freq: 'yearly' },
  { path: 'iletisim', priority: '0.5', freq: 'yearly' },
];

const xmlEscape = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c]));

export async function GET({ site }) {
  const base = String(site ?? 'https://muratlola.com').replace(/\/$/, '');

  let projects = [];
  try {
    projects = (await getProjects()) ?? [];
  } catch {
    // Supabase build sırasında ulaşılamazsa sitemap yine de üretilsin,
    // sadece statik sayfalarla. Boş bir sitemap, hiç sitemap'ten iyidir.
    projects = [];
  }

  /* Sayfaların canonical'ı sonda eğik çizgiyle çıkıyor (Astro directory
     format). Sitemap'te çizgisiz yazarsak Google iki ayrı adres görür ve
     ikisi de zayıflar — aynı biçimi kullan. */
  const entries = [
    ...STATIC.map((s) => ({
      loc: s.path ? `${base}/${s.path}/` : `${base}/`,
      priority: s.priority,
      freq: s.freq,
      lastmod: null,
    })),
    ...projects
      .filter((p) => p && p.slug)
      .map((p) => ({
        loc: `${base}/proje/${encodeURIComponent(p.slug)}/`,
        priority: '0.8',
        freq: 'monthly',
        lastmod: p.created_at ? String(p.created_at).slice(0, 10) : null,
      })),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries
      .map(
        (e) =>
          `  <url>\n` +
          `    <loc>${xmlEscape(e.loc)}</loc>\n` +
          (e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>\n` : '') +
          `    <changefreq>${e.freq}</changefreq>\n` +
          `    <priority>${e.priority}</priority>\n` +
          `  </url>`
      )
      .join('\n') +
    `\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
