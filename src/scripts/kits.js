/* İş kartları — galeri asımı. Ana sayfa ve /projeler kullanır. */
import { revealAll, guardImages } from './dom.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => (
  { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
));

export function renderKits(root, list, { empty = 'Henüz iş eklenmedi.', base = '/proje', lang = 'tr' } = {}) {
  if (!root) return;

  /* İngilizce sayfada kartlar da İngilizce olsun. Alan boşsa Türkçeye düşer;
     detay sayfaları da aynı kuralı uyguluyor, ikisi ayrışmasın. */
  const en = lang === 'en';
  const baslik = (p) => (en && p.title_en) || p.title;
  const etiket = (p) => (en && p.category_en) || p.category;

  if (!list.length) {
    root.innerHTML = `<p class="label" style="grid-column:span 12;">${esc(empty)}</p>`;
    return;
  }

  root.innerHTML = list.map((p, i) => {
    const no = esc(p.number || String(i + 1).padStart(2, '0'));
    return `
      <a class="kit" href="${base}/${encodeURIComponent(p.slug)}" data-reveal data-cur="${en ? 'View' : 'Gör'}">
        <div class="kit__media${p.cover ? '' : ' no-img'}">
          ${p.cover ? `<img src="${esc(p.cover)}" alt="${esc(baslik(p))}" loading="lazy">` : ''}
        </div>
        <div class="kit__body">
          <span class="kit__no">${no}</span>
          <div>
            <h3 class="kit__title">${esc(baslik(p))}</h3>
            <div class="kit__tag">${esc(etiket(p))}${p.award ? ` · <span class="kit__award">${esc(p.award)}</span>` : ''}</div>
          </div>
          <span class="kit__year">${esc(p.year)}</span>
        </div>
      </a>`;
  }).join('');

  revealAll(root);
  guardImages(root);
  // Kartlar Supabase geldikten SONRA çiziliyor; imleç etiketleri o ana kadar
  // bağlanamıyor. Haber ver ki app.js yeni kartlara bağlansın.
  window.dispatchEvent(new CustomEvent('kits:rendered', { detail: root }));
}
