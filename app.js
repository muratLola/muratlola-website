/* ═══════════════════════════════════════════
   formaLOLA — app.js
   Firebase-ready frontend logic
═══════════════════════════════════════════ */

/* ══════════ FIREBASE KURULUMU ══════════ */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  GithubAuthProvider, // BUNA EKLENDİ
  OAuthProvider,      // BUNA EKLENDİ (Apple vb. için)
  signInWithPopup, 
  onAuthStateChanged, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCI7Ku7aF2gAf-lDpMwzYfBY0iC_ulg3gE",
  authDomain: "formalola-c4ba7.firebaseapp.com",
  projectId: "formalola-c4ba7",
  storageBucket: "formalola-c4ba7.firebasestorage.app",
  messagingSenderId: "67406520517",
  appId: "1:67406520517:web:a9d240d47a99d3c79690ac"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
/* ═══════════════════════════════════════ */


/* ══════════ MOCK DATA ══════════ */
const MOCK_DESIGNS = [
  { id: 1, title: 'Gece Yarısı Pro', designer: 'MertStudio', designerInitials: 'MS', sport: 'Futbol', style: 'modern', pattern: 'gradient', colors: ['#0a0a0a','#e63946','#ffffff'], price: 449, exclusivePrice: 3999, sales: 128, likes: 342, license: 'standard', bg: 'linear-gradient(140deg,#0a0a0a,#1a1a2e)', num: '10', kit: 'Deplasman' },
  { id: 2, title: 'Anadolu Kırmızısı', designer: 'FormArt', designerInitials: 'FA', sport: 'Futbol', style: 'retro', pattern: 'stripes', colors: ['#e63946','#1d1d1d','#f4f1de'], price: 299, exclusivePrice: 2499, sales: 89, likes: 211, license: 'standard', bg: 'linear-gradient(140deg,#e63946,#8b0000)', num: '7', kit: 'Ev' },
  { id: 3, title: 'Cyber Esports Kit', designer: 'NeonLab', designerInitials: 'NL', sport: 'E-Spor', style: 'futuristic', pattern: 'geometric', colors: ['#0d1b2a','#415a77','#e9c46a'], price: 599, exclusivePrice: 5499, sales: 67, likes: 198, license: 'exclusive', bg: 'linear-gradient(140deg,#0d1b2a,#415a77)', num: '9', kit: 'Ev' },
  { id: 4, title: 'Bosphorus Wave', designer: 'IstanbulKit', designerInitials: 'IK', sport: 'Basketbol', style: 'modern', pattern: 'abstract', colors: ['#1d3557','#457b9d','#a8dadc'], price: 389, exclusivePrice: 3500, sales: 54, likes: 167, license: 'standard', bg: 'linear-gradient(140deg,#1d3557,#457b9d)', num: '23', kit: 'Deplasman' },
  { id: 5, title: 'Sarı Kaplan', designer: 'TigerDesign', designerInitials: 'TD', sport: 'Futbol', style: 'classic', pattern: 'stripes', colors: ['#e9c46a','#1d1d1d','#ffffff'], price: 329, exclusivePrice: 2999, sales: 103, likes: 289, license: 'standard', bg: 'linear-gradient(140deg,#e9c46a,#f4a261)', num: '11', kit: 'Ev' },
  { id: 6, title: 'Mor Şimşek', designer: 'EliteKit', designerInitials: 'EK', sport: 'Voleybol', style: 'futuristic', pattern: 'geometric', colors: ['#8338ec','#3a0ca3','#f72585'], price: 449, exclusivePrice: 4000, sales: 41, likes: 134, license: 'standard', bg: 'linear-gradient(140deg,#8338ec,#3a0ca3)', num: '6', kit: 'Ev' },
];

const MOCK_DESIGNERS = [
  { id: 1, name: 'MertStudio', initials: 'MS', bio: 'Futbol forma uzmanı', sales: 128, designs: 24, rating: 4.9, level: 'master' },
  { id: 2, name: 'NeonLab', initials: 'NL', bio: 'E-spor & fütüristik tasarım', sales: 67, designs: 18, rating: 4.8, level: 'elite' },
  { id: 3, name: 'IstanbulKit', initials: 'IK', bio: 'Türk motifli formalar', sales: 54, designs: 15, rating: 4.7, level: 'pro' },
  { id: 4, name: 'FormArt', initials: 'FA', bio: 'Retro koleksiyon ustası', sales: 89, designs: 31, rating: 4.8, level: 'elite' }
];

const MOCK_COMPETITIONS = [
  { id: 1, club: 'Bosphorus FC', desc: '2026-27 sezonu Ev forması tasarım yarışması', prize: '₺5.000', deadline: '15 gün kaldı', entries: 34 },
  { id: 2, club: 'Ankara Thunder', desc: 'E-Spor takımımız için yeni kimlik arıyoruz', prize: '$800', deadline: '8 gün kaldı', entries: 19 },
];


/* ══════════ STATE ══════════ */
let currentPage = 'home';
let previousPage = 'home';
let currentUser = null;
let favorites = new Set();
let currentDesignId = null;
let exploreOffset = 0;
let selectedColors = new Set();
let currentUploadStep = 1;


/* ══════════ INIT ══════════ */
document.addEventListener('DOMContentLoaded', () => {
  renderHomeDesigns();
  renderSpotlight();
  renderHomeComps();
  calcEarnings();
  initScrollNav();
});

function initScrollNav() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('mainNav');
    if (window.scrollY > 20) {
      nav.style.boxShadow = '0 1px 20px rgba(0,0,0,0.4)';
    } else {
      nav.style.boxShadow = 'none';
    }
  });
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


/* ══════════ RENDER HOME ══════════ */
function renderHomeDesigns() {
  const grid = document.getElementById('homeGrid');
  if (!grid) return;
  grid.innerHTML = MOCK_DESIGNS.slice(0, 8).map(d => designCard(d)).join('');
}

function renderSpotlight() {
  const el = document.getElementById('spotlightGrid');
  if (!el) return;
  el.innerHTML = MOCK_DESIGNERS.map(d => `
    <div class="spotlight-card" onclick="showDesignerProfile(${d.id})">
      <div class="sp-avatar">${d.initials}</div>
      <div class="sp-name">${d.name}</div>
      <div class="sp-level">${d.level}</div>
    </div>
  `).join('');
}

function renderHomeComps() {
  const el = document.getElementById('homeComps');
  if (!el) return;
  el.innerHTML = MOCK_COMPETITIONS.map(c => compCard(c)).join('');
}


/* ══════════ COMPONENTS ══════════ */
function designCard(d) {
  const isFav = favorites.has(d.id);
  const badge = d.license === 'exclusive' ? `<span class="tag tag-excl" style="font-size:10px;padding:3px 7px">Exclusive</span>` : '';
  
  return `
    <div class="design-card" onclick="showDesignDetail(${d.id})">
      <div class="dc-img">
        <div class="dc-img-placeholder" style="background:${d.bg}; width:100%; height:100%; position:relative">
          <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center">
            <span style="font-family:'Bebas Neue',sans-serif;font-size:26px;color:rgba(255,255,255,0.7);">${d.num}</span>
          </div>
        </div>
        ${badge ? `<div class="dc-badge-top">${badge}</div>` : ''}
        <div class="dc-overlay">
          <button class="dc-action" onclick="event.stopPropagation();openBuyModal(${d.id})">Satın Al</button>
        </div>
      </div>
      <div class="dc-body">
        <div class="dc-title">${d.title}</div>
        <div class="dc-footer">
          <span class="dc-price">₺${d.price}</span>
        </div>
      </div>
    </div>
  `;
}

function compCard(c) {
  return `<div class="comp-card"><div class="comp-club">${c.club}</div><div class="comp-prize">${c.prize}</div></div>`;
}


/* ══════════ EXPLORE & FILTERS ══════════ */
function renderExplore() { applyFilters(); }
function applyFilters() {
  const grid = document.getElementById('exploreGrid');
  if (!grid) return;
  grid.innerHTML = MOCK_DESIGNS.map(d => designCard(d)).join('');
}
function clearFilters() { applyFilters(); }
function toggleFilterPanel() { document.getElementById('filterPanel').classList.toggle('open'); }
function filterByCategory(cat) { showPage('explore'); }
function loadMore() {}
function toggleSwatch(el) { el.classList.toggle('active'); }


/* ══════════ DESIGN DETAIL ══════════ */
function showDesignDetail(id) {
  const d = MOCK_DESIGNS.find(x => x.id === id);
  if (!d) return;
  currentDesignId = id;
  showPage('detail');
  document.getElementById('detailContent').innerHTML = `<h1 class="detail-title">${d.title}</h1><button class="btn-buy-now" onclick="openBuyModal(${d.id})">Satın Al - ₺${d.price}</button>`;
}


/* ══════════ OTHER PAGES ══════════ */
function renderDesignersPage() {
  const grid = document.getElementById('designersGrid');
  if(grid) grid.innerHTML = MOCK_DESIGNERS.map(d => `<div class="designer-card">${d.name}</div>`).join('');
}
function showDesignerProfile(id) { showPage('designer-profile'); }
function renderCompetitionsPage() {
  const grid = document.getElementById('compsGrid');
  if(grid) grid.innerHTML = MOCK_COMPETITIONS.map(c => compCard(c)).join('');
}
function renderDashboard() {
  if (!currentUser) {
    document.getElementById('dashContent').innerHTML = `<button class="btn-cta" onclick="showModal('loginModal')">Giriş Yap</button>`;
    return;
  }
  document.getElementById('dashContent').innerHTML = `<h2>Hoş geldin, ${currentUser.name} 👋</h2>`;
}
function dashTab(tab, btn) { renderDashboard(); }


/* ══════════ MODALS & UI ══════════ */
function showModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
function outsideClose(e, id) { if (e.target.id === id) closeModal(id); }

let toastTimer;
function showToast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast show${type ? ' ' + type : ''}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
}

function setTrendTab(btn) {
  document.querySelectorAll('.ttab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
}
function toggleMobileNav() { document.getElementById('navMobileMenu').classList.toggle('hidden'); }


/* ══════════ UPLOAD / BUY ══════════ */
function openBuyModal(id) { showModal('buyModal'); }
function selectBuyLicense(el, price) {}
function processBuy(id) { closeModal('buyModal'); showToast('Satın alındı', 'success'); }
function wizGo(step) {
  for (let i = 1; i <= 5; i++) document.getElementById('panel' + i)?.classList.add('hidden');
  document.getElementById('panel' + step)?.classList.remove('hidden');
}
function previewSlot(input, slotId) {}
function submitDesign() { closeModal('uploadModal'); showToast('Yayınlandı', 'success'); }
function calcEarnings() {}
function syncColor(colorId, hexId) {}
function syncHex(hexId, colorId) {}


/* ══════════ FIREBASE AUTH LOGIC ══════════ */

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = { name: user.displayName || user.email.split('@')[0], email: user.email, uid: user.uid };
    document.getElementById('navLoginBtn').classList.add('hidden');
    document.getElementById('navAvatar').classList.remove('hidden');
    document.getElementById('navAvatar').textContent = currentUser.name[0].toUpperCase();
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
    await signInWithEmailAndPassword(auth, email, pass);
    closeModal('loginModal');
    showToast(`Hoş geldin! ✓`, 'success');
  } catch (error) {
    showToast('Giriş başarısız.', 'error');
  }
}

async function doRegister() {
  const email = document.getElementById('regEmail').value;
  const pass = document.getElementById('regPass').value;
  if (!email || !pass) { showToast('Tüm alanları doldurun', 'error'); return; }
  try {
    await createUserWithEmailAndPassword(auth, email, pass);
    closeModal('loginModal');
    showToast('Kayıt başarılı!', 'success');
  } catch (error) {
    showToast('Kayıt olunamadı.', 'error');
  }
}

async function doGoogleLogin() {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    closeModal('loginModal');
    showToast('Google ile giriş yapıldı!', 'success');
  } catch (error) {
    showToast('Giriş iptal edildi.', 'error');
  }
}

async function doLogout() {
  try {
    await signOut(auth);
    showPage('home');
    showToast('Çıkış yapıldı', '');
  } catch (error) {}
}

function authTab(tab, btn) {
  document.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('authLogin').classList.toggle('hidden', tab !== 'login');
  document.getElementById('authRegister').classList.toggle('hidden', tab !== 'register');
}
// GitHub Girişi
window.doGithubLogin = async function() {
  const provider = new GithubAuthProvider();
  try {
    await signInWithPopup(auth, provider);
    closeModal('loginModal');
    showToast('GitHub ile giriş yapıldı!', 'success');
  } catch (error) {
    showToast('GitHub ile giriş iptal edildi.', 'error');
    console.error(error);
  }
}

// Apple Girişi
window.doAppleLogin = async function() {
  const provider = new OAuthProvider('apple.com');
  try {
    await signInWithPopup(auth, provider);
    closeModal('loginModal');
    showToast('Apple ile giriş yapıldı!', 'success');
  } catch (error) {
    showToast('Apple ile giriş iptal edildi.', 'error');
    console.error(error);
  }
}

/* ══════════ EXPORT TO WINDOW (MODÜL ÇÖZÜMÜ) ══════════ */
// HTML'deki onclick komutlarının çalışması için hepsini window'a atıyoruz.
window.showPage = showPage;
window.goBack = goBack;
window.showModal = showModal;
window.closeModal = closeModal;
window.outsideClose = outsideClose;
window.toggleMobileNav = toggleMobileNav;
window.setTrendTab = setTrendTab;
window.filterByCategory = filterByCategory;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.toggleFilterPanel = toggleFilterPanel;
window.toggleSwatch = toggleSwatch;
window.loadMore = loadMore;
window.showDesignDetail = showDesignDetail;
window.showDesignerProfile = showDesignerProfile;
window.dashTab = dashTab;
window.openBuyModal = openBuyModal;
window.selectBuyLicense = selectBuyLicense;
window.processBuy = processBuy;
window.wizGo = wizGo;
window.previewSlot = previewSlot;
window.submitDesign = submitDesign;
window.calcEarnings = calcEarnings;
window.syncColor = syncColor;
window.syncHex = syncHex;
// Auth
window.doLogin = doLogin;
window.doRegister = doRegister;
window.doGoogleLogin = doGoogleLogin;
window.doLogout = doLogout;
window.authTab = authTab;

