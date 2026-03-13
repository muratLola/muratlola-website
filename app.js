/* ═══════════════════════════════════════════
   formaLOLA — app.js  (Temiz Versiyon)
═══════════════════════════════════════════ */

/* ── CONFIG ── */
const ADMIN_EMAILS = ['firat3306ogur@gmail.com'];
const IMGBB_KEY = '8450d2c8a81b83cde9453909f3d7cb28';

/* ── FIREBASE ── */
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
const db   = firebase.firestore();

/* ── MOCK DATA ── */
const MOCK = [
  { id:'m1', title:'Gece Yarısı Pro',    designer:'MertStudio',      di:'MS', sport:'Futbol',    style:'modern',    pattern:'gradient', colors:['#0a0a0a','#e63946','#ffffff'], price:449,  exclPrice:3999, sales:128, likes:342, bg:'linear-gradient(140deg,#0a0a0a,#1a1a2e)', num:'10', kit:'Deplasman' },
  { id:'m2', title:'Anadolu Kırmızısı', designer:'FormArt',         di:'FA', sport:'Futbol',    style:'retro',     pattern:'stripes',  colors:['#e63946','#1d1d1d','#f4f1de'], price:299,  exclPrice:2499, sales:89,  likes:211, bg:'linear-gradient(140deg,#e63946,#8b0000)', num:'7',  kit:'Ev' },
  { id:'m3', title:'Cyber Esports Kit', designer:'NeonLab',         di:'NL', sport:'E-Spor',    style:'futuristic',pattern:'geometric',colors:['#0d1b2a','#415a77','#e9c46a'], price:599,  exclPrice:5499, sales:67,  likes:198, bg:'linear-gradient(140deg,#0d1b2a,#415a77)', num:'9',  kit:'Ev' },
  { id:'m4', title:'Bosphorus Wave',    designer:'IstanbulKit',     di:'IK', sport:'Basketbol', style:'modern',    pattern:'abstract', colors:['#1d3557','#457b9d','#a8dadc'], price:389,  exclPrice:3500, sales:54,  likes:167, bg:'linear-gradient(140deg,#1d3557,#457b9d)', num:'23', kit:'Deplasman' },
  { id:'m5', title:'Sarı Kaplan',       designer:'TigerDesign',     di:'TD', sport:'Futbol',    style:'classic',   pattern:'stripes',  colors:['#e9c46a','#1d1d1d','#ffffff'], price:329,  exclPrice:2999, sales:103, likes:289, bg:'linear-gradient(140deg,#e9c46a,#f4a261)', num:'11', kit:'Ev' },
  { id:'m6', title:'Mor Şimşek',        designer:'EliteKit',        di:'EK', sport:'Voleybol',  style:'futuristic',pattern:'geometric',colors:['#8338ec','#3a0ca3','#f72585'], price:449,  exclPrice:4000, sales:41,  likes:134, bg:'linear-gradient(140deg,#8338ec,#3a0ca3)', num:'6',  kit:'Ev' },
  { id:'m7', title:'Arctic Pro',        designer:'NordKit',         di:'NK', sport:'Basketbol', style:'minimal',   pattern:'minimal',  colors:['#f4f1de','#e9c46a','#1d1d1d'], price:269,  exclPrice:2200, sales:77,  likes:156, bg:'linear-gradient(140deg,#e9ecef,#dee2e6)', num:'3',  kit:'Deplasman' },
  { id:'m8', title:'Karadeniz Fırtınası',designer:'BlackSeaDesign',di:'BD', sport:'Rugby',     style:'modern',    pattern:'abstract', colors:['#023e8a','#0077b6','#90e0ef'], price:519,  exclPrice:4800, sales:32,  likes:98,  bg:'linear-gradient(140deg,#023e8a,#0077b6)', num:'8',  kit:'Ev' },
  { id:'m9', title:'Retro 76',          designer:'VintageFC',       di:'VF', sport:'Futbol',    style:'retro',     pattern:'retro',    colors:['#606c38','#dda15e','#fefae0'], price:349,  exclPrice:3000, sales:91,  likes:243, bg:'linear-gradient(140deg,#606c38,#283618)', num:'10', kit:'Üçüncü' },
  { id:'m10',title:'Flame Street',      designer:'StreetKit',       di:'SK', sport:'E-Spor',    style:'street',    pattern:'abstract', colors:['#e85d04','#dc2f02','#1d1d1d'], price:479,  exclPrice:4200, sales:58,  likes:177, bg:'linear-gradient(140deg,#e85d04,#9d0208)', num:'1',  kit:'Ev' },
];
const MOCK_DESIGNERS = [
  { id:1, name:'MertStudio',      ini:'MS', bio:'Futbol forma uzmanı',          sales:128, designs:24, rating:4.9, level:'master' },
  { id:2, name:'NeonLab',         ini:'NL', bio:'E-spor & fütüristik tasarım', sales:67,  designs:18, rating:4.8, level:'elite' },
  { id:3, name:'IstanbulKit',     ini:'IK', bio:'Türk motifli formalar',        sales:54,  designs:15, rating:4.7, level:'pro' },
  { id:4, name:'FormArt',         ini:'FA', bio:'Retro koleksiyon ustası',      sales:89,  designs:31, rating:4.8, level:'elite' },
  { id:5, name:'TigerDesign',     ini:'TD', bio:'Agresif, dinamik formalar',    sales:103, designs:27, rating:4.9, level:'master' },
  { id:6, name:'VintageFC',       ini:'VF', bio:'70-80ler nostalji uzmanı',     sales:91,  designs:22, rating:4.7, level:'elite' },
];
const MOCK_COMPS = [
  { id:1, club:'Bosphorus FC',      desc:'2026-27 sezonu Ev forması yarışması',              prize:'₺5.000', deadline:'15 gün kaldı', entries:34 },
  { id:2, club:'Ankara Thunder',    desc:'E-Spor takımımız için yeni kimlik arıyoruz',       prize:'$800',   deadline:'8 gün kaldı',  entries:19 },
  { id:3, club:'Ege Volley',        desc:'Kadın voleybol takımı Deplasman forması',           prize:'₺3.500', deadline:'22 gün kaldı', entries:11 },
  { id:4, club:'İstanbul Lions',    desc:'Amerikan futbolu takımımız için tam kit tasarımı', prize:'$1.200', deadline:'30 gün kaldı', entries:7 },
];

/* ── STATE ── */
let ALL = [...MOCK];
let curPage = 'home', prevPage = 'home';
let curUser = null;
let favs = new Set();
let expOffset = 0;
let selColors = new Set();
let buyDesignId = null, buyPrice = 0, buyLicense = 'standard';

/* ── DİL SİSTEMİ ── */
const LANGS = {
  tr:{ code:'tr', name:'Türkçe',    flag:'🇹🇷', login:'Giriş Yap', register:'Kayıt Ol', explore:'Keşfet', upload:'+ Tasarım Yükle', buy:'Satın Al', fav_add:'♡ Favorilere Ekle', fav_rm:'♥ Favorilerden Çıkar', designs:'tasarım', competitions:'Yarışmalar', designers:'Tasarımcılar', how:'Nasıl Çalışır' },
  en:{ code:'en', name:'English',   flag:'🇬🇧', login:'Sign In', register:'Register', explore:'Explore', upload:'+ Upload Design', buy:'Buy Now', fav_add:'♡ Add to Favorites', fav_rm:'♥ Remove', designs:'designs', competitions:'Competitions', designers:'Designers', how:'How It Works' },
  de:{ code:'de', name:'Deutsch',   flag:'🇩🇪', login:'Anmelden', register:'Registrieren', explore:'Entdecken', upload:'+ Design hochladen', buy:'Kaufen', fav_add:'♡ Favoriten', fav_rm:'♥ Entfernen', designs:'Designs', competitions:'Wettbewerbe', designers:'Designer', how:'Wie es funktioniert' },
  fr:{ code:'fr', name:'Français',  flag:'🇫🇷', login:'Connexion', register:'Inscription', explore:'Explorer', upload:'+ Uploader', buy:'Acheter', fav_add:'♡ Favoris', fav_rm:'♥ Retirer', designs:'designs', competitions:'Compétitions', designers:'Designers', how:'Comment ça marche' },
  es:{ code:'es', name:'Español',   flag:'🇪🇸', login:'Iniciar', register:'Registrarse', explore:'Explorar', upload:'+ Subir', buy:'Comprar', fav_add:'♡ Favoritos', fav_rm:'♥ Quitar', designs:'diseños', competitions:'Competiciones', designers:'Diseñadores', how:'Cómo funciona' },
  ar:{ code:'ar', name:'العربية',   flag:'🇸🇦', login:'دخول', register:'تسجيل', explore:'استكشاف', upload:'+ رفع تصميم', buy:'شراء', fav_add:'♡ المفضلة', fav_rm:'♥ إزالة', designs:'تصميم', competitions:'مسابقات', designers:'مصممون', how:'كيف يعمل' },
  pt:{ code:'pt', name:'Português', flag:'🇧🇷', login:'Entrar', register:'Cadastrar', explore:'Explorar', upload:'+ Enviar', buy:'Comprar', fav_add:'♡ Favoritos', fav_rm:'♥ Remover', designs:'designs', competitions:'Competições', designers:'Designers', how:'Como funciona' },
  it:{ code:'it', name:'Italiano',  flag:'🇮🇹', login:'Accedi', register:'Registrati', explore:'Esplora', upload:'+ Carica', buy:'Acquista', fav_add:'♡ Preferiti', fav_rm:'♥ Rimuovi', designs:'design', competitions:'Competizioni', designers:'Designer', how:'Come funziona' },
  ru:{ code:'ru', name:'Русский',   flag:'🇷🇺', login:'Войти', register:'Регистрация', explore:'Обзор', upload:'+ Загрузить', buy:'Купить', fav_add:'♡ Избранное', fav_rm:'♥ Удалить', designs:'дизайнов', competitions:'Конкурсы', designers:'Дизайнеры', how:'Как это работает' },
  ja:{ code:'ja', name:'日本語',     flag:'🇯🇵', login:'ログイン', register:'登録', explore:'探索', upload:'+ アップ', buy:'購入', fav_add:'♡ お気に入り', fav_rm:'♥ 削除', designs:'デザイン', competitions:'コンテスト', designers:'デザイナー', how:'仕組み' },
};
let curLang = localStorage.getItem('fl_lang') || 'tr';
let L = LANGS[curLang] || LANGS.tr;

function setLang(code) {
  if (!LANGS[code]) return;
  curLang = code; L = LANGS[code];
  localStorage.setItem('fl_lang', code);
  document.documentElement.lang = code;
  document.body.classList.toggle('rtl', code === 'ar');
  const lc = document.getElementById('langCode');
  if (lc) lc.textContent = code.toUpperCase();
  buildLangGrid();
  closeModal('langModal');
  toast(`${L.flag} ${L.name}`, '');
}
function buildLangGrid() {
  const g = document.getElementById('langGrid');
  if (!g) return;
  g.innerHTML = Object.values(LANGS).map(l => `
    <button class="lang-opt${l.code===curLang?' active':''}" onclick="setLang('${l.code}')">
      <span class="lang-fl">${l.flag}</span>
      <span class="lang-nm">${l.name}</span>
      ${l.code===curLang?'<span class="lang-ck">✓</span>':''}
    </button>`).join('');
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  L = LANGS[curLang] || LANGS.tr;
  document.documentElement.lang = curLang;
  document.body.classList.toggle('rtl', curLang==='ar');
  const lc = document.getElementById('langCode');
  if (lc) lc.textContent = curLang.toUpperCase();
  buildLangGrid();
  buildHeroCards();
  renderHome();
  renderSpot();
  renderHomeComps();
  calcE();
  fetchDesigns();
  window.addEventListener('scroll', () => {
    const n = document.getElementById('mainNav');
    if (n) n.style.boxShadow = window.scrollY > 20 ? '0 1px 20px rgba(0,0,0,.4)' : 'none';
  });
});

/* ── FIREBASE: FETCH DESIGNS ── */
async function fetchDesigns() {
  try {
    // orderBy YOK — composite index sorunundan kaçınmak için
    const snap = await db.collection('designs').where('status','==','approved').get();
    const real = [];
    snap.forEach(doc => {
      const d = doc.data();
      const c1 = (d.colors&&d.colors[0])||'#1f1f26';
      const c2 = (d.colors&&d.colors[1])||'#0c0c0e';
      real.push({
        id: doc.id,
        title: d.title||'Tasarım',
        designer: d.designerName||'Anonim',
        di: (d.designerInitials||'?'),
        sport: d.sport||'Futbol',
        style: d.style||'modern',
        pattern: d.pattern||'minimal',
        colors: d.colors||[],
        price: d.price||0,
        exclPrice: d.exclusivePrice||0,
        sales: d.sales||0,
        likes: d.likes||0,
        coverUrl: d.coverUrl||'',
        coverThumb: d.coverThumb||'',
        imageUrls: d.imageUrls||{},
        bg: `linear-gradient(140deg,${c1},${c2})`,
        num: String(Math.floor(Math.random()*11)+1),
        kit: d.kit||'Ev',
        designerId: d.designerId||'',
        desc: d.desc||'',
        _ts: d.createdAt?.(d.createdAt.toMillis?d.createdAt.toMillis():0)||0
      });
    });
    real.sort((a,b)=>b._ts-a._ts);
    ALL = [...real,...MOCK];
    renderHome();
    if (curPage==='explore') applyFilters();
    console.log(`✓ ${real.length} onaylı tasarım yüklendi`);
  } catch(e) {
    console.error('Tasarımlar çekilemedi:',e);
    ALL = [...MOCK];
    renderHome();
  }
}

/* ── PAGE ROUTING ── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const t = document.getElementById('page-'+id);
  if (!t) return;
  prevPage = curPage; curPage = id;
  t.classList.add('active');
  window.scrollTo(0,0);
  if (id==='explore')   renderExplore();
  if (id==='designers') renderDesignersPage();
  if (id==='competitions') renderCompsPage();
  if (id==='dashboard') renderDash();
}
function goBack() { showPage(prevPage||'home'); }

function checkAuthThenUpload() {
  if (!curUser) { showModal('loginModal'); return; }
  showModal('uploadModal');
}

/* ── HERO CARDS ── */
function buildHeroCards() {
  const el = document.getElementById('heroCards');
  if (!el) return;
  const items = MOCK.slice(0,3);
  el.innerHTML = items.map((d,i) => `
    <div class="hcard" style="animation-delay:${i*0.1}s" onclick="showPage('explore')">
      <div class="hcard-img" style="background:${d.bg}">
        <div class="shirt">
          <div class="shirt-s" style="background:${d.colors[1]||'rgba(255,255,255,.4)'}"></div>
          <span class="shirt-n" style="color:rgba(255,255,255,.65)">${d.num}</span>
        </div>
      </div>
      <div class="hcard-body">
        <span class="hcard-title">${d.title}</span>
        <div class="hcard-row">
          <span class="hcard-price">₺${d.price.toLocaleString('tr-TR')}</span>
          <span class="tag ${i===0?'tag-hot':'tag-new'}">${i===0?'Çok Satan':'Yeni'}</span>
        </div>
      </div>
    </div>`).join('');
}

/* ── HOME ── */
function renderHome() {
  const g = document.getElementById('homeGrid');
  if (!g) return;
  g.innerHTML = ALL.slice(0,8).map(d=>dCard(d)).join('');
}
function renderSpot() {
  const g = document.getElementById('spotGrid');
  if (!g) return;
  g.innerHTML = MOCK_DESIGNERS.slice(0,4).map(d=>`
    <div class="spot-card" onclick="showDesignerProfile(${d.id})">
      <div class="sp-av">${d.ini}</div>
      <div class="sp-name">${d.name}</div>
      <div class="sp-lvl">${lvlLabel(d.level)}</div>
      <div class="sp-stats">
        <div><span class="sp-sn">${d.designs}</span><span class="sp-sl">Tasarım</span></div>
        <div><span class="sp-sn">${d.sales}</span><span class="sp-sl">Satış</span></div>
        <div><span class="sp-sn">${d.rating}</span><span class="sp-sl">Puan</span></div>
      </div>
    </div>`).join('');
}
function renderHomeComps() {
  const g = document.getElementById('homeComps');
  if (!g) return;
  g.innerHTML = MOCK_COMPS.slice(0,3).map(c=>compCard(c)).join('');
}
function setTTab(btn) {
  document.querySelectorAll('.ttab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderHome();
}

/* ── DESIGN CARD ── */
function dCard(d) {
  const fav = favs.has(String(d.id));
  const cdots = (d.colors||[]).slice(0,3).map(c=>`<div class="cdot" style="background:${c}"></div>`).join('');
  const badge = d.license==='exclusive'
    ? `<span class="tag tag-excl" style="font-size:10px;padding:2px 7px">Exclusive</span>`
    : d.sales>80 ? `<span class="tag tag-hot" style="font-size:10px;padding:2px 7px">Çok Satan</span>`
    : (d.id==='m1'||d.id==='m2') ? `<span class="tag tag-new" style="font-size:10px;padding:2px 7px">Yeni</span>` : '';
  const img = d.coverUrl
    ? `<img src="${d.coverThumb||d.coverUrl}" alt="${d.title}" style="width:100%;height:100%;object-fit:cover;transition:transform .4s" loading="lazy" onerror="this.parentNode.style.background='${d.bg}';this.remove()">`
    : `<div class="dcard-ph" style="background:${d.bg};width:100%;height:100%"><div class="shirt" style="width:60px;height:72px"><div class="shirt-s" style="background:${d.colors&&d.colors[1]?d.colors[1]:'rgba(255,255,255,.4)'}"></div><span class="shirt-n">${d.num}</span></div></div>`;
  return `
    <div class="dcard" onclick="showDesign('${d.id}')">
      <div class="dcard-img">
        ${img}
        ${badge?`<div class="dcard-badge">${badge}</div>`:''}
        <div class="dcard-ov">
          <button class="dcard-buy" onclick="event.stopPropagation();openBuy('${d.id}')">${L.buy}</button>
          <button class="dcard-fav" onclick="event.stopPropagation();toggleFav('${d.id}',this)">${fav?'♥':'♡'}</button>
        </div>
      </div>
      <div class="dcard-body">
        <div class="dcard-sport">${d.sport}</div>
        <div class="dcard-title">${d.title}</div>
        <div class="dcard-by">by <span onclick="event.stopPropagation();showDesignerProfile('${d.id}')">${d.designer}</span></div>
        <div class="dcard-foot">
          <span class="dcard-price">₺${(d.price||0).toLocaleString('tr-TR')}</span>
          <div class="dcard-meta"><span>♥ ${d.likes}</span><div class="cdots">${cdots}</div></div>
        </div>
      </div>
    </div>`;
}
function compCard(c) {
  return `
    <div class="comp-card">
      <div class="comp-club">${c.club}</div>
      <div class="comp-desc">${c.desc}</div>
      <div class="comp-meta"><span class="comp-prize">${c.prize}</span><span class="comp-dl">${c.deadline}</span></div>
      <span class="comp-badge">${c.entries} katılımcı</span>
      <button style="margin-top:12px;width:100%;padding:9px;background:var(--ac);border:none;border-radius:var(--r);color:#fff;font-size:13px;cursor:pointer" onclick="showModal('loginModal')">Katıl</button>
    </div>`;
}

/* ── EXPLORE ── */
function renderExplore() { expOffset=0; applyFilters(); }
function filterCat(cat) {
  showPage('explore');
  setTimeout(()=>{
    document.querySelectorAll('.fpc input').forEach(i=>{
      if(['Futbol','Basketbol','Voleybol','E-Spor','Rugby','Amerikan Futbolu','Hentbol'].includes(i.value))
        i.checked = i.value===cat;
    });
    applyFilters();
  },80);
}
function getFiltered() {
  const q = (document.getElementById('searchInput')?.value||'').toLowerCase();
  const sort = document.getElementById('sortSel')?.value||'popular';
  const sports   = checkedVals(['Futbol','Basketbol','Voleybol','E-Spor','Rugby','Amerikan Futbolu','Hentbol','Futbol Akademi']);
  const styles   = checkedVals(['modern','retro','minimal','futuristic','classic','street']);
  const patterns = checkedVals(['stripes','gradient','geometric','camo','abstract','minimal','retro']);
  const lics     = checkedVals(['standard','exclusive']);
  const pmin = parseFloat(document.getElementById('priceMin')?.value)||0;
  const pmax = parseFloat(document.getElementById('priceMax')?.value)||Infinity;
  let r = ALL.filter(d=>{
    if (q && !d.title.toLowerCase().includes(q) && !(d.designer||'').toLowerCase().includes(q) && !(d.sport||'').toLowerCase().includes(q)) return false;
    if (sports.length   && !sports.includes(d.sport))   return false;
    if (styles.length   && !styles.includes(d.style))   return false;
    if (patterns.length && !patterns.includes(d.pattern))return false;
    if (lics.length     && !lics.includes(d.license||'standard')) return false;
    if ((d.price||0)<pmin||(d.price||0)>pmax) return false;
    if (selColors.size>0){
      const ok=[...selColors].some(sc=>(d.colors||[]).some(dc=>colorClose(dc,sc)));
      if(!ok) return false;
    }
    return true;
  });
  if (sort==='newest')     r=[...r].reverse();
  else if(sort==='price-asc') r=[...r].sort((a,b)=>(a.price||0)-(b.price||0));
  else if(sort==='price-desc')r=[...r].sort((a,b)=>(b.price||0)-(a.price||0));
  else if(sort==='bestseller')r=[...r].sort((a,b)=>(b.sales||0)-(a.sales||0));
  else r=[...r].sort((a,b)=>(b.likes||0)-(a.likes||0));
  return r;
}
function checkedVals(allowed) {
  return [...document.querySelectorAll('.fpc input:checked')].filter(i=>allowed.includes(i.value)).map(i=>i.value);
}
function applyFilters() {
  const r=getFiltered(), g=document.getElementById('expGrid');
  if(!g)return;
  expOffset=Math.min(12,r.length);
  g.innerHTML=r.slice(0,expOffset).map(d=>dCard(d)).join('');
  const c=document.getElementById('resCount');
  if(c)c.textContent=`${r.length} ${L.designs} bulundu`;
}
function loadMore() {
  const r=getFiltered(), g=document.getElementById('expGrid');
  if(!g)return;
  const next=r.slice(expOffset,expOffset+8);
  g.innerHTML+=next.map(d=>dCard(d)).join('');
  expOffset+=next.length;
  if(expOffset>=r.length){const b=document.getElementById('loadMoreBtn');if(b)b.style.display='none';}
}
function clearFilters() {
  document.querySelectorAll('.fpc input').forEach(i=>i.checked=false);
  const pm=document.getElementById('priceMin'),px=document.getElementById('priceMax'),si=document.getElementById('searchInput');
  if(pm)pm.value='';if(px)px.value='';if(si)si.value='';
  selColors.clear();
  document.querySelectorAll('.sw').forEach(s=>s.classList.remove('active'));
  applyFilters();
}
function toggleFP(){document.getElementById('fpanel').classList.toggle('open');}
function toggleSwatch(el){
  el.classList.toggle('active');
  if(el.classList.contains('active'))selColors.add(el.dataset.hex);
  else selColors.delete(el.dataset.hex);
  applyFilters();
}
function colorClose(c1,c2){
  try{const r=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];const[a,b,c]=r(c1),[x,y,z]=r(c2);return Math.abs(a-x)+Math.abs(b-y)+Math.abs(c-z)<120;}catch{return false;}
}

/* ── DESIGN DETAIL ── */
function showDesign(id) {
  const d=ALL.find(x=>String(x.id)===String(id));
  if(!d)return;
  showPage('detail');
  const el=document.getElementById('detailContent');
  const fav=favs.has(String(id));
  const imgs=d.imageUrls||{};
  const slots=[
    {label:'Ön',   url:d.coverUrl||''},
    {label:'Arka', url:imgs.back?.url||''},
    {label:'Detay',url:imgs.detail?.url||''},
    {label:'Flat', url:imgs.flat?.url||''},
  ];
  const mainHtml = d.coverUrl
    ? `<img src="${d.coverUrl}" alt="${d.title}" style="width:100%;height:100%;object-fit:contain">`
    : `<div style="width:100%;height:100%;background:${d.bg};display:flex;align-items:center;justify-content:center"><div class="shirt" style="width:140px;height:168px;border-radius:12px 12px 24px 24px;border:1px solid rgba(255,255,255,.1)"><div class="shirt-s" style="height:4px;background:${d.colors&&d.colors[1]?d.colors[1]:'rgba(255,255,255,.4)'}"></div><span class="shirt-n" style="font-size:54px">${d.num}</span></div></div>`;
  el.innerHTML=`
    <div class="detail-grid">
      <div class="detail-imgs">
        <div class="detail-main" id="dmain">${mainHtml}</div>
        <div class="detail-thumbs">
          ${slots.map((s,i)=>{
            const has=s.url;
            return `<div class="dthumb${i===0?' active':''}" onclick="switchMain(this,'${s.url}','${d.bg}','${d.num}','${s.label}')" style="${has?'':'background:'+d.bg+';display:flex;align-items:center;justify-content:center'}">
              ${has?`<img src="${s.url}" alt="${s.label}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-size:9px;color:rgba(255,255,255,.5)">${s.label}</span>`}
            </div>`;
          }).join('')}
        </div>
      </div>
      <div class="detail-info">
        <div class="det-sport">${d.sport} · ${d.kit||'Ev'}</div>
        <h1 class="detail-title">${d.title}</h1>
        <div class="det-designer">
          <div class="det-dav">${d.di}</div>
          by <span class="det-dname" onclick="showDesignerProfile('${d.id}')">${d.designer}</span>
          <span style="margin-left:auto;font-size:12px;color:var(--tx3)">♥ ${d.likes}</span>
        </div>
        ${d.desc?`<p style="font-size:14px;color:var(--tx2);margin-bottom:16px;line-height:1.6">${d.desc}</p>`:''}
        <div class="det-colors">
          ${(d.colors||[]).map(c=>`<div class="det-clr" style="background:${c}" title="${c}"></div>`).join('')}
          <span style="font-size:11px;color:var(--tx3);margin-left:4px">${(d.colors||[]).join(' · ')}</span>
        </div>
        <div class="det-meta">
          <div class="dm"><div class="dm-l">Stil</div><div class="dm-v">${d.style}</div></div>
          <div class="dm"><div class="dm-l">Desen</div><div class="dm-v">${d.pattern}</div></div>
          <div class="dm"><div class="dm-l">Satış</div><div class="dm-v">${d.sales}</div></div>
          <div class="dm"><div class="dm-l">Lisans</div><div class="dm-v">${d.license==='exclusive'?'Exclusive':'Standart'}</div></div>
        </div>
        <div class="det-lic">
          <div class="lic-opt sel" onclick="selLic(this,'standard',${d.price})">
            <input type="radio" name="lr" checked>
            <div class="lic-opt-info"><div class="lic-opt-name">Standart Lisans</div><div class="lic-opt-desc">Birden fazla takım alabilir</div></div>
            <div class="lic-opt-price">₺${(d.price||0).toLocaleString('tr-TR')}</div>
          </div>
          <div class="lic-opt" onclick="selLic(this,'exclusive',${d.exclPrice||0})">
            <input type="radio" name="lr">
            <div class="lic-opt-info"><div class="lic-opt-name">Exclusive Lisans</div><div class="lic-opt-desc">Tek kulüp — yayından kalkar</div></div>
            <div class="lic-opt-price">₺${(d.exclPrice||0).toLocaleString('tr-TR')}</div>
          </div>
        </div>
        <button class="btn-buynow" onclick="openBuy('${d.id}')">Satın Al</button>
        <button class="btn-fav" onclick="toggleFav('${d.id}',this)">${fav?'♥ Favorilerden Çıkar':'♡ Favorilere Ekle'}</button>
        <div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--bd)">
          <div style="font-size:11px;color:var(--tx3);margin-bottom:7px;text-transform:uppercase;letter-spacing:.08em">Üretim Dosyaları</div>
          <div style="display:flex;gap:7px;flex-wrap:wrap">
            ${['PNG','AI','SVG','PDF'].map(f=>`<span style="background:var(--bg4);border:1px solid var(--bd);border-radius:5px;padding:3px 10px;font-size:11px;font-family:var(--fm)">${f}</span>`).join('')}
          </div>
        </div>
      </div>
    </div>`;
}
function switchMain(el,url,bg,num,label){
  document.querySelectorAll('.dthumb').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  const m=document.getElementById('dmain');
  if(!m)return;
  m.innerHTML=url
    ?`<img src="${url}" alt="${label}" style="width:100%;height:100%;object-fit:contain">`
    :`<div style="width:100%;height:100%;background:${bg};display:flex;align-items:center;justify-content:center"><span style="font-family:'Bebas Neue',sans-serif;font-size:48px;color:rgba(255,255,255,.4)">${label}</span></div>`;
}
function selLic(el,type,price){
  document.querySelectorAll('.lic-opt').forEach(o=>o.classList.remove('sel'));
  el.classList.add('sel');
  el.querySelector('input').checked=true;
  buyPrice=price; buyLicense=type;
}

/* ── DESIGNERS PAGE ── */
function renderDesignersPage(){
  const g=document.getElementById('designersGrid');
  if(!g)return;
  g.innerHTML=MOCK_DESIGNERS.map(d=>`
    <div class="dsgn-card" onclick="showDesignerProfile(${d.id})">
      <div class="dc-top"><div class="dc-av">${d.ini}</div><div><div class="dc-nm">${d.name}</div><div class="dc-lv">${lvlLabel(d.level)}</div></div></div>
      <div class="dc-stats">
        <div><div class="dc-sn">${d.designs}</div><div class="dc-sl">Tasarım</div></div>
        <div><div class="dc-sn">${d.sales}</div><div class="dc-sl">Satış</div></div>
        <div><div class="dc-sn">${d.rating}</div><div class="dc-sl">Puan</div></div>
      </div>
    </div>`).join('');
}
function showDesignerProfile(id){
  const d=MOCK_DESIGNERS.find(x=>String(x.id)===String(id))||MOCK_DESIGNERS[0];
  const designs=ALL.filter(x=>x.designer===d.name).slice(0,4);
  showPage('designer-profile');
  const el=document.getElementById('designerProfileContent');
  el.innerHTML=`
    <button class="back-btn" onclick="goBack()">← Geri</button>
    <div style="display:flex;align-items:center;gap:24px;padding:28px 0 28px;border-bottom:1px solid var(--bd);margin-bottom:28px;flex-wrap:wrap">
      <div style="width:76px;height:76px;border-radius:50%;background:linear-gradient(135deg,var(--ac),#ff9f43);display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:30px;color:#fff;flex-shrink:0">${d.ini}</div>
      <div>
        <h1 style="font-family:'Bebas Neue',sans-serif;font-size:38px;letter-spacing:.5px;margin-bottom:5px">${d.name}</h1>
        <div style="display:flex;align-items:center;gap:10px">
          <span class="lvl-badge ${d.level}">${lvlLabel(d.level)}</span>
          <span style="font-size:13px;color:var(--tx2)">${d.bio}</span>
        </div>
      </div>
      <div style="margin-left:auto;display:flex;gap:22px;text-align:center;flex-wrap:wrap">
        <div><div style="font-family:'Bebas Neue',sans-serif;font-size:30px">${d.designs}</div><div style="font-size:12px;color:var(--tx3)">Tasarım</div></div>
        <div><div style="font-family:'Bebas Neue',sans-serif;font-size:30px">${d.sales}</div><div style="font-size:12px;color:var(--tx3)">Satış</div></div>
        <div><div style="font-family:'Bebas Neue',sans-serif;font-size:30px">${d.rating}</div><div style="font-size:12px;color:var(--tx3)">Puan</div></div>
      </div>
    </div>
    <h2 style="font-family:'Bebas Neue',sans-serif;font-size:22px;margin-bottom:18px">Tasarımları</h2>
    <div class="dgrid" style="padding-bottom:60px">${(designs.length?designs:ALL.slice(0,4)).map(x=>dCard(x)).join('')}</div>`;
}
function lvlLabel(l){return {rookie:'Rookie',pro:'Pro',elite:'Elite',master:'Master'}[l]||'Rookie';}

/* ── COMPETITIONS PAGE ── */
function renderCompsPage(){
  const g=document.getElementById('compsGrid');
  if(!g)return;
  g.innerHTML=MOCK_COMPS.map(c=>`
    <div class="comp-card">
      <div class="comp-club">${c.club}</div>
      <div class="comp-desc">${c.desc}</div>
      <div class="comp-meta"><span class="comp-prize">${c.prize}</span><span class="comp-dl">${c.deadline}</span></div>
      <span class="comp-badge">${c.entries} katılımcı</span>
      <button style="margin-top:12px;width:100%;padding:9px;background:var(--ac);border:none;border-radius:var(--r);color:#fff;font-size:13px;cursor:pointer" onclick="showModal('loginModal')">Katıl</button>
    </div>`).join('');
}

/* ── DASHBOARD ── */
function renderDash(){
  if(!curUser){
    document.getElementById('dashMain').innerHTML=`
      <div style="text-align:center;padding:80px 20px">
        <div style="font-family:'Bebas Neue',sans-serif;font-size:44px;margin-bottom:14px">Giriş Gerekli</div>
        <p style="color:var(--tx2);margin-bottom:22px">Dashboard'a erişmek için giriş yapın.</p>
        <button class="btn-cta" onclick="showModal('loginModal')">Giriş Yap</button>
      </div>`;
    return;
  }
  dTab('overview',document.querySelector('.dni'));
}
async function dTab(tab,btn){
  document.querySelectorAll('.dni').forEach(i=>i.classList.remove('active'));
  if(btn)btn.classList.add('active');
  const el=document.getElementById('dashMain');
  if(!el)return;

  if(tab==='overview'){
    el.innerHTML=`
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:26px;margin-bottom:22px">Hoş geldin, ${curUser?.name||'Tasarımcı'} 👋</h2>
      <div class="dash-stats" id="dStats"><div class="ds-card"><div class="ds-l">Yükleniyor</div><div class="ds-v">—</div></div></div>
      <div class="dash-sec-t" style="margin-top:20px">Son Tasarımlarım</div>
      <div id="dRecent" style="color:var(--tx2);font-size:13px">Yükleniyor...</div>`;
    loadDashOverview();

  } else if(tab==='mydesigns'){
    el.innerHTML=`
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:26px">Tasarımlarım</h2>
        <button class="btn-primary" onclick="checkAuthThenUpload()">+ Yeni Yükle</button>
      </div>
      <div id="myDesignsGrid" class="dgrid">Yükleniyor...</div>`;
    loadMyDesigns();

  } else if(tab==='purchases'){
    el.innerHTML=`<h2 style="font-family:'Bebas Neue',sans-serif;font-size:26px;margin-bottom:22px">Satın Aldıklarım</h2><div id="purchasesEl">Yükleniyor...</div>`;
    loadPurchases();

  } else if(tab==='sales'){
    el.innerHTML=`<h2 style="font-family:'Bebas Neue',sans-serif;font-size:26px;margin-bottom:22px">Satışlar</h2><div id="salesEl">Yükleniyor...</div>`;
    loadSales();

  } else if(tab==='earnings'){
    el.innerHTML=`
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:26px;margin-bottom:22px">Kazançlar</h2>
      <div class="dash-stats" id="earnStats"><div class="ds-card"><div class="ds-l">Yükleniyor</div><div class="ds-v">—</div></div></div>
      <div style="margin-top:18px;background:var(--bg3);border:1px solid var(--bd);border-radius:var(--rl);padding:18px;text-align:center">
        <div style="font-size:13px;color:var(--tx2);margin-bottom:12px">Minimum ₺500 tutarında çekim yapabilirsin</div>
        <button class="btn-cta" onclick="toast('iyzico ödeme entegrasyonu yakında aktif olacak.','')">Ödeme İste</button>
      </div>`;
    loadEarnings();

  } else if(tab==='favorites'){
    const favDs=ALL.filter(d=>favs.has(String(d.id)));
    el.innerHTML=`
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:26px;margin-bottom:22px">Favorilerim</h2>
      ${favDs.length===0
        ?`<div style="text-align:center;padding:60px 20px"><p style="color:var(--tx2);margin-bottom:16px">Henüz favori tasarımın yok.</p><button class="btn-cta" onclick="showPage('explore')">Tasarımları Keşfet</button></div>`
        :`<div class="dgrid">${favDs.map(d=>dCard(d)).join('')}</div>`}`;

  } else if(tab==='admin'){
    el.innerHTML=`<h2 style="font-family:'Bebas Neue',sans-serif;font-size:26px;margin-bottom:22px;color:var(--ac)">Admin Panel — Onay Bekleyenler</h2><div id="adminGrid">Yükleniyor...</div>`;
    loadPending();

  } else if(tab==='settings'){
    el.innerHTML=`
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:26px;margin-bottom:22px">Ayarlar</h2>
      <div style="max-width:500px">
        <div class="fg"><label>İsim</label><input type="text" id="setName" value="${curUser?.name||''}"></div>
        <div class="fg"><label>E-posta</label><input type="email" value="${curUser?.email||''}" disabled style="opacity:.6"></div>
        <div class="fg"><label>Bio</label><textarea rows="3" placeholder="Kendini tanıt..."></textarea></div>
        <button class="btn-form" onclick="saveName()">Kaydet</button>
        <div style="margin-top:20px;padding-top:18px;border-top:1px solid var(--bd)">
          <button style="padding:9px 16px;background:transparent;border:1px solid rgba(230,57,70,.4);color:var(--ac);border-radius:var(--r);font-size:13px;cursor:pointer" onclick="doLogout()">Çıkış Yap</button>
        </div>
      </div>`;
  }
}

async function saveName(){
  const v=document.getElementById('setName')?.value?.trim();
  if(!v){toast('İsim boş olamaz','error');return;}
  try{
    await auth.currentUser?.updateProfile({displayName:v});
    if(curUser)curUser.name=v;
    toast('Profil güncellendi ✓','success');
  }catch(e){toast('Hata: '+e.message,'error');}
}

async function loadDashOverview(){
  try{
    const snap=await db.collection('designs').where('designerId','==',curUser.uid).get();
    let td=0,ts=0,tl=0,tp=0;
    const recent=[];
    snap.forEach(doc=>{const d=doc.data();td++;ts+=d.sales||0;tl+=d.likes||0;if(d.status==='pending')tp++;if(recent.length<4)recent.push({id:doc.id,...d});});
    const st=document.getElementById('dStats');
    if(st)st.innerHTML=`
      <div class="ds-card"><div class="ds-l">Tasarım</div><div class="ds-v">${td}</div></div>
      <div class="ds-card"><div class="ds-l">Toplam Satış</div><div class="ds-v acc">${ts}</div></div>
      <div class="ds-card"><div class="ds-l">Beğeni</div><div class="ds-v">${tl}</div></div>
      <div class="ds-card"><div class="ds-l">Onay Bekleyen</div><div class="ds-v gold">${tp}</div></div>`;
    const re=document.getElementById('dRecent');
    if(re){
      if(recent.length===0){re.innerHTML=`<div style="text-align:center;padding:40px 20px"><p style="color:var(--tx2);margin-bottom:14px">Henüz tasarım yüklemedin.</p><button class="btn-cta" onclick="checkAuthThenUpload()">+ İlk Tasarımını Yükle</button></div>`;}
      else{re.innerHTML=`<div style="background:var(--bg3);border:1px solid var(--bd);border-radius:var(--rl);overflow:hidden">${recent.map(d=>`<div style="padding:13px 17px;border-bottom:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:14px;font-weight:500">${d.title}</div><div style="font-size:11px;color:var(--tx3);margin-top:2px">${d.sport} · ₺${d.price||0}</div></div><span style="font-size:11px;padding:3px 9px;border-radius:4px;${d.status==='approved'?'background:rgba(42,157,143,.15);color:#4ecdc4':d.status==='pending'?'background:rgba(201,168,76,.15);color:var(--gold)':'background:rgba(230,57,70,.15);color:var(--ac)'}">${d.status==='approved'?'✓ Yayında':d.status==='pending'?'⏳ Bekliyor':'✕ Reddedildi'}</span></div>`).join('')}</div>`;}
    }
  }catch(e){console.error(e);}
}
async function loadMyDesigns(){
  const g=document.getElementById('myDesignsGrid');
  try{
    const snap=await db.collection('designs').where('designerId','==',curUser.uid).get();
    const ds=[];
    snap.forEach(doc=>{const d=doc.data();const c1=(d.colors&&d.colors[0])||'#1f1f26';const c2=(d.colors&&d.colors[1])||'#0c0c0e';ds.push({id:doc.id,...d,di:d.designerInitials||'?',designer:d.designerName||'Ben',bg:`linear-gradient(140deg,${c1},${c2})`,num:'10',exclPrice:d.exclusivePrice||0,likes:d.likes||0,sales:d.sales||0,coverUrl:d.coverUrl||'',coverThumb:d.coverThumb||''});});
    if(g)g.innerHTML=ds.length?ds.map(d=>dCard(d)).join(''):`<p style="color:var(--tx2)">Henüz tasarım yüklemedin.</p>`;
  }catch(e){if(g)g.innerHTML=`<p style="color:var(--ac)">Veri çekilemedi.</p>`;}
}
async function loadPurchases(){
  const el=document.getElementById('purchasesEl');
  try{
    const snap=await db.collection('purchases').where('buyerId','==',curUser.uid).get();
    if(snap.empty){el.innerHTML=`<div style="text-align:center;padding:50px 20px"><div style="font-size:36px;margin-bottom:10px">🛒</div><p style="color:var(--tx2);margin-bottom:14px">Henüz satın alma yok.</p><button class="btn-cta" onclick="showPage('explore')">Tasarımları Keşfet</button></div>`;return;}
    const rows=[];
    snap.forEach(doc=>{const p=doc.data();const ts=p.purchasedAt?.toDate?.()?p.purchasedAt.toDate().toLocaleDateString('tr-TR'):'—';rows.push(`<div style="padding:13px 17px;border-bottom:1px solid var(--bd);display:grid;grid-template-columns:1fr auto auto;gap:14px;align-items:center"><div><div style="font-size:14px;font-weight:500">${p.designId||'Tasarım'}</div><div style="font-size:11px;color:var(--tx3);margin-top:2px">${p.license==='exclusive'?'Exclusive':'Standart'} · ${ts}</div></div><span style="font-family:var(--fm);color:var(--ac)">₺${(p.price||0).toLocaleString('tr-TR')}</span><span style="background:rgba(42,157,143,.15);color:#4ecdc4;font-size:11px;padding:3px 9px;border-radius:4px">✓ Teslim edildi</span></div>`);});
    el.innerHTML=`<div style="background:var(--bg3);border:1px solid var(--bd);border-radius:var(--rl);overflow:hidden">${rows.join('')}</div>`;
  }catch(e){el.innerHTML=`<p style="color:var(--tx2)">Veri çekilemedi.</p>`;}
}
async function loadSales(){
  const el=document.getElementById('salesEl');
  try{
    const snap=await db.collection('purchases').where('designerId','==',curUser.uid).get();
    if(snap.empty){el.innerHTML=`<p style="color:var(--tx2)">Henüz satış yok. Tasarımlarını paylaş!</p>`;return;}
    const rows=[];
    snap.forEach(doc=>{const p=doc.data();const ts=p.purchasedAt?.toDate?.()?p.purchasedAt.toDate().toLocaleDateString('tr-TR'):'—';rows.push(`<div style="padding:13px 17px;border-bottom:1px solid var(--bd);display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;font-size:13px;align-items:center"><span>${p.designId||'—'}</span><span style="color:var(--tx2)">${p.buyerEmail||'—'}</span><span style="color:var(--ac);font-family:var(--fm)">₺${(p.price||0).toLocaleString('tr-TR')}</span><span style="color:var(--tx3);font-size:12px">${ts}</span></div>`);});
    el.innerHTML=`<div style="background:var(--bg3);border:1px solid var(--bd);border-radius:var(--rl);overflow:hidden"><div style="padding:11px 17px;border-bottom:1px solid var(--bd);display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:12px;font-size:11px;color:var(--tx3);font-family:var(--fm);text-transform:uppercase;letter-spacing:.08em"><span>Tasarım</span><span>Alıcı</span><span>Fiyat</span><span>Tarih</span></div>${rows.join('')}</div>`;
  }catch(e){el.innerHTML=`<p style="color:var(--tx2)">Veri çekilemedi.</p>`;}
}
async function loadEarnings(){
  const el=document.getElementById('earnStats');
  try{
    const snap=await db.collection('purchases').where('designerId','==',curUser.uid).get();
    let total=0;snap.forEach(doc=>{total+=((doc.data().price||0)*0.8);});
    if(el)el.innerHTML=`
      <div class="ds-card"><div class="ds-l">Toplam Kazanç</div><div class="ds-v gold">₺${Math.round(total).toLocaleString('tr-TR')}</div></div>
      <div class="ds-card"><div class="ds-l">Bekleyen</div><div class="ds-v">₺0</div></div>`;
  }catch(e){if(el)el.innerHTML=`<div class="ds-card"><div class="ds-l">Veri yok</div><div class="ds-v">—</div></div>`;}
}
async function loadPending(){
  const g=document.getElementById('adminGrid');
  try{
    const snap=await db.collection('designs').where('status','==','pending').get();
    if(snap.empty){g.innerHTML=`<div style="padding:18px;background:var(--bg3);border-radius:var(--r);color:var(--tx2)">Onay bekleyen tasarım yok 🎉</div>`;return;}
    let html='';
    snap.forEach(doc=>{const d=doc.data(),id=doc.id;html+=`<div style="display:flex;align-items:center;justify-content:space-between;background:var(--bg3);border:1px solid var(--bd);border-left:3px solid var(--gold);padding:15px 18px;border-radius:var(--r);margin-bottom:10px;gap:12px;flex-wrap:wrap"><div><div style="font-size:15px;font-weight:500;margin-bottom:3px">${d.title||'—'}</div><div style="font-size:12px;color:var(--tx2)"><span style="color:var(--ac)">by ${d.designerName||'?'}</span> · ${d.sport||''} · ₺${d.price||0}</div></div><div style="display:flex;gap:9px"><button onclick="approveD('${id}')" style="padding:7px 14px;background:rgba(42,157,143,.15);color:#4ecdc4;border:1px solid #4ecdc4;border-radius:6px;cursor:pointer;font-size:13px">✓ Onayla</button><button onclick="rejectD('${id}')" style="padding:7px 14px;background:rgba(230,57,70,.15);color:var(--ac);border:1px solid var(--ac);border-radius:6px;cursor:pointer;font-size:13px">✕ Reddet</button></div></div>`;});
    g.innerHTML=html;
  }catch(e){g.innerHTML=`<p style="color:var(--ac)">Hata: ${e.message}</p>`;}
}
async function approveD(id){
  try{await db.collection('designs').doc(id).update({status:'approved'});toast('✓ Onaylandı','success');loadPending();fetchDesigns();}catch(e){toast('Hata: '+e.message,'error');}
}
async function rejectD(id){
  if(!confirm('Reddetmek istediğinizden emin misiniz?'))return;
  try{await db.collection('designs').doc(id).update({status:'rejected'});toast('Reddedildi','');loadPending();}catch(e){toast('Hata: '+e.message,'error');}
}

/* ── AUTH ── */
auth.onAuthStateChanged(user=>{
  if(user){
    curUser={name:user.displayName||user.email.split('@')[0],email:user.email,uid:user.uid};
    document.getElementById('navLoginBtn')?.classList.add('hidden');
    const av=document.getElementById('navAvatar');
    if(av){av.classList.remove('hidden');av.textContent=curUser.name[0].toUpperCase();}
    const da=document.getElementById('dashAv');if(da)da.textContent=curUser.name[0].toUpperCase();
    const dn=document.getElementById('dashName');if(dn)dn.textContent=curUser.name;
    // Admin butonu
    const ab=document.getElementById('adminNavBtn');
    if(ab)ab.style.display=ADMIN_EMAILS.includes(user.email)?'block':'none';
  }else{
    curUser=null;
    document.getElementById('navLoginBtn')?.classList.remove('hidden');
    const av=document.getElementById('navAvatar');if(av)av.classList.add('hidden');
  }
});
async function doLogin(){
  const email=document.getElementById('loginEmail')?.value;
  const pass=document.getElementById('loginPass')?.value;
  if(!email||!pass){toast('E-posta ve şifre gerekli','error');return;}
  try{
    await auth.signInWithEmailAndPassword(email,pass);
    closeModal('loginModal');
    toast('Hoş geldin! ✓','success');
  }catch(e){
    const m={'auth/user-not-found':'E-posta kayıtlı değil.','auth/wrong-password':'Şifre yanlış.','auth/invalid-email':'Geçersiz e-posta.','auth/too-many-requests':'Çok fazla deneme, bekleyin.'};
    toast(m[e.code]||'Giriş başarısız.','error');
  }
}
async function doRegister(){
  const name=document.getElementById('regName')?.value?.trim();
  const email=document.getElementById('regEmail')?.value;
  const pass=document.getElementById('regPass')?.value;
  const role=document.getElementById('regRole')?.value||'designer';
  if(!name||!email||!pass){toast('Tüm alanları doldurun','error');return;}
  if(pass.length<6){toast('Şifre en az 6 karakter','error');return;}
  try{
    const cred=await auth.createUserWithEmailAndPassword(email,pass);
    await cred.user.updateProfile({displayName:name});
    await db.collection('users').doc(cred.user.uid).set({name,email,role,level:'rookie',createdAt:firebase.firestore.FieldValue.serverTimestamp()});
    closeModal('loginModal');
    toast(`Hoş geldin, ${name}! ✓`,'success');
  }catch(e){
    const m={'auth/email-already-in-use':'Bu e-posta kayıtlı.','auth/weak-password':'Şifre çok zayıf.','auth/invalid-email':'Geçersiz e-posta.'};
    toast(m[e.code]||'Kayıt başarısız.','error');
  }
}
async function doGoogle(){
  try{
    await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    closeModal('loginModal');
    toast('Google ile giriş yapıldı!','success');
  }catch(e){toast('Giriş iptal edildi.','');}
}
async function doLogout(){
  await auth.signOut();
  showPage('home');
  toast('Çıkış yapıldı','');
}
function aTab(tab,btn){
  document.querySelectorAll('.mtab').forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('formLogin')?.classList.toggle('hidden',tab!=='login');
  document.getElementById('formReg')?.classList.toggle('hidden',tab!=='register');
}

/* ── BUY CHECKOUT ── */
function openBuy(id){
  const d=ALL.find(x=>String(x.id)===String(id));
  if(!d)return;
  buyDesignId=id; buyPrice=d.price||0; buyLicense='standard';
  const el=document.getElementById('buyContent');
  const thumb=d.coverThumb||d.coverUrl||'';
  el.innerHTML=`
    <!-- ADIM 1 -->
    <div id="bs1">
      <div class="buy-design-row">
        <div class="buy-thumb" style="background:${d.bg};overflow:hidden">
          ${thumb?`<img src="${thumb}" style="width:100%;height:100%;object-fit:cover">`:`<span style="font-family:'Bebas Neue',sans-serif;font-size:20px;color:rgba(255,255,255,.6)">${d.num}</span>`}
        </div>
        <div style="flex:1;min-width:0">
          <div class="buy-title">${d.title}</div>
          <div class="buy-by">by ${d.designer}</div>
          <div style="margin-top:5px;display:flex;gap:5px;flex-wrap:wrap">
            <span style="font-size:11px;background:var(--bg4);border:1px solid var(--bd);border-radius:4px;padding:2px 7px;color:var(--tx3)">${d.sport}</span>
            <span style="font-size:11px;background:var(--bg4);border:1px solid var(--bd);border-radius:4px;padding:2px 7px;color:var(--tx3)">${d.kit||'Ev'}</span>
          </div>
        </div>
      </div>
      <div class="buy-lics">
        <div class="buy-lopt sel" id="blstd" onclick="selBuyLic(this,'standard',${d.price})">
          <input type="radio" name="bl" checked>
          <div class="buy-lopt-info"><div class="buy-lopt-name">Standart Lisans</div><div class="buy-lopt-desc">Birden fazla takım alabilir</div></div>
          <span class="buy-lopt-price">₺${(d.price||0).toLocaleString('tr-TR')}</span>
        </div>
        <div class="buy-lopt" id="blexcl" onclick="selBuyLic(this,'exclusive',${d.exclPrice||0})">
          <input type="radio" name="bl">
          <div class="buy-lopt-info"><div class="buy-lopt-name">Exclusive Lisans</div><div class="buy-lopt-desc">Tek kulüp — yayından kalkar</div></div>
          <span class="buy-lopt-price">₺${(d.exclPrice||0).toLocaleString('tr-TR')}</span>
        </div>
      </div>
      <div style="background:var(--bg3);border:1px solid var(--bd);border-radius:var(--r);padding:11px 14px;margin-bottom:13px">
        <div style="font-size:11px;color:var(--tx3);margin-bottom:7px;text-transform:uppercase;letter-spacing:.08em;font-family:var(--fm)">Teslim Edilecek Dosyalar</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${['PNG','AI','SVG','PDF'].map(f=>`<span style="background:var(--bg4);border:1px solid var(--bd);border-radius:4px;padding:2px 9px;font-size:11px;font-family:var(--fm)">${f}</span>`).join('')}</div>
      </div>
      <div class="buy-total"><span style="color:var(--tx2);font-size:14px">Toplam (KDV dahil)</span><span class="buy-total-p" id="bTotal">₺${(d.price||0).toLocaleString('tr-TR')}</span></div>
      <div style="background:rgba(42,157,143,.06);border:1px solid rgba(42,157,143,.2);border-radius:var(--r);padding:9px 13px;margin-bottom:14px;font-size:12px;color:#4ecdc4">✓ Ödeme sonrası tüm dosyalar <strong>anında</strong> hesabınıza eklenir</div>
      <button class="btn-checkout" onclick="toPay('${d.id}')">Ödemeye Geç →</button>
      <div style="text-align:center;margin-top:10px;font-size:11px;color:var(--tx3)">🔒 iyzico · SSL · Visa · Mastercard · Troy</div>
    </div>
    <!-- ADIM 2 -->
    <div id="bs2" class="hidden">
      <button onclick="document.getElementById('bs2').classList.add('hidden');document.getElementById('bs1').classList.remove('hidden')" style="background:none;border:none;color:var(--tx3);font-size:13px;cursor:pointer;margin-bottom:14px;padding:0">← Geri dön</button>
      <div style="background:var(--bg3);border:1px solid var(--bd);border-radius:var(--r);padding:13px 15px;margin-bottom:18px;display:flex;justify-content:space-between">
        <span style="font-size:13px;color:var(--tx2)" id="bs2sum">—</span>
        <span style="font-family:var(--fm);font-size:16px;color:var(--ac)" id="bs2price">₺0</span>
      </div>
      <div class="fg"><label>Kart Üzerindeki İsim</label><input type="text" id="cname" placeholder="AD SOYAD" style="text-transform:uppercase"></div>
      <div class="fg"><label>Kart Numarası</label><input type="text" id="cnum" placeholder="0000 0000 0000 0000" maxlength="19" oninput="fmtCard(this)"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:13px">
        <div class="fg"><label>Son Kullanma</label><input type="text" id="cexp" placeholder="AA/YY" maxlength="5" oninput="fmtExp(this)"></div>
        <div class="fg"><label>CVV</label><input type="text" id="ccvv" placeholder="000" maxlength="3"></div>
      </div>
      <div style="background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.2);border-radius:var(--r);padding:9px 13px;margin-bottom:14px;font-size:12px;color:var(--gold)">⚠ Kart bilgileriniz iyzico'nun güvenli altyapısında işlenir. Tarafımızca saklanmaz.</div>
      <div class="fg" style="margin-bottom:14px"><label class="chk-l"><input type="checkbox" id="cayma"> Dijital içerikte cayma hakkımın bulunmadığını onaylıyorum. <a href="#" onclick="event.preventDefault();closeModal('buyModal');showPage('legal-refund')" style="color:var(--ac);text-decoration:underline">İptal Koşulları</a></label></div>
      <button class="btn-form btn-pay" id="payBtn" onclick="finalizePay('${d.id}')"><span id="payBtnTxt">💳 Ödemeyi Tamamla</span></button>
      <div class="pay-row-sm" style="margin-top:12px">
        <div class="plogo-sm" style="background:#1A1A2E"><span style="font-weight:700;color:#00D4AA;font-size:10px">iyzico</span></div>
        <div class="plogo-sm" style="background:#1A1F71"><span style="font-weight:900;color:#fff;font-size:10px;letter-spacing:1px">VISA</span></div>
        <div class="plogo-sm" style="background:#252525;gap:0;width:32px"><div style="width:11px;height:11px;border-radius:50%;background:#EB001B;margin-right:-5px;z-index:1;flex-shrink:0"></div><div style="width:11px;height:11px;border-radius:50%;background:#F79E1B;flex-shrink:0"></div></div>
        <div class="plogo-sm" style="background:#0066CC"><span style="font-weight:700;color:#fff;font-size:10px">troy</span></div>
        <div class="plogo-sm" style="background:#2D7D46"><span style="font-size:9px">🔒</span><span style="font-weight:700;color:#fff;font-size:10px;margin-left:3px">SSL</span></div>
      </div>
    </div>
    <!-- ADIM 3 -->
    <div id="bs3" class="hidden" style="text-align:center;padding:20px 0">
      <div style="font-size:44px;margin-bottom:14px">🎉</div>
      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:26px;margin-bottom:9px">Satın Alma Tamamlandı!</h3>
      <p style="font-size:14px;color:var(--tx2);margin-bottom:22px;line-height:1.6">Dosyalar hesabınıza eklendi.<br>Dashboard > Satın Aldıklarım bölümünden indirebilirsiniz.</p>
      <div style="background:var(--bg3);border:1px solid var(--bd);border-radius:var(--r);padding:14px;margin-bottom:18px;text-align:left">
        <div style="font-size:12px;color:var(--tx3);margin-bottom:7px">Sipariş Özeti</div>
        <div style="display:flex;justify-content:space-between;font-size:14px" id="orderSum"></div>
      </div>
      <button class="btn-form" onclick="closeModal('buyModal');showPage('dashboard')">Dashboard'a Git</button>
    </div>`;
  showModal('buyModal');
}
function selBuyLic(el,type,price){
  document.querySelectorAll('.buy-lopt').forEach(o=>o.classList.remove('sel'));
  el.classList.add('sel');el.querySelector('input').checked=true;
  buyPrice=price;buyLicense=type;
  const bt=document.getElementById('bTotal');
  if(bt)bt.textContent=`₺${price.toLocaleString('tr-TR')}`;
}
function toPay(id){
  if(!curUser){closeModal('buyModal');showModal('loginModal');toast('Giriş yapmanız gerekiyor','');return;}
  const d=ALL.find(x=>String(x.id)===String(id));
  document.getElementById('bs1').classList.add('hidden');
  document.getElementById('bs2').classList.remove('hidden');
  const s=document.getElementById('bs2sum'),p=document.getElementById('bs2price');
  if(s)s.textContent=`${d?.title||''} · ${buyLicense==='exclusive'?'Exclusive':'Standart'}`;
  if(p)p.textContent=`₺${buyPrice.toLocaleString('tr-TR')}`;
}
async function finalizePay(id){
  if(!document.getElementById('cayma')?.checked){toast('Cayma hakkı onayını işaretleyin','error');return;}
  const cn=document.getElementById('cname')?.value?.trim();
  const num=document.getElementById('cnum')?.value?.replace(/\s/g,'');
  const exp=document.getElementById('cexp')?.value;
  const cvv=document.getElementById('ccvv')?.value;
  if(!cn||num?.length<16||!exp||cvv?.length<3){toast('Kart bilgilerini eksiksiz doldurun','error');return;}
  const btn=document.getElementById('payBtn'),btxt=document.getElementById('payBtnTxt');
  if(btn)btn.disabled=true;if(btxt)btxt.textContent='⏳ İşleniyor...';
  await new Promise(r=>setTimeout(r,1800));
  try{
    if(curUser&&db){
      const d=ALL.find(x=>String(x.id)===String(id));
      await db.collection('purchases').add({
        designId:id,designTitle:d?.title||'',
        buyerId:curUser.uid,buyerEmail:curUser.email,
        designerId:d?.designerId||'',
        price:buyPrice,license:buyLicense,
        purchasedAt:firebase.firestore.FieldValue.serverTimestamp(),
        status:'completed'
      });
      if(!String(id).startsWith('m')){
        await db.collection('designs').doc(id).update({sales:firebase.firestore.FieldValue.increment(1)});
      }
    }
  }catch(e){console.error('Satış kaydı:',e);}
  document.getElementById('bs2')?.classList.add('hidden');
  const s3=document.getElementById('bs3');
  if(s3){s3.classList.remove('hidden');const os=document.getElementById('orderSum');if(os){const d=ALL.find(x=>String(x.id)===String(id));os.innerHTML=`<span>${d?.title||'Tasarım'}</span><span style="color:var(--ac);font-family:var(--fm)">₺${buyPrice.toLocaleString('tr-TR')}</span>`;}}
  if(btn)btn.disabled=false;
}
function fmtCard(i){let v=i.value.replace(/\D/g,'').substring(0,16);i.value=v.replace(/(.{4})/g,'$1 ').trim();}
function fmtExp(i){let v=i.value.replace(/\D/g,'');if(v.length>=2)v=v.substring(0,2)+'/'+v.substring(2,4);i.value=v;}

/* ── IMGBB UPLOAD ── */
async function uploadImgBB(file){
  const fd=new FormData();fd.append('image',file);
  const res=await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,{method:'POST',body:fd});
  const data=await res.json();
  if(!data.success)throw new Error(data.error?.message||'ImgBB hatası');
  return{url:data.data.url,thumb:data.data.thumb.url};
}
async function uploadAllSlots(){
  const keys={
    'ss-front':'front','ss-back':'back','ss-detail':'detail','ss-flat':'flat',
    'ss-m1':'model','ss-m2':'texture','ss-m3':'pattern','ss-m4':'colorVar','ss-m5':'field','ss-m6':'packaging'
  };
  const res={};
  for(const[slotId,key]of Object.entries(keys)){
    const slot=document.getElementById(slotId);if(!slot)continue;
    if(!slot.querySelector('img.is-prev'))continue;
    const fi=slot.closest('.is')?.querySelector('input[type="file"]');
    if(!fi?.files?.[0])continue;
    try{toast(`Yükleniyor: ${key}...`,'');res[key]=await uploadImgBB(fi.files[0]);}
    catch(e){
      if(['front','back','detail','flat'].includes(key))throw new Error(`Zorunlu görsel yüklenemedi (${key}): ${e.message}`);
      console.warn(key,'yüklenemedi:',e);
    }
  }
  return res;
}

/* ── SUBMIT DESIGN ── */
async function submitDesign(){
  if(!document.getElementById('upCopy')?.checked){toast('Telif beyanını onaylayın','error');return;}
  if(!curUser){closeModal('uploadModal');showModal('loginModal');return;}
  const title=document.getElementById('upTitle')?.value?.trim();
  if(!title){toast('Tasarım adı zorunludur','error');return;}
  const req=['ss-front','ss-back','ss-detail','ss-flat'];
  const missing=req.filter(id=>!document.getElementById(id)?.querySelector('img.is-prev'));
  if(missing.length){toast('4 zorunlu görseli yükleyin','error');return;}
  const btn=document.getElementById('pubBtn');
  if(btn){btn.disabled=true;btn.textContent='⏳ Yükleniyor...';}
  try{
    toast('Görseller ImgBB\'ye yükleniyor...','');
    let imgs={};
    try{imgs=await uploadAllSlots();}
    catch(e){toast('Görsel hatası: '+e.message,'error');if(btn){btn.disabled=false;btn.textContent='Tasarımı Yayınla 🚀';}return;}
    toast('Kaydediliyor...','');
    await db.collection('designs').add({
      title,
      sport:document.getElementById('upSport')?.value||'Futbol',
      kit:document.getElementById('upKit')?.value||'Ev',
      style:document.getElementById('upStyle')?.value||'modern',
      pattern:document.getElementById('upPattern')?.value||'minimal',
      fabric:document.getElementById('upFabric')?.value||'',
      desc:document.getElementById('upDesc')?.value?.trim()||'',
      tags:(document.getElementById('upTags')?.value||'').split(',').map(t=>t.trim()).filter(Boolean),
      colors:[document.getElementById('c1h')?.value||'#e63946',document.getElementById('c2h')?.value||'#1d1d1d',document.getElementById('c3h')?.value||'#ffffff'],
      price:Number(document.getElementById('stdPrice')?.value)||0,
      exclusivePrice:Number(document.getElementById('exclPrice')?.value)||0,
      designerId:curUser.uid,
      designerName:curUser.name,
      designerInitials:curUser.name[0]?.toUpperCase()||'?',
      coverUrl:imgs.front?.url||'',
      coverThumb:imgs.front?.thumb||'',
      imageUrls:imgs,
      likes:0,sales:0,
      createdAt:firebase.firestore.FieldValue.serverTimestamp(),
      status:'pending'
    });
    if(btn){btn.disabled=false;btn.textContent='Tasarımı Yayınla 🚀';}
    closeModal('uploadModal');
    toast('🚀 Tasarım yüklendi! Admin onayı bekleniyor.','success');
    resetUpload();
  }catch(e){
    console.error(e);toast('Yükleme hatası: '+e.message,'error');
    if(btn){btn.disabled=false;btn.textContent='Tasarımı Yayınla 🚀';}
  }
}
function resetUpload(){
  wizStep(1);
  ['upTitle','upDesc','upTags'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
  document.getElementById('upCopy').checked=false;
  ['ss-front','ss-back','ss-detail','ss-flat','ss-m1','ss-m2','ss-m3','ss-m4','ss-m5','ss-m6'].forEach(id=>{
    const el=document.getElementById(id);if(!el)return;
    el.innerHTML='<div class="isp">+</div><div class="isl">'+el.querySelector('.isl')?.textContent+'</div>';
    el.closest('.is')?.classList.remove('filled');
  });
}
function wizStep(n){
  for(let i=1;i<=5;i++){
    document.getElementById('panel'+i)?.classList.add('hidden');
    const w=document.getElementById('ws'+i);if(w){w.classList.remove('active','done');}
  }
  document.getElementById('panel'+n)?.classList.remove('hidden');
  const wa=document.getElementById('ws'+n);if(wa)wa.classList.add('active');
  for(let i=1;i<n;i++){const w=document.getElementById('ws'+i);if(w)w.classList.add('done');}
  if(n===2){
    const req=['ss-front','ss-back','ss-detail','ss-flat'];
    const missing=req.filter(id=>!document.getElementById(id)?.querySelector('img.is-prev'));
    if(missing.length){toast('4 zorunlu görseli yükleyin','error');wizStep(1);return;}
  }
}
function prevSlot(input,slotId){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const slot=document.getElementById(slotId);
    if(slot){slot.innerHTML=`<img src="${e.target.result}" class="is-prev" alt="preview">`;slot.closest('.is')?.classList.add('filled');}
  };
  reader.readAsDataURL(file);
}
function calcE(){
  const s=parseFloat(document.getElementById('stdPrice')?.value)||0;
  const x=parseFloat(document.getElementById('exclPrice')?.value)||0;
  const se=document.getElementById('stdEarn'),xe=document.getElementById('exclEarn');
  if(se)se.textContent=`₺${Math.round(s*.8).toLocaleString('tr-TR')}`;
  if(xe)xe.textContent=`₺${Math.round(x*.8).toLocaleString('tr-TR')}`;
}
function syncC(cId,hId){const h=document.getElementById(hId);if(h)h.value=document.getElementById(cId)?.value;}
function syncH(hId,cId){const v=document.getElementById(hId)?.value;if(/^#[0-9A-Fa-f]{6}$/.test(v))document.getElementById(cId).value=v;}

/* ── FAVORITES ── */
function toggleFav(id,btn){
  const s=String(id);
  if(favs.has(s)){favs.delete(s);toast('Favorilerden çıkarıldı','');if(btn)btn.textContent=btn.classList.contains('btn-fav')?'♡ Favorilere Ekle':'♡';}
  else{favs.add(s);toast('Favorilere eklendi ♥','success');if(btn)btn.textContent=btn.classList.contains('btn-fav')?'♥ Favorilerden Çıkar':'♥';}
}

/* ── MODALS ── */
function showModal(id){const el=document.getElementById(id);if(el)el.classList.add('open');}
function closeModal(id){const el=document.getElementById(id);if(el)el.classList.remove('open');}
function oClose(e,id){if(e.target.id===id)closeModal(id);}

/* ── TOAST ── */
let toastT;
function toast(msg,type){
  const el=document.getElementById('toast');if(!el)return;
  el.textContent=msg;el.className=`toast show${type?' '+type:''}`;
  clearTimeout(toastT);toastT=setTimeout(()=>el.classList.remove('show'),3000);
}

/* ── MISC ── */
function toggleNav(){document.getElementById('navMob')?.classList.toggle('hidden');}
function setTTab(btn){document.querySelectorAll('.ttab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderHome();}
