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
let currentProfileId = null;
let favoriteIds = new Set();
let uploadedGalleryUrls = [];

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
  showToast._t = setTimeout(() => { el.className = 'toast'; }, 2800);
}
function showModal(id){ const el=$(id); if(el) el.classList.remove('hidden'); }
function closeModal(id){ const el=$(id); if(el) el.classList.add('hidden'); }
function closeAllModals(){ document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden')); }

function formatDate(ts){
  const d = ts?.toDate?.() || (ts?.seconds ? new Date(ts.seconds * 1000) : null);
  return d ? d.toLocaleDateString('tr-TR') : '—';
}

function formatRole(role){
  if (role === 'designer') return 'Tasarımcı';
  if (role === 'club') return 'Takım / Kulüp';
  if (role === 'admin') return 'Admin';
  return 'Rol seçilmedi';
}

function showPage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`page-${page}`);
  if (target) target.classList.add('active');
  if (page === 'dashboard') renderDashboard();
  if (page === 'explore') applyFilters();
  if (page === 'profile') renderPublicProfile(currentProfileId || currentUser?.uid || null);
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
function setLang(code){ currentLang = code; localStorage.setItem('fl_lang', code); applyLanguage(); buildLangModal(); closeModal('langModal'); }
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
    name: user.displayName || user.email?.split('@')[0] || 'User',
    email: user.email || '',
    photoURL: user.photoURL || '',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };
  if (!snap.exists) {
    const data = {
      ...base,
      role: forcedRole || (user.email === ADMIN_EMAIL ? 'admin' : null),
      status: 'active',
      country: 'TR',
      bio: '',
      username: (user.email || 'user').split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase(),
      totalSales: 0,
      totalEarnings: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await ref.set(data);
    return data;
  }
  const current = snap.data() || {};
  await ref.set(base, { merge: true });
  return { ...current, ...base };
}

function needsRoleSelection(profile) { return !profile?.role || profile.role === 'pending_role'; }

async function reloadCurrentUser() {
  const user = auth.currentUser;
  if (!user) return;
  const profile = await ensureUserDoc(user);
  currentUser = {
    uid: user.uid,
    email: user.email || '',
    name: profile?.name || user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
    role: profile?.role || null,
    username: profile?.username || '',
    bio: profile?.bio || '',
    country: profile?.country || '',
    photoURL: profile?.photoURL || '',
    createdAt: profile?.createdAt || null,
    isAdmin: (profile?.role === 'admin') || user.email === ADMIN_EMAIL
  };
  updateAuthUI();
  await loadFavorites();
}

function updateAuthUI() {
  const loggedIn = !!currentUser;
  $('navLoginBtn')?.classList.toggle('hidden', loggedIn);
  const avatar = $('navAvatar');
  if (avatar) {
    avatar.classList.toggle('hidden', !loggedIn);
    avatar.innerHTML = currentUser?.photoURL ? `<img src="${sanitizeHTML(currentUser.photoURL)}" alt="avatar">` : sanitizeHTML((currentUser?.name || 'U')[0].toUpperCase());
  }
  $('adminTabBtn')?.classList.toggle('hidden', !currentUser?.isAdmin);
}

auth.onAuthStateChanged(async (user) => {
  if (!user) {
    currentUser = null;
    favoriteIds = new Set();
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
      username: profile?.username || '',
      bio: profile?.bio || '',
      country: profile?.country || '',
      photoURL: profile?.photoURL || '',
      createdAt: profile?.createdAt || null,
      isAdmin: (profile?.role === 'admin') || user.email === ADMIN_EMAIL
    };
    updateAuthUI();
    await loadFavorites();
    if (needsRoleSelection(profile)) showModal('roleModal');
    renderDashboard();
  } catch (e) {
    console.error(e);
    showToast('Kullanıcı profili yüklenemedi', 'error');
  }
});

async function chooseRole(role) {
  if (!auth.currentUser) return;
  try {
    await db.collection('users').doc(auth.currentUser.uid).set({ role, status: 'active', updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
    closeModal('roleModal');
    showToast('Hesap tipi kaydedildi', 'success');
    await reloadCurrentUser();
    if (pendingIntent === 'upload') { pendingIntent = null; authThenUpload(); }
  } catch (e) {
    showToast('Rol kaydedilemedi: ' + e.message, 'error');
  }
}

async function doLogin() {
  const email = $('loginEmail').value.trim();
  const pass = $('loginPass').value;
  if (!email || !pass) return showToast('E-posta ve şifre gerekli', 'error');
  try {
    await auth.signInWithEmailAndPassword(email, pass);
    closeModal('authModal');
    showToast('Hoş geldin', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

async function resetPassword() {
  const email = $('loginEmail').value.trim();
  if (!email) return showToast('Önce e-posta adresini yaz', 'error');
  try {
    await auth.sendPasswordResetEmail(email);
    showToast('Şifre sıfırlama bağlantısı gönderildi', 'success');
  } catch (e) { showToast('Şifre sıfırlama hatası: ' + e.message, 'error'); }
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
  } catch (e) { showToast(e.message, 'error'); }
}

async function doGoogleLogin() {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    const profile = await ensureUserDoc(result.user);
    closeModal('authModal');
    if (needsRoleSelection(profile)) showModal('roleModal');
    else showToast('Google ile giriş başarılı', 'success');
  } catch (e) { showToast(e.message, 'error'); }
}

async function logout() { await auth.signOut(); showPage('home'); }

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
  syncUploadLivePreview();
  showModal('uploadModal');
}

async function uploadImageToImgBB(file) {
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, { method:'POST', body: fd });
  const json = await res.json();
  if (!json?.success) throw new Error(json?.error?.message || 'Yükleme başarısız');
  return json.data.url;
}

async function uploadPreviewToImgBB() {
  const file = $('upImageFile').files?.[0];
  if (!file) return showToast('Önce bir görsel seçin', 'error');
  try {
    showToast('Görsel yükleniyor...');
    const url = await uploadImageToImgBB(file);
    $('upPreviewUrl').value = url;
    $('uploadPreview').innerHTML = `<img src="${sanitizeHTML(url)}" alt="preview">`;
    syncUploadLivePreview();
    showToast('Görsel yüklendi', 'success');
  } catch (e) { showToast('ImgBB hatası: ' + e.message, 'error'); }
}

async function uploadGalleryToImgBB() {
  const files = Array.from($('upGalleryFiles').files || []);
  if (!files.length) return showToast('Galeri için en az bir görsel seçin', 'error');
  try {
    showToast('Galeri görselleri yükleniyor...');
    for (const file of files) {
      const url = await uploadImageToImgBB(file);
      if (!uploadedGalleryUrls.includes(url)) uploadedGalleryUrls.push(url);
    }
    renderGalleryPreview();
    syncUploadLivePreview();
    showToast('Galeri güncellendi', 'success');
  } catch (e) { showToast('Galeri yükleme hatası: ' + e.message, 'error'); }
}

function removeGalleryImage(index) {
  uploadedGalleryUrls.splice(index, 1);
  renderGalleryPreview();
  syncUploadLivePreview();
}

function renderGalleryPreview() {
  const grid = $('galleryPreviewGrid');
  const status = $('galleryStatus');
  if (status) status.textContent = uploadedGalleryUrls.length ? `${uploadedGalleryUrls.length} galeri görseli yüklendi.` : 'Henüz galeri görseli yüklenmedi.';
  if (!grid) return;
  if (!uploadedGalleryUrls.length) {
    grid.innerHTML = '';
    return;
  }
  grid.innerHTML = uploadedGalleryUrls.map((url, index) => `
    <div class="gallery-thumb">
      <img src="${sanitizeHTML(url)}" alt="gallery ${index+1}">
      <button type="button" class="gallery-remove" onclick="removeGalleryImage(${index})">×</button>
    </div>
  `).join('');
}

function syncUploadLivePreview() {
  const title = $('upTitle')?.value?.trim() || '—';
  const sportMap = { football:'Futbol', basketball:'Basketbol', volleyball:'Voleybol', esports:'E-Spor' };
  const sport = sportMap[$('upSport')?.value] || '—';
  const price = $('upPrice')?.value ? `₺${Number($('upPrice').value).toLocaleString('tr-TR')}` : '—';
  if ($('uploadLiveTitle')) $('uploadLiveTitle').textContent = title;
  if ($('uploadLiveSport')) $('uploadLiveSport').textContent = sport;
  if ($('uploadLivePrice')) $('uploadLivePrice').textContent = price;
  if ($('uploadLiveGalleryCount')) $('uploadLiveGalleryCount').textContent = `${uploadedGalleryUrls.length} görsel`;
}

async function submitDesign() {
  if (!currentUser) return showToast('Giriş yapmalısın', 'error');
  if (currentUser.role !== 'designer' && !currentUser.isAdmin) return showToast('Yalnızca tasarımcılar yükleyebilir', 'error');
  const title = $('upTitle').value.trim();
  const sport = $('upSport').value;
  const description = $('upDesc').value.trim();
  const coverImage = $('upPreviewUrl').value.trim();
  const sourceUrl = $('upSourceUrl').value.trim();
  const tags = $('upTags').value.trim().split(',').map(x => x.trim()).filter(Boolean).slice(0,8);
  const priceStandard = Number($('upPrice').value || 0);
  const priceExclusive = Number($('upExclusivePrice').value || 0);
  if (!title || !description || !coverImage || !priceStandard) return showToast('Başlık, açıklama, kapak görseli ve fiyat gerekli', 'error');
  try {
    await db.collection('designs').add({
      title, sport, description, coverImage, previewUrl: coverImage, galleryImages: uploadedGalleryUrls.slice(0, 8), sourceUrl, tags,
      priceStandard, priceExclusive,
      designerId: currentUser.uid,
      designerName: currentUser.name,
      designerUsername: currentUser.username || '',
      designerEmail: currentUser.email,
      designerPhotoURL: currentUser.photoURL || '',
      status: 'pending',
      visibility: 'private',
      featured: false,
      editorPick: false,
      archived: false,
      views: 0, likes: 0, sales: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    ['upTitle','upDesc','upPreviewUrl','upSourceUrl','upPrice','upExclusivePrice','upTags'].forEach(id => { if ($(id)) $(id).value=''; });
    if ($('upImageFile')) $('upImageFile').value = '';
    if ($('upGalleryFiles')) $('upGalleryFiles').value = '';
    uploadedGalleryUrls = [];
    renderGalleryPreview();
    $('uploadPreview').textContent = 'Önizleme yok';
    syncUploadLivePreview();
    closeModal('uploadModal');
    showToast('Tasarım gönderildi. Admin onayı bekleniyor.', 'success');
    renderDashboard();
  } catch (e) { showToast('Tasarım kaydedilemedi: ' + e.message, 'error'); }
}

async function uploadAvatarToImgBB() {
  const file = $('profileImageFile').files?.[0];
  if (!file) return showToast('Önce profil fotoğrafı seçin', 'error');
  try {
    showToast('Profil fotoğrafı yükleniyor...');
    const url = await uploadImageToImgBB(file);
    $('profilePhotoUrl').value = url;
    $('profilePhotoPreview').innerHTML = `<img src="${sanitizeHTML(url)}" alt="avatar preview">`;
    showToast('Profil fotoğrafı yüklendi', 'success');
  } catch (e) { showToast('ImgBB hatası: ' + e.message, 'error'); }
}

function populateProfileEditor() {
  if (!currentUser) return;
  $('profileNameInput').value = currentUser.name || '';
  $('profileUsernameInput').value = currentUser.username || '';
  $('profileCountryInput').value = currentUser.country || '';
  $('profileBioInput').value = currentUser.bio || '';
  $('profilePhotoUrl').value = currentUser.photoURL || '';
  $('profilePhotoPreview').innerHTML = currentUser.photoURL ? `<img src="${sanitizeHTML(currentUser.photoURL)}" alt="avatar">` : 'Önizleme yok';
}

async function saveProfile() {
  if (!currentUser) return showToast('Giriş yapmalısın', 'error');
  const name = $('profileNameInput').value.trim();
  const username = $('profileUsernameInput').value.trim().toLowerCase().replace(/[^a-z0-9_-]/g,'');
  const country = $('profileCountryInput').value.trim() || 'TR';
  const bio = $('profileBioInput').value.trim();
  const photoURL = $('profilePhotoUrl').value.trim();
  if (!name || !username) return showToast('Ad ve kullanıcı adı gerekli', 'error');
  try {
    await db.collection('users').doc(currentUser.uid).set({
      name, username, country, bio, photoURL,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge:true });
    if (auth.currentUser?.displayName !== name) await auth.currentUser.updateProfile({ displayName: name, photoURL: photoURL || null });
    closeModal('profileEditModal');
    showToast('Profil güncellendi', 'success');
    await reloadCurrentUser();
    renderDashboard();
    if (currentPage === 'profile') renderPublicProfile(currentUser.uid);
  } catch (e) { showToast('Profil güncellenemedi: ' + e.message, 'error'); }
}

async function fetchApprovedDesigns() {
  try {
    const snap = await db.collection('designs').where('status', '==', 'approved').where('visibility', '==', 'public').get();
    allDesigns = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderHome();
    applyFilters();
    await renderDesigners();
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
        <div class="design-meta"><span>${sanitizeHTML((d.sport||'').toUpperCase())}</span><span onclick="event.stopPropagation(); openProfilePage('${d.designerId || ''}')">${sanitizeHTML(d.designerName || 'Designer')}</span></div>
        <h3 class="design-title">${sanitizeHTML(d.title || 'İsimsiz Tasarım')}</h3>
        <p class="design-desc">${sanitizeHTML(d.description || '')}</p>
        <div class="design-footer"><strong class="price">₺${Number(d.priceStandard||0).toLocaleString('tr-TR')}</strong><span class="soft">👁 ${d.views||0} · ❤️ ${d.likes||0}</span></div>
      </div>
    </article>`;
}

function renderHome() {
  const featured = [...allDesigns].sort((a,b)=> (Number(b.featured)||0)*1000 + (b.likes||0)+(b.views||0) - (((Number(a.featured)||0)*1000) + (a.likes||0)+(a.views||0))).slice(0,6);
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
  const q = ($('searchInput')?.value || '').trim().toLowerCase();
  let arr = [...allDesigns];
  if (sport) arr = arr.filter(d => d.sport === sport);
  if (q) arr = arr.filter(d => {
    const hay = [d.title, d.description, ...(d.tags || []), d.designerName].join(' ').toLowerCase();
    return hay.includes(q);
  });
  if (sort === 'new') arr.sort((a,b)=> (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  if (sort === 'popular') arr.sort((a,b)=> ((b.likes||0)+(b.views||0)*0.5) - ((a.likes||0)+(a.views||0)*0.5));
  if (sort === 'priceAsc') arr.sort((a,b)=> (a.priceStandard||0) - (b.priceStandard||0));
  if (sort === 'priceDesc') arr.sort((a,b)=> (b.priceStandard||0) - (a.priceStandard||0));
  $('exploreGrid').innerHTML = arr.map(buildDesignCard).join('') || `<p class="muted">Sonuç bulunamadı.</p>`;
  $('exploreCount').textContent = `${arr.length} tasarım`;
}
function clearFilters(){ if($('filterSport')) $('filterSport').value=''; if($('sortSelect')) $('sortSelect').value='new'; if($('searchInput')) $('searchInput').value=''; applyFilters(); }

async function renderDesigners() {
  try {
    const snap = await db.collection('users').where('role','==','designer').get();
    const userMap = new Map(snap.docs.map(d=>[d.id,{ id:d.id, ...d.data() }]));
    const counts = new Map();
    for (const d of allDesigns) {
      if (!d.designerId) continue;
      const existing = counts.get(d.designerId) || { count:0, likes:0 };
      existing.count += 1; existing.likes += Number(d.likes||0);
      counts.set(d.designerId, existing);
    }
    const cards = [...userMap.values()].sort((a,b)=> (counts.get(b.id)?.count||0) - (counts.get(a.id)?.count||0)).map(x => `
      <div class="designer-card clickable" onclick="openProfilePage('${x.id}')">
        <div class="designer-top">
          <div class="designer-avatar">${x.photoURL ? `<img src="${sanitizeHTML(x.photoURL)}" alt="avatar">` : sanitizeHTML((x.name||'D')[0].toUpperCase())}</div>
          <div><strong>${sanitizeHTML(x.name || 'Designer')}</strong><div class="muted small">@${sanitizeHTML(x.username || 'designer')}</div></div>
        </div>
        <div class="designer-stats"><span>${counts.get(x.id)?.count || 0} tasarım</span><span>${counts.get(x.id)?.likes || 0} beğeni</span></div>
      </div>`).join('');
    $('designersGrid').innerHTML = cards || `<p class="muted">Henüz tasarımcı verisi yok.</p>`;
  } catch (e) {
    console.error(e);
    $('designersGrid').innerHTML = `<p class="muted">Tasarımcılar yüklenemedi.</p>`;
  }
}

async function openDesign(id) {
  let design = allDesigns.find(x => x.id === id);
  if (!design) {
    const doc = await db.collection('designs').doc(id).get();
    if (!doc.exists) return;
    design = { id: doc.id, ...doc.data() };
  }
  const d = design;
  const isFav = favoriteIds.has(id);
  const gallery = [d.coverImage, ...((d.galleryImages || []).filter(Boolean))].filter(Boolean);
  const main = gallery[0] || '';
  $('designModalContent').innerHTML = `
    <div class="design-detail">
      <div>
        <div class="design-detail-cover">${main ? `<img id="designMainImage" src="${sanitizeHTML(main)}" alt="${sanitizeHTML(d.title)}">` : ''}</div>
        ${gallery.length > 1 ? `<div class="design-gallery-strip">${gallery.map((img, idx)=>`<button type="button" class="design-gallery-thumb ${idx===0?'active':''}" onclick="setDesignMainImage('${sanitizeHTML(img)}', this)"><img src="${sanitizeHTML(img)}" alt="galeri ${idx+1}"></button>`).join('')}</div>` : ''}
      </div>
      <div>
        <div class="design-meta"><span>${sanitizeHTML((d.sport||'').toUpperCase())}</span><span onclick="event.stopPropagation(); openProfilePage('${d.designerId || ''}')">${sanitizeHTML(d.designerName||'Designer')}</span></div>
        <h2 class="section-head" style="display:block;margin-bottom:8px"><span style="font-family:'Bebas Neue',sans-serif;font-size:52px">${sanitizeHTML(d.title || 'İsimsiz Tasarım')}</span></h2>
        <p class="muted">${sanitizeHTML(d.description || '')}</p>
        <div style="margin-top:16px; display:flex; flex-wrap:wrap; gap:8px"><span class="chip">Standart ₺${Number(d.priceStandard||0).toLocaleString('tr-TR')}</span>${d.priceExclusive?`<span class="chip">Exclusive ₺${Number(d.priceExclusive).toLocaleString('tr-TR')}</span>`:''}${(d.tags||[]).map(tag=>`<span class="chip">#${sanitizeHTML(tag)}</span>`).join('')}</div>
        <div class="detail-actions">
          <button class="btn btn-primary" onclick="demoBuy('${d.id}','standard')">Demo Satın Al</button>
          <button class="btn btn-ghost" onclick="copyShareLink('${d.id}')">Paylaş</button>
          <button class="btn btn-ghost" onclick="toggleFavorite('${d.id}')">${isFav ? 'Favoriden Çıkar' : 'Favoriye Ekle'}</button>
        </div>
        ${d.sourceUrl ? `<p class="muted small" style="margin-top:16px">Kaynak dosya bağlantısı sistemde kayıtlı.</p>` : ''}
      </div>
    </div>`;
  showModal('designModal');
}
function setDesignMainImage(url, btn) {
  const img = $('designMainImage');
  if (img) img.src = url;
  document.querySelectorAll('.design-gallery-thumb').forEach(el => el.classList.remove('active'));
  btn?.classList.add('active');
}

async function toggleFavorite(designId) {
  if (!currentUser) { showModal('authModal'); return showToast('Favori için giriş yapmalısın'); }
  const ref = db.collection('users').doc(currentUser.uid).collection('favorites').doc(designId);
  try {
    if (favoriteIds.has(designId)) {
      await ref.delete();
      favoriteIds.delete(designId);
      showToast('Favorilerden çıkarıldı', 'success');
    } else {
      await ref.set({ designId, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      favoriteIds.add(designId);
      showToast('Favorilere eklendi', 'success');
    }
    if (!closeModal) return;
    if (!$('designModal').classList.contains('hidden')) openDesign(designId);
    if (currentPage === 'dashboard') renderFavorites();
  } catch (e) { showToast('Favori güncellenemedi: ' + e.message, 'error'); }
}

async function loadFavorites() {
  if (!currentUser) { favoriteIds = new Set(); return; }
  try {
    const snap = await db.collection('users').doc(currentUser.uid).collection('favorites').get();
    favoriteIds = new Set(snap.docs.map(d => d.id));
  } catch { favoriteIds = new Set(); }
}

function copyShareLink(designId) {
  const shareUrl = `${window.location.origin}${window.location.pathname}?design=${designId}`;
  navigator.clipboard.writeText(shareUrl).then(() => showToast('Tasarım linki kopyalandı', 'success')).catch(() => showToast('Link kopyalanamadı', 'error'));
}
function demoBuy(id, licenseType) { showToast(`Ödeme demo modunda. ${licenseType === 'standard' ? 'Standart' : 'Exclusive'} lisans ekranı başvuru sonrası aktifleştirilecek.`); }

function switchDashboardTab(tab, btn) {
  document.querySelectorAll('.dashboard-tab').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.dtab').forEach(el => el.classList.remove('active'));
  $(`dashboardTab-${tab}`)?.classList.add('active');
  if (btn) btn.classList.add('active');
  if (tab === 'favorites') renderFavorites();
  if (tab === 'admin' && currentUser?.isAdmin) renderAdminPanel();
}

async function renderDashboard() {
  if (!currentUser) {
    ['myDesigns','myFavorites','myPurchases'].forEach(id => { if ($(id)) $(id).innerHTML = `<div class="empty-state">Dashboard için giriş yapmalısın.</div>`; });
    return;
  }
  populateProfileEditor();
  $('dashboardName').textContent = currentUser.name || 'Dashboard';
  $('dashboardWelcome').textContent = `Hoş geldin, ${currentUser.name}`;
  $('dashRoleChip').textContent = formatRole(currentUser.role);
  $('dashJoinedInfo').textContent = `Katılım: ${formatDate(currentUser.createdAt)}`;
  $('profileSummaryName').textContent = currentUser.name || '—';
  $('profileSummaryEmail').textContent = currentUser.email || '—';
  $('profileSummaryUsername').textContent = currentUser.username ? '@' + currentUser.username : '—';
  $('profileSummaryCountry').textContent = currentUser.country || '—';
  $('dashAvatarWrap').innerHTML = currentUser.photoURL ? `<img src="${sanitizeHTML(currentUser.photoURL)}" alt="avatar">` : sanitizeHTML((currentUser.name||'U')[0].toUpperCase());

  try {
    const snap = await db.collection('designs').where('designerId', '==', currentUser.uid).get();
    const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const totalLikes = rows.reduce((sum,r)=>sum+Number(r.likes||0),0);
    $('dashTotalDesigns').textContent = rows.length;
    $('dashPendingDesigns').textContent = rows.filter(x => x.status === 'pending').length;
    $('dashApprovedDesigns').textContent = rows.filter(x => x.status === 'approved').length;
    $('dashLikes').textContent = totalLikes;
    $('myDesigns').innerHTML = rows.length ? rows.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0)).map(r => `
      <div class="design-row-card">
        <div class="row-meta">
          <strong>${sanitizeHTML(r.title)}</strong>
          <span class="muted">${sanitizeHTML(r.description || '')}</span>
        </div>
        <div class="row-actions">
          <span class="row-status ${sanitizeHTML(r.status)}">${sanitizeHTML(r.status)}</span>
          <button class="mini-btn" onclick="openDesign('${r.id}')">Görüntüle</button>
        </div>
      </div>`).join('') : `<div class="empty-state">Henüz tasarımın yok.</div>`;
  } catch (e) {
    $('myDesigns').innerHTML = `<div class="empty-state">Tasarımlar yüklenemedi.</div>`;
  }
  renderFavorites();
  if (currentUser.isAdmin) renderAdminPanel();
}

function renderFavorites() {
  const favs = allDesigns.filter(d => favoriteIds.has(d.id));
  $('myFavorites').innerHTML = favs.length ? favs.map(buildDesignCard).join('') : `<div class="empty-state">Henüz favori tasarımın yok.</div>`;
}

async function renderAdminPanel() {
  if (!currentUser?.isAdmin) return;
  await Promise.all([renderPendingDesigns(), renderContactMessages(), renderUsersAdmin(), renderPublishedDesignsAdmin()]);
}

async function renderPendingDesigns() {
  try {
    const snap = await db.collection('designs').where('status','==','pending').get();
    const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    $('adminPendingDesigns').innerHTML = rows.length ? rows.map(r => `
      <div class="admin-list-item">
        <div class="row-meta">
          <strong>${sanitizeHTML(r.title)}</strong>
          <span class="muted">${sanitizeHTML(r.designerName || 'Designer')} · ₺${Number(r.priceStandard||0).toLocaleString('tr-TR')}</span>
        </div>
        <div class="row-actions">
          <button class="mini-btn success" onclick="moderateDesign('${r.id}','approve')">Onayla</button>
          <button class="mini-btn danger" onclick="moderateDesign('${r.id}','reject')">Reddet</button>
          <button class="mini-btn" onclick="moderateDesign('${r.id}','archive')">Arşivle</button>
          <button class="mini-btn danger" onclick="moderateDesign('${r.id}','delete')">Sil</button>
        </div>
      </div>`).join('') : `<div class="empty-state">Bekleyen tasarım yok.</div>`;
  } catch (e) { $('adminPendingDesigns').innerHTML = `<div class="empty-state">Bekleyen tasarımlar yüklenemedi.</div>`; }
}

async function moderateDesign(id, action) {
  if (!currentUser?.isAdmin) return;
  try {
    const ref = db.collection('designs').doc(id);
    if (action === 'approve') {
      await ref.set({ status:'approved', visibility:'public', archived:false, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge:true });
      showToast('Tasarım onaylandı', 'success');
    } else if (action === 'reject') {
      const rejectReason = prompt('Reddetme sebebi (opsiyonel)') || '';
      await ref.set({ status:'rejected', visibility:'private', rejectReason, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge:true });
      showToast('Tasarım reddedildi', 'success');
    } else if (action === 'archive') {
      await ref.set({ status:'archived', visibility:'private', archived:true, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge:true });
      showToast('Tasarım arşivlendi', 'success');
    } else if (action === 'delete') {
      if (!confirm('Bu tasarımı kalıcı olarak silmek istediğine emin misin?')) return;
      await ref.delete();
      showToast('Tasarım silindi', 'success');
    } else if (action === 'feature') {
      const doc = await ref.get();
      await ref.set({ featured: !doc.data()?.featured, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge:true });
      showToast('Öne çıkan durumu güncellendi', 'success');
    } else if (action === 'editorPick') {
      const doc = await ref.get();
      await ref.set({ editorPick: !doc.data()?.editorPick, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge:true });
      showToast('Editör seçimi durumu güncellendi', 'success');
    }
    await fetchApprovedDesigns();
    renderDashboard();
  } catch (e) { showToast('Moderasyon hatası: ' + e.message, 'error'); }
}


async function renderPublishedDesignsAdmin() {
  const target = $('adminPublishedDesigns');
  if (!target) return;
  try {
    const snap = await db.collection('designs').orderBy('updatedAt','desc').limit(20).get();
    const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    target.innerHTML = rows.length ? rows.map(r => `
      <div class="admin-list-item">
        <div class="row-meta">
          <strong>${sanitizeHTML(r.title || 'İsimsiz Tasarım')}</strong>
          <span class="muted">${sanitizeHTML(r.designerName || 'Designer')} · ${sanitizeHTML(r.status || 'pending')} · ₺${Number(r.priceStandard||0).toLocaleString('tr-TR')}</span>
        </div>
        <div class="row-actions">
          <button class="mini-btn" onclick="openDesign('${r.id}')">Aç</button>
          <button class="mini-btn" onclick="moderateDesign('${r.id}','archive')">Arşivle</button>
          <button class="mini-btn" onclick="moderateDesign('${r.id}','feature')">${r.featured ? 'Featured Kapat' : 'Featured Yap'}</button>
          <button class="mini-btn" onclick="moderateDesign('${r.id}','editorPick')">${r.editorPick ? 'Pick Kapat' : 'Editor Pick'}</button>
          <button class="mini-btn danger" onclick="moderateDesign('${r.id}','delete')">Sil</button>
        </div>
      </div>`).join('') : `<div class="empty-state">Yönetilecek tasarım yok.</div>`;
  } catch (e) {
    target.innerHTML = `<div class="empty-state">Tasarımlar yüklenemedi.</div>`;
  }
}

async function renderContactMessages() {
  try {
    const snap = await db.collection('contact_messages').orderBy('createdAt','desc').limit(10).get();
    const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    $('adminContactMessages').innerHTML = rows.length ? rows.map(r => `
      <div class="message-row">
        <div class="row-meta"><strong>${sanitizeHTML(r.name || 'Anonim')}</strong><span class="muted">${sanitizeHTML(r.subject || 'Konu yok')} · ${sanitizeHTML(r.email || '')}</span><span class="muted">${sanitizeHTML(r.message || '')}</span></div>
      </div>`).join('') : `<div class="empty-state">Mesaj yok.</div>`;
  } catch (e) { $('adminContactMessages').innerHTML = `<div class="empty-state">Mesajlar yüklenemedi.</div>`; }
}

async function renderUsersAdmin() {
  try {
    const snap = await db.collection('users').orderBy('updatedAt','desc').limit(20).get();
    const rows = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    $('adminUsers').innerHTML = rows.length ? rows.map(r => `
      <div class="user-row">
        <div class="row-meta"><strong>${sanitizeHTML(r.name || 'Kullanıcı')}</strong><span class="muted">${sanitizeHTML(r.email || '')} · ${formatRole(r.role)} · ${sanitizeHTML(r.status || 'active')}</span></div>
        <div class="row-actions">
          <button class="mini-btn" onclick="openProfilePage('${r.id}')">Profil</button>
          ${r.role !== 'admin' ? `<button class="mini-btn ${r.status==='suspended'?'success':'danger'}" onclick="toggleUserStatus('${r.id}','${r.status || 'active'}')">${r.status==='suspended' ? 'Aktifleştir' : 'Askıya Al'}</button>` : ''}
        </div>
      </div>`).join('') : `<div class="empty-state">Kullanıcı yok.</div>`;
  } catch (e) { $('adminUsers').innerHTML = `<div class="empty-state">Kullanıcılar yüklenemedi.</div>`; }
}

async function toggleUserStatus(uid, currentStatus) {
  if (!currentUser?.isAdmin) return;
  try {
    const next = currentStatus === 'suspended' ? 'active' : 'suspended';
    await db.collection('users').doc(uid).set({ status: next, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge:true });
    showToast(`Kullanıcı durumu: ${next}`, 'success');
    renderUsersAdmin();
  } catch (e) { showToast('Kullanıcı güncellenemedi: ' + e.message, 'error'); }
}

function openProfilePage(uid) {
  currentProfileId = uid;
  showPage('profile');
}

async function renderPublicProfile(uid) {
  const el = $('profilePageContent');
  if (!uid) { el.innerHTML = `<div class="empty-state">Profil bulunamadı.</div>`; return; }
  try {
    const [userDoc, designsSnap] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('designs').where('designerId','==',uid).where('status','==','approved').where('visibility','==','public').get()
    ]);
    if (!userDoc.exists) { el.innerHTML = `<div class="empty-state">Profil bulunamadı.</div>`; return; }
    const u = userDoc.data();
    const designs = designsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const likes = designs.reduce((sum,d)=>sum+Number(d.likes||0),0);
    const views = designs.reduce((sum,d)=>sum+Number(d.views||0),0);
    el.innerHTML = `
      <div class="profile-card-public">
        <div class="public-top">
          <div class="profile-avatar profile-avatar-large">${u.photoURL ? `<img src="${sanitizeHTML(u.photoURL)}" alt="avatar">` : sanitizeHTML((u.name||'U')[0].toUpperCase())}</div>
          <div>
            <h1>${sanitizeHTML(u.name || 'Designer')}</h1>
            <p>@${sanitizeHTML(u.username || 'designer')}</p>
            <p>${sanitizeHTML(u.bio || 'Henüz biyografi eklenmedi.')}</p>
          </div>
        </div>
        <div class="public-stats">
          <div class="public-stat"><strong>${designs.length}</strong><span>Tasarım</span></div>
          <div class="public-stat"><strong>${likes}</strong><span>Beğeni</span></div>
          <div class="public-stat"><strong>${views}</strong><span>Görüntülenme</span></div>
          <div class="public-stat"><strong>${sanitizeHTML(u.country || '—')}</strong><span>Ülke</span></div>
        </div>
        <div class="panel"><div class="panel-head"><h3>Yayınlanan Tasarımlar</h3></div>${designs.length ? `<div class="card-grid">${designs.map(buildDesignCard).join('')}</div>` : `<div class="empty-state">Henüz yayınlanan tasarım yok.</div>`}</div>
      </div>`;
  } catch (e) { console.error(e); el.innerHTML = `<div class="empty-state">Profil yüklenemedi.</div>`; }
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
    await db.collection('contact_messages').add({ name, email, subject, message, userId: currentUser?.uid || null, createdAt: firebase.firestore.FieldValue.serverTimestamp(), status: 'new' });
    e.target.reset();
    showToast('Mesajın gönderildi', 'success');
  } catch (e) { showToast('Gönderim hatası: ' + e.message, 'error'); }
  finally { btn.disabled = false; }
}

async function updateLiveCounters() {
  try {
    const [designsSnap, usersSnap, ordersSnap] = await Promise.all([
      db.collection('designs').where('status','==','approved').where('visibility','==','public').get(),
      db.collection('users').get(),
      db.collection('orders').get().catch(()=>({ size:0, docs: [] }))
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
  } catch (e) { $('heroStatsText').textContent = 'Sayaçlar yüklenemedi'; console.warn(e); }
}

window.addEventListener('DOMContentLoaded', async () => {
  applyLanguage();
  buildLangModal();
  $('contactForm').addEventListener('submit', submitContactForm);
  document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', (e)=>{ if (e.target === m && m.id !== 'roleModal') m.classList.add('hidden'); }));
  ['upTitle','upSport','upPrice'].forEach(id => $(id)?.addEventListener('input', syncUploadLivePreview));
  syncUploadLivePreview();
  renderGalleryPreview();
  await fetchApprovedDesigns();
  const sharedDesignId = new URLSearchParams(window.location.search).get('design');
  if (sharedDesignId) { try { await openDesign(sharedDesignId); } catch {} }
});
