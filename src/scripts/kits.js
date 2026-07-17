/* İş kartları — galeri asımı. Ana sayfa ve /projeler kullanır. */
import { revealAll, guardImages } from './dom.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => (
  { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
));

export function renderKits(root, list, { empty = "Henüz iş eklenmedi." } = {}) {
  if (!root) return;

  if (!list.length) {
    root.innerHTML = `<p class="label" style="grid-column:span 12;">${esc(empty)}</p>`;
    return;
  }

  root.innerHTML = list.map((p, i) => {
    const no = esc(p.number || String(i + 1).padStart(2, '0'));
    return `
      <a class="kit" href="/proje?p=${encodeURIComponent(p.slug)}" data-reveal data-cur="Gör">
        <div class="kit__media${p.cover ? '' : ' no-img'}">
          ${p.cover ? `<img src="${esc(p.cover)}" alt="${esc(p.title)}" loading="lazy">` : ''}
        </div>
        <div class="kit__body">
          <span class="kit__no">${no}</span>
          <div>
            <h3 class="kit__title">${esc(p.title)}</h3>
            <div class="kit__tag">${esc(p.category)}${p.award ? ` · <span class="kit__award">${esc(p.award)}</span>` : ''}</div>
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
