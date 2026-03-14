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

const ADMIN_EMAIL = 'firat3306ogur@gmail.com';
const IMGBB_API_KEY = '8450d2c8a81b83cde9453909f3d7cb28';

let currentUser = null;
let currentPage = 'home';
let allDesigns = [];
let pendingIntent = null;
let currentLang = localStorage.getItem('fl_lang') || 'tr';
let t = null;

const LANGS = {
  tr: {
    name:'Türkçe', flag:'🇹🇷', login:'Giriş Yap', uploadNav:'+ Tasarım Yükle', navExplore:'Keşfet', navDesigners:'Tasarımcılar', navAbout:'Hakkımızda', navContact:'İletişim',
    heroLine1:'FORMA TASARIMINI', heroLine2:'SAT.', heroLine3:'HAYALİNİ', heroLine4:'BUL.', heroSub:'Tasarımcılar yükler — Takımlar keşfeder — Moderasyon sonrası yayına girer', heroExplore:'Tasarımları Keşfet', heroUpload:'Tasarım Yükle',
    featuredTitle:'Öne Çıkan Tasarımlar', featuredSub:'En çok etkileşim alan ve editoryal olarak öne çıkan işler.'
  },
  en: {
    name:'English', flag:'🇬🇧', login:'Sign In', uploadNav:'+ Upload Design', navExplore:'Explore', navDesigners:'Designers', navAbout:'About', navContact:'Contact',
    heroLine1:'SELL YOUR KIT', heroLine2:'DESIGN.', heroLine3:'FIND YOUR', heroLine4:'NEXT KIT.', heroSub:'Designers upload — Clubs discover — Published after moderation', heroExplore:'Explore Designs', heroUpload:'Upload Design',
    featuredTitle:'Featured Designs', featuredSub:'Most engaging and editorially highlighted works.'
  },
  ar: {
    name:'العربية', flag:'🇸🇦', login:'تسجيل الدخول', uploadNav:'+ رفع تصميم', navExplore:'استكشف', navDesigners:'المصممون', navAbout:'من نحن', navContact:'اتصال',
    heroLine1:'بِع تصميم', heroLine2:'قميصك.', heroLine3:'اعثر على', heroLine4:'طقمك.', heroSub:'المصممون يرفعون — الأندية تكتشف — بعد المراجعة', heroExplore:'استكشف التصاميم', heroUpload:'رفع تصميم'
  }
};

function sanitizeHTML(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function $(id){ return document.getElementById(id); }
function showToast(msg, type='') {
  const el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `toast show ${type}`;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { el.className = 'toast'; }, 2600);
}
function showModal(id){ const el=$(id); if(el) el.classList.remove('hidden'); }
function closeModal(id){ const el=$(id); if(el) el.classList.add('hidden'); }
function closeAllModals(){ document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden')); }

function showPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');
  if (page === 'dashboard') renderDashboard();
  if (page === 'explore') applyFilters();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchAuthTab(which) {
  $('loginPane').classList.toggle('hidden', which !== 'login');
  $('registerPane').classList.toggle('hidden', which !== 'register');
  $('loginTabBtn').classList.toggle('active', which === 'login');
  $('registerTabBtn').classList.toggle('active', which === 'register');
}

function buildLangModal(){
  const grid = $('langGrid');
  if (!grid) return;
  grid.innerHTML = Object.entries(LANGS).map(([code, lang]) => `
    <button class="lang-option ${code===currentLang?'active':''}" onclick="setLang('${code}')">
      <span>${lang.flag}</span>
      <strong>${sanitizeHTML(lang.name)}</strong>
    </button>`).join('');
}
function openLangModal(){ buildLangModal(); showModal('langModal'); }
function setLang(code){
  currentLang = code; localStorage.setItem('fl_lang', code); applyLanguage(); buildLangModal(); closeModal('langModal');
}
function applyLanguage(){
  t = LANGS[currentLang] || LANGS.tr;
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
  if ($('langBtnTxt')) $('langBtnTxt').textContent = currentLang.toUpperCase();
}

async function ensureUserDoc(user, forcedRole = null) {
  const ref = db.collection('users').doc(user.uid);
  const snap = await ref.get();
  const base = {
    name: user.displayName || user.email.split('@')[0],
    email: user.email || '',
    photoURL: user.photoURL || '',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (!snap.exists) {
    const role = forcedRole || null;
    const data = {
      ...base,
      role,
      status: 'active',
      country: 'TR',
      totalSales: 0,
      totalEarnings: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (user.email === ADMIN_EMAIL) data.role = 'admin';
    await ref.set(data);
    return data;
  }
  await ref.set(base, { merge: true });
  return { ...snap.data(), ...base };
}

function needsRoleSelection(profile) {
  return !profile?.role || profile.role === 'pending_role';
}

async function chooseRole(role) {
  if (!auth.currentUser) return;
  try {
    await db.collection('users').doc(auth.currentUser.uid).set({
      role,
      status: 'active',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    closeModal('roleModal');
    showToast('Hesap tipi kaydedildi', 'success');
    await reloadCurrentUser();
    if (pendingIntent === 'upload') {
      pendingIntent = null;
      authThenUpload();
    }
  } catch (e) {
    showToast('Rol kaydedilemedi: ' + e.message, 'error');
  }
}

async function reloadCurrentUser() {
  const user = auth.currentUser;
  if (!user) return;
  const profile = await ensureUserDoc(user);
  currentUser = {
    uid: user.uid,
    email: user.email || '',
    name: profile?.name || user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
    role: profile?.role || null,
    isAdmin: (profile?.role === 'admin') || user.email === ADMIN_EMAIL
  };
  updateAuthUI();
}

function updateAuthUI() {
  const loggedIn = !!currentUser;
  $('navLoginBtn')?.classList.toggle('hidden', loggedIn);
  const avatar = $('navAvatar');
  if (avatar) {
    avatar.classList.toggle('hidden', !loggedIn);
    if (loggedIn) avatar.textContent = (currentUser.name || 'U')[0].toUpperCase();
  }
}

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    currentUser = null;
    updateAuthUI();
    return;
  }
  try {
    const profile = await ensureUserDoc(user);
    currentUser = {
      uid: user.uid,
      email: user.email || '',
      name: profile?.name || user.displayName || user.email.split('@')[0],
      role: profile?.role || null,
      isAdmin: (profile?.role === 'admin') || user.email === ADMIN_EMAIL
    };
    updateAuthUI();
    if (needsRoleSelection(profile)) showModal('roleModal');
    if ($('dashboardWelcome')) $('dashboardWelcome').textContent = `Hoş geldin, ${currentUser.name}`;
    renderDashboard();
  } catch (e) {
    console.error(e);
    showToast('Kullanıcı profili yüklenemedi', 'error');
  }
});

async function doLogin() {
  const email = $('loginEmail').value.trim();
  const pass = $('loginPass').value;
  if (!email || !pass) return showToast('E-posta ve şifre gerekli', 'error');
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    closeModal('authModal');
    showToast('Hoş geldin', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function doRegister() {
  const name = $('regName').value.trim();
  const email = $('regEmail').value.trim();
  const pass = $('regPass').value;
  const role = $('regRole').value;
  if (!name || !email || !pass) return showToast('Tüm alanları doldurun', 'error');
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, pass);
    await cred.user.updateProfile({ displayName: name });
    await ensureUserDoc(cred.user, role);
    closeModal('authModal');
    showToast('Kayıt başarılı', 'success');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function doGoogleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    const profile = await ensureUserDoc(result.user);
    closeModal('authModal');
    if (needsRoleSelection(profile)) {
      showModal('roleModal');
    } else {
      showToast('Google ile giriş başarılı', 'success');
    }
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function logout() {
  await auth.signOut();
  showPage('home');
}

function authThenUpload() {
  if (!currentUser) {
    pendingIntent = 'upload';
    showModal('authModal');
    showToast('Tasarım yüklemek için giriş yapın');
    return;
  }
  if (!currentUser.role) {
    pendingIntent = 'upload';
    showModal('roleModal');
    showToast('Önce hesap tipini seçmelisin');
    return;
  }
  if (currentUser.role !== 'designer' && !currentUser.isAdmin) {
    showToast('Tasarım yüklemek için hesap tipin Tasarımcı olmalı', 'error');
    return;
  }
  showModal('uploadModal');
}

async function uploadPreviewToImgBB() {
  const file = $('upImageFile').files?.[0];
  if (!file) return showToast('Önce bir görsel seçin', 'error');
  const fd = new FormData();
  fd.append('image', file);
  try {
    showToast('Görsel yükleniyor...');
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method:'POST', body: fd });
    const json = await res.json();
    if (!json?.success) throw new Error(json?.error?.message || 'Yükleme başarısız');
    $('upPreviewUrl').value = json.data.url;
    $('uploadPreview').innerHTML = `<img src="${sanitizeHTML(json.data.url)}" alt="preview">`;
    showToast('Görsel yüklendi', 'success');
  } catch (e) {
    showToast('ImgBB hatası: ' + e.message, 'error');
  }
}

async function submitDesign() {
  if (!currentUser) return showToast('Giriş yapmalısın', 'error');
  if (currentUser.role !== 'designer' && !currentUser.isAdmin) return showToast('Yalnızca tasarımcılar yükleyebilir', 'error');
  const title = $('upTitle').value.trim();
  const sport = $('upSport').value;
  const description = $('upDesc').value.trim();
  const coverImage = $('upPreviewUrl').value.trim();
  const sourceUrl = $('upSourceUrl').value.trim();
  const priceStandard = Number($('upPrice').value || 0);
  const priceExclusive = Number($('upExclusivePrice').value || 0);
  if (!title || !description || !coverImage || !priceStandard) return showToast('Başlık, açıklama, görsel ve fiyat gerekli', 'error');
  try {
    await db.collection('designs').add({
      title,
      sport,
      description,
      coverImage,
      previewUrl: coverImage,
      sourceUrl,
      priceStandard,
      priceExclusive,
      designerId: currentUser.uid,
      designerName: currentUser.name,
      designerEmail: currentUser.email,
      status: 'pending',
      visibility: 'private',
      featured: false,
      views: 0,
      likes: 0,
      sales: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal('uploadModal');
    $('upTitle').value=''; $('upDesc').value=''; $('upPreviewUrl').value=''; $('upSourceUrl').value=''; $('upPrice').value=''; $('upExclusivePrice').value=''; $('uploadPreview').textContent='Önizleme yok';
    showToast('Tasarım gönderildi. Admin onayı bekleniyor.', 'success');
    renderDashboard();
  } catch (e) {
    showToast('Tasarım kaydedilemedi: ' + e.message, 'error');
  }
}

async function fetchApprovedDesigns() {
  try {
    const snap = await db.collection('designs').where('status', '==', 'approved').where('visibility', '==', 'public').get();
    allDesigns = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderHome();
    applyFilters();
    renderDesigners();
    updateLiveCounters();
  } catch (e) {
    console.error(e);
    showToast('Tasarımlar yüklenemedi', 'error');
  }
}

function buildDesignCard(d) {
  const badge = d.featured ? '<span class="design-badge">Öne Çıkan</span>' : '';
  const img = d.coverImage ? `<img src="${sanitizeHTML(d.coverImage)}" alt="${sanitizeHTML(d.title)}">` : `<div class="design-placeholder">formaLOLA</div>`;
  return `
    <article class="design-card" onclick="openDesign('${d.id}')">
      <div class="design-cover">${badge}${img}</div>
      <div class="design-body">
        <div class="design-meta"><span>${sanitizeHTML((d.sport||'').toUpperCase())}</span><span>${sanitizeHTML(d.designerName || 'Designer')}</span></div>
        <h3 class="design-title">${sanitizeHTML(d.title || 'İsimsiz Tasarım')}</h3>
        <p class="design-desc">${sanitizeHTML(d.description || '')}</p>
        <div class="design-footer"><strong class="price">₺${Number(d.priceStandard||0).toLocaleString('tr-TR')}</strong><span class="soft">👁 ${d.views||0} · ❤️ ${d.likes||0}</span></div>
      </div>
    </article>`;
}

function renderHome() {
  const featured = [...allDesigns].sort((a,b)=> (b.likes||0)+(b.views||0) - ((a.likes||0)+(a.views||0))).slice(0,6);
  const newest = [...allDesigns].sort((a,b)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)).slice(0,6);
  $('featuredGrid').innerHTML = featured.map(buildDesignCard).join('') || `<p class="muted">Henüz onaylı tasarım yok.</p>`;
  $('newGrid').innerHTML = newest.map(buildDesignCard).join('') || `<p class="muted">Henüz onaylı tasarım yok.</p>`;
  $('heroStack').innerHTML = featured.slice(0,3).map((d,i)=>`
    <div class="hero-card" onclick="openDesign('${d.id}')">
      <div class="hero-card-top" style="background:${i===1?'linear-gradient(180deg,#f3e8e8,#f7dada)':'linear-gradient(180deg,#111827,#172036)'}">
        <div class="hero-shirt"></div>
      </div>
      <div class="hero-card-body"><div class="hero-card-title">${sanitizeHTML(d.title||'Tasarım')}</div><div class="hero-card-row"><span>₺${Number(d.priceStandard||0).toLocaleString('tr-TR')}</span><span class="tag ${i===0?'tag-hot':i===1?'tag-new':'tag-excl'}">${i===0?'Trend':i===1?'Yeni':'Premium'}</span></div></div>
    </div>`).join('');
}

function applyFilters() {
  const sport = $('filterSport')?.value || '';
  const sort = $('sortSelect')?.value || 'new';
  let arr = [...allDesigns];
  if (sport) arr = arr.filter(d => d.sport === sport);
  if (sort === 'new') arr.sort((a,b)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  if (sort === 'popular') arr.sort((a,b)=> ((b.likes||0)+(b.views||0)*0.5) - ((a.likes||0)+(a.views||0)*0.5));
  if (sort === 'priceAsc') arr.sort((a,b)=> (a.priceStandard||0) - (b.priceStandard||0));
  if (sort === 'priceDesc') arr.sort((a,b)=> (b.priceStandard||0) - (a.priceStandard||0));
  $('exploreGrid').innerHTML = arr.map(buildDesignCard).join('') || `<p class="muted">Sonuç bulunamadı.</p>`;
  $('exploreCount').textContent = `${arr.length} tasarım`;
}
function clearFilters(){ $('filterSport').value=''; $('sortSelect').value='new'; applyFilters(); }

function renderDesigners() {
  const byDesigner = new Map();
  for (const d of allDesigns) {
    const id = d.designerId || 'unknown';
    if (!byDesigner.has(id)) byDesigner.set(id, { id, name: d.designerName || 'Designer', count:0, likes:0 });
    const item = byDesigner.get(id); item.count++; item.likes += Number(d.likes||0);
  }
  const cards = [...byDesigner.values()].sort((a,b)=> b.count - a.count).map(x => `
    <div class="designer-card">
      <div class="designer-top"><div class="designer-avatar">${sanitizeHTML((x.name||'D')[0].toUpperCase())}</div><div><strong>${sanitizeHTML(x.name)}</strong><div class="muted small">Tasarımcı</div></div></div>
      <div class="designer-stats"><span>${x.count} tasarım</span><span>${x.likes} beğeni</span></div>
    </div>`).join('');
  $('designersGrid').innerHTML = cards || `<p class="muted">Henüz tasarımcı verisi yok.</p>`;
}

async function openDesign(id) {
  const design = allDesigns.find(x => x.id === id) || (await db.collection('designs').doc(id).get()).data();
  if (!design) return;
  try { await db.collection('designs').doc(id).set({ views: firebase.firestore.FieldValue.increment(1), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge:true }); } catch {}
  const d = { id, ...design };
  $('designModalContent').innerHTML = `
    <div class="design-detail">
      <div class="design-detail-cover">${d.coverImage ? `<img src="${sanitizeHTML(d.coverImage)}" alt="${sanitizeHTML(d.title)}">` : ''}</div>
      <div>
        <div class="design-meta"><span>${sanitizeHTML((d.sport||'').toUpperCase())}</span><span>${sanitizeHTML(d.designerName||'Designer')}</span></div>
        <h2 class="section-head" style="display:block;margin-bottom:8px"><span style="font-family:'Bebas Neue',sans-serif;font-size:52px">${sanitizeHTML(d.title || 'İsimsiz Tasarım')}</span></h2>
        <p class="muted">${sanitizeHTML(d.description || '')}</p>
        <div style="margin-top:16px"><span class="chip">Standart ₺${Number(d.priceStandard||0).toLocaleString('tr-TR')}</span>${d.priceExclusive?`<span class="chip">Exclusive ₺${Number(d.priceExclusive).toLocaleString('tr-TR')}</span>`:''}</div>
        <div class="detail-actions">
          <button class="btn btn-primary" onclick="demoBuy('${d.id}','standard')">Demo Satın Al</button>
          <button class="btn btn-ghost" onclick="copyShareLink('${d.id}')">Paylaş</button>
          <button class="btn btn-ghost" onclick="toggleLike('${d.id}')">Beğen</button>
        </div>
        ${d.sourceUrl ? `<p class="muted small" style="margin-top:16px">Kaynak dosya bağlantısı sistemde kayıtlı.</p>` : ''}
      </div>
    </div>`;
  showModal('designModal');
}

async function toggleLike(id) {
  try {
    await db.collection('designs').doc(id).set({ likes: firebase.firestore.FieldValue.increment(1) }, { merge:true });
    showToast('Beğeni eklendi', 'success');
    fetchApprovedDesigns();
  } catch (e) { showToast('Beğeni kaydedilemedi', 'error'); }
}

function copyShareLink(designId) {
  const shareUrl = `${window.location.origin}${window.location.pathname}?design=${designId}`;
  navigator.clipboard.writeText(shareUrl).then(() => showToast('Tasarım linki kopyalandı', 'success')).catch(() => showToast('Link kopyalanamadı', 'error'));
}

function demoBuy(id, licenseType) {
  showToast(`Ödeme demo modunda. ${licenseType === 'standard' ? 'Standart' : 'Exclusive'} lisans ekranı başvuru sonrası aktifleştirilecek.`);
}

async function renderDashboard() {
  if (!currentUser) {
    $('myDesigns').innerHTML = `<p class="muted">Dashboard için giriş yapmalısın.</p>`;
    return;
  }
  $('dashRole').textContent = currentUser.role || 'Rol seçilmedi';
  $('dashboardWelcome').textContent = `Hoş geldin, ${currentUser.name}`;
  try {
    const snap = await db.collection('designs').where('designerId', '==', currentUser.uid).get();
    const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    $('dashTotalDesigns').textContent = rows.length;
    $('dashPendingDesigns').textContent = rows.filter(x => x.status === 'pending').length;
    $('dashApprovedDesigns').textContent = rows.filter(x => x.status === 'approved').length;
    $('myDesigns').innerHTML = rows.length ? rows.map(r => `
      <div class="design-row">
        <strong>${sanitizeHTML(r.title)}</strong>
        <span class="soft">${sanitizeHTML(r.status)}</span>
      </div>`).join('') : `<p class="muted">Henüz tasarımın yok.</p>`;
  } catch (e) {
    $('myDesigns').innerHTML = `<p class="muted">Tasarımlar yüklenemedi.</p>`;
  }
}

async function submitContactForm(e) {
  e.preventDefault();
  const name = $('contactName').value.trim();
  const email = $('contactEmail').value.trim();
  const subject = $('contactSubject').value.trim();
  const message = $('contactMessage').value.trim();
  if (!name || !email || !subject || !message) return showToast('Tüm alanları doldurun', 'error');
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true;
  try {
    await db.collection('contact_messages').add({
      name,
      email,
      subject,
      message,
      userId: currentUser?.uid || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'new'
    });
    e.target.reset();
    showToast('Mesajın gönderildi', 'success');
  } catch (e) {
    showToast('Gönderim hatası: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

async function updateLiveCounters() {
  try {
    const [designsSnap, usersSnap, ordersSnap] = await Promise.all([
      db.collection('designs').where('status','==','approved').where('visibility','==','public').get(),
      db.collection('users').get(),
      db.collection('orders').get().catch(()=>({ docs: [] }))
    ]);
    const approvedCount = designsSnap.size;
    const users = usersSnap.docs.map(d => d.data());
    const designersCount = users.filter(u => u.role === 'designer').length;
    const countriesCount = new Set(users.map(u => u.country).filter(Boolean)).size;
    const ordersCount = ordersSnap.size || 0;
    $('metricDesigns').textContent = approvedCount.toLocaleString('tr-TR');
    $('metricDesigners').textContent = designersCount.toLocaleString('tr-TR');
    $('metricOrders').textContent = ordersCount.toLocaleString('tr-TR');
    $('metricCountries').textContent = countriesCount.toLocaleString('tr-TR');
    $('heroStatsText').textContent = `${approvedCount.toLocaleString('tr-TR')} Tasarım · ${designersCount.toLocaleString('tr-TR')} Tasarımcı · ${ordersCount.toLocaleString('tr-TR')} Satış`;
  } catch (e) {
    $('heroStatsText').textContent = 'Sayaçlar yüklenemedi';
    console.warn(e);
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  applyLanguage();
  buildLangModal();
  $('contactForm').addEventListener('submit', submitContactForm);
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', (e)=>{ if (e.target === m) m.classList.add('hidden'); }));
  await fetchApprovedDesigns();
  const sharedDesignId = new URLSearchParams(window.location.search).get('design');
  if (sharedDesignId) {
    try { await openDesign(sharedDesignId); } catch {}
  }
});
