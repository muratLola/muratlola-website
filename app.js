/* ═══════════════════════════════════════════
   formaLOLA — app.js
═══════════════════════════════════════════ */

/* ══════════ ADMIN AYARLARI ══════════ */
// SADECE BURAYA YAZDIĞIN MAİLLER ADMİN PANELİNİ GÖREBİLİR
const ADMIN_EMAILS = ['firat3306ogur@gmail.com'];

/* ══════════ FIREBASE INIT ══════════ */
const firebaseConfig = {
  apiKey: "AIzaSyCI7Ku7aF2gAf-lDpMwzYfBY0iC_ulg3gE",
  authDomain: "formalola-c4ba7.firebaseapp.com",
  projectId: "formalola-c4ba7",
  storageBucket: "formalola-c4ba7.firebasestorage.app",
  messagingSenderId: "67406520517",
  appId: "1:67406520517:web:a9d240d47a99d3c79690ac"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore(); 
/* ═══════════════════════════════════════ */

/* ══════════ MOCK DATA (Örnek Vitrin) ══════════ */
const MOCK_DESIGNS = [
  { id: 'm1', title: 'Gece Yarısı Pro', designer: 'MertStudio', designerInitials: 'MS', sport: 'Futbol', style: 'modern', pattern: 'gradient', colors: ['#0a0a0a','#e63946','#ffffff'], price: 449, exclusivePrice: 3999, sales: 128, likes: 342, license: 'standard', bg: 'linear-gradient(140deg,#0a0a0a,#1a1a2e)', num: '10', kit: 'Deplasman' },
  { id: 'm2', title: 'Anadolu Kırmızısı', designer: 'FormArt', designerInitials: 'FA', sport: 'Futbol', style: 'retro', pattern: 'stripes', colors: ['#e63946','#1d1d1d','#f4f1de'], price: 299, exclusivePrice: 2499, sales: 89, likes: 211, license: 'standard', bg: 'linear-gradient(140deg,#e63946,#8b0000)', num: '7', kit: 'Ev' },
  { id: 'm3', title: 'Cyber Esports Kit', designer: 'NeonLab', designerInitials: 'NL', sport: 'E-Spor', style: 'futuristic', pattern: 'geometric', colors: ['#0d1b2a','#415a77','#e9c46a'], price: 599, exclusivePrice: 5499, sales: 67, likes: 198, license: 'exclusive', bg: 'linear-gradient(140deg,#0d1b2a,#415a77)', num: '9', kit: 'Ev' },
  { id: 'm4', title: 'Bosphorus Wave', designer: 'IstanbulKit', designerInitials: 'IK', sport: 'Basketbol', style: 'modern', pattern: 'abstract', colors: ['#1d3557','#457b9d','#a8dadc'], price: 389, exclusivePrice: 3500, sales: 54, likes: 167, license: 'standard', bg: 'linear-gradient(140deg,#1d3557,#457b9d)', num: '23', kit: 'Deplasman' },
  { id: 'm5', title: 'Sarı Kaplan', designer: 'TigerDesign', designerInitials: 'TD', sport: 'Futbol', style: 'classic', pattern: 'stripes', colors: ['#e9c46a','#1d1d1d','#ffffff'], price: 329, exclusivePrice: 2999, sales: 103, likes: 289, license: 'standard', bg: 'linear-gradient(140deg,#e9c46a,#f4a261)', num: '11', kit: 'Ev' },
  { id: 'm6', title: 'Mor Şimşek', designer: 'EliteKit', designerInitials: 'EK', sport: 'Voleybol', style: 'futuristic', pattern: 'geometric', colors: ['#8338ec','#3a0ca3','#f72585'], price: 449, exclusivePrice: 4000, sales: 41, likes: 134, license: 'standard', bg: 'linear-gradient(140deg,#8338ec,#3a0ca3)', num: '6', kit: 'Ev' },
  { id: 'm7', title: 'Arctic Pro', designer: 'NordKit', designerInitials: 'NK', sport: 'Basketbol', style: 'minimal', pattern: 'minimal', colors: ['#f4f1de','#e9c46a','#1d1d1d'], price: 269, exclusivePrice: 2200, sales: 77, likes: 156, license: 'standard', bg: 'linear-gradient(140deg,#e9ecef,#dee2e6)', num: '3', kit: 'Deplasman' },
  { id: 'm8', title: 'Karadeniz Fırtınası', designer: 'BlackSeaDesign', designerInitials: 'BD', sport: 'Rugby', style: 'modern', pattern: 'abstract', colors: ['#023e8a','#0077b6','#90e0ef'], price: 519, exclusivePrice: 4800, sales: 32, likes: 98, license: 'exclusive', bg: 'linear-gradient(140deg,#023e8a,#0077b6)', num: '8', kit: 'Ev' },
];

const MOCK_DESIGNERS = [
  { id: 1, name: 'MertStudio', initials: 'MS', bio: 'Futbol forma uzmanı', sales: 128, designs: 24, rating: 4.9, level: 'master' },
  { id: 2, name: 'NeonLab', initials: 'NL', bio: 'E-spor & fütüristik tasarım', sales: 67, designs: 18, rating: 4.8, level: 'elite' },
];

const MOCK_COMPETITIONS = [
  { id: 1, club: 'Bosphorus FC', desc: '2026-27 sezonu Ev forması tasarım yarışması', prize: '₺5.000', deadline: '15 gün kaldı', entries: 34 },
  { id: 2, club: 'Ankara Thunder', desc: 'E-Spor takımımız için yeni kimlik arıyoruz', prize: '$800', deadline: '8 gün kaldı', entries: 19 },
  { id: 3, club: 'Ege Volley', desc: 'Kadın voleybol takımı Deplasman forması', prize: '₺3.500', deadline: '22 gün kaldı', entries: 11 },
];

/* ══════════ STATE ══════════ */
// SİTEDEKİ TÜM TASARIMLAR BURADA TOPLANACAK (Gerçekler + Örnekler)
let ALL_DESIGNS = [...MOCK_DESIGNS]; 

let currentPage = 'home';
let previousPage = 'home';
let currentUser = null;
let favorites = new Set();
let currentDesignId = null;
let exploreOffset = 0;
let selectedColors = new Set();
let currentUploadStep = 1;
let uploadedImages = {};

/* ══════════ INIT ══════════ */
document.addEventListener('DOMContentLoaded', () => {
  renderHomeDesigns();
  renderSpotlight();
  renderHomeComps();
  calcEarnings();
  initScrollNav();
  
  // Site açılır açılmaz veritabanındaki onaylı tasarımları getir
  fetchApprovedDesigns();
});

function initScrollNav() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('mainNav');
    if (window.scrollY > 20) nav.style.boxShadow = '0 1px 20px rgba(0,0,0,0.4)';
    else nav.style.boxShadow = 'none';
  });
}

/* ══════════ FİRESTORE'DAN VERİ ÇEKME FONKSİYONU ══════════ */
async function fetchApprovedDesigns() {
  try {
    const snapshot = await db.collection('designs').where('status', '==', 'approved').orderBy('createdAt', 'desc').get();
    const realDesigns = [];
    
    snapshot.forEach(doc => {
      const d = doc.data();
      // Renk paletten gradient oluştur
      const col1 = (d.colors && d.colors[0]) || '#1f1f26';
      const col2 = (d.colors && d.colors[1]) || '#0c0c0e';
      realDesigns.push({
        id: doc.id,
        title: d.title,
        designer: d.designerName || 'Anonim',
        designerInitials: d.designerInitials || '?',
        sport: d.sport,
        style: d.style,
        pattern: d.pattern,
        colors: d.colors || [],
        price: d.price || 0,
        exclusivePrice: d.exclusivePrice || 0,
        sales: d.sales || 0,
        likes: d.likes || 0,
        license: d.exclusivePrice > 0 ? 'standard' : 'standard',
        // Gerçek ImgBB fotoğrafları
        coverUrl: d.coverUrl || '',
        coverThumb: d.coverThumb || '',
        imageUrls: d.imageUrls || {},
        // Fotoğraf yoksa renk paletten gradient göster
        bg: `linear-gradient(140deg, ${col1}, ${col2})`,
        num: String(Math.floor(Math.random() * 99) + 1),
        kit: d.kit || 'Ev',
        designerId: d.designerId,
        desc: d.desc || ''
      });
    });
    
    ALL_DESIGNS = [...realDesigns, ...MOCK_DESIGNS];
    renderHomeDesigns();
    if (currentPage === 'explore') applyFilters();
    
  } catch (error) {
    console.error('Tasarımlar çekilemedi:', error);
    // Hata olursa sadece mock data göster
    ALL_DESIGNS = [...MOCK_DESIGNS];
    renderHomeDesigns();
  }
}

/* ══════════ PAGE ROUTING ══════════ */
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) {
    previousPage = currentPage;
    currentPage = pageId;
    target.classList.add('active');
    window.scrollTo(0, 0);

    if (pageId === 'explore') renderExplore();
    if (pageId === 'designers') renderDesignersPage();
    if (pageId === 'competitions') renderCompetitionsPage();
    if (pageId === 'dashboard') renderDashboard();
  }
}

function goBack() { showPage(previousPage || 'home'); }

function filterByCategory(cat) {
  showPage('explore');
  setTimeout(() => {
    document.querySelectorAll('.fp-check input').forEach(inp => {
      if (inp.value === cat) inp.checked = true;
      else if (['Futbol','Basketbol','Voleybol','E-Spor','Rugby','Amerikan Futbolu','Hentbol'].includes(inp.value)) inp.checked = false;
    });
    applyFilters();
  }, 100);
}

/* ══════════ RENDER HOME ══════════ */
function renderHomeDesigns() {
  const grid = document.getElementById('homeGrid');
  if (!grid) return;
  grid.innerHTML = ALL_DESIGNS.slice(0, 8).map(d => designCard(d)).join('');
}

function renderSpotlight() {
  const el = document.getElementById('spotlightGrid');
  if (!el) return;
  el.innerHTML = MOCK_DESIGNERS.map(d => `
    <div class="spotlight-card" onclick="showDesignerProfile('${d.id}')">
      <div class="sp-avatar">${d.initials}</div>
      <div class="sp-name">${d.name}</div>
      <div class="sp-level">${levelLabel(d.level)}</div>
      <div class="sp-stats">
        <div class="sp-stat"><span class="sp-stat-n">${d.designs}</span><span class="sp-stat-l">Tasarım</span></div>
        <div class="sp-stat"><span class="sp-stat-n">${d.sales}</span><span class="sp-stat-l">Satış</span></div>
        <div class="sp-stat"><span class="sp-stat-n">${d.rating}</span><span class="sp-stat-l">Puan</span></div>
      </div>
    </div>
  `).join('');
}

function renderHomeComps() {
  const el = document.getElementById('homeComps');
  if (!el) return;
  el.innerHTML = MOCK_COMPETITIONS.map(c => compCard(c)).join('');
}

/* ══════════ DESIGN CARD ══════════ */
function designCard(d) {
  const isFav = favorites.has(String(d.id));
  const colDots = (d.colors || []).map(c => `<div class="dc-color-dot" style="background:${c}"></div>`).join('');
  const licTag = d.license === 'exclusive' ? `<span class="tag tag-excl" style="font-size:10px;padding:3px 7px">Exclusive</span>` : '';
  const hotTag = d.sales > 80 ? `<span class="tag tag-hot" style="font-size:10px;padding:3px 7px">Çok Satan</span>` : d.id === 'm1' || d.id === 'm2' ? `<span class="tag tag-new" style="font-size:10px;padding:3px 7px">Yeni</span>` : '';
  const badge = licTag || hotTag;

  // Gerçek fotoğraf varsa göster, yoksa gradient placeholder
  const imgContent = d.coverUrl
    ? `<img src="${d.coverThumb || d.coverUrl}" alt="${d.title}" style="width:100%;height:100%;object-fit:cover;transition:transform 0.4s ease" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const placeholderStyle = d.coverUrl ? 'display:none' : 'display:flex';

  return `
    <div class="design-card" onclick="showDesignDetail('${d.id}')">
      <div class="dc-img">
        <div style="width:100%;height:100%;position:relative;overflow:hidden">
          ${imgContent}
          <div class="dc-img-placeholder" style="background:${d.bg};width:100%;height:100%;position:${d.coverUrl?'absolute':'relative'};inset:0;${placeholderStyle};align-items:center;justify-content:center">
            <div style="width:70px;height:84px;background:rgba(255,255,255,0.12);border-radius:8px 8px 14px 14px;display:flex;align-items:center;justify-content:center;position:relative;border:1px solid rgba(255,255,255,0.08)">
              <div style="position:absolute;left:0;right:0;height:3px;top:50%;transform:translateY(-50%);background:${d.colors && d.colors[1] ? d.colors[1] : 'rgba(255,255,255,0.4)'}"></div>
              <span style="font-family:'Bebas Neue',sans-serif;font-size:26px;color:rgba(255,255,255,0.7);position:relative;z-index:1">${d.num}</span>
            </div>
          </div>
        </div>
        ${badge ? `<div class="dc-badge-top">${badge}</div>` : ''}
        <div class="dc-overlay">
          <button class="dc-action" onclick="event.stopPropagation();openBuyModal('${d.id}')">Satın Al</button>
          <button class="dc-fav ${isFav ? 'fav-active' : ''}" onclick="event.stopPropagation();toggleFav('${d.id}',this)">${isFav ? '♥' : '♡'}</button>
        </div>
      </div>
      <div class="dc-body">
        <div class="dc-sport">${d.sport}</div>
        <div class="dc-title">${d.title}</div>
        <div class="dc-designer">by <span onclick="event.stopPropagation();showDesignerProfile('${d.id}')">${d.designer}</span></div>
        <div class="dc-footer">
          <span class="dc-price">₺${(d.price||0).toLocaleString('tr-TR')}</span>
          <div class="dc-meta">
            <span>♥ ${d.likes}</span>
            <div class="dc-colors">${colDots}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ══════════ COMPETITION CARD ══════════ */
function compCard(c) {
  return `
    <div class="comp-card">
      <div class="comp-club">${c.club}</div>
      <div class="comp-desc">${c.desc}</div>
      <div class="comp-meta">
        <span class="comp-prize">${c.prize}</span>
        <span class="comp-deadline">${c.deadline}</span>
      </div>
      <span class="comp-badge">${c.entries} katılımcı</span>
    </div>
  `;
}

/* ══════════ EXPLORE ══════════ */
function renderExplore() { exploreOffset = 0; applyFilters(); }

function getFilteredDesigns() {
  const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const sort = document.getElementById('sortSel')?.value || 'popular';
  const checkedSports = [...document.querySelectorAll('.fp-check input[type=checkbox]:checked')]
    .filter(i => ['Futbol','Basketbol','Voleybol','E-Spor','Rugby','Amerikan Futbolu','Hentbol','Futbol Akademi'].includes(i.value))
    .map(i => i.value);
  const checkedStyles = [...document.querySelectorAll('.fp-check input[type=checkbox]:checked')]
    .filter(i => ['modern','retro','minimal','futuristic','classic','street','pro team'].includes(i.value))
    .map(i => i.value);
  const checkedPatterns = [...document.querySelectorAll('.fp-check input[type=checkbox]:checked')]
    .filter(i => ['stripes','gradient','geometric','camo','abstract','minimal','retro'].includes(i.value))
    .map(i => i.value);
  const checkedLicenses = [...document.querySelectorAll('.fp-check input[type=checkbox]:checked')]
    .filter(i => ['standard','exclusive'].includes(i.value))
    .map(i => i.value);
  const priceMin = parseFloat(document.getElementById('priceMin')?.value) || 0;
  const priceMax = parseFloat(document.getElementById('priceMax')?.value) || Infinity;

  let filtered = ALL_DESIGNS.filter(d => {
    if (search && !d.title.toLowerCase().includes(search) && !(d.designer||'').toLowerCase().includes(search) && !(d.sport||'').toLowerCase().includes(search)) return false;
    if (checkedSports.length && !checkedSports.includes(d.sport)) return false;
    if (checkedStyles.length && !checkedStyles.includes(d.style)) return false;
    if (checkedPatterns.length && !checkedPatterns.includes(d.pattern)) return false;
    if (checkedLicenses.length && !checkedLicenses.includes(d.license)) return false;
    if ((d.price||0) < priceMin || (d.price||0) > priceMax) return false;
    if (selectedColors.size > 0) {
      const matchColor = [...selectedColors].some(sc =>
        (d.colors||[]).some(dc => colorSimilar(dc, sc))
      );
      if (!matchColor) return false;
    }
    return true;
  });

  if (sort === 'newest') filtered = [...filtered].reverse();
  else if (sort === 'price-asc') filtered = [...filtered].sort((a, b) => (a.price||0) - (b.price||0));
  else if (sort === 'price-desc') filtered = [...filtered].sort((a, b) => (b.price||0) - (a.price||0));
  else if (sort === 'bestseller') filtered = [...filtered].sort((a, b) => (b.sales||0) - (a.sales||0));
  else filtered = [...filtered].sort((a, b) => (b.likes||0) - (a.likes||0));

  return filtered;
}

function applyFilters() {
  const filtered = getFilteredDesigns();
  const grid = document.getElementById('exploreGrid');
  if (!grid) return;
  exploreOffset = Math.min(12, filtered.length);
  grid.innerHTML = filtered.slice(0, exploreOffset).map(d => designCard(d)).join('');
  const count = document.getElementById('resultsCount');
  if (count) count.textContent = `${filtered.length} tasarım bulundu`;
}

function loadMore() {
  const filtered = getFilteredDesigns();
  const grid = document.getElementById('exploreGrid');
  if (!grid) return;
  const next = filtered.slice(exploreOffset, exploreOffset + 8);
  grid.innerHTML += next.map(d => designCard(d)).join('');
  exploreOffset += next.length;
  if (exploreOffset >= filtered.length) {
    document.querySelector('.btn-load').style.display = 'none';
  }
}

function clearFilters() {
  document.querySelectorAll('.fp-check input').forEach(i => i.checked = false);
  document.getElementById('priceMin').value = '';
  document.getElementById('priceMax').value = '';
  document.getElementById('searchInput').value = '';
  selectedColors.clear();
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('active'));
  applyFilters();
}

function toggleFilterPanel() { document.getElementById('filterPanel').classList.toggle('open'); }

function toggleSwatch(el) {
  const hex = el.dataset.hex;
  el.classList.toggle('active');
  if (el.classList.contains('active')) selectedColors.add(hex);
  else selectedColors.delete(hex);
  applyFilters();
}

function colorSimilar(c1, c2) {
  const r = (hex) => [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)];
  try {
    const [r1,g1,b1] = r(c1), [r2,g2,b2] = r(c2);
    return Math.abs(r1-r2) + Math.abs(g1-g2) + Math.abs(b1-b2) < 120;
  } catch(e) { return false; }
}

/* ══════════ DESIGN DETAIL ══════════ */
function showDesignDetail(id) {
  const d = ALL_DESIGNS.find(x => String(x.id) === String(id));
  if (!d) return;
  currentDesignId = id;
  showPage('detail');

  // Gerçek görselleri veya placeholder hazırla
  const imgs = d.imageUrls || {};
  const slots = [
    { key: 'front',   label: 'Ön',     url: d.coverUrl || '' },
    { key: 'back',    label: 'Arka',   url: imgs.back?.url || '' },
    { key: 'detail',  label: 'Detay',  url: imgs.detail?.url || '' },
    { key: 'flat',    label: 'Flat',   url: imgs.flat?.url || '' },
    { key: 'model',   label: 'Model',  url: imgs.model?.url || '' },
    { key: 'texture', label: 'Kumaş',  url: imgs.texture?.url || '' },
  ].filter(s => s.url || s.key === 'front' || s.key === 'back' || s.key === 'detail' || s.key === 'flat');

  const mainImgHtml = d.coverUrl
    ? `<img src="${d.coverUrl}" alt="${d.title}" style="width:100%;height:100%;object-fit:contain">`
    : `<div style="width:100%;height:100%;background:${d.bg};display:flex;align-items:center;justify-content:center">
        <div style="width:140px;height:168px;background:rgba(255,255,255,0.12);border-radius:12px 12px 24px 24px;display:flex;align-items:center;justify-content:center;position:relative;border:1px solid rgba(255,255,255,0.08)">
          <div style="position:absolute;left:0;right:0;height:4px;top:50%;transform:translateY(-50%);background:${d.colors && d.colors[1] ? d.colors[1] : 'rgba(255,255,255,0.4)'}"></div>
          <span style="font-family:'Bebas Neue',sans-serif;font-size:56px;color:rgba(255,255,255,0.7);position:relative;z-index:1">${d.num}</span>
        </div>
      </div>`;

  const thumbsHtml = slots.map((s, i) => {
    const thumbStyle = s.url
      ? `overflow:hidden`
      : `background:${d.bg};display:flex;align-items:center;justify-content:center`;
    const thumbContent = s.url
      ? `<img src="${s.url}" alt="${s.label}" style="width:100%;height:100%;object-fit:cover">`
      : `<span style="font-size:10px;color:rgba(255,255,255,0.5)">${s.label}</span>`;
    return `<div class="detail-thumb ${i===0?'active':''}" style="${thumbStyle}" onclick="switchDetailImg(this,'${s.url || ''}','${d.bg}','${d.num}','${s.label}')">${thumbContent}</div>`;
  }).join('');

  const content = document.getElementById('detailContent');
  const isFav = favorites.has(String(id));
  content.innerHTML = `
    <div class="detail-grid">
      <div class="detail-imgs">
        <div class="detail-main-img" id="detailMainImg">${mainImgHtml}</div>
        <div class="detail-thumbs">${thumbsHtml}</div>
      </div>

      <div class="detail-info">
        <div class="detail-sport-badge">${d.sport} · ${d.kit}</div>
        <h1 class="detail-title">${d.title}</h1>
        <div class="detail-designer-row">
          <div class="detail-designer-av">${d.designerInitials}</div>
          <span>by <a class="detail-designer-name" onclick="showDesignerProfile('${d.id}')">${d.designer}</a></span>
          <span style="margin-left:auto;font-size:12px">♥ ${d.likes} beğeni</span>
        </div>

        ${d.desc ? `<p style="font-size:14px;color:var(--text2);margin-bottom:16px;line-height:1.6">${d.desc}</p>` : ''}

        <div class="detail-colors">
          ${(d.colors||[]).map(c => `<div class="det-color" style="background:${c}" title="${c}"></div>`).join('')}
          <span style="font-size:12px;color:var(--text3);margin-left:6px">${(d.colors||[]).join(' · ')}</span>
        </div>

        <div class="detail-meta-grid">
          <div class="dm-item"><div class="dm-label">Stil</div><div class="dm-val" style="text-transform:capitalize">${d.style}</div></div>
          <div class="dm-item"><div class="dm-label">Desen</div><div class="dm-val" style="text-transform:capitalize">${d.pattern}</div></div>
          <div class="dm-item"><div class="dm-label">Toplam Satış</div><div class="dm-val">${d.sales}</div></div>
          <div class="dm-item"><div class="dm-label">Lisans</div><div class="dm-val">${d.license === 'exclusive' ? 'Exclusive' : 'Standart'}</div></div>
        </div>

        <div class="detail-license-sel" id="licSel">
          <div class="lic-option selected" onclick="selectLicense(this,'standard',${d.price})">
            <input type="radio" name="licRadio" checked>
            <div class="lic-opt-info">
              <div class="lic-opt-name">Standart Lisans</div>
              <div class="lic-opt-desc">Birden fazla takım satın alabilir</div>
            </div>
            <div class="lic-opt-price">₺${(d.price||0).toLocaleString('tr-TR')}</div>
          </div>
          <div class="lic-option" onclick="selectLicense(this,'exclusive',${d.exclusivePrice})">
            <input type="radio" name="licRadio">
            <div class="lic-opt-info">
              <div class="lic-opt-name">Exclusive Lisans</div>
              <div class="lic-opt-desc">Tek kulüp alır — tasarım yayından kalkar</div>
            </div>
            <div class="lic-opt-price">₺${(d.exclusivePrice||0).toLocaleString('tr-TR')}</div>
          </div>
        </div>

        <button class="btn-buy-now" onclick="openBuyModal('${d.id}')">Satın Al</button>
        <button class="btn-fav-full" onclick="toggleFav('${d.id}', this)">${isFav ? '♥ Favorilerden Çıkar' : '♡ Favorilere Ekle'}</button>

        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border)">
          <div style="font-size:11px;color:var(--text3);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.08em">Üretim Dosyaları</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${['PNG','AI','SVG','PDF'].map(f => `<span style="background:var(--bg4);border:1px solid var(--border);border-radius:6px;padding:4px 10px;font-size:11px;font-family:var(--font-mono)">${f}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Detay sayfasında thumbnail'a tıklayınca ana görseli değiştir
function switchDetailImg(thumbEl, url, bg, num, label) {
  document.querySelectorAll('.detail-thumb').forEach(t => t.classList.remove('active'));
  thumbEl.classList.add('active');
  const main = document.getElementById('detailMainImg');
  if (!main) return;
  if (url) {
    main.innerHTML = `<img src="${url}" alt="${label}" style="width:100%;height:100%;object-fit:contain">`;
  } else {
    main.innerHTML = `<div style="width:100%;height:100%;background:${bg};display:flex;align-items:center;justify-content:center"><span style="font-family:'Bebas Neue',sans-serif;font-size:48px;color:rgba(255,255,255,0.4)">${label}</span></div>`;
  }
}

function selectLicense(el, type, price) {
  document.querySelectorAll('.lic-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input').checked = true;
}

/* ══════════ DESIGNERS PAGE ══════════ */
function renderDesignersPage() {
  const grid = document.getElementById('designersGrid');
  if (!grid) return;
  grid.innerHTML = MOCK_DESIGNERS.map(d => `
    <div class="designer-card" onclick="showDesignerProfile('${d.id}')">
      <div class="designer-card-top">
        <div class="dcard-av">${d.initials}</div>
        <div>
          <div class="dcard-name">${d.name}</div>
          <div class="dcard-level">${levelLabel(d.level)}</div>
        </div>
      </div>
      <div class="dcard-stats">
        <div class="dcard-stat"><div class="dcard-stat-n">${d.designs}</div><div class="dcard-stat-l">Tasarım</div></div>
        <div class="dcard-stat"><div class="dcard-stat-n">${d.sales}</div><div class="dcard-stat-l">Satış</div></div>
        <div class="dcard-stat"><div class="dcard-stat-n">${d.rating}</div><div class="dcard-stat-l">Puan</div></div>
      </div>
    </div>
  `).join('');
}

function showDesignerProfile(id) {
  const d = MOCK_DESIGNERS.find(x => String(x.id) === String(id)) || MOCK_DESIGNERS[0];
  const designs = ALL_DESIGNS.filter(x => x.designer === d.name || Math.random() > 0.5).slice(0, 4);
  showPage('designer-profile');
  const el = document.getElementById('designerProfileContent');
  el.innerHTML = `
    <button class="back-btn" onclick="goBack()">← Geri</button>
    <div style="display:flex;align-items:center;gap:24px;padding:28px 0 32px;border-bottom:1px solid var(--border);margin-bottom:32px">
      <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#ff9f43);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:32px;color:#fff;flex-shrink:0">${d.initials}</div>
      <div>
        <h1 style="font-family:'Bebas Neue',sans-serif;font-size:40px;letter-spacing:0.5px;margin-bottom:6px">${d.name}</h1>
        <div style="display:flex;align-items:center;gap:12px">
          <span class="level-badge ${d.level}">${levelLabel(d.level)}</span>
          <span style="font-size:13px;color:var(--text2)">${d.bio}</span>
        </div>
      </div>
      <div style="margin-left:auto;display:flex;gap:24px;text-align:center">
        <div><div style="font-family:'Bebas Neue',sans-serif;font-size:32px">${d.designs}</div><div style="font-size:12px;color:var(--text3)">Tasarım</div></div>
        <div><div style="font-family:'Bebas Neue',sans-serif;font-size:32px">${d.sales}</div><div style="font-size:12px;color:var(--text3)">Satış</div></div>
        <div><div style="font-family:'Bebas Neue',sans-serif;font-size:32px">${d.rating}</div><div style="font-size:12px;color:var(--text3)">Puan</div></div>
      </div>
    </div>
    <h2 style="font-family:'Bebas Neue',sans-serif;font-size:24px;margin-bottom:20px">Tasarımları</h2>
    <div class="designs-grid" style="padding-bottom:60px">
      ${designs.map(x => designCard(x)).join('')}
    </div>
  `;
}

function levelLabel(level) {
  const map = { rookie: 'Rookie', pro: 'Pro', elite: 'Elite', master: 'Master' };
  return map[level] || 'Rookie';
}

/* ══════════ COMPETITIONS PAGE ══════════ */
function renderCompetitionsPage() {
  const grid = document.getElementById('compsGrid');
  if (!grid) return;
  grid.innerHTML = MOCK_COMPETITIONS.map(c => `
    <div class="comp-card">
      <div class="comp-club">${c.club}</div>
      <div class="comp-desc">${c.desc}</div>
      <div class="comp-meta">
        <span class="comp-prize">${c.prize}</span>
        <span class="comp-deadline">${c.deadline}</span>
      </div>
      <span class="comp-badge">${c.entries} katılımcı</span>
      <button style="margin-top:14px;width:100%;padding:10px;background:var(--accent);border:none;border-radius:var(--r);color:#fff;font-size:13px;cursor:pointer" onclick="showToast('Yarışmaya katılmak için giriş yapın','')">Katıl</button>
    </div>
  `).join('');
}

/* ══════════ DASHBOARD GERÇEK VERİ ══════════ */
async function loadDashboardOverview() {
  if (!currentUser) return;
  try {
    const snapshot = await db.collection('designs')
      .where('designerId', '==', currentUser.uid)
      .orderBy('createdAt', 'desc')
      .get();

    let totalDesigns = 0, totalSales = 0, totalLikes = 0, pendingCount = 0;
    const recentDesigns = [];

    snapshot.forEach(doc => {
      const d = doc.data();
      totalDesigns++;
      totalSales += d.sales || 0;
      totalLikes += d.likes || 0;
      if (d.status === 'pending') pendingCount++;
      if (recentDesigns.length < 3) recentDesigns.push({ id: doc.id, ...d });
    });

    const totalEarnings = totalSales * 0; // Gerçek satış verisi gelince hesaplanır

    const statsEl = document.getElementById('dashStatsGrid');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="ds-card"><div class="ds-label">Tasarım Sayısı</div><div class="ds-val">${totalDesigns}</div></div>
        <div class="ds-card"><div class="ds-label">Toplam Satış</div><div class="ds-val accent">${totalSales}</div></div>
        <div class="ds-card"><div class="ds-label">Toplam Beğeni</div><div class="ds-val">${totalLikes}</div></div>
        <div class="ds-card"><div class="ds-label">Onay Bekleyen</div><div class="ds-val gold">${pendingCount}</div></div>
      `;
    }

    const recentEl = document.getElementById('dashRecentDesigns');
    if (recentEl) {
      if (recentDesigns.length === 0) {
        recentEl.innerHTML = `<div style="text-align:center;padding:40px 20px">
          <p style="color:var(--text2);margin-bottom:16px">Henüz tasarım yüklemedin.</p>
          <button class="btn-cta" onclick="showModal('uploadModal')">+ İlk Tasarımını Yükle</button>
        </div>`;
      } else {
        recentEl.innerHTML = `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden">
          ${recentDesigns.map(d => `
            <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center" onclick="showDesignDetail('${d.id}')" style="cursor:pointer">
              <div>
                <div style="font-size:14px;font-weight:500">${d.title}</div>
                <div style="font-size:11px;color:var(--text3);margin-top:2px">${d.sport} · ₺${d.price}</div>
              </div>
              <span style="font-size:11px;padding:3px 10px;border-radius:4px;${
                d.status === 'approved' ? 'background:rgba(42,157,143,0.15);color:#4ecdc4' :
                d.status === 'pending'  ? 'background:rgba(201,168,76,0.15);color:var(--gold)' :
                                          'background:rgba(230,57,70,0.15);color:var(--accent)'
              }">${
                d.status === 'approved' ? '✓ Yayında' :
                d.status === 'pending'  ? '⏳ Bekliyor' : '✕ Reddedildi'
              }</span>
            </div>
          `).join('')}
        </div>`;
      }
    }
  } catch(e) {
    console.error('Dashboard verisi çekilemedi:', e);
    const statsEl = document.getElementById('dashStatsGrid');
    if (statsEl) statsEl.innerHTML = `<div class="ds-card"><div class="ds-label">Veri yüklenemedi</div><div class="ds-val">—</div></div>`;
  }
}

/* ══════════ DASHBOARD & GİZLİ ADMİN PANELİ ══════════ */
function renderDashboard() {
  if (!currentUser) {
    document.getElementById('dashContent').innerHTML = `
      <div style="text-align:center;padding:80px 20px">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:48px;margin-bottom:16px">Giriş Gerekli</div>
        <p style="color:var(--text2);margin-bottom:24px">Dashboard'a erişmek için giriş yapmanız gerekiyor.</p>
        <button class="btn-cta" onclick="showModal('loginModal')">Giriş Yap</button>
      </div>
    `;
    return;
  }
  dashTab('overview', document.querySelector('.dn-item'));
}

function dashTab(tab, btn) {
  document.querySelectorAll('.dn-item').forEach(i => i.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const el = document.getElementById('dashContent');

  if (tab === 'overview') {
    el.innerHTML = `
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:24px">Hoş geldin, ${currentUser?.name || 'Tasarımcı'} 👋</h2>
      <div class="dash-stats" id="dashStatsGrid">
        <div class="ds-card"><div class="ds-label">Yükleniyor...</div><div class="ds-val">—</div></div>
      </div>
      <div class="dash-section-title" style="margin-top:24px">Son Tasarımlarım</div>
      <div id="dashRecentDesigns" style="color:var(--text2);font-size:13px">Yükleniyor...</div>
    `;
    // Gerçek verileri Firestore'dan çek
    loadDashboardOverview();
  } else if (tab === 'mydesigns') {
    // Sadece giriş yapan kullanıcının tasarımlarını göster
    const myDesigns = ALL_DESIGNS.filter(d => d.designerId === currentUser?.uid || d.designer === currentUser?.name);
    
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px">Tasarımlarım</h2>
        <button class="btn-primary" onclick="showModal('uploadModal')">+ Yeni Yükle</button>
      </div>
      <div class="designs-grid">
        ${myDesigns.length > 0 
            ? myDesigns.map(d => designCard(d)).join('') 
            : '<p style="color:var(--text2)">Henüz bir tasarım yüklemedin.</p>'}
      </div>
    `;
  } else if (tab === 'sales') {
    el.innerHTML = `
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:24px">Satışlar</h2>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden">
        <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:grid;grid-template-columns:1fr 1fr 1fr 1fr;font-size:11px;color:var(--text3);font-family:'DM Mono',monospace;text-transform:uppercase;letter-spacing:0.08em">
          <span>Tasarım</span><span>Alıcı</span><span>Fiyat</span><span>Tarih</span>
        </div>
        ${[
          { d: 'Gece Yarısı Pro', b: 'FC Bosphorus', p: '₺449', t: '12 Mar 2026' },
          { d: 'Anadolu Kırmızısı', b: 'Ankara United', p: '₺299', t: '9 Mar 2026' },
          { d: 'Geo Minimal', b: 'Ege Voleybol', p: '₺299', t: '5 Mar 2026' },
        ].map(s => `
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:grid;grid-template-columns:1fr 1fr 1fr 1fr;font-size:13px;align-items:center">
            <span>${s.d}</span><span style="color:var(--text2)">${s.b}</span>
            <span style="color:var(--accent);font-family:'DM Mono',monospace">${s.p}</span>
            <span style="color:var(--text3);font-size:12px">${s.t}</span>
          </div>
        `).join('')}
      </div>
    `;
  } else if (tab === 'earnings') {
    el.innerHTML = `
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:24px">Kazançlar</h2>
      <div class="dash-stats">
        <div class="ds-card"><div class="ds-label">Bu Ay</div><div class="ds-val gold">₺2.150</div></div>
        <div class="ds-card"><div class="ds-label">Toplam</div><div class="ds-val gold">₺8.640</div></div>
        <div class="ds-card"><div class="ds-label">Bekleyen</div><div class="ds-val">₺449</div></div>
      </div>
      <div style="margin-top:20px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-lg);padding:20px;text-align:center">
        <div style="font-size:13px;color:var(--text2);margin-bottom:12px">Minimum ₺500 tutarında çekim yapabilirsin</div>
        <button class="btn-cta" onclick="showToast('iyzico ödeme sistemi entegrasyonu gerekiyor','')">Ödeme İste</button>
      </div>
    `;
  } else if (tab === 'favorites') {
    const favDesigns = ALL_DESIGNS.filter(d => favorites.has(String(d.id)));
    el.innerHTML = `
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:24px">Favorilerim</h2>
      ${favDesigns.length === 0
        ? `<div style="text-align:center;padding:60px 20px;color:var(--text2)">Henüz favori tasarımın yok.<br><a href="#" onclick="showPage('explore')" style="color:var(--accent)">Tasarımları keşfet →</a></div>`
        : `<div class="designs-grid">${favDesigns.map(d => designCard(d)).join('')}</div>`
      }
    `;
  } else if (tab === 'settings') {
    el.innerHTML = `
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:24px">Ayarlar</h2>
      <div style="max-width:520px">
        <div class="fg"><label>İsim</label><input type="text" value="${currentUser?.name || ''}"></div>
        <div class="fg"><label>E-posta</label><input type="email" value="${currentUser?.email || ''}"></div>
        <div class="fg"><label>Bio</label><textarea rows="3" placeholder="Kendini tanıt..."></textarea></div>
        <button class="btn-form" onclick="showToast('Profil güncellendi ✓','success')">Kaydet</button>
        <div style="margin-top:20px;padding-top:20px;border-top:1px solid var(--border)">
          <button style="padding:10px 16px;background:transparent;border:1px solid rgba(230,57,70,0.4);color:var(--accent);border-radius:var(--r);font-size:13px;cursor:pointer" onclick="doLogout()">Çıkış Yap</button>
        </div>
      </div>
    `;
  } else if (tab === 'adminPanel') { 
    el.innerHTML = `
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:24px; color:var(--accent)">Admin Paneli - Onay Bekleyenler</h2>
      <div id="adminPendingGrid" class="designs-grid" style="grid-template-columns: 1fr;">Yükleniyor...</div>
    `;
    loadPendingDesigns();
  }
}

/* ══════════ ADMİN ONAY/RED FONKSİYONLARI ══════════ */
async function loadPendingDesigns() {
  const grid = document.getElementById('adminPendingGrid');
  try {
    const snapshot = await db.collection('designs').where('status', '==', 'pending').get();
    if (snapshot.empty) {
      grid.innerHTML = '<div style="padding:20px; background:var(--bg3); border-radius:var(--r); color:var(--text2);">Onay bekleyen yeni tasarım yok. 🎉</div>';
      return;
    }
    
    let html = '';
    snapshot.forEach(doc => {
      const d = doc.data();
      const id = doc.id;
      html += `
        <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg3); border:1px solid var(--border); border-left:4px solid var(--gold); padding:16px 20px; border-radius:var(--r); margin-bottom:12px;">
          <div>
            <div style="font-size:16px; font-weight:500; margin-bottom:4px;">${d.title}</div>
            <div style="font-size:12px; color:var(--text2); font-family:var(--font-mono)">
              <span style="color:var(--accent)">by ${d.designerName}</span> • ${d.sport} • ₺${d.price}
            </div>
          </div>
          <div style="display:flex; gap:10px;">
            <button onclick="approveDesign('${id}')" style="padding:8px 16px; background:rgba(42,157,143,0.15); color:#4ecdc4; border:1px solid #4ecdc4; border-radius:6px; cursor:pointer; font-weight:500; font-size:13px;">✓ Onayla</button>
            <button onclick="rejectDesign('${id}')" style="padding:8px 16px; background:rgba(230,57,70,0.15); color:var(--accent); border:1px solid var(--accent); border-radius:6px; cursor:pointer; font-weight:500; font-size:13px;">✕ Reddet</button>
          </div>
        </div>
      `;
    });
    grid.innerHTML = html;
  } catch(error) {
    grid.innerHTML = '<p style="color:var(--accent)">Veriler çekilirken hata oluştu.</p>';
    console.error(error);
  }
}

async function approveDesign(id) {
  try {
    await db.collection('designs').doc(id).update({ status: 'approved' });
    showToast('Tasarım onaylandı ve yayına alındı! ✓', 'success');
    loadPendingDesigns(); // Bekleyenler listesini yenile
    fetchApprovedDesigns(); // Ana sayfayı hemen yenile ki görünsün!
  } catch(e) {
    showToast('Onaylama hatası: ' + e.message, 'error');
  }
}

async function rejectDesign(id) {
  if(!confirm('Bu tasarımı tamamen reddetmek istediğinize emin misiniz?')) return;
  try {
    await db.collection('designs').doc(id).update({ status: 'rejected' });
    showToast('Tasarım reddedildi ✕', '');
    loadPendingDesigns(); // Listeyi yenile
  } catch(e) {
    showToast('Hata: ' + e.message, 'error');
  }
}

/* ══════════ AUTH (GERÇEK FIREBASE) ══════════ */
auth.onAuthStateChanged((user) => {
  if (user) {
    currentUser = { name: user.displayName || user.email.split('@')[0], email: user.email, uid: user.uid };
    document.getElementById('navLoginBtn').classList.add('hidden');
    document.getElementById('navAvatar').classList.remove('hidden');
    document.getElementById('navAvatar').textContent = currentUser.name[0].toUpperCase();
    
    const dashAv = document.getElementById('dashAv');
    if(dashAv) dashAv.textContent = currentUser.name[0].toUpperCase();
    const dashUname = document.getElementById('dashUname');
    if(dashUname) dashUname.textContent = currentUser.name;

    // EĞER GİREN KİŞİ ADMİN İSE GİZLİ BUTONU GÖSTER
    const adminBtn = document.getElementById('dashAdminBtn');
    if(adminBtn) {
      if (ADMIN_EMAILS.includes(user.email)) {
        adminBtn.classList.remove('hidden');
      } else {
        adminBtn.classList.add('hidden');
      }
    }
    
  } else {
    currentUser = null;
    document.getElementById('navLoginBtn').classList.remove('hidden');
    document.getElementById('navAvatar').classList.add('hidden');
  }
});

async function doLogin() {
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;
  if (!email || !pass) { showToast('E-posta ve şifre gerekli', 'error'); return; }
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    closeModal('loginModal');
    showToast('Hoş geldin! ✓', 'success');
  } catch (error) {
    const msgs = {
      'auth/user-not-found': 'Bu e-posta kayıtlı değil.',
      'auth/wrong-password': 'Şifre yanlış.',
      'auth/invalid-email': 'Geçersiz e-posta.',
      'auth/too-many-requests': 'Çok fazla deneme. Lütfen bekleyin.'
    };
    showToast(msgs[error.code] || 'Giriş başarısız.', 'error');
  }
}

async function doRegister() {
  const name = document.getElementById('regName')?.value?.trim();
  const email = document.getElementById('regEmail').value;
  const pass = document.getElementById('regPass').value;
  const role = document.getElementById('regRole')?.value || 'designer';
  if (!name || !email || !pass) { showToast('Tüm alanları doldurun', 'error'); return; }
  if (pass.length < 6) { showToast('Şifre en az 6 karakter olmalı', 'error'); return; }
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    // Firebase Auth profiline isim kaydet
    await cred.user.updateProfile({ displayName: name });
    // Firestore'a kullanıcı profili kaydet
    await db.collection('users').doc(cred.user.uid).set({
      name: name,
      email: email,
      role: role,
      level: 'rookie',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal('loginModal');
    showToast(`Hoş geldin, ${name}! ✓`, 'success');
  } catch (error) {
    const msgs = {
      'auth/email-already-in-use': 'Bu e-posta zaten kayıtlı.',
      'auth/weak-password': 'Şifre çok zayıf.',
      'auth/invalid-email': 'Geçersiz e-posta.'
    };
    showToast(msgs[error.code] || 'Kayıt olunamadı: ' + error.message, 'error');
  }
}

async function doGoogleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
    closeModal('loginModal');
    showToast('Google ile giriş yapıldı!', 'success');
  } catch (error) {
    showToast('Giriş iptal edildi.', 'error');
  }
}

async function doLogout() {
  try {
    await auth.signOut();
    showPage('home');
    showToast('Çıkış yapıldı', '');
  } catch (error) {
    showToast('Hata: ' + error.message, 'error');
  }
}

function authTab(tab, btn) {
  document.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('authLogin').classList.toggle('hidden', tab !== 'login');
  document.getElementById('authRegister').classList.toggle('hidden', tab !== 'register');
}

/* ══════════ BUY MODAL ══════════ */
function openBuyModal(id) {
  const d = ALL_DESIGNS.find(x => String(x.id) === String(id));
  if (!d) return;
  const el = document.getElementById('buyContent');
  el.innerHTML = `
    <div class="buy-design-row">
      <div class="buy-thumb" style="background:${d.bg}">
        <span style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:rgba(255,255,255,0.6)">${d.num}</span>
      </div>
      <div>
        <div class="buy-title">${d.title}</div>
        <div class="buy-designer">by ${d.designer}</div>
      </div>
    </div>
    <div class="buy-license">
      <div class="buy-lic-opt sel" onclick="selectBuyLicense(this,${d.price})">
        <input type="radio" name="buyLic" checked>
        <span class="buy-lic-name">Standart Lisans</span>
        <span class="buy-lic-price">₺${(d.price||0).toLocaleString('tr-TR')}</span>
      </div>
      <div class="buy-lic-opt" onclick="selectBuyLicense(this,${d.exclusivePrice})">
        <input type="radio" name="buyLic">
        <span class="buy-lic-name">Exclusive Lisans</span>
        <span class="buy-lic-price">₺${(d.exclusivePrice||0).toLocaleString('tr-TR')}</span>
      </div>
    </div>
    <div class="buy-total">
      <span>Toplam</span>
      <span class="buy-total-price" id="buyTotal">₺${(d.price||0).toLocaleString('tr-TR')}</span>
    </div>
    <div class="iyzico-badge">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 5h12v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5z" stroke="#4ecdc4" stroke-width="1.2"/><path d="M2 5V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" stroke="#4ecdc4" stroke-width="1.2"/></svg>
      iyzico ile güvenli ödeme
    </div>
    <button class="btn-form" onclick="processBuy('${d.id}')">Ödemeye Geç</button>
    <p style="font-size:11px;color:var(--text3);text-align:center;margin-top:10px">Satın alma onaylanınca üretim dosyaları anında hesabına teslim edilir</p>
  `;
  showModal('buyModal');
}

function selectBuyLicense(el, price) {
  document.querySelectorAll('.buy-lic-opt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel');
  el.querySelector('input').checked = true;
  document.getElementById('buyTotal').textContent = `₺${price.toLocaleString('tr-TR')}`;
}

function processBuy(id) {
  if (!currentUser) {
    closeModal('buyModal');
    showModal('loginModal');
    showToast('Satın almak için giriş yapın', '');
    return;
  }
  closeModal('buyModal');
  showToast('🎉 Satın alma tamamlandı! Dosyalar hesabınıza eklendi.', 'success');
}

/* ══════════ IMGBB ENTEGRASYONU ══════════ */
const IMGBB_API_KEY = '8450d2c8a81b83cde9453909f3d7cb28';

// Tek bir dosyayı ImgBB'ye yükle, URL döndür
async function uploadToImgBB(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
    method: 'POST',
    body: formData
  });
  const data = await res.json();
  if (!data.success) throw new Error('ImgBB yükleme hatası: ' + (data.error?.message || 'Bilinmeyen hata'));
  return {
    url: data.data.url,          // Doğrudan URL
    thumb: data.data.thumb.url,  // Küçük önizleme URL
    display: data.data.display_url
  };
}

// Birden fazla slot'taki dosyaları ImgBB'ye yükle
async function uploadAllSlotImages() {
  const slots = ['s-front','s-back','s-detail','s-flat','s-model','s-tex','s-pat','s-var','s-field','s-pkg'];
  const slotNames = {
    's-front': 'front', 's-back': 'back', 's-detail': 'detail', 's-flat': 'flat',
    's-model': 'model', 's-tex': 'texture', 's-pat': 'pattern',
    's-var': 'colorVar', 's-field': 'field', 's-pkg': 'packaging'
  };
  const results = {};
  
  for (const slotId of slots) {
    const slot = document.getElementById(slotId);
    if (!slot) continue;
    const imgEl = slot.querySelector('img.is-preview');
    if (!imgEl) continue; // Bu slot boş, atla
    
    // Slot'un parent'ındaki file input'u bul
    const fileInput = slot.closest('.img-slot')?.querySelector('input[type="file"]');
    if (!fileInput?.files?.[0]) continue;
    
    try {
      showToast(`Görsel yükleniyor (${slotNames[slotId]})...`, '');
      const imgData = await uploadToImgBB(fileInput.files[0]);
      results[slotNames[slotId]] = imgData;
    } catch(e) {
      console.error(`${slotId} yüklenemedi:`, e);
      // Zorunlu slotlarda hata at
      if (['s-front','s-back','s-detail','s-flat'].includes(slotId)) {
        throw new Error(`Zorunlu görsel yüklenemedi (${slotNames[slotId]}): ${e.message}`);
      }
    }
  }
  return results;
}

/* ══════════ UPLOAD VE FIRESTORE ══════════ */
function wizGo(step) {
  if (step === 2) {
    const req = ['s-front','s-back','s-detail','s-flat'];
    const missing = req.filter(id => !document.getElementById(id)?.querySelector('img'));
    if (missing.length > 0) {
      showToast('4 zorunlu görseli yükleyin', 'error');
      return;
    }
  }
  if (step === 3) {
    if (!document.getElementById('upTitle')?.value.trim()) {
      showToast('Tasarım adı zorunludur', 'error');
      return;
    }
  }

  for (let i = 1; i <= 5; i++) {
    document.getElementById('panel' + i)?.classList.add('hidden');
    document.getElementById('ws' + i)?.classList.remove('active', 'done');
  }
  document.getElementById('panel' + step)?.classList.remove('hidden');
  document.getElementById('ws' + step)?.classList.add('active');
  for (let i = 1; i < step; i++) {
    document.getElementById('ws' + i)?.classList.add('done');
  }
  currentUploadStep = step;
}

function previewSlot(input, slotId) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const slot = document.getElementById(slotId);
    if (slot) {
      slot.innerHTML = `<img src="${e.target.result}" class="is-preview" alt="preview">`;
      slot.closest('.img-slot').classList.add('filled');
    }
  };
  reader.readAsDataURL(file);
}

async function submitDesign() {
  if (!document.getElementById('upCopyright').checked) {
    showToast('Telif beyanını onaylayın', 'error');
    return;
  }
  if (!currentUser) {
    closeModal('uploadModal');
    showModal('loginModal');
    showToast('Tasarım yüklemek için giriş yapmalısınız.', 'error');
    return;
  }

  const title = document.getElementById('upTitle').value.trim();
  if (!title) { showToast('Tasarım adı zorunludur', 'error'); return; }

  const sport    = document.getElementById('upSport').value;
  const kit      = document.getElementById('upKit').value;
  const style    = document.getElementById('upStyle').value;
  const pattern  = document.getElementById('upPattern').value;
  const fabric   = document.getElementById('upFabric').value;
  const desc     = document.getElementById('upDesc').value.trim();
  const tags     = document.getElementById('upTags').value.split(',').map(t => t.trim()).filter(Boolean);
  const c1       = document.getElementById('c1h').value;
  const c2       = document.getElementById('c2h').value;
  const c3       = document.getElementById('c3h').value;
  const stdPrice = Number(document.getElementById('stdPrice').value) || 0;
  const exclPrice= Number(document.getElementById('exclPrice').value) || 0;

  // Yayınla butonunu devre dışı bırak, loading göster
  const publishBtn = document.querySelector('.btn-publish');
  if (publishBtn) { publishBtn.disabled = true; publishBtn.textContent = '⏳ Görseller yükleniyor...'; }

  try {
    // 1. Tüm görselleri ImgBB'ye yükle
    showToast('Görseller ImgBB\'ye yükleniyor...', '');
    let imageUrls = {};
    try {
      imageUrls = await uploadAllSlotImages();
    } catch(imgError) {
      showToast('Görsel yükleme hatası: ' + imgError.message, 'error');
      if (publishBtn) { publishBtn.disabled = false; publishBtn.textContent = 'Tasarımı Yayınla 🚀'; }
      return;
    }

    // 2. Firestore'a kaydet
    showToast('Veriler kaydediliyor...', '');
    const newDesign = {
      title,
      sport,
      kit,
      style,
      pattern,
      fabric,
      desc,
      tags,
      colors: [c1, c2, c3].filter(c => c && c !== '#ffffff' || c === c1),
      price: stdPrice,
      exclusivePrice: exclPrice,
      designerId: currentUser.uid,
      designerName: currentUser.name,
      designerInitials: (currentUser.name[0] || 'U').toUpperCase(),
      // ImgBB'den gelen URL'ler
      imageUrls,          // { front: {url,thumb}, back: {...}, ... }
      coverUrl: imageUrls.front?.url || '',      // Ana kart görseli
      coverThumb: imageUrls.front?.thumb || '',  // Küçük önizleme
      likes: 0,
      sales: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    };

    await db.collection('designs').add(newDesign);
    
    if (publishBtn) { publishBtn.disabled = false; publishBtn.textContent = 'Tasarımı Yayınla 🚀'; }
    closeModal('uploadModal');
    showToast('🚀 Tasarım yüklendi! Admin onayı bekleniyor (max 24 saat).', 'success');
    resetUploadForm();

  } catch (error) {
    console.error('Yükleme Hatası:', error);
    showToast('Yükleme başarısız: ' + error.message, 'error');
    if (publishBtn) { publishBtn.disabled = false; publishBtn.textContent = 'Tasarımı Yayınla 🚀'; }
  }
}

function resetUploadForm() {
  wizGo(1);
  document.getElementById('upTitle').value = '';
  document.getElementById('upDesc').value = '';
  document.getElementById('upTags').value = '';
  document.getElementById('upCopyright').checked = false;
  ['s-front','s-back','s-detail','s-flat','s-model','s-tex','s-pat','s-var','s-field','s-pkg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      const slot = el.closest('.img-slot');
      el.innerHTML = `<div class="is-plus">+</div><div class="is-lbl">${el.querySelector('.is-lbl')?.textContent || ''}</div>`;
      slot?.classList.remove('filled');
    }
  });
}

function calcEarnings() {
  const std = parseFloat(document.getElementById('stdPrice')?.value) || 0;
  const excl = parseFloat(document.getElementById('exclPrice')?.value) || 0;
  const stdEl = document.getElementById('stdEarn');
  const exclEl = document.getElementById('exclEarn');
  if (stdEl) stdEl.textContent = `₺${Math.round(std * 0.8).toLocaleString('tr-TR')}`;
  if (exclEl) exclEl.textContent = `₺${Math.round(excl * 0.8).toLocaleString('tr-TR')}`;
}

/* ══════════ COLOR SYNC ══════════ */
function syncColor(colorId, hexId) {
  const el = document.getElementById(hexId);
  if (el) el.value = document.getElementById(colorId).value;
}
function syncHex(hexId, colorId) {
  const hex = document.getElementById(hexId).value;
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    document.getElementById(colorId).value = hex;
  }
}

/* ══════════ FAVORITES ══════════ */
function toggleFav(id, btn) {
  const stringId = String(id);
  if (favorites.has(stringId)) {
    favorites.delete(stringId);
    showToast('Favorilerden çıkarıldı', '');
    if (btn) btn.textContent = btn.classList.contains('btn-fav-full') ? '♡ Favorilere Ekle' : '♡';
  } else {
    favorites.add(stringId);
    showToast('Favorilere eklendi ♥', 'success');
    if (btn) btn.textContent = btn.classList.contains('btn-fav-full') ? '♥ Favorilerden Çıkar' : '♥';
  }
}

/* ══════════ MODALS ══════════ */
function showModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('open');
}
function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}
function outsideClose(e, id) {
  if (e.target.id === id) closeModal(id);
}

/* ══════════ TOAST ══════════ */
let toastTimer;
function showToast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show${type ? ' ' + type : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ══════════ MISC ══════════ */
function setTrendTab(btn) {
  document.querySelectorAll('.ttab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderHomeDesigns();
}

function toggleMobileNav() {
  const menu = document.getElementById('navMobileMenu');
  menu.classList.toggle('hidden');
}
