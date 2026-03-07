import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, doc, setDoc, onSnapshot, collection, getDoc, getDocs, query, where, orderBy, limit, updateDoc, serverTimestamp, deleteDoc, addDoc, increment, runTransaction, startAfter } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAgWXDIgIR503HIK_z7dVYzI-kvg9VFGsk",
    authDomain: "halisaha-app-898e2.firebaseapp.com",
    projectId: "halisaha-app-898e2",
    storageBucket: "halisaha-app-898e2.firebasestorage.app",
    messagingSenderId: "423261008778",
    appId: "1:423261008778:web:e8f2a08bfcacb96b4c8e73"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ── STATE ──
let currentUser = null;
let currentMatchData = null;
let players = [];
let globalMatchId = "";
let currentTeamA = [];
let currentTeamB = [];
let avgEloA = 0, avgEloB = 0;
let mvpName = "";
let unsubPlayers = null;
let unsubChat = null;
let unsubWaitlist = null;
let unsubMatch = null;
let eloChart = null;

// ── HELPERS ──
function escapeHTML(str) {
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
}

window.showToast = function (msg, type = "success") {
    const t = document.getElementById("toast");
    if (!t) return;
    t.innerText = msg;
    t.style.borderColor = type === "error" ? "#e74c3c" : type === "info" ? "#3498db" : "#2ecc71";
    t.className = "toast show";
    setTimeout(() => t.className = "toast", 3200);
};

// ── CITIES ──
const sehirler = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", "Aydın", "Balıkesir", 
    "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", 
    "Diyarbakır", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", 
    "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir", 
    "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", 
    "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", 
    "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", "Karaman", 
    "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
].sort();

document.addEventListener('DOMContentLoaded', () => {
    ['regCity', 'filterCity', 'matchCity', 'editCity', 'lbCity', 'tournamentCity'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.innerHTML = ""; sehirler.forEach(s => el.innerHTML += `<option value="${s}">${s}</option>`); el.value = "İstanbul"; }
    });
    if (localStorage.getItem('theme') === 'light') document.body.classList.add('light-mode');
});

window.toggleTheme = function () {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
};

// ── TIER & BADGES ──
function getTier(e) {
    if (e < 1400) return { n: "🥉 Bronz", c: "tier-bronz" };
    if (e < 1700) return { n: "🥈 Gümüş", c: "tier-gumus" };
    if (e < 2000) return { n: "🥇 Altın", c: "tier-altin" };
    return { n: "💎 Efsane", c: "tier-efsane" };
}

function calculateBadges(u) {
    let html = "";
    if ((u.goals || 0) >= 10) html += `<span class="badge">⚽ Gol Makinesi</span>`;
    if ((u.assists || 0) >= 5) html += `<span class="badge">🎯 Maestro</span>`;
    if ((u.matchesPlayed || 0) >= 10) html += `<span class="badge">🛡️ Emektar</span>`;
    if ((u.matchesPlayed || 0) >= 20) html += `<span class="badge">👑 Efsane</span>`;
    if (u.power > 1800) html += `<span class="badge">💎 VIP</span>`;
    return html || `<span class="badge">🌱 Çaylak</span>`;
}

// ── ELO CHART ──
function renderEloChart(hist) {
    const ctx = document.getElementById('eloChart');
    if (!ctx) return;
    if (eloChart) eloChart.destroy();

    let currentPower = currentUser.power;
    const eloPoints = [currentPower];
    hist.forEach(h => {
        let change = parseInt(h.eloChange.replace('+', ''));
        currentPower -= change;
        eloPoints.unshift(currentPower);
    });

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 80);
    gradient.addColorStop(0, 'rgba(212,175,55,0.3)');
    gradient.addColorStop(1, 'rgba(212,175,55,0)');

    eloChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: eloPoints.map((_, i) => i === eloPoints.length - 1 ? 'Şimdi' : `-${eloPoints.length - 1 - i}`),
            datasets: [{
                label: 'ELO', data: eloPoints,
                borderColor: '#D4AF37', borderWidth: 2,
                fill: true, tension: 0.4,
                backgroundColor: gradient,
                pointBackgroundColor: '#D4AF37',
                pointRadius: 3, pointHoverRadius: 6,
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: true,
            plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `ELO: ${ctx.raw}` } } },
            scales: {
                x: { display: true, ticks: { color: '#6b7280', font: { size: 9 } }, grid: { display: false } },
                y: { display: false }
            }
        }
    });
}

// ── AUTH STATE ──
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const uDoc = await getDoc(doc(db, "users", user.uid));
            if (uDoc.exists()) {
                currentUser = { uid: user.uid, ...uDoc.data() };
                document.getElementById('authScreen').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';
                updateProfileUI();
                if (document.getElementById('userNameDisplay'))
                    document.getElementById('userNameDisplay').innerText = currentUser.name;
                if (window.location.pathname.includes('katil.html')) checkUrlParams();
                listenToNotifications();
                setTimeout(() => window._postLoginInit?.(), 500);
            } else {
                // User exists in Auth but not in Firestore yet — sign them out cleanly
                await signOut(auth);
                document.getElementById('authScreen').style.display = 'block';
                if (document.getElementById('mainApp')) document.getElementById('mainApp').style.display = 'none';
            }
        } catch (err) {
            console.error("Kullanıcı verisi yüklenemedi:", err.code, err.message);
            // Permission error or network error — show auth screen, don't crash
            if (err.code === 'permission-denied') {
                showToast("Oturum izin hatası. Tekrar giriş yapın.", "error");
                await signOut(auth);
            }
            document.getElementById('authScreen').style.display = 'block';
            if (document.getElementById('mainApp')) document.getElementById('mainApp').style.display = 'none';
        }
    } else {
        currentUser = null;
        document.getElementById('authScreen').style.display = 'block';
        if (document.getElementById('mainApp')) document.getElementById('mainApp').style.display = 'none';
    }
});

// ── PROFILE UI ──
function updateProfileUI() {
    if (!document.getElementById('profileName')) return;
    document.getElementById('profileName').innerText = currentUser.name;
    document.getElementById('profileAvatar').innerText = currentUser.name?.charAt(0)?.toUpperCase() || '?';
    document.getElementById('profilePosAge').innerText = `${currentUser.position} · ${currentUser.age} Yaş · ${currentUser.height}cm`;
    document.getElementById('profileCity').innerText = `📍 ${currentUser.city || 'İstanbul'}`;
    document.getElementById('profileBadges').innerHTML = calculateBadges(currentUser);
    const t = getTier(currentUser.power);
    document.getElementById('profileTier').innerText = `${t.n} · ${Math.round(currentUser.power)} ELO`;
    document.getElementById('profileTier').className = `elo-badge ${t.c}`;
    document.getElementById('profileMatches').innerText = currentUser.matchesPlayed || 0;
    document.getElementById('profileGoals').innerText = currentUser.goals || 0;
    document.getElementById('profileAssists').innerText = currentUser.assists || 0;
    if (typeof window.updateProfileUI_XP === 'function') window.updateProfileUI_XP();
    if (typeof renderProfileRadar === 'function') renderProfileRadar(currentUser);

    // Win streak badge
    const streakVal = currentUser.winStreak || 0;
    const reliabilityVal = currentUser.reliability;
    const badgesEl = document.getElementById('profileBadges');
    if (badgesEl) {
        let extra = '';
        if (streakVal >= 3) extra += `<span class="badge" style="background:rgba(243,156,18,0.15);border-color:rgba(243,156,18,0.4);color:#f39c12;">🔥 ${streakVal} Seri</span>`;
        if (reliabilityVal !== undefined) extra += `<span class="badge" style="font-size:10px;">${_getReliabilityBadge(reliabilityVal)}</span>`;
        if (extra) badgesEl.innerHTML += extra;
    }
    if (currentUser.city) {
        const fc = document.getElementById('filterCity');
        if (fc) fc.value = currentUser.city;
        const lbc = document.getElementById('lbCity');
        if (lbc) lbc.value = currentUser.city;
    }
    loadPublicMatches();
    loadHistory();
}

// ── EDIT PROFILE ──
window.resetPassword = async () => {
    const email = document.getElementById('loginEmail')?.value || prompt("E-posta adresinizi girin:");
    if (!email) return;
    try { await sendPasswordResetEmail(auth, email); showToast("Sıfırlama maili gönderildi!"); }
    catch (e) { showToast("Mail gönderilemedi!", "error"); }
};

window.openEditModal = () => {
    document.getElementById('editCity').value = currentUser.city;
    document.getElementById('editAge').value = currentUser.age;
    document.getElementById('editHeight').value = currentUser.height;
    document.getElementById('editPosition').value = currentUser.position;
    document.getElementById('editProfileModal').style.display = 'flex';
};
window.closeEditModal = () => document.getElementById('editProfileModal').style.display = 'none';

window.saveProfileEdit = async () => {
    const city = document.getElementById('editCity').value;
    const age = parseInt(document.getElementById('editAge').value);
    const height = parseInt(document.getElementById('editHeight').value);
    const pos = document.getElementById('editPosition').value;
    if (isNaN(age) || isNaN(height)) return showToast("Sayısal değerleri doğru girin", "error");
    await updateDoc(doc(db, "users", currentUser.uid), { city, age, height, position: pos });
    currentUser = { ...currentUser, city, age, height, position: pos };
    updateProfileUI(); closeEditModal(); showToast("Profil güncellendi!");
};

// ── AUTH ──
window.switchAuthTab = (t) => {
    document.getElementById('tabLoginBtn').className = t === 'login' ? 'tab active' : 'tab';
    document.getElementById('tabRegBtn').className = t === 'register' ? 'tab active' : 'tab';
    document.getElementById('loginForm').style.display = t === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = t === 'register' ? 'block' : 'none';
};

window.registerUser = async () => {
    const e = document.getElementById('regEmail').value?.trim();
    const p = document.getElementById('regPassword').value;
    const n = document.getElementById('regName').value?.trim();
    const c = document.getElementById('regCity').value;
    const a = parseInt(document.getElementById('regAge').value);
    const h = parseInt(document.getElementById('regHeight').value);
    const pos = document.getElementById('regPosition').value;
    if (!n) return showToast("Ad Soyad giriniz", "error");
    if (!e) return showToast("E-posta giriniz", "error");
    if (p.length < 6) return showToast("Şifre min 6 karakter olmalı", "error");
    const btn = document.querySelector('#registerForm button');
    if (btn) { btn.innerText = "Kaydediliyor..."; btn.disabled = true; }
    try {
        const u = await createUserWithEmailAndPassword(auth, e, p);
        await setDoc(doc(db, "users", u.user.uid), {
            name: n, city: c, age: a || 0, height: h || 0,
            position: pos, power: 1500,
            goals: 0, assists: 0, matchesPlayed: 0,
            createdAt: serverTimestamp()
        });
        showToast("Hoş geldin, " + n + "! 🎉");
    } catch (x) {
        const msg = x.code === 'auth/email-already-in-use' ? 'Bu e-posta zaten kayıtlı!'
            : x.code === 'auth/invalid-email' ? 'Geçersiz e-posta!'
            : x.code === 'auth/weak-password' ? 'Şifre çok zayıf!'
            : x.message;
        showToast(msg, "error");
    } finally {
        if (btn) { btn.innerText = "VIP Hesabı Oluştur"; btn.disabled = false; }
    }
};

window.loginUser = async () => {
    const email = document.getElementById('loginEmail').value?.trim();
    const pass = document.getElementById('loginPassword').value;
    if (!email || !pass) return showToast("E-posta ve şifre giriniz", "error");
    const btn = document.querySelector('#loginForm button');
    if (btn) { btn.innerText = "Giriş yapılıyor..."; btn.disabled = true; }
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
        const msg = e.code === 'auth/user-not-found' ? 'Bu e-posta ile kayıtlı hesap bulunamadı!'
            : e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential' ? 'Şifre hatalı!'
            : e.code === 'auth/invalid-email' ? 'Geçersiz e-posta!'
            : e.code === 'auth/too-many-requests' ? 'Çok fazla deneme! Biraz bekleyin.'
            : 'Giriş başarısız! Bilgileri kontrol edin.';
        showToast(msg, "error");
    } finally {
        if (btn) { btn.innerText = "Giriş Yap"; btn.disabled = false; }
    }
};

window.logoutUser = () => signOut(auth);

// ── TAB SWITCHING ──
window.switchAppTab = (n) => {
    const tabs = ['discover', 'feed', 'match', 'leaderboard', 'tournament', 'clan', 'history'];
    tabs.forEach(t => {
        const el = document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1));
        if (el) el.style.display = 'none';
    });
    document.querySelectorAll('.app-nav button').forEach(b => b.classList.remove('active'));

    const tabEl = document.getElementById('tab' + n.charAt(0).toUpperCase() + n.slice(1));
    if (tabEl) tabEl.style.display = 'block';
    const navEl = document.getElementById('nav' + n.charAt(0).toUpperCase() + n.slice(1));
    if (navEl) navEl.classList.add('active');

    if (n === 'discover') loadPublicMatches();
    if (n === 'feed') loadFeed();
    if (n === 'history') loadHistory();
    if (n === 'leaderboard') loadLeaderboard();
    if (n === 'tournament') loadTournaments();
};

// ── DISCOVER ──
window.loadPublicMatches = async function () {
    const list = document.getElementById('publicMatchesList');
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>Maçlar aranıyor...</p></div>`;
    const cityVal = document.getElementById('filterCity').value;
    const q = query(collection(db, "matches"), where("status", "==", "active"), where("visibility", "==", "public"), where("city", "==", cityVal));
    const snap = await getDocs(q);
    list.innerHTML = "";
    let found = false;
    const now = new Date();
    snap.forEach(d => {
        const data = d.data();
        if (new Date(data.time) < now) return;
        found = true;
        const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(data.pitch + " " + data.city)}`;
        const isFull = (data.playerCount || 0) >= 14;
        const joinBtn = isFull
            ? `<button disabled class="btn-sm" style="background:#374151;color:#6b7280;">Dolu</button>`
            : `<button onclick="handlePublicJoin('${d.id}', ${data.password ? 'true' : 'false'})" class="btn-success btn-sm">Katılma İsteği</button>`;
        const hasPass = data.password ? `<span style="font-size:11px;background:rgba(212,175,55,0.1);border:1px solid var(--border);padding:2px 8px;border-radius:6px;color:var(--gold);">🔒 Şifreli</span>` : '';
        const fmtTime = data.time?.replace('T', ' ').slice(0, 16) || '—';
        list.innerHTML += `
        <div class="discover-card">
            <div class="discover-header">
                <span class="discover-title">${escapeHTML(data.pitch)}</span>
                <span class="discover-time">${fmtTime}</span>
            </div>
            <div class="discover-meta">${escapeHTML(data.city)} ${hasPass} ${escapeHTML(data.notes || '')}</div>
            <div class="discover-meta" style="margin-bottom:10px;">
                👥 ${data.playerCount || 0}/14 oyuncu
            </div>
            <div class="discover-actions">
                ${joinBtn}
                <button onclick="window.open('${map}', '_blank')" class="btn-blue btn-sm" style="width:44px;padding:6px;">📍</button>
            </div>
        </div>`;
    });
    if (!found) list.innerHTML = `<div class="empty-state"><div class="empty-icon">🏟️</div><p>${cityVal} için aktif maç bulunamadı.</p></div>`;
};

let pendingMatchId = null;
window.handlePublicJoin = (mId, isProtected) => {
    if (!currentUser) return;
    if (isProtected) {
        pendingMatchId = mId;
        document.getElementById('passwordModal').style.display = 'flex';
        document.getElementById('modalPasswordBtn').onclick = async () => {
            const pwd = document.getElementById('modalPasswordInput').value;
            const docSnap = await getDoc(doc(db, "matches", pendingMatchId));
            if (docSnap.data().password === pwd) {
                document.getElementById('passwordModal').style.display = 'none';
                document.getElementById('modalPasswordInput').value = '';
                requestJoinEngine(pendingMatchId);
            } else { showToast("Yanlış Şifre!", "error"); }
        };
    } else { requestJoinEngine(mId); }
};

async function requestJoinEngine(mId) {
    try {
        // Fair Play Ceza Kontrolü
        const isBanned = await _checkFairPlayBan(currentUser.uid);
        if (isBanned) {
            const banSnap = await getDoc(doc(db, "users", currentUser.uid));
            const reason = banSnap.data()?.fairPlayBanReason || 'Fair Play ihlali';
            return showToast(`⛔ Fair Play cezanız devam ediyor! (${reason})`, "error");
        }
        // BUG FIX: don't add to waitlist if already a player
        const existingPlayer = await getDoc(doc(db, "matches", mId, "players", currentUser.uid));
        if (existingPlayer.exists()) {
            showToast("Zaten bu maçtasın! ✅", "info");
            loadActiveMatchRoom(mId); return;
        }
        const matchSnap = await getDoc(doc(db, "matches", mId));
        if (matchSnap.exists() && matchSnap.data().captainUid === currentUser.uid) {
            showToast("Kaptan olarak odadasın! ✅", "info");
            loadActiveMatchRoom(mId); return;
        }
        await setDoc(doc(db, "matches", mId, "waitlist", currentUser.uid), {
            uid: currentUser.uid, name: currentUser.name, position: currentUser.position,
            power: currentUser.power, requestedAt: serverTimestamp()
        });
        showToast("İstek Kaptana İletildi! ✅");
        loadActiveMatchRoom(mId);
    } catch (e) { showToast("Hata oluştu!", "error"); }
}

// ── MATCH CREATE ──
window.createMatchLink = async function () {
    const p = document.getElementById('pitchName').value?.trim();
    const t = document.getElementById('matchTime').value;
    const c = document.getElementById('matchCity').value;
    const f = parseFloat(document.getElementById('matchFee').value) || 0;
    const n = document.getElementById('matchNotes').value?.trim();
    const pwd = document.getElementById('isPasswordProtected').checked ? document.getElementById('matchPassword').value : "";
    if (!p || !t) return showToast("Saha adı ve saat zorunlu!", "error");

    globalMatchId = "VIP-" + Date.now().toString(36).toUpperCase();
    currentMatchData = { pitch: p, time: t, city: c, fee: f, notes: n, password: pwd, visibility: document.getElementById('matchVisibility').value, status: "active", captainUid: currentUser.uid, playerCount: 0, scoreA: 0, scoreB: 0, createdAt: serverTimestamp() };
    await setDoc(doc(db, "matches", globalMatchId), currentMatchData);

    // BUG FIX: captain auto-joins with hasPaid/isGuest fields
    await runTransaction(db, async (tx) => {
        tx.set(doc(db, "matches", globalMatchId, "players", currentUser.uid), {
            uid: currentUser.uid, name: currentUser.name, position: currentUser.position,
            power: currentUser.power, hasPaid: false, isGuest: false
        });
        tx.update(doc(db, "matches", globalMatchId), { playerCount: increment(1) });
    });

    showToast("Maç Oluşturuldu! 🏟️");
    document.getElementById('setupMatchSection').style.display = 'none';
    loadActiveMatchRoom(globalMatchId);
};

function loadActiveMatchRoom(id) {
    globalMatchId = id;
    document.getElementById('activeMatchRoom').style.display = 'block';
    document.getElementById('setupMatchSection').style.display = 'none';
    switchAppTab('match');

    if (unsubMatch) unsubMatch();
    unsubMatch = onSnapshot(doc(db, "matches", id), (docSnap) => {
        if (!docSnap.exists()) return;
        const data = docSnap.data();
        // Guard: if match was reset mid-flight, ignore stale snapshot
        if (!globalMatchId || globalMatchId !== id) return;
        currentMatchData = data;

        // Pitch name in score board
        const sp = document.getElementById('scorePitch');
        if (sp) sp.innerText = currentMatchData.pitch || '—';

        // Status
        const alert = document.getElementById('matchStatusAlert');
        if (currentMatchData.status === 'cancelled') {
            if (currentMatchData.captainUid === currentUser.uid) {
                // Captain already handled reset in cancelMatch()
                return;
            }
            // Non-captain: auto reset after 3s
            if (alert) { alert.innerText = "❌ BU MAÇ KAPTAN TARAFINDAN İPTAL EDİLDİ!"; alert.style.display = 'block'; }
            setTimeout(() => {
                if (!globalMatchId) return; // already reset
                showToast("Maç iptal edildi. Ana sayfaya dönülüyor.", "error");
                _resetMatchRoom();
            }, 3000);
            return;
        } else { if (alert) alert.style.display = 'none'; }

        // Fee
        if (currentMatchData.fee && currentMatchData.fee > 0) {
            const feeDiv = document.getElementById('feeCalculator');
            feeDiv.style.display = 'flex';
            document.getElementById('feeTotalVal').innerText = `₺${currentMatchData.fee}`;
            document.getElementById('feePerPersonVal').innerText = `₺${(currentMatchData.fee / 14).toFixed(1)}`;
        }

        // Notes
        if (currentMatchData.notes) document.getElementById('displayMatchNotes').innerText = `📝 ${currentMatchData.notes}`;

        // Score
        document.getElementById('liveScoreA').innerText = currentMatchData.scoreA || 0;
        document.getElementById('liveScoreB').innerText = currentMatchData.scoreB || 0;

        // Fetch weather once (safe call - function defined later in module)
        if (currentMatchData.city) {
            setTimeout(() => {
                if (typeof fetchWeather === 'function') {
                    fetchWeather(currentMatchData.city, currentMatchData.time).then(data => {
                        if (typeof renderWeatherWidget === 'function') renderWeatherWidget(data, 'weatherWidgetRoom');
                    });
                }
            }, 100);
        }
        // Captain controls
        if (currentMatchData.captainUid === currentUser.uid && currentMatchData.status === 'active') {
            document.getElementById('captainControls').style.display = 'block';
            document.getElementById('btnGoalA').style.display = 'inline-block';
            document.getElementById('btnGoalB').style.display = 'inline-block';
            document.getElementById('waitlistSection').style.display = 'block';
            listenToWaitlist(id);
        } else {
            // Non-captain: show observer quick button
            const obsBtn = document.getElementById('observerQuickBtn');
            if (obsBtn) obsBtn.style.display = 'block';
        }
    });

    listenToPlayers(id);
    listenToChat(id);
}

// ── CAPTAIN: WAITLIST ──
function listenToWaitlist(id) {
    if (unsubWaitlist) unsubWaitlist();
    unsubWaitlist = onSnapshot(collection(db, "matches", id, "waitlist"), (snap) => {
        const list = document.getElementById('waitlistPlayers');
        list.innerHTML = "";
        if (snap.empty) { list.innerHTML = `<li style="font-size:12px;color:var(--text-dim);text-align:center;background:none;border:none;">İstek yok</li>`; return; }
        snap.forEach(d => {
            const w = d.data();
            const t = getTier(w.power);
            const li = document.createElement('li');
            li.className = 'player-item';
            li.innerHTML = `
                <div class="player-item-left">
                    <div class="player-avatar-sm">${(w.name||'?').charAt(0).toUpperCase()}</div>
                    <div>
                        <div class="player-name">${escapeHTML(w.name)}</div>
                        <div class="player-pos">${escapeHTML(w.position)} · <span class="elo-badge ${t.c}" style="padding:1px 6px;font-size:10px;">${Math.round(w.power)}</span></div>
                    </div>
                </div>
                <div style="display:flex;gap:6px;">
                    <button data-uid="${w.uid}" data-name="${escapeHTML(w.name)}" data-pos="${escapeHTML(w.position)}" data-pow="${w.power}" class="approve-btn btn-success btn-sm">✔ Kabul</button>
                    <button data-uid="${w.uid}" class="reject-btn btn-danger btn-sm">✘</button>
                </div>`;
            list.appendChild(li);
        });
        document.querySelectorAll('.approve-btn').forEach(btn => btn.onclick = (e) => {
            const b = e.currentTarget;
            approvePlayer(b.dataset.uid, b.dataset.name, b.dataset.pos, parseFloat(b.dataset.pow));
        });
        document.querySelectorAll('.reject-btn').forEach(btn => btn.onclick = (e) => rejectPlayer(e.currentTarget.dataset.uid));
    });
}

window.approvePlayer = async function (uid, name, pos, power) {
    if (players.length >= 14) return showToast("Kadro dolu! (14/14)", "error");
    await runTransaction(db, async (tx) => {
        tx.set(doc(db, "matches", globalMatchId, "players", uid), { uid, name, position: pos, power });
        tx.delete(doc(db, "matches", globalMatchId, "waitlist", uid));
        tx.update(doc(db, "matches", globalMatchId), { playerCount: increment(1) });
    });
    showToast(`${name} kadroya alındı! ✅`);
};

window.rejectPlayer = async function (uid) {
    await deleteDoc(doc(db, "matches", globalMatchId, "waitlist", uid));
    showToast("İstek reddedildi.", "info");
};

window.kickPlayer = async function (uid, name) {
    if (confirm(`${name} oyuncusunu kadrodan çıkarmak istiyor musun?`)) {
        await runTransaction(db, async (tx) => {
            tx.delete(doc(db, "matches", globalMatchId, "players", uid));
            tx.update(doc(db, "matches", globalMatchId), { playerCount: increment(-1) });
        });
        showToast(`${name} kadrodan çıkarıldı`, "error");
    }
};

// ── PLAYER LIST ──
function listenToPlayers(id) {
    if (unsubPlayers) unsubPlayers();
    unsubPlayers = onSnapshot(collection(db, "matches", id, "players"), (snap) => {
        players = [];
        const list = document.getElementById('playerList');
        list.innerHTML = "";
        document.getElementById('playerCount').innerText = snap.size;
        snap.forEach(d => {
            const p = { id: d.id, ...d.data() };
            players.push(p);
            const isCapt = currentMatchData && currentMatchData.captainUid === currentUser.uid;
            const kickBtn = (isCapt && p.uid !== currentUser.uid)
                ? `<button onclick="kickPlayer('${p.uid}','${escapeHTML(p.name)}')" class="btn-danger btn-sm" style="padding:4px 8px;font-size:11px;">❌</button>`
                : '';
            const paidBtn = isCapt
                ? `<button onclick="togglePayment('${p.uid}','${p.id}')" class="btn-sm" style="padding:4px 9px;font-size:13px;background:${p.hasPaid ? 'rgba(46,204,113,0.2)' : 'rgba(231,76,60,0.12)'};border:1px solid ${p.hasPaid ? '#2ecc71' : '#e74c3c'};border-radius:6px;">${p.hasPaid ? '✅' : '💸'}</button>`
                : `<span style="font-size:14px;">${p.hasPaid ? '✅' : '💸'}</span>`;
            const guestBadge = p.isGuest ? `<span style="font-size:9px;background:rgba(212,175,55,0.12);border:1px solid rgba(212,175,55,0.3);border-radius:4px;padding:1px 5px;color:var(--gold);margin-left:4px;">MİSAFİR</span>` : '';
            const t = getTier(p.power || 1500);
            list.innerHTML += `
                <li class="player-item">
                    <div class="player-item-left">
                        <div class="player-avatar-sm">${(p.name||'?').charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="player-name">${escapeHTML(p.name)}${guestBadge}</div>
                            <div class="player-pos">${escapeHTML(p.position)}</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        ${paidBtn}
                        <span class="player-power">${Math.round(p.power || 1500)}</span>
                        ${kickBtn}
                    </div>
                </li>`;
        });
    });
}

// ── SCORE UPDATE ──
window.updateLiveScore = async function (team) {
    if (!currentMatchData || currentMatchData.captainUid !== currentUser.uid) return;
    const field = team === 'A' ? 'scoreA' : 'scoreB';
    await updateDoc(doc(db, "matches", globalMatchId), { [field]: increment(1) });
    const teamName = team === 'A' ? (currentTeamA.length ? currentTeamA.map(p=>p.name).slice(0,2).join(', ')+' takımı' : 'A Takımı') : 'B Takımı';
    await addDoc(collection(db, "matches", globalMatchId, "messages"), {
        name: "SİSTEM", text: `⚽ GOL! ${team} Takımı skoru güncelledi!`, createdAt: serverTimestamp()
    });
};

window.cancelMatch = async function () {
    if (!confirm("Maçı iptal etmek istediğine emin misin?")) return;
    try {
        await updateDoc(doc(db, "matches", globalMatchId), { status: "cancelled" });
        await addDoc(collection(db, "matches", globalMatchId, "messages"), {
            name: "SİSTEM", text: `❌ KAPTAN MAÇI İPTAL ETTİ.`, createdAt: serverTimestamp()
        });
        showToast("Maç İptal Edildi", "error");
        _resetMatchRoom();
    } catch(e) { showToast("İptal edilemedi!", "error"); }
};

function _resetMatchRoom() {
    // Unsubscribe all match listeners
    if (unsubMatch) { unsubMatch(); unsubMatch = null; }
    if (unsubPlayers) { unsubPlayers(); unsubPlayers = null; }
    if (unsubChat) { unsubChat(); unsubChat = null; }
    if (unsubWaitlist) { unsubWaitlist(); unsubWaitlist = null; }

    // Reset state
    globalMatchId = "";
    currentMatchData = null;
    players = [];
    currentTeamA = [];
    currentTeamB = [];
    avgEloA = 0; avgEloB = 0;
    mvpName = "";

    // Reset UI
    document.getElementById('activeMatchRoom').style.display = 'none';
    document.getElementById('setupMatchSection').style.display = 'block';
    document.getElementById('captainControls').style.display = 'none';
    document.getElementById('teamsContainer').style.display = 'none';
    document.getElementById('tacticsBoardSection').style.display = 'none';
    document.getElementById('statsSection').style.display = 'none';
    document.getElementById('shareSection').style.display = 'none';
    document.getElementById('peerRatingSection').style.display = 'none';
    const obsBtn = document.getElementById('observerQuickBtn');
    if (obsBtn) obsBtn.style.display = 'none';
    const probBar = document.getElementById('winProbBar');
    if (probBar) probBar.style.display = 'none';
    // Clear inputs
    ['pitchName','matchFee','matchNotes'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const chatBox = document.getElementById('chatBox');
    if (chatBox) chatBox.innerHTML = '';
    const playerList = document.getElementById('playerList');
    if (playerList) playerList.innerHTML = '';
    showToast("Maç odası sıfırlandı. Yeni maç kurabilirsin.", "info");
}

// ── AI TEAM GENERATOR ──
window.generateTeams = async function () {
    if (players.length < 2) return showToast("En az 2 oyuncu gerekli!", "error");

    const positions = { 'Kaleci': [], 'Defans': [], 'Orta Saha': [], 'Forvet': [] };
    players.forEach(p => { if (positions[p.position]) positions[p.position].push(p); else positions['Orta Saha'].push(p); });
    for (let pos in positions) positions[pos].sort((a, b) => b.power - a.power);

    currentTeamA = []; currentTeamB = [];
    let pA = 0, pB = 0;

    const distribute = (group) => {
        group.forEach(player => {
            if (pA <= pB) { currentTeamA.push(player); pA += player.power; }
            else { currentTeamB.push(player); pB += player.power; }
        });
    };

    distribute(positions['Kaleci']);
    distribute(positions['Defans']);
    distribute(positions['Orta Saha']);
    distribute(positions['Forvet']);

    avgEloA = currentTeamA.length > 0 ? (pA / currentTeamA.length) : 0;
    avgEloB = currentTeamB.length > 0 ? (pB / currentTeamB.length) : 0;

    const renderTeam = (listId, powId, team, avg) => {
        const el = document.getElementById(listId);
        el.innerHTML = "";
        team.forEach(p => {
            el.innerHTML += `<div class="team-player-item"><span>${escapeHTML(p.name)}<small style="color:var(--text-dim);margin-left:5px;">${p.position}</small></span><span style="font-size:11px;color:var(--gold);">${Math.round(p.power)}</span></div>`;
        });
        document.getElementById(powId).innerText = `ELO: ${Math.round(avg)}`;
    };

    renderTeam('listA', 'powerA', currentTeamA, avgEloA);
    renderTeam('listB', 'powerB', currentTeamB, avgEloB);

    document.getElementById('teamsContainer').style.display = 'grid';
    const waBar = document.getElementById('whatsappShareBar');
    if (waBar) waBar.style.display = 'block';
    showToast("Takımlar oluşturuldu! ⚖️");

    // Render tactics board
    renderTacticsBoard('4-3-3');
    document.getElementById('tacticsBoardSection').style.display = 'block';

    // Set active formation btn
    document.querySelectorAll('.formation-btn').forEach(b => b.classList.remove('active'));
    const firstBtn = document.querySelector('.formation-btn');
    if (firstBtn) firstBtn.classList.add('active');

    addDoc(collection(db, "matches", globalMatchId, "messages"), {
        name: "SİSTEM",
        text: `🤖 AI Takımları Kurdu! A(${Math.round(avgEloA)} ELO) vs B(${Math.round(avgEloB)} ELO)`,
        createdAt: serverTimestamp()
    });

    // Takım UID'lerini Firestore'a kaydet (Observer gol senkronizasyonu için)
    try {
        await updateDoc(doc(db, "matches", globalMatchId), {
            teamA_uids: currentTeamA.map(p => p.uid),
            teamB_uids: currentTeamB.map(p => p.uid)
        });
    } catch(e) { console.warn("Takım UIDs kaydedilemedi:", e); }

    // Kazanma ihtimali hesapla
    const totalElo = avgEloA + avgEloB;
    const winProbA = totalElo > 0 ? Math.round((avgEloA / totalElo) * 100) : 50;
    const winProbB = 100 - winProbA;
    const probBar = document.getElementById('winProbBar');
    if (probBar) {
        probBar.style.display = 'block';
        probBar.innerHTML = `
            <div style="font-size:11px;color:var(--text-dim);letter-spacing:1px;margin-bottom:6px;text-align:center;">⚖️ KAZANMA İHTİMALİ</div>
            <div style="display:flex;border-radius:8px;overflow:hidden;height:28px;">
                <div style="width:${winProbA}%;background:linear-gradient(90deg,#e74c3c,#c0392b);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;">A %${winProbA}</div>
                <div style="width:${winProbB}%;background:linear-gradient(90deg,#2980b9,#3498db);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;">B %${winProbB}</div>
            </div>`;
    }
};

// ── STATS & ELO ──
window.openStatsPanel = function () {
    if (currentTeamA.length === 0) return showToast("Önce takımları kurun!", "error");
    if (players.length < 4) return showToast("⚠️ En az 4 oyuncu olmalı! (Anti-hile koruması)", "error");

    document.getElementById('statsSection').style.display = 'block';
    document.getElementById('statsList').innerHTML = "";

    players.forEach(p => {
        if (p.isGuest) return;
        const isA = currentTeamA.some(player => player.uid === p.uid);
        const tag = isA ? `<span class="stat-player-tag tag-a">A TAKIMI</span>` : `<span class="stat-player-tag tag-b">B TAKIMI</span>`;
        const isGK = p.position === 'Kaleci';
        // Merge observer stats hint
        const obs = (currentMatchData?.observerStats || {})[p.uid] || {};
        const obsHint = obs.goals ? `<span style="font-size:10px;color:var(--gold);margin-left:6px;">📺 Gözlemci: ${obs.goals || 0}G ${obs.assists || 0}A</span>` : '';

        document.getElementById('statsList').innerHTML += `
            <div class="stat-input-card">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
                        ${tag} <strong>${escapeHTML(p.name)}</strong>${obsHint}
                    </div>
                    <div class="stat-inputs">
                        ${!isGK ? `<input type="number" id="goals_${p.uid}" placeholder="⚽ Gol" min="0" max="15" value="${obs.goals||''}">` : ''}
                        <input type="number" id="assists_${p.uid}" placeholder="🎯 Asist" min="0" max="10" value="${obs.assists||''}">
                        <input type="number" id="shots_${p.uid}" placeholder="👟 Şut" min="0" max="20" value="${(obs.shotsOn||0)+(obs.shotsOff||0)||''}">
                        ${isGK ? `<input type="number" id="saves_${p.uid}" placeholder="🧤 Kurtarış" min="0" max="20" value="${obs.saves||''}">` : ''}
                        <input type="number" id="penMissed_${p.uid}" placeholder="❌ Pen.Kaçırdı" min="0" max="5">
                        <input type="number" id="penCaused_${p.uid}" placeholder="🚨 Pen.Yaptı" min="0" max="5">
                    </div>
                </div>
            </div>`;
    });
    document.getElementById('statsSection').scrollIntoView({ behavior: 'smooth' });
};

window.saveMatchData = async function () {
    const btn = document.querySelector('#statsSection button[onclick="saveMatchData()"]');
    if (btn) { btn.innerText = "HESAPLANIYOR..."; btn.disabled = true; }

    const sA = currentMatchData.scoreA || 0;
    const sB = currentMatchData.scoreB || 0;
    let mvp = { name: "", pts: -1, uid: "" };

    // Check observer stats (if observer saved them)
    let obsStats = currentMatchData.observerStats || {};

    let totalGoals = 0, inputError = false;
    players.forEach(p => {
        if (p.isGuest) return;
        const g = parseInt(document.getElementById(`goals_${p.uid}`)?.value) || 0;
        const a = parseInt(document.getElementById(`assists_${p.uid}`)?.value) || 0;
        if (g > 15) { showToast(`${p.name} için gol sayısı 15'i geçemez!`, "error"); inputError = true; }
        if (a > 10) { showToast(`${p.name} için asist sayısı 10'u geçemez!`, "error"); inputError = true; }
        totalGoals += g;
    });

    if (inputError) {
        if (btn) { btn.innerText = "💾 MAÇI KAYDET & MVP SEÇ"; btn.disabled = false; }
        return;
    }
    if (totalGoals > (sA + sB) * 1.5 + 5) {
        showToast("⚠️ Gol sayıları skora göre çok yüksek! Kontrol et.", "error");
        if (btn) { btn.innerText = "💾 MAÇI KAYDET & MVP SEÇ"; btn.disabled = false; }
        return;
    }

    const expA = 1 / (1 + Math.pow(10, (avgEloB - avgEloA) / 400));
    const expB = 1 - expA;

    // XP helpers
    const XP_MATCH = 100, XP_WIN = 50, XP_GOAL = 20, XP_ASSIST = 10;
    function calcLevel(xp) { return Math.floor(1 + Math.sqrt((xp || 0) / 200)); }

    // Match badges
    let badgesGiven = {};
    let bestSaves = { uid: "", val: -1 };
    let bestDef = { uid: "", val: -1 };
    let bestShot = { uid: "", val: -1, goals: 0, shots: 0 }; // shots/goal ratio

    for (const p of players) {
        if (p.isGuest) continue;

        // Merge observer stats if available
        const obs = obsStats[p.uid] || {};

        const g = parseInt(document.getElementById(`goals_${p.uid}`)?.value) || 0;
        const a = parseInt(document.getElementById(`assists_${p.uid}`)?.value) || 0;
        const shots = (parseInt(document.getElementById(`shots_${p.uid}`)?.value) || 0) + (obs.shotsOn || 0) + (obs.shotsOff || 0);
        const saves = (parseInt(document.getElementById(`saves_${p.uid}`)?.value) || 0) + (obs.saves || 0);
        const penMissed = (parseInt(document.getElementById(`penMissed_${p.uid}`)?.value) || 0) + (obs.penMissed || 0);
        const penCaused = (parseInt(document.getElementById(`penCaused_${p.uid}`)?.value) || 0);
        const tackles = obs.tackles || 0;
        const interceptions = obs.interceptions || 0;
        const keyPasses = obs.keyPasses || 0;
        const turnovers = obs.turnovers || 0;
        const yellowCards = (obs.yellowCards || 0);

        // Performance score (for MVP + ELO bonus)
        const perfPts = (g * 3) + (a * 2) + (saves * 1.5) + (tackles * 0.5) + (interceptions * 0.5) + (keyPasses * 0.5)
            - (penMissed * 2) - (penCaused * 1) - (turnovers * 0.3) - (yellowCards * 1);
        if (perfPts > mvp.pts) mvp = { name: p.name, pts: perfPts, uid: p.uid };

        // Track badge candidates
        if (saves > bestSaves.val) bestSaves = { uid: p.uid, name: p.name, val: saves };
        const defScore = tackles + interceptions;
        if (defScore > bestDef.val) bestDef = { uid: p.uid, name: p.name, val: defScore };
        const shotRatio = shots > 0 ? g / shots : 0;
        if (shotRatio > bestShot.val && g > 0) bestShot = { uid: p.uid, name: p.name, val: shotRatio, goals: g, shots };

        const isA = currentTeamA.some(x => x.uid === p.uid);
        const resScore = isA ? (sA > sB ? 1 : sA === sB ? 0.5 : 0) : (sB > sA ? 1 : sB === sA ? 0.5 : 0);
        const expScore = isA ? expA : expB;

        // ELO calculation
        const eloBase = Math.round(32 * (resScore - expScore));
        const eloPenalty = (penMissed * -8) + (penCaused * -5) + (yellowCards * -3);
        const eloBonus = Math.round(Math.min(perfPts * 0.5, 15)); // cap bonus
        const eloChange = eloBase + eloBonus + eloPenalty;

        const uRef = doc(db, "users", p.uid);
        const uSnap = await getDoc(uRef);
        const uData = uSnap.data() || {};
        const curPower = uData.power || 1500;
        const newPower = Math.max(100, curPower + eloChange);
        const diff = newPower - curPower;

        // XP & Level
        const curXP = uData.xp || 0;
        const earnedXP = XP_MATCH + (resScore === 1 ? XP_WIN : 0) + (g * XP_GOAL) + (a * XP_ASSIST);
        const newXP = curXP + earnedXP;
        const oldLevel = calcLevel(curXP);
        const newLevel = calcLevel(newXP);

        await updateDoc(uRef, {
            power: newPower,
            goals: increment(g), assists: increment(a), matchesPlayed: increment(1),
            shots: increment(shots), saves: increment(saves),
            tackles: increment(tackles), interceptions: increment(interceptions),
            penaltiesMissed: increment(penMissed),
            xp: newXP, level: newLevel
        });

        await setDoc(doc(db, "users", p.uid, "history", globalMatchId), {
            date: new Date().toLocaleDateString('tr-TR'), timestamp: serverTimestamp(),
            pitch: currentMatchData.pitch,
            result: resScore === 1 ? "Galibiyet" : (resScore === 0.5 ? "Berabere" : "Mağlubiyet"),
            score: `${sA}-${sB}`,
            eloChange: `${diff > 0 ? '+' + diff : diff}`,
            goals: g, assists: a, saves, shots, tackles, interceptions,
            penMissed, xpEarned: earnedXP, newLevel, levelUp: newLevel > oldLevel
        });

        if (newLevel > oldLevel && p.uid === currentUser.uid) {
            setTimeout(() => showToast(`🎉 SEVİYE ATLADIN! Level ${newLevel} ⬆️`, "success"), 1200);
        }
    }

    // Set MVP + mvpCount
    mvpName = mvp.name;
    if (mvp.uid) {
        await updateDoc(doc(db, "users", mvp.uid), { mvpCount: increment(1) });
    }

    // Give match badges
    if (bestSaves.val > 0) badgesGiven['duvar'] = bestSaves.name;
    if (bestDef.val > 0) badgesGiven['gizliKahraman'] = bestDef.name;
    if (bestShot.val > 0) badgesGiven['sniper'] = bestShot.name;
    // "Kasap": most penalty caused / yellow cards
    const kasap = players.filter(p => !p.isGuest).find(p => {
        const obs = obsStats[p.uid] || {};
        return (obs.yellowCards || 0) >= 2;
    });
    if (kasap) badgesGiven['kasap'] = kasap.name;

    await updateDoc(doc(db, "matches", globalMatchId), {
        status: "finished", mvp: mvp.name, mvpUid: mvp.uid,
        matchBadges: badgesGiven,
        finalScoreA: sA, finalScoreB: sB, finishedAt: serverTimestamp()
    });

    // MVP sayacını artır
    if (mvp.uid && !mvp.uid.startsWith('guest_')) {
        await updateDoc(doc(db, "users", mvp.uid), { mvpCount: increment(1) });
    }

    // AI Maç Sonu Gazetesi
    _postMatchReport(sA, sB, mvp.name, badgesGiven, players);

    // Feed'e otomatik paylaşım + win streak güncelle
    _autoPostMatchToFeed(sA, sB, mvp.name, currentMatchData.pitch);
    _updateWinStreakAfterMatch(currentUser.uid, sA, sB);

    document.getElementById('statsSection').style.display = 'none';

    // Show badges banner
    _showMatchBadges(badgesGiven, mvp.name);

    // Open peer rating
    _openPeerRatingPanel();

    showToast(`🏆 MVP: ${mvpName} — Kaydedildi!`, "success");
    getDoc(doc(db, "users", currentUser.uid)).then(u => {
        if (u.exists()) { currentUser = { ...currentUser, ...u.data() }; updateProfileUI(); }
    });
};

// ── MATCH BADGES ──
function _showMatchBadges(badges, mvpName) {
    const shareSection = document.getElementById('shareSection');
    if (!shareSection) return;

    const badgeDefs = {
        duvar:        { icon: '🧱', label: 'Duvar', desc: 'En iyi kaleci/kurtarış' },
        gizliKahraman:{ icon: '🎯', label: 'Gizli Kahraman', desc: 'En fazla müdahale' },
        sniper:       { icon: '🎯', label: 'Sniper', desc: 'En yüksek şut/gol oranı' },
        kasap:        { icon: '🪓', label: 'Kasap', desc: '2+ sarı kart' }
    };

    let badgeHTML = '';
    Object.entries(badges).forEach(([key, playerName]) => {
        const def = badgeDefs[key];
        if (def && playerName) {
            badgeHTML += `<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;">
                <span style="font-size:24px;">${def.icon}</span>
                <div><div style="font-size:13px;font-weight:700;color:var(--gold);">${def.label}</div><div style="font-size:12px;color:var(--text-dim);">${escapeHTML(playerName)} · ${def.desc}</div></div>
            </div>`;
        }
    });

    shareSection.style.display = 'block';
    const mvpBanner = document.getElementById('mvpBanner');
    if (mvpBanner && mvpName) { mvpBanner.style.display = 'block'; document.getElementById('mvpDisplayName').innerText = mvpName; }

    const badgesEl = document.getElementById('matchBadgesSection');
    if (badgesEl && badgeHTML) {
        badgesEl.innerHTML = `<div style="margin-bottom:15px;"><div style="font-size:12px;letter-spacing:2px;color:var(--text-dim);margin-bottom:10px;">🏅 MAÇ ROZETLERİ</div>${badgeHTML}</div>`;
    }
}

// ── PEER RATING ──
function _openPeerRatingPanel() {
    const section = document.getElementById('peerRatingSection');
    if (!section) return;

    const isInTeamA = currentTeamA.some(p => p.uid === currentUser.uid);
    const myTeam = isInTeamA ? currentTeamA : currentTeamB;
    const teammates = myTeam.filter(p => p.uid !== currentUser.uid && !p.isGuest);

    if (teammates.length === 0) return;

    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
    section.innerHTML = `
        <h3 style="margin-bottom:10px;font-size:18px;">⭐ Takım Arkadaşlarını Puanla</h3>
        <p style="font-size:12px;color:var(--text-dim);margin-bottom:15px;">Sadece kendi takımındakileri puanlarsın. Puanlar ELO'ya yansır.</p>
        <div id="peerRatingList"></div>
        <button onclick="_submitPeerRatings()" class="btn-success" style="margin-top:10px;width:100%;">✅ Puanları Gönder</button>
        <button onclick="_skipPeerRating()" class="btn-ghost" style="margin-top:6px;width:100%;">Atla →</button>`;

    const list = document.getElementById('peerRatingList');
    window._peerRatings = {};
    teammates.forEach(p => {
        window._peerRatings[p.uid] = 0;
        list.innerHTML += `
            <div class="stat-input-card" style="margin-bottom:10px;">
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                    <div class="player-avatar-sm">${(p.name||'?').charAt(0).toUpperCase()}</div>
                    <strong style="font-size:14px;">${escapeHTML(p.name)}</strong>
                </div>
                <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                    ${[1,2,3,4,5].map(n => `<button onclick="_setStar('${p.uid}',${n})" id="pstar_${p.uid}_${n}" style="font-size:26px;background:none;border:none;cursor:pointer;opacity:0.3;transition:all 0.15s;padding:4px;">⭐</button>`).join('')}
                </div>
                <input type="text" id="peerNote_${p.uid}" placeholder="Yorum ekle (opsiyonel)" style="margin-top:8px;font-size:12px;">
            </div>`;
    });
}

window._setStar = function(uid, rating) {
    window._peerRatings[uid] = rating;
    for (let i = 1; i <= 5; i++) {
        const btn = document.getElementById(`pstar_${uid}_${i}`);
        if (btn) btn.style.opacity = i <= rating ? '1' : '0.25';
    }
};

window._submitPeerRatings = async function() {
    const isInTeamA = currentTeamA.some(p => p.uid === currentUser.uid);
    const myTeam = isInTeamA ? currentTeamA : currentTeamB;
    const teammates = myTeam.filter(p => p.uid !== currentUser.uid && !p.isGuest);
    let count = 0;
    for (const p of teammates) {
        const rating = window._peerRatings?.[p.uid] || 0;
        if (!rating) continue;
        const comment = document.getElementById(`peerNote_${p.uid}`)?.value?.trim() || '';
        await setDoc(doc(db, "users", p.uid, "ratings", `${globalMatchId}_${currentUser.uid}`), {
            fromUid: currentUser.uid, fromName: currentUser.name,
            rating, comment, matchId: globalMatchId, timestamp: serverTimestamp()
        });
        const eloFromRating = Math.round((rating - 3) * 2); // -4 to +4
        if (eloFromRating !== 0) {
            const snap = await getDoc(doc(db, "users", p.uid));
            if (snap.exists()) {
                await updateDoc(doc(db, "users", p.uid), { power: Math.max(100, (snap.data().power || 1500) + eloFromRating) });
            }
        }
        count++;
    }
    showToast(`${count} oyuncu puanlandı! ⭐`);
    _skipPeerRating();
};

window._skipPeerRating = function() {
    const s = document.getElementById('peerRatingSection');
    if (s) s.style.display = 'none';
};

// ── VISUAL SHARE (html2canvas) ──
window.shareMatchResult = async function () {
    const sA = currentMatchData.scoreA || 0;
    const sB = currentMatchData.scoreB || 0;

    // Try visual share first
    try {
        const cardEl = document.getElementById('shareCardTemplate');
        cardEl.innerHTML = `
            <div style="
                width:360px;height:640px;
                background:linear-gradient(160deg,#060912 0%,#0d1422 50%,#111827 100%);
                padding:30px;font-family:'Bebas Neue',sans-serif;
                display:flex;flex-direction:column;gap:20px;
                position:relative;overflow:hidden;
                border:2px solid rgba(212,175,55,0.4);
                box-sizing:border-box;
            ">
                <div style="position:absolute;top:-80px;right:-80px;width:250px;height:250px;
                    background:radial-gradient(circle,rgba(212,175,55,0.15),transparent 70%);"></div>

                <div style="text-align:center;">
                    <div style="font-size:12px;letter-spacing:4px;color:#6b7280;margin-bottom:5px;">HALİ SAHA PRO</div>
                    <div style="font-size:36px;color:#D4AF37;letter-spacing:2px;">MAÇ SONUCU</div>
                </div>

                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.2);border-radius:12px;padding:15px;text-align:center;">
                    <div style="font-size:13px;color:#6b7280;letter-spacing:2px;margin-bottom:8px;">🏟️ ${escapeHTML(currentMatchData.pitch)}</div>
                    <div style="display:flex;justify-content:center;align-items:center;gap:20px;">
                        <div style="text-align:center;">
                            <div style="font-size:11px;color:#aaa;letter-spacing:1px;">A TAKIMI</div>
                            <div style="font-size:80px;color:#e74c3c;line-height:1;">${sA}</div>
                        </div>
                        <div style="font-size:40px;color:#374151;">—</div>
                        <div style="text-align:center;">
                            <div style="font-size:11px;color:#aaa;letter-spacing:1px;">B TAKIMI</div>
                            <div style="font-size:80px;color:#3498db;line-height:1;">${sB}</div>
                        </div>
                    </div>
                </div>

                <div style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.3);border-radius:12px;padding:15px;text-align:center;">
                    <div style="font-size:11px;letter-spacing:3px;color:#6b7280;margin-bottom:5px;">🏆 MAÇIN YILDIZI</div>
                    <div style="font-size:32px;color:#D4AF37;letter-spacing:2px;">${escapeHTML(mvpName) || '—'}</div>
                </div>

                <div style="margin-top:auto;">
                    <div style="display:flex;justify-content:space-between;font-size:11px;color:#374151;border-top:1px solid rgba(255,255,255,0.05);padding-top:15px;">
                        <span style="letter-spacing:2px;">#HALISAHAPRO</span>
                        <span>${new Date().toLocaleDateString('tr-TR')}</span>
                    </div>
                </div>
            </div>`;

        // Load html2canvas dynamically
        if (!window.html2canvas) {
            await new Promise((res, rej) => {
                const s = document.createElement('script');
                s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
                s.onload = res; s.onerror = rej;
                document.head.appendChild(s);
            });
        }

        const canvas = await window.html2canvas(cardEl.firstElementChild, {
            scale: 2, useCORS: true, backgroundColor: '#060912',
            width: 360, height: 640
        });

        canvas.toBlob(async (blob) => {
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], 'mac.png', { type: 'image/png' })] })) {
                await navigator.share({
                    files: [new File([blob], 'halisaha_mac.png', { type: 'image/png' })],
                    title: 'Maç Sonucu',
                    text: `A Takımı ${sA} - ${sB} B Takımı | MVP: ${mvpName} #HaliSahaPRO`
                });
            } else {
                // Fallback: download image
                const link = document.createElement('a');
                link.href = canvas.toDataURL('image/png');
                link.download = `halisaha_${Date.now()}.png`;
                link.click();
                showToast("📸 Görsel indirildi! Instagram'da paylaşabilirsin.");
            }
        }, 'image/png');

    } catch (err) {
        // Final fallback: text copy
        const text = `⚽ MAÇ SONUCU\n🏟️ ${currentMatchData.pitch}\n📊 A Takımı ${sA} — ${sB} B Takımı\n🏆 MVP: ${mvpName}\n\n#HaliSahaPRO`;
        if (navigator.share) { navigator.share({ title: 'Maç Sonucu', text }); }
        else { navigator.clipboard.writeText(text); showToast("Sonuç panoya kopyalandı!"); }
    }
};

// ── CHAT ──
function listenToChat(id) {
    if (unsubChat) unsubChat();
    unsubChat = onSnapshot(
        query(collection(db, "matches", id, "messages"), orderBy("createdAt", "asc"), limit(60)),
        (snap) => {
            const box = document.getElementById('chatBox');
            box.innerHTML = "";
            snap.forEach(d => {
                const m = d.data();
                const div = document.createElement('div');
                if (m.name === "🎙️ SPİKER") {
                    div.className = `chat-msg event ${m.actionType || ''}`;
                    div.innerHTML = `<strong>${escapeHTML(m.name)}</strong> ${escapeHTML(m.text)}`;
                } else if (m.name === "📰 GAZETECİ") {
                    div.className = 'chat-msg event report';
                    div.innerHTML = `<strong>${escapeHTML(m.name)}</strong> ${escapeHTML(m.text)}`;
                } else if (m.name === "SİSTEM") {
                    div.className = 'chat-msg system';
                    div.innerHTML = `${escapeHTML(m.text)}`;
                } else {
                    div.className = 'chat-msg';
                    div.innerHTML = `<strong>${escapeHTML(m.name)}</strong> ${escapeHTML(m.text)}`;
                }
                box.appendChild(div);
            });
            box.scrollTop = box.scrollHeight;
        }
    );
}

window.sendChatMessage = async function () {
    const i = document.getElementById('chatInput');
    const txt = i.value.trim();
    if (!txt || !globalMatchId) return;
    await addDoc(collection(db, "matches", globalMatchId, "messages"), {
        uid: currentUser.uid, name: currentUser.name, text: txt, createdAt: serverTimestamp()
    });
    i.value = "";
};

// ── HISTORY ──
async function loadHistory() {
    const histEl = document.getElementById('historyList');
    histEl.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><p>Geçmiş yükleniyor...</p></div>`;
    const snap = await getDocs(query(collection(db, "users", currentUser.uid, "history"), orderBy("timestamp", "desc"), limit(15)));
    const hist = [];
    histEl.innerHTML = "";

    if (snap.empty) {
        histEl.innerHTML = `<div class="empty-state"><div class="empty-icon">📜</div><p>Henüz maç geçmişin yok.</p></div>`;
        return;
    }

    let recentResults = [];
    snap.forEach(d => {
        hist.push(d.data());
        const dt = d.data();
        recentResults.push(dt.result);
        const cls = dt.result === 'Galibiyet' ? 'win' : dt.result === 'Mağlubiyet' ? 'loss' : 'draw';
        const eloNum = parseInt(dt.eloChange?.replace('+', '') || '0');
        const eloColor = eloNum > 0 ? 'var(--green)' : eloNum < 0 ? 'var(--red)' : 'var(--gold)';
        const eloArrow = eloNum > 0 ? '↑' : eloNum < 0 ? '↓' : '→';
        histEl.innerHTML += `
            <div class="history-card ${cls}">
                <div class="history-header">
                    <span class="history-pitch">${escapeHTML(dt.pitch)}</span>
                    <span class="history-date">${dt.date}</span>
                </div>
                <div class="history-result">
                    <span class="history-badge">${dt.result}</span>
                    <span class="history-score">${dt.score}</span>
                </div>
                <div class="history-stats-row">
                    <span>⚽ ${dt.goals} Gol</span>
                    <span>🎯 ${dt.assists} Asist</span>
                    <span class="history-elo" style="color:${eloColor};">${eloArrow} ${dt.eloChange} ELO</span>
                </div>
            </div>`;
    });

    // Show form arrows in profile — last 3 matches
    showFormArrows(recentResults.slice(0, 3));
    renderEloChart(hist);
}

function showFormArrows(results) {
    const profileTierEl = document.getElementById('profileTier');
    if (!profileTierEl || results.length === 0) return;

    // Calc net ELO trend of last 3 matches from history
    const wins = results.filter(r => r === 'Galibiyet').length;
    const losses = results.filter(r => r === 'Mağlubiyet').length;

    let arrowHTML = '';
    if (wins > losses) {
        arrowHTML = `<span class="form-arrow form-up" style="margin-left:8px;">↑ Form</span>`;
    } else if (losses > wins) {
        arrowHTML = `<span class="form-arrow form-down" style="margin-left:8px;">↓ Düşüş</span>`;
    } else {
        arrowHTML = `<span class="form-arrow form-neutral" style="margin-left:8px;">→ Stabil</span>`;
    }

    // Inject next to tier badge
    const existing = document.getElementById('formArrowBadge');
    if (existing) existing.remove();
    const badge = document.createElement('span');
    badge.id = 'formArrowBadge';
    badge.innerHTML = arrowHTML;
    profileTierEl.parentNode.insertBefore(badge, profileTierEl.nextSibling);
}

// ── LEADERBOARD (KATEGORİLİ) ──
window.loadLeaderboard = async function () {
    const lbEl = document.getElementById('leaderboardList');
    lbEl.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><p>Sıralama yükleniyor...</p></div>`;
    const city = document.getElementById('lbCity')?.value || '';
    const category = document.getElementById('lbCategory')?.value || 'power';
    try {
        let snap;
        if (city) {
            // Şehre göre filtreli (Firebase index gerekir)
            try {
                const q = query(collection(db, "users"), where("city", "==", city), orderBy(category, "desc"), limit(20));
                snap = await getDocs(q);
            } catch(indexErr) {
                // Index yoksa sadece category'ye göre sırala
                console.warn("Composite index eksik, fallback kullanılıyor:", indexErr);
                const q2 = query(collection(db, "users"), orderBy(category, "desc"), limit(30));
                const all = await getDocs(q2);
                // Client-side city filter
                const filtered = all.docs.filter(d => !city || d.data().city === city);
                snap = { empty: filtered.length === 0, forEach: (fn) => filtered.forEach(fn) };
            }
        } else {
            const q = query(collection(db, "users"), orderBy(category, "desc"), limit(20));
            snap = await getDocs(q);
        }

        lbEl.innerHTML = "";
        if (snap.empty) { lbEl.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><p>Henüz yeterli oyuncu yok.</p></div>`; return; }
        let rank = 1;
        snap.forEach(d => {
            const u = d.data();
            const t = getTier(u.power);
            const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
            const isMe = d.id === currentUser.uid;
            let statDisplay = '', badgeClass = 'tier-gumus';
            if (category === 'goals') { statDisplay = `⚽ ${u.goals || 0} Gol`; badgeClass = 'tier-efsane'; }
            else if (category === 'assists') { statDisplay = `🎯 ${u.assists || 0} Asist`; badgeClass = 'tier-altin'; }
            else if (category === 'mvpCount') { statDisplay = `🌟 ${u.mvpCount || 0} MVP`; badgeClass = 'tier-bronz'; }
            else if (category === 'saves') { statDisplay = `🧤 ${u.saves || 0} Kurtarış`; badgeClass = 'tier-gumus'; }
            else { statDisplay = `${Math.round(u.power)} ELO`; badgeClass = t.c; }
            const streak = u.winStreak || 0;
            const streakBadge = streak >= 3 ? `🔥${streak}` : '';
            lbEl.innerHTML += `
                <div class="player-item" data-uid="${d.id}" style="${isMe ? 'border:1px solid var(--gold);background:rgba(212,175,55,0.05);' : ''}">
                    <div class="player-item-left">
                        <div class="player-avatar-sm" style="${rank <= 3 ? 'background:linear-gradient(135deg,#D4AF37,#7B5E00);' : ''}">${medal}</div>
                        <div>
                            <div class="player-name">${escapeHTML(u.name)} ${streakBadge} ${isMe ? '<span style="color:var(--gold);font-size:10px;">(Sen)</span>' : ''}</div>
                            <div class="player-pos">${u.position} · ${u.matchesPlayed || 0} maç</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span class="elo-badge ${badgeClass}" style="font-size:12px;padding:4px 10px;">${statDisplay}</span>
                        ${!isMe ? `<button onclick="openH2H('${d.id}','${escapeHTML(u.name)}')" style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);color:var(--gold);border-radius:6px;padding:4px 7px;font-size:10px;cursor:pointer;">⚖️</button>` : ''}
                    </div>
                </div>`;
            rank++;
        });
    } catch (e) {
        console.error("Leaderboard hatası:", e);
        lbEl.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Sıralama yüklenemedi. <br><small style="color:var(--text-dim)">Firebase Console → Firestore → Indexes → Composite index ekle: users (city ASC, ${document.getElementById('lbCategory')?.value||'power'} DESC)</small></p></div>`;
    }
};

// ── CLAN ──
window.createClan = async function () {
    const name = document.getElementById('newClanName').value?.trim();
    if (!name) return showToast("Kulüp adı girin!", "error");
    if (currentUser.clanId) return showToast("Zaten bir kulübe üyesin!", "error");
    const clanRef = await addDoc(collection(db, "clans"), { name, leaderUid: currentUser.uid, leaderName: currentUser.name, members: [currentUser.uid], memberNames: [currentUser.name], createdAt: serverTimestamp() });
    await updateDoc(doc(db, "users", currentUser.uid), { clanId: clanRef.id, clanName: name });
    currentUser.clanId = clanRef.id; currentUser.clanName = name;
    showToast(`${name} kuruldu! 🛡️`);
    loadClanUI();
};

window.leaveClan = async function () {
    if (!currentUser.clanId) return;
    if (!confirm("Kulüpten ayrılmak istediğine emin misin?")) return;
    await updateDoc(doc(db, "users", currentUser.uid), { clanId: null, clanName: null });
    currentUser.clanId = null; currentUser.clanName = null;
    showToast("Kulüpten ayrıldın.");
    document.getElementById('noClanSection').style.display = 'block';
    document.getElementById('myClanSection').style.display = 'none';
};

window.inviteToClan = function () {
    const link = `${window.location.origin}/katil.html?clan=${currentUser.clanId}`;
    if (navigator.share) { navigator.share({ title: 'Kulübe Katıl', text: `${currentUser.clanName} kulübüne katılmak için tıkla!`, url: link }); }
    else { navigator.clipboard.writeText(link); showToast("Davet linki kopyalandı!"); }
};

async function loadClanUI() {
    if (!currentUser.clanId) {
        document.getElementById('noClanSection').style.display = 'block';
        document.getElementById('myClanSection').style.display = 'none';
        return;
    }
    document.getElementById('noClanSection').style.display = 'none';
    document.getElementById('myClanSection').style.display = 'block';
    document.getElementById('displayClanName').innerText = currentUser.clanName || '—';
    const snap = await getDoc(doc(db, "clans", currentUser.clanId));
    if (snap.exists()) {
        const clan = snap.data();
        const memberList = document.getElementById('clanMembersList');
        memberList.innerHTML = "";
        for (const uid of (clan.members || [])) {
            const u = await getDoc(doc(db, "users", uid));
            if (u.exists()) {
                const ud = u.data();
                const t = getTier(ud.power);
                memberList.innerHTML += `
                    <li class="player-item">
                        <div class="player-item-left">
                            <div class="player-avatar-sm">${(ud.name||'?').charAt(0).toUpperCase()}</div>
                            <div>
                                <div class="player-name">${escapeHTML(ud.name)} ${uid === clan.leaderUid ? '<span style="color:var(--gold);">👑</span>' : ''}</div>
                                <div class="player-pos">${ud.position} · ${ud.matchesPlayed || 0} maç</div>
                            </div>
                        </div>
                        <span class="elo-badge ${t.c}" style="font-size:11px;">${Math.round(ud.power)}</span>
                    </li>`;
            }
        }
    }
}

// Katil.html functions (kept for compatibility)
window.checkUrlParams = function () {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('match');
    const clanId = params.get('clan');
    if (matchId) {
        document.getElementById('matchInviteSection').style.display = 'block';
        globalMatchId = matchId;
        const matchDoc = getDoc(doc(db, "matches", matchId)).then(d => {
            if (d.exists()) {
                const data = d.data();
                document.getElementById('displayMatchId').innerHTML = `<div style="background:var(--glass);border:1px solid var(--border);border-radius:10px;padding:15px;margin:10px 0;"><strong>${escapeHTML(data.pitch)}</strong><br><small>${data.time?.replace('T', ' ')}</small></div>`;
                if (data.password) { document.getElementById('passwordSection').style.display = 'flex'; }
                else { document.getElementById('joinSection').style.display = 'flex'; }
            }
        });
    }
    if (clanId) {
        document.getElementById('clanInviteSection').style.display = 'block';
        getDoc(doc(db, "clans", clanId)).then(d => {
            if (d.exists()) document.getElementById('displayInvitedClanName').innerText = d.data().name;
        });
    }
};

window.checkPassword = async function () {
    const params = new URLSearchParams(window.location.search);
    const matchId = params.get('match');
    const pwd = document.getElementById('roomPassword').value;
    const d = await getDoc(doc(db, "matches", matchId));
    if (d.data().password === pwd) {
        document.getElementById('passwordSection').style.display = 'none';
        document.getElementById('joinSection').style.display = 'flex';
    } else { showToast("Yanlış Şifre!", "error"); }
};

window.requestJoinMatch = function () { requestJoinEngine(globalMatchId); };

window.joinClan = async function () {
    const params = new URLSearchParams(window.location.search);
    const clanId = params.get('clan');
    if (!clanId || !currentUser) return;
    const cSnap = await getDoc(doc(db, "clans", clanId));
    if (!cSnap.exists()) return showToast("Kulüp bulunamadı!", "error");
    const clan = cSnap.data();
    await updateDoc(doc(db, "clans", clanId), { members: [...(clan.members || []), currentUser.uid], memberNames: [...(clan.memberNames || []), currentUser.name] });
    await updateDoc(doc(db, "users", currentUser.uid), { clanId, clanName: clan.name });
    showToast(`${clan.name} kulübüne katıldın! 🛡️`);
};

// ══════════════════════════════════════════════════════
// ── 🌤️ WEATHER INTEGRATION (OpenWeather API) ──
// ══════════════════════════════════════════════════════

const WEATHER_API_KEY = 'bd5e378503939ddaee76f12ad7a97608'; // Free tier key
const cityCoords = {
    'İstanbul': { lat: 41.01, lon: 28.97 }, 'Ankara': { lat: 39.93, lon: 32.85 },
    'İzmir': { lat: 38.42, lon: 27.14 }, 'Bursa': { lat: 40.18, lon: 29.06 },
    'Antalya': { lat: 36.90, lon: 30.70 }, 'Adana': { lat: 37.00, lon: 35.32 },
    'Konya': { lat: 37.87, lon: 32.48 }, 'Gaziantep': { lat: 37.06, lon: 37.38 },
    'Mersin': { lat: 36.80, lon: 34.63 }, 'Kayseri': { lat: 38.73, lon: 35.49 },
    'Samsun': { lat: 41.29, lon: 36.33 }, 'Diyarbakır': { lat: 37.91, lon: 40.22 },
    'Şanlıurfa': { lat: 37.16, lon: 38.79 }, 'Hatay': { lat: 36.20, lon: 36.16 },
    'Balıkesir': { lat: 39.65, lon: 27.88 }, 'Kahramanmaraş': { lat: 37.58, lon: 36.94 },
    'Van': { lat: 38.49, lon: 43.38 }, 'Aydın': { lat: 37.85, lon: 27.84 },
    'Denizli': { lat: 37.77, lon: 29.09 }, 'Tekirdağ': { lat: 40.98, lon: 27.51 }
};

const weatherIcons = {
    '01': '☀️', '02': '⛅', '03': '☁️', '04': '☁️',
    '09': '🌧️', '10': '🌦️', '11': '⛈️', '13': '❄️', '50': '🌫️'
};

function getWeatherIcon(iconCode) {
    const prefix = iconCode?.slice(0, 2);
    return weatherIcons[prefix] || '🌡️';
}

function getWeatherWarning(data) {
    const temp = data.main?.temp;
    const weatherId = data.weather?.[0]?.id;
    const rain = data.rain?.['1h'] || data.rain?.['3h'] || 0;
    const wind = data.wind?.speed || 0;

    if (weatherId >= 200 && weatherId < 300) return '⛈️ Fırtına var! Maçı ertelemeni tavsiye ederim.';
    if (weatherId >= 300 && weatherId < 600) return `🌧️ Yağmur bekleniyor! Krampon seçimine dikkat.`;
    if (weatherId >= 600 && weatherId < 700) return '❄️ Kar var! Saha durumunu kontrol et.';
    if (temp < 5) return `🥶 Çok soğuk (${Math.round(temp)}°C)! İçlik giymeyi unutma.`;
    if (temp > 35) return `🔥 Çok sıcak (${Math.round(temp)}°C)! Bol su iç.`;
    if (wind > 10) return `💨 Rüzgarlı (${Math.round(wind * 3.6)} km/s)! Pas oyununda dikkatli ol.`;
    return null;
}

async function fetchWeather(city, targetTime) {
    const coords = cityCoords[city];
    if (!coords) return null;
    try {
        // Use forecast endpoint for future times
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${WEATHER_API_KEY}&units=metric&lang=tr`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Weather API error');
        const data = await res.json();

        if (!targetTime) return data.list?.[0];

        // Find closest forecast to match time
        const matchTs = new Date(targetTime).getTime() / 1000;
        let closest = data.list[0];
        let minDiff = Infinity;
        data.list.forEach(entry => {
            const diff = Math.abs(entry.dt - matchTs);
            if (diff < minDiff) { minDiff = diff; closest = entry; }
        });
        return closest;
    } catch (e) {
        return null;
    }
}

function renderWeatherWidget(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!data) { container.innerHTML = ''; return; }

    const icon = getWeatherIcon(data.weather?.[0]?.icon);
    const temp = Math.round(data.main?.temp);
    const desc = data.weather?.[0]?.description || '';
    const humidity = data.main?.humidity;
    const warning = getWeatherWarning(data);

    container.innerHTML = `
        <div class="weather-widget">
            <div class="weather-icon">${icon}</div>
            <div class="weather-info">
                <div class="weather-temp">${temp}°C <span style="font-size:13px;color:var(--text-dim);">Nem: %${humidity}</span></div>
                <div class="weather-desc">${desc.charAt(0).toUpperCase() + desc.slice(1)}</div>
                ${warning ? `<div class="weather-warning">${warning}</div>` : ''}
            </div>
        </div>`;
}

let weatherDebounce = null;
window.fetchWeatherForMatch = function () {
    clearTimeout(weatherDebounce);
    weatherDebounce = setTimeout(async () => {
        const city = document.getElementById('matchCity')?.value;
        const time = document.getElementById('matchTime')?.value;
        if (!city) return;
        const data = await fetchWeather(city, time || null);
        renderWeatherWidget(data, 'weatherWidgetSetup');
    }, 800);
};

async function fetchAndShowRoomWeather() {
    if (!currentMatchData) return;
    const data = await fetchWeather(currentMatchData.city, currentMatchData.time);
    renderWeatherWidget(data, 'weatherWidgetRoom');
}

// ══════════════════════════════════════════════════════
// ── 🏟️ 2D TACTICS BOARD (Drag & Drop) ──
// ══════════════════════════════════════════════════════

const FORMATIONS = {
    '4-3-3': {
        A: [
            { pos: 'GK', x: 50, y: 8 },
            { pos: 'DEF', x: 20, y: 22 }, { pos: 'DEF', x: 37, y: 20 }, { pos: 'DEF', x: 63, y: 20 }, { pos: 'DEF', x: 80, y: 22 },
            { pos: 'MID', x: 25, y: 35 }, { pos: 'MID', x: 50, y: 32 }, { pos: 'MID', x: 75, y: 35 },
            { pos: 'FWD', x: 20, y: 46 }, { pos: 'FWD', x: 50, y: 44 }, { pos: 'FWD', x: 80, y: 46 }
        ],
        B: [
            { pos: 'GK', x: 50, y: 92 },
            { pos: 'DEF', x: 20, y: 78 }, { pos: 'DEF', x: 37, y: 80 }, { pos: 'DEF', x: 63, y: 80 }, { pos: 'DEF', x: 80, y: 78 },
            { pos: 'MID', x: 25, y: 65 }, { pos: 'MID', x: 50, y: 68 }, { pos: 'MID', x: 75, y: 65 },
            { pos: 'FWD', x: 20, y: 54 }, { pos: 'FWD', x: 50, y: 56 }, { pos: 'FWD', x: 80, y: 54 }
        ]
    },
    '4-4-2': {
        A: [
            { pos: 'GK', x: 50, y: 8 },
            { pos: 'DEF', x: 18, y: 21 }, { pos: 'DEF', x: 36, y: 19 }, { pos: 'DEF', x: 64, y: 19 }, { pos: 'DEF', x: 82, y: 21 },
            { pos: 'MID', x: 18, y: 35 }, { pos: 'MID', x: 36, y: 33 }, { pos: 'MID', x: 64, y: 33 }, { pos: 'MID', x: 82, y: 35 },
            { pos: 'FWD', x: 35, y: 46 }, { pos: 'FWD', x: 65, y: 46 }
        ],
        B: [
            { pos: 'GK', x: 50, y: 92 },
            { pos: 'DEF', x: 18, y: 79 }, { pos: 'DEF', x: 36, y: 81 }, { pos: 'DEF', x: 64, y: 81 }, { pos: 'DEF', x: 82, y: 79 },
            { pos: 'MID', x: 18, y: 65 }, { pos: 'MID', x: 36, y: 67 }, { pos: 'MID', x: 64, y: 67 }, { pos: 'MID', x: 82, y: 65 },
            { pos: 'FWD', x: 35, y: 54 }, { pos: 'FWD', x: 65, y: 54 }
        ]
    },
    '3-5-2': {
        A: [
            { pos: 'GK', x: 50, y: 8 },
            { pos: 'DEF', x: 25, y: 21 }, { pos: 'DEF', x: 50, y: 19 }, { pos: 'DEF', x: 75, y: 21 },
            { pos: 'MID', x: 12, y: 34 }, { pos: 'MID', x: 30, y: 32 }, { pos: 'MID', x: 50, y: 30 }, { pos: 'MID', x: 70, y: 32 }, { pos: 'MID', x: 88, y: 34 },
            { pos: 'FWD', x: 35, y: 46 }, { pos: 'FWD', x: 65, y: 46 }
        ],
        B: [
            { pos: 'GK', x: 50, y: 92 },
            { pos: 'DEF', x: 25, y: 79 }, { pos: 'DEF', x: 50, y: 81 }, { pos: 'DEF', x: 75, y: 79 },
            { pos: 'MID', x: 12, y: 66 }, { pos: 'MID', x: 30, y: 68 }, { pos: 'MID', x: 50, y: 70 }, { pos: 'MID', x: 70, y: 68 }, { pos: 'MID', x: 88, y: 66 },
            { pos: 'FWD', x: 35, y: 54 }, { pos: 'FWD', x: 65, y: 54 }
        ]
    },
    '5-3-2': {
        A: [
            { pos: 'GK', x: 50, y: 8 },
            { pos: 'DEF', x: 10, y: 22 }, { pos: 'DEF', x: 28, y: 20 }, { pos: 'DEF', x: 50, y: 18 }, { pos: 'DEF', x: 72, y: 20 }, { pos: 'DEF', x: 90, y: 22 },
            { pos: 'MID', x: 25, y: 34 }, { pos: 'MID', x: 50, y: 32 }, { pos: 'MID', x: 75, y: 34 },
            { pos: 'FWD', x: 35, y: 45 }, { pos: 'FWD', x: 65, y: 45 }
        ],
        B: [
            { pos: 'GK', x: 50, y: 92 },
            { pos: 'DEF', x: 10, y: 78 }, { pos: 'DEF', x: 28, y: 80 }, { pos: 'DEF', x: 50, y: 82 }, { pos: 'DEF', x: 72, y: 80 }, { pos: 'DEF', x: 90, y: 78 },
            { pos: 'MID', x: 25, y: 66 }, { pos: 'MID', x: 50, y: 68 }, { pos: 'MID', x: 75, y: 66 },
            { pos: 'FWD', x: 35, y: 55 }, { pos: 'FWD', x: 65, y: 55 }
        ]
    }
};

function posToFormationRole(position) {
    if (position === 'Kaleci') return 'GK';
    if (position === 'Defans') return 'DEF';
    if (position === 'Orta Saha') return 'MID';
    return 'FWD';
}

window.applyFormation = function (formation) {
    document.querySelectorAll('.formation-btn').forEach(b => {
        b.classList.toggle('active', b.textContent === formation);
    });
    renderTacticsBoard(formation);
};

function renderTacticsBoard(formation = '4-3-3') {
    const board = document.getElementById('tacticsBoard');
    if (!board) return;

    // Clear tokens, keep pitch lines
    board.querySelectorAll('.player-token').forEach(t => t.remove());

    const layout = FORMATIONS[formation] || FORMATIONS['4-3-3'];

    const sortedByRole = (team) => {
        const order = ['GK', 'DEF', 'MID', 'FWD'];
        return [...team].sort((a, b) => order.indexOf(posToFormationRole(a.position)) - order.indexOf(posToFormationRole(b.position)));
    };

    const placeTeam = (team, positions, teamClass) => {
        const sorted = sortedByRole(team);
        sorted.forEach((player, i) => {
            if (i >= positions.length) return;
            const slot = positions[i];
            createPlayerToken(board, player, slot.x, slot.y, teamClass);
        });
    };

    placeTeam(currentTeamA, layout.A, 'team-a');
    placeTeam(currentTeamB, layout.B, 'team-b');
}

function createPlayerToken(board, player, xPct, yPct, teamClass) {
    const token = document.createElement('div');
    token.className = `player-token ${teamClass}`;
    if (player.uid === currentMatchData?.captainUid) token.classList.add('captain-token');

    token.style.left = `${xPct}%`;
    token.style.top = `${yPct}%`;

    const initial = document.createElement('span');
    initial.className = 'token-initial';
    initial.textContent = (player.name || '?').charAt(0).toUpperCase();
    token.appendChild(initial);

    const nameTag = document.createElement('span');
    nameTag.className = 'token-name';
    nameTag.textContent = player.name?.split(' ')[0] || '?';
    token.appendChild(nameTag);

    makeDraggable(token, board);
    board.appendChild(token);
}

function makeDraggable(el, board) {
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    el.addEventListener('pointerdown', (e) => {
        isDragging = true;
        el.style.zIndex = 100;
        el.style.transition = 'none';
        el.setPointerCapture(e.pointerId);

        const rect = board.getBoundingClientRect();
        startLeft = parseFloat(el.style.left);
        startTop = parseFloat(el.style.top);
        startX = (e.clientX - rect.left) / rect.width * 100;
        startY = (e.clientY - rect.top) / rect.height * 100;

        e.preventDefault();
    }, { passive: false });

    el.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const rect = board.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 100;
        const y = (e.clientY - rect.top) / rect.height * 100;
        const dx = x - startX;
        const dy = y - startY;

        const newLeft = Math.max(3, Math.min(97, startLeft + dx));
        const newTop = Math.max(3, Math.min(97, startTop + dy));

        el.style.left = `${newLeft}%`;
        el.style.top = `${newTop}%`;
    });

    el.addEventListener('pointerup', (e) => {
        isDragging = false;
        el.style.zIndex = 10;
        el.releasePointerCapture(e.pointerId);
    });
}

// ══════════════════════════════════════════════════════
// ── 🎖️ TOURNAMENT SYSTEM ──
// ══════════════════════════════════════════════════════

window.openCreateTournamentModal = () => {
    document.getElementById('createTournamentModal').style.display = 'flex';
};

window.createTournament = async () => {
    const name = document.getElementById('tournamentName').value?.trim();
    const type = document.getElementById('tournamentType').value;
    const max = parseInt(document.getElementById('maxParticipants').value);
    const start = document.getElementById('tournamentStart').value;
    const city = document.getElementById('tournamentCity').value;

    if (!name || !max || max < 4 || max > 16) return showToast("Bilgileri eksiksiz doldurun! (4-16 katılımcı)", "error");

    try {
        const ref = await addDoc(collection(db, "turnuvalar"), {
            name, type, maxParticipants: max, participantCount: 1,
            status: "pending", city,
            creatorUid: currentUser.uid, creatorName: currentUser.name,
            startDate: start || null, createdAt: serverTimestamp()
        });

        await setDoc(doc(db, "turnuvalar", ref.id, "katilimcilar", currentUser.uid), {
            uid: currentUser.uid, name: currentUser.name,
            clanId: currentUser.clanId || null, status: "approved",
            power: currentUser.power, joinedAt: serverTimestamp()
        });

        // Auto init standings
        await setDoc(doc(db, "turnuvalar", ref.id, "puanTablosu", currentUser.uid), {
            name: currentUser.name, puan: 0, galibiyet: 0, beraberlik: 0,
            maglubiyet: 0, atilanGol: 0, yenilenGol: 0
        });

        showToast(`"${name}" turnuvası oluşturuldu! 🏆`);
        document.getElementById('createTournamentModal').style.display = 'none';
        document.getElementById('tournamentName').value = '';
        loadTournaments();
    } catch (e) { showToast("Hata oluştu!", "error"); }
};

async function loadTournaments() {
    const list = document.getElementById('tournamentList');
    if (!list) return;
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">⏳</div><p>Yükleniyor...</p></div>`;

    try {
        const q = query(collection(db, "turnuvalar"), orderBy("createdAt", "desc"), limit(20));
        const snap = await getDocs(q);
        list.innerHTML = "";

        if (snap.empty) {
            list.innerHTML = `<div class="empty-state"><div class="empty-icon">🏟️</div><p>Henüz turnuva yok. İlkini sen oluştur!</p></div>`;
            return;
        }

        snap.forEach(d => {
            const t = d.data();
            const statusMap = { pending: { txt: 'Başlamadı', cls: 't-status-pending' }, active: { txt: 'Devam Ediyor', cls: 't-status-active' }, finished: { txt: 'Bitti', cls: 't-status-finished' } };
            const s = statusMap[t.status] || statusMap.pending;
            const isCreator = t.creatorUid === currentUser.uid;
            const typeIcon = t.type === 'lig' ? '🏅 Lig' : '⚔️ Kupa';

            list.innerHTML += `
                <div class="tournament-card">
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;">
                        <div class="tournament-title">${escapeHTML(t.name)}</div>
                        <span class="tournament-status ${s.cls}">${s.txt}</span>
                    </div>
                    <div class="tournament-meta">${typeIcon} · ${t.participantCount || 0}/${t.maxParticipants} katılımcı · ${escapeHTML(t.city || '')} · Kuran: ${escapeHTML(t.creatorName)}</div>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        <button onclick="viewTournamentDetail('${d.id}')" class="btn-blue btn-sm">📊 Puan Tablosu</button>
                        ${t.status === 'pending' ? `<button onclick="joinTournament('${d.id}')" class="btn-success btn-sm">+ Katıl</button>` : ''}
                        ${isCreator && t.status === 'pending' ? `<button onclick="startTournament('${d.id}')" class="btn-sm" style="background:var(--gold);color:#000;">▶ Başlat</button>` : ''}
                        ${isCreator ? `<button onclick="shareTournamentLink('${d.id}','${escapeHTML(t.name)}')" class="whatsapp-btn btn-sm">📲 Paylaş</button>` : ''}
                    </div>
                </div>`;
        });
    } catch (e) {
        list.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Turnuvalar yüklenemedi. Firebase index gerekebilir.</p></div>`;
    }
}

window.joinTournament = async (tid) => {
    try {
        const tSnap = await getDoc(doc(db, "turnuvalar", tid));
        if (!tSnap.exists()) return showToast("Turnuva bulunamadı!", "error");
        const t = tSnap.data();
        if ((t.participantCount || 0) >= t.maxParticipants) return showToast("Turnuva dolu!", "error");

        // Check if already joined
        const existing = await getDoc(doc(db, "turnuvalar", tid, "katilimcilar", currentUser.uid));
        if (existing.exists()) return showToast("Zaten katıldın!", "info");

        await runTransaction(db, async (tx) => {
            tx.set(doc(db, "turnuvalar", tid, "katilimcilar", currentUser.uid), {
                uid: currentUser.uid, name: currentUser.name,
                power: currentUser.power, status: "approved", joinedAt: serverTimestamp()
            });
            tx.set(doc(db, "turnuvalar", tid, "puanTablosu", currentUser.uid), {
                name: currentUser.name, puan: 0, galibiyet: 0, beraberlik: 0,
                maglubiyet: 0, atilanGol: 0, yenilenGol: 0
            });
            tx.update(doc(db, "turnuvalar", tid), { participantCount: increment(1) });
        });
        showToast("Turnuvaya katıldın! 🏆");
        loadTournaments();
    } catch (e) { showToast("Hata!", "error"); }
};

window.startTournament = async (tid) => {
    if (!confirm("Turnuvayı başlatmak istediğine emin misin? Başladıktan sonra katılımcı değişmez.")) return;
    await updateDoc(doc(db, "turnuvalar", tid), { status: "active" });
    showToast("Turnuva başladı! ⚡");
    loadTournaments();
};

window.viewTournamentDetail = async (tid) => {
    try {
        const snap = await getDocs(collection(db, "turnuvalar", tid, "puanTablosu"));
        const rows = [];
        snap.forEach(d => rows.push({ id: d.id, ...d.data() }));
        rows.sort((a, b) => (b.puan - a.puan) || (b.atilanGol - b.yenilenGol) - (a.atilanGol - a.yenilenGol));

        if (rows.length === 0) { showToast("Henüz puan tablosu yok.", "info"); return; }

        const tSnap = await getDoc(doc(db, "turnuvalar", tid));
        const tName = tSnap.data()?.name || 'Turnuva';

        // Build standings in tournament tab
        const list = document.getElementById('tournamentList');
        list.innerHTML = `
            <button onclick="loadTournaments()" class="btn-ghost btn-sm" style="margin-bottom:12px;">← Geri</button>
            <div class="tournament-title" style="margin-bottom:12px;">${escapeHTML(tName)} — Puan Tablosu</div>
            <table class="standings-table">
                <thead><tr>
                    <th class="rank-col">#</th><th>Oyuncu</th><th>O</th><th>G</th><th>B</th><th>M</th><th>Puan</th>
                </tr></thead>
                <tbody>
                ${rows.map((r, i) => `
                    <tr class="${r.id === currentUser.uid ? 'my-row' : ''}">
                        <td class="rank-col">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
                        <td>${escapeHTML(r.name)} ${r.id === currentUser.uid ? '<span style="color:var(--gold);font-size:10px;">(Sen)</span>' : ''}</td>
                        <td>${(r.galibiyet || 0) + (r.beraberlik || 0) + (r.maglubiyet || 0)}</td>
                        <td style="color:var(--green);">${r.galibiyet || 0}</td>
                        <td style="color:var(--gold);">${r.beraberlik || 0}</td>
                        <td style="color:var(--red);">${r.maglubiyet || 0}</td>
                        <td style="font-weight:800;color:var(--gold);">${r.puan || 0}</td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
    } catch (e) { showToast("Puan tablosu yüklenemedi!", "error"); }
};

window.shareTournamentLink = (tid, name) => {
    const link = `${window.location.origin}/katil.html?tournament=${tid}`;
    if (navigator.share) { navigator.share({ title: name, text: `${name} turnuvasına katıl!`, url: link }); }
    else { navigator.clipboard.writeText(link); showToast("Turnuva linki kopyalandı!"); }
};
// ══════════════════════════════════════════════════════
// ── 🎙️ CANLI MAÇ SPİKERİ (PLAY-BY-PLAY) ──
// ══════════════════════════════════════════════════════

const spikerReplikleri = {
    goals: [
        "⚽ GOL! {isim} kaleciyi avlıyor! İnanılmaz bir vuruş!",
        "⚽ FİLELER HAVALANDI! {isim} affetmiyor, klas bir gol!",
        "⚽ GOL GOL GOL! {isim} takımını sırtlıyor!",
        "⚽ Harika bitiriş! {isim} topu ağlarla buluşturdu."
    ],
    assists: [
        "🎯 Harika vizyon! {isim} adeta 'al da at' dedi.",
        "🎯 Asist {isim}'den geliyor! Rakip savunmanın kilidini açtı.",
        "🎯 {isim} araya harika bir top bıraktı, muazzam asist!"
    ],
    saves: [
        "🧤 İNANILMAZ KURTARIŞ! {isim} kalesinde devleşiyor!",
        "🧤 {isim} gole izin vermiyor! Panter gibi uzandı.",
        "🧤 Mutlak golü önledi! {isim} takımını ayakta tutuyor."
    ],
    tackles: [
        "🛡️ Müthiş müdahale! {isim} topu çaldı!",
        "🛡️ {isim} rakibi durduruyor, sahayı kontrol ediyor.",
        "🛡️ Harika savunma! {isim} tehlikeyi önledi."
    ],
    keyPasses: [
        "🪄 Efsane pas! {isim} adeta rakip savunmayı ikiye böldü!",
        "🪄 {isim}'den kilit pas! Net pozisyon yarattı.",
        "🪄 Sihirli dokunuş! {isim}'in pasını izleyin."
    ],
    yellowCards: [
        "🟨 Hakemin eli cebine gitti. {isim} sarı kart görüyor.",
        "🟨 Sert müdahale! {isim} sarı kartla cezalandırıldı.",
        "🟨 Tansiyon yükseldi, {isim} sarı kart aldı."
    ]
};

function getSpikerCumlesi(action, isim) {
    const replikler = spikerReplikleri[action];
    if (!replikler) return `⚡ ${escapeHTML(isim)} sahnede!`;
    return replikler[Math.floor(Math.random() * replikler.length)].replace('{isim}', escapeHTML(isim));
}

// ══════════════════════════════════════════════════════
// ── 📺 GELİŞMİŞ OBSERVER PANELI ──
// ══════════════════════════════════════════════════════

let observerMatchId = null;
let unsubObserver = null;
let observerPlayerStats = {};
let obsMatchTimer = null;
let obsElapsed = 0;
let obsTimerRunning = false;

// Canlı reyting algoritması (SofaScore mantığı)
function calculateLiveRating(p) {
    let r = 6.0;
    r += (p.goals || 0) * 1.2;
    r += (p.assists || 0) * 0.8;
    r += (p.shotsOn || 0) * 0.2;
    r += (p.dribbles || 0) * 0.15;
    r += (p.keyPasses || 0) * 0.35;
    r += (p.tackles || 0) * 0.25;
    r += (p.interceptions || 0) * 0.2;
    r += (p.saves || 0) * 0.45;
    r += (p.foulsWon || 0) * 0.1;
    r -= (p.shotsOff || 0) * 0.1;
    r -= (p.turnovers || 0) * 0.25;
    r -= (p.dribbledPast || 0) * 0.15;
    r -= (p.foulsCommitted || 0) * 0.15;
    r -= (p.yellowCards || 0) * 1.2;
    return Math.max(3.0, Math.min(10.0, r)).toFixed(1);
}

function ratingColor(r) {
    const v = parseFloat(r);
    return v >= 8.0 ? '#2ecc71' : v >= 6.5 ? '#f1c40f' : '#e74c3c';
}

window.openObserverPanel = function() {
    const p = document.getElementById('observerPanel');
    if (p) p.style.display = 'flex';
};

// Açık maç varsa direkt yükle
window.openObserverWithCurrentMatch = function() {
    const p = document.getElementById('observerPanel');
    if (p) p.style.display = 'flex';
    if (globalMatchId) {
        const inp = document.getElementById('observerMatchInput');
        if (inp) { inp.value = globalMatchId; }
        window.loadObserverMatch();
    }
};

window.copyMatchId = function() {
    if (!globalMatchId) return showToast("Aktif maç yok!", "error");
    navigator.clipboard.writeText(globalMatchId).then(() => showToast(`Maç ID kopyalandı: ${globalMatchId}`));
};
window.closeObserverPanel = function() {
    const p = document.getElementById('observerPanel');
    if (p) p.style.display = 'none';
    if (unsubObserver) { unsubObserver(); unsubObserver = null; }
    if (obsMatchTimer) { clearInterval(obsMatchTimer); obsMatchTimer = null; }
};

window.loadObserverMatch = async function() {
    const mid = document.getElementById('observerMatchInput')?.value?.trim();
    if (!mid) return showToast("Maç ID girin!", "error");
    const matchSnap = await getDoc(doc(db, "matches", mid));
    if (!matchSnap.exists()) return showToast("Maç bulunamadı!", "error");
    observerMatchId = mid;
    observerPlayerStats = {};
    obsElapsed = 0;

    const playersSnap = await getDocs(collection(db, "matches", mid, "players"));
    playersSnap.forEach(d => {
        const p = d.data();
        observerPlayerStats[d.id] = {
            uid: d.id, name: p.name, position: p.position,
            goals: 0, assists: 0,
            // Hücum
            shotsOn: 0, shotsOff: 0, dribbles: 0,
            // Oyun kurma
            keyPasses: 0, crosses: 0, turnovers: 0,
            // Savunma
            tackles: 0, interceptions: 0, blocks: 0, dribbledPast: 0,
            // Disiplin & kaleci
            foulsWon: 0, foulsCommitted: 0, yellowCards: 0, redCards: 0, saves: 0
        };
    });

    renderObserverMainBoard(matchSnap.data());

    if (unsubObserver) unsubObserver();
    unsubObserver = onSnapshot(doc(db, "matches", mid), (snap) => {
        if (snap.exists()) {
            const data = snap.data();
            const board = document.getElementById('obsScoreA');
            if (board) board.innerText = data.scoreA || 0;
            const boardB = document.getElementById('obsScoreB');
            if (boardB) boardB.innerText = data.scoreB || 0;
            // Takım UID listelerini bellekte tut (gol senkronizasyonu)
            window.obsTeamA = data.teamA_uids || [];
            window.obsTeamB = data.teamB_uids || [];
        }
    });

    showToast("Maç yüklendi! ✅");
};

function renderObserverMainBoard(matchData) {
    const board = document.getElementById('observerBoard');
    if (!board) return;

    const playerRows = Object.values(observerPlayerStats).map(p => {
        const r = calculateLiveRating(p);
        const rc = ratingColor(r);
        const fireIcon = parseFloat(r) >= 8 ? '🔥' : parseFloat(r) <= 5 ? '❄️' : '';
        return `<tr onclick="openAdvancedPlayerStats('${p.uid}')" style="cursor:pointer;">
            <td style="padding:10px 6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:30px;height:30px;border-radius:50%;background:rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;">${(p.name||'?').charAt(0).toUpperCase()}</div>
                    <div>
                        <div style="font-size:13px;font-weight:600;">${escapeHTML(p.name)} ${fireIcon}</div>
                        <div style="font-size:10px;color:var(--text-dim);">${p.position}</div>
                    </div>
                </div>
            </td>
            <td style="text-align:center;font-size:13px;" id="obs_mini_goals_${p.uid}">${p.goals}</td>
            <td style="text-align:center;font-size:13px;" id="obs_mini_assists_${p.uid}">${p.assists}</td>
            <td style="text-align:center;font-size:13px;" id="obs_mini_saves_${p.uid}">${p.saves}</td>
            <td style="text-align:center;">
                <span style="font-size:14px;font-weight:800;color:${rc};" id="obs_mini_rating_${p.uid}">${r}</span>
            </td>
        </tr>`;
    }).join('');

    board.innerHTML = `
        <!-- SCOREBOARD -->
        <div style="text-align:center;padding:15px;background:rgba(0,0,0,0.2);border-radius:12px;margin-bottom:15px;position:relative;">
            <div style="font-size:11px;letter-spacing:2px;color:var(--text-dim);margin-bottom:8px;">${escapeHTML(matchData.pitch || '—')} · CANLI</div>
            <div style="display:flex;justify-content:center;align-items:center;gap:25px;">
                <div style="text-align:center;">
                    <div style="font-size:11px;color:var(--text-dim);">A TAKIMI</div>
                    <div style="font-size:56px;color:#e74c3c;font-family:'Bebas Neue',sans-serif;line-height:1;" id="obsScoreA">${matchData.scoreA || 0}</div>
                </div>
                <div>
                    <div style="font-size:20px;color:var(--text-dim);">—</div>
                    <div style="font-size:10px;color:var(--gold);margin-top:4px;" id="obsTimer">00:00</div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:11px;color:var(--text-dim);">B TAKIMI</div>
                    <div style="font-size:56px;color:#3498db;font-family:'Bebas Neue',sans-serif;line-height:1;" id="obsScoreB">${matchData.scoreB || 0}</div>
                </div>
            </div>
            <div style="display:flex;gap:8px;justify-content:center;margin-top:12px;">
                <button onclick="obsToggleTimer()" id="obsTimerBtn" style="background:rgba(46,204,113,0.15);border:1px solid rgba(46,204,113,0.4);color:#2ecc71;border-radius:8px;padding:6px 14px;font-size:12px;cursor:pointer;">▶ Başlat</button>
                <button onclick="obsAddGoal('A')" style="background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.4);color:#e74c3c;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;">+1 A</button>
                <button onclick="obsAddGoal('B')" style="background:rgba(52,152,219,0.15);border:1px solid rgba(52,152,219,0.4);color:#3498db;border-radius:8px;padding:6px 12px;font-size:12px;cursor:pointer;">+1 B</button>
            </div>
        </div>

        <!-- PLAYER TABLE -->
        <div style="font-size:11px;color:var(--gold);letter-spacing:1px;margin-bottom:8px;">OYUNCULAR — Tıkla ve istatistik gir</div>
        <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="font-size:10px;color:var(--text-dim);letter-spacing:1px;border-bottom:1px solid var(--border);">
                <th style="text-align:left;padding:6px 4px;">OYUNCU</th>
                <th style="text-align:center;">⚽</th><th style="text-align:center;">🎯</th><th style="text-align:center;">🧤</th><th style="text-align:center;">★</th>
            </tr></thead>
            <tbody id="obsPlayerRows">${playerRows}</tbody>
        </table>
        </div>

        <button onclick="saveObserverStats()" class="btn-success" style="margin-top:15px;width:100%;">💾 İstatistikleri Kaydet (Kaptana)</button>`;
}

function refreshObserverRow(uid) {
    const p = observerPlayerStats[uid];
    if (!p) return;
    const r = calculateLiveRating(p);
    const rc = ratingColor(r);
    const fireIcon = parseFloat(r) >= 8 ? '🔥' : parseFloat(r) <= 5 ? '❄️' : '';

    const gEl = document.getElementById(`obs_mini_goals_${uid}`);
    const aEl = document.getElementById(`obs_mini_assists_${uid}`);
    const sEl = document.getElementById(`obs_mini_saves_${uid}`);
    const rEl = document.getElementById(`obs_mini_rating_${uid}`);
    if (gEl) gEl.innerText = p.goals;
    if (aEl) aEl.innerText = p.assists;
    if (sEl) sEl.innerText = p.saves;
    if (rEl) { rEl.innerText = r; rEl.style.color = rc; }
}

window.obsToggleTimer = function() {
    const btn = document.getElementById('obsTimerBtn');
    const timerEl = document.getElementById('obsTimer');
    if (!btn) return;
    if (obsTimerRunning) {
        clearInterval(obsMatchTimer); obsMatchTimer = null; obsTimerRunning = false;
        btn.innerText = '▶ Devam';
    } else {
        obsTimerRunning = true;
        btn.innerText = '⏸ Durdur';
        obsMatchTimer = setInterval(() => {
            obsElapsed++;
            const m = String(Math.floor(obsElapsed / 60)).padStart(2, '0');
            const s = String(obsElapsed % 60).padStart(2, '0');
            if (timerEl) timerEl.innerText = `${m}:${s}`;
        }, 1000);
    }
};

window.obsAddGoal = async function(team) {
    if (!observerMatchId) return;
    const field = team === 'A' ? 'scoreA' : 'scoreB';
    await updateDoc(doc(db, "matches", observerMatchId), { [field]: increment(1) });
    showToast(`${team} Takımı GOL! ⚽`);
};

// ── GELİŞMİŞ OYUNCU İSTATİSTİK PANELİ (BOTTOM SHEET) ──
window.openAdvancedPlayerStats = function(uid) {
    const p = observerPlayerStats[uid];
    if (!p) return;

    const modal = document.getElementById('advancedStatsModal');
    const content = document.getElementById('advancedStatsContent');
    if (!modal || !content) return;

    const r = calculateLiveRating(p);
    const rc = ratingColor(r);
    const isGK = p.position === 'Kaleci';
    const isDEF = p.position === 'Defans';
    const isMID = p.position === 'Orta Saha';
    const isFWD = p.position === 'Forvet';

    const row = (label, field, icon) => `
        <div class="adv-row">
            <span>${icon} ${label}</span>
            <div class="adv-ctrl">
                <button onclick="updateAdvStat('${uid}','${field}',-1)">−</button>
                <span id="adv_${uid}_${field}">${p[field] || 0}</span>
                <button onclick="updateAdvStat('${uid}','${field}',1)">+</button>
            </div>
        </div>`;

    content.innerHTML = `
        <div class="adv-header">
            <div>
                <div style="font-size:24px;font-weight:800;color:#fff;">${escapeHTML(p.name)}</div>
                <div style="font-size:12px;color:var(--text-dim);">${p.position}</div>
            </div>
            <div class="live-rating-box" id="advRatingBox" style="border-color:${rc}55;background:${rc}15;">
                <div class="live-rating-val" id="advRatingVal" style="color:${rc};">${r}</div>
                <div class="live-rating-lbl">REYTİNG</div>
            </div>
        </div>

        <!-- TAB SWITCHER -->
        <div style="display:flex;gap:6px;margin-bottom:15px;flex-wrap:wrap;">
            <button onclick="showAdvTab('hucum')" id="advTab_hucum" class="adv-tab-btn active">⚔️ Hücum</button>
            <button onclick="showAdvTab('pas')" id="advTab_pas" class="adv-tab-btn">🧠 Pas</button>
            <button onclick="showAdvTab('savunma')" id="advTab_savunma" class="adv-tab-btn">🛡️ Savunma</button>
            <button onclick="showAdvTab('disiplin')" id="advTab_disiplin" class="adv-tab-btn">🚨 Disiplin</button>
        </div>

        <!-- HÜCUM -->
        <div id="advTabContent_hucum" class="adv-tab-content">
            <div class="adv-group" style="margin-bottom:10px;">
                ${row('Gol', 'goals', '⚽')}
                ${!isGK ? row('İsabetli Şut', 'shotsOn', '🎯') : ''}
                ${!isGK ? row('Karavana (dışarı)', 'shotsOff', '❌') : ''}
                ${(isFWD || isMID) ? row('Başarılı Çalım', 'dribbles', '🪄') : ''}
                ${isGK ? row('Kurtarış', 'saves', '🧤') : ''}
                ${isGK ? row('Hatalı Gol Yedi', 'goalsConceded', '😔') : ''}
            </div>
        </div>

        <!-- PAS & OYUN KURMA -->
        <div id="advTabContent_pas" class="adv-tab-content" style="display:none;">
            <div class="adv-group" style="margin-bottom:10px;">
                ${row('Asist', 'assists', '🎯')}
                ${row('Kilit Pas', 'keyPasses', '🔑')}
                ${(isMID || isFWD) ? row('İsabetli Orta', 'crosses', '📬') : ''}
                ${row('Top Kaybı', 'turnovers', '🗑️')}
            </div>
        </div>

        <!-- SAVUNMA -->
        <div id="advTabContent_savunma" class="adv-tab-content" style="display:none;">
            <div class="adv-group" style="margin-bottom:10px;">
                ${row('Top Çalma', 'tackles', '🛑')}
                ${row('Pas Kesme', 'interceptions', '✂️')}
                ${(isDEF || isGK) ? row('Şut Engelleme', 'blocks', '🧱') : ''}
                ${row('Çalım Yedi', 'dribbledPast', '😤')}
            </div>
        </div>

        <!-- DİSİPLİN -->
        <div id="advTabContent_disiplin" class="adv-tab-content" style="display:none;">
            <div class="adv-group" style="margin-bottom:10px;">
                ${row('Faul Aldı', 'foulsWon', '🤕')}
                ${row('Faul Yaptı', 'foulsCommitted', '🪓')}
                ${row('Sarı Kart', 'yellowCards', '🟨')}
                ${row('Kırmızı Kart', 'redCards', '🟥')}
            </div>
        </div>

        <button onclick="updateAdvStat('${uid}','goals',1)" class="quick-goal-btn">⚽ HIZLI GOL EKLE</button>
        <button onclick="document.getElementById('advancedStatsModal').style.display='none'" class="btn-ghost" style="margin-top:10px;width:100%;">✖ Kapat</button>`;

    modal.style.display = 'flex';
};

window.showAdvTab = function(tab) {
    ['hucum','pas','savunma','disiplin'].forEach(t => {
        const c = document.getElementById(`advTabContent_${t}`);
        const b = document.getElementById(`advTab_${t}`);
        if (c) c.style.display = t === tab ? 'block' : 'none';
        if (b) b.classList.toggle('active', t === tab);
    });
};

window.updateAdvStat = async function(uid, field, delta) {
    const p = observerPlayerStats[uid];
    if (!p) return;

    // Sıfır altına inmeyi engelle
    const oldVal = p[field] || 0;
    const newVal = Math.max(0, oldVal + delta);
    if (oldVal === newVal) return;
    p[field] = newVal;

    // 1. Ekran animasyonu
    const el = document.getElementById(`adv_${uid}_${field}`);
    if (el) {
        el.innerText = p[field];
        el.style.transform = 'scale(1.4)';
        el.style.color = delta > 0 ? '#2ecc71' : '#e74c3c';
        setTimeout(() => { el.style.transform = 'scale(1)'; el.style.color = 'var(--gold)'; }, 200);
    }

    // 2. GOL → ANA SKORBORD OTOMATİK SENKRON
    if (field === 'goals' && observerMatchId) {
        const qBtn = document.querySelector('.quick-goal-btn');
        if (qBtn) qBtn.innerText = `⚽ HIZLI GOL EKLE (${p.goals})`;

        const tA = window.obsTeamA || (typeof currentTeamA !== 'undefined' ? currentTeamA.map(x => x.uid) : []);
        const tB = window.obsTeamB || (typeof currentTeamB !== 'undefined' ? currentTeamB.map(x => x.uid) : []);
        let team = tA.includes(uid) ? 'A' : tB.includes(uid) ? 'B' : null;

        if (team) {
            const scoreField = team === 'A' ? 'scoreA' : 'scoreB';
            await updateDoc(doc(db, "matches", observerMatchId), { [scoreField]: increment(delta > 0 ? 1 : -1) });
            showToast(delta > 0 ? `⚽ ${team} Takımına Gol!` : `🔄 ${team} Golü Geri Alındı`, delta > 0 ? "success" : "info");
        } else {
            if (delta > 0) showToast("⚠️ Takım tespiti yapılamadı, üstten manuel +1 ekle.", "info");
        }
    }

    // 3. Canlı Reyting
    const newR = calculateLiveRating(p);
    const rc = ratingColor(newR);
    const rEl = document.getElementById('advRatingVal');
    const rBox = document.getElementById('advRatingBox');
    if (rEl) { rEl.innerText = newR; rEl.style.color = rc; }
    if (rBox) { rBox.style.borderColor = rc + '55'; rBox.style.background = rc + '15'; }

    refreshObserverRow(uid);
    if (navigator.vibrate) navigator.vibrate(delta > 0 ? 60 : 20);

    // 4. Spiker
    const spikerFields = { goals: 'goals', assists: 'assists', saves: 'saves', tackles: 'tackles', keyPasses: 'keyPasses', yellowCards: 'yellowCards' };
    if (delta > 0 && spikerFields[field] && observerMatchId) {
        const firstName = p.name.split(' ')[0];
        const msg = getSpikerCumlesi(spikerFields[field], firstName);
        const minute = Math.floor(obsElapsed / 60);
        const timeStr = minute > 0 ? `⏱️ ${minute}' ` : '';
        await addDoc(collection(db, "matches", observerMatchId, "messages"), {
            name: "🎙️ SPİKER", text: timeStr + msg,
            type: "event", actionType: field, createdAt: serverTimestamp()
        });
    }
};

window.saveObserverStats = async function() {
    if (!observerMatchId) return;
    try {
        const statsObj = {};
        Object.values(observerPlayerStats).forEach(p => { statsObj[p.uid] = { ...p }; });
        await updateDoc(doc(db, "matches", observerMatchId), { observerStats: statsObj, hasObserverStats: true });
        showToast("İstatistikler Kaptana İletildi! ✅");
    } catch(e) { showToast("Kaydetme hatası!", "error"); }
};

// ── FİFA TARZI OYUNCU KARTI ──
window.showPlayerCard = function() {
    if (!currentUser) return;
    const modal = document.getElementById('playerCardModal');
    if (!modal) return;

    const elo = currentUser.power || 1500;
    const tier = getTier(elo);
    const level = currentUser.level || 1;
    const xp = currentUser.xp || 0;
    const pos = currentUser.position;

    function eloToStat(base, elo) { return Math.min(99, Math.max(40, Math.round(base + (elo - 1500) / 50))); }
    const pace     = eloToStat(70, elo);
    const shooting = pos === 'Forvet' ? eloToStat(78, elo) : pos === 'Orta Saha' ? eloToStat(68, elo) : eloToStat(55, elo);
    const passing  = pos === 'Orta Saha' ? eloToStat(80, elo) : eloToStat(65, elo);
    const defending= pos === 'Defans' ? eloToStat(78, elo) : pos === 'Kaleci' ? eloToStat(70, elo) : eloToStat(55, elo);
    const gkSkill  = pos === 'Kaleci' ? eloToStat(82, elo) : eloToStat(40, elo);
    const physical = eloToStat(72, elo);
    const overall  = Math.round((pace + shooting + passing + defending + physical) / 5);

    const tierColors = { 'tier-bronz': '#CD7F32', 'tier-gumus': '#C0C0C0', 'tier-altin': '#D4AF37', 'tier-efsane': '#9B59B6' };
    const cardColor = tierColors[tier.c] || '#D4AF37';

    modal.style.display = 'flex';
    document.getElementById('playerCardContent').innerHTML = `
        <div style="width:280px;height:420px;margin:0 auto;background:linear-gradient(160deg,#0a0f1e 0%,#111827 100%);border:2px solid ${cardColor};border-radius:16px;padding:24px 20px;position:relative;overflow:hidden;font-family:'Bebas Neue',sans-serif;box-shadow:0 0 40px ${cardColor}40;" id="playerCardEl">
            <div style="position:absolute;top:-60px;right:-60px;width:180px;height:180px;background:radial-gradient(circle,${cardColor}25,transparent 70%);"></div>
            <div style="text-align:center;margin-bottom:16px;">
                <div style="font-size:11px;letter-spacing:3px;color:${cardColor};margin-bottom:4px;">HALİ SAHA PRO</div>
                <div style="width:70px;height:70px;border-radius:50%;background:linear-gradient(135deg,${cardColor},${cardColor}88);display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:32px;color:#000;font-weight:900;border:2px solid ${cardColor};">${(currentUser.name||'?').charAt(0).toUpperCase()}</div>
                <div style="font-size:26px;color:#fff;">${escapeHTML(currentUser.name)}</div>
                <div style="font-size:12px;color:${cardColor};margin-top:2px;">${currentUser.position} · ${currentUser.city || ''}</div>
            </div>
            <div style="display:flex;justify-content:center;gap:20px;margin-bottom:16px;">
                <div style="text-align:center;"><div style="font-size:42px;color:${cardColor};line-height:1;">${overall}</div><div style="font-size:10px;color:var(--text-dim);">OVERALL</div></div>
                <div style="text-align:center;"><div style="font-size:26px;color:#fff;">${Math.round(elo)}</div><div style="font-size:10px;color:var(--text-dim);">ELO</div></div>
                <div style="text-align:center;"><div style="font-size:26px;color:#fff;">Lv.${level}</div><div style="font-size:10px;color:var(--text-dim);">SEVİYE</div></div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px;">
                ${[['HIZ',pace],['ŞUT',shooting],['PAS',passing],['DEF',defending],[pos==='Kaleci'?'KALECİ':'FİZİK',pos==='Kaleci'?gkSkill:physical],['MAÇ',currentUser.matchesPlayed||0]].map(([lbl,val])=>`<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:6px 10px;display:flex;justify-content:space-between;align-items:center;"><span style="font-size:10px;color:var(--text-dim);letter-spacing:1px;">${lbl}</span><span style="font-size:16px;color:${val >= 75 ? '#2ecc71' : val >= 60 ? cardColor : '#e74c3c'};">${val}</span></div>`).join('')}
            </div>
            <div style="font-size:10px;color:${cardColor};letter-spacing:3px;text-align:center;">${tier.n.toUpperCase()}</div>
        </div>
        <div style="display:flex;gap:10px;margin-top:15px;justify-content:center;">
            <button onclick="sharePlayerCard()" class="whatsapp-btn">📲 Paylaş</button>
            <button onclick="document.getElementById('playerCardModal').style.display='none'" class="btn-ghost">Kapat</button>
        </div>`;
};

window.sharePlayerCard = async function() {
    const cardEl = document.getElementById('playerCardEl');
    if (!cardEl) return;
    if (!window.html2canvas) {
        await new Promise((res,rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
        });
    }
    try {
        const canvas = await window.html2canvas(cardEl, { scale: 2, backgroundColor: '#060912' });
        canvas.toBlob(async (blob) => {
            const file = new File([blob], 'kart.png', { type: 'image/png' });
            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], text: `${currentUser.name} · ${Math.round(currentUser.power)} ELO #HaliSahaPRO` });
            } else {
                const a = document.createElement('a'); a.href = canvas.toDataURL(); a.download = 'oyuncu_karti.png'; a.click();
                showToast("Kart indirildi! 📥");
            }
        });
    } catch(e) { showToast("Kart oluşturulamadı", "error"); }
};

// ── XP HESAPLAMA ──
window.updateProfileUI_XP = function() {
    const level = currentUser.level || 1;
    const xp = currentUser.xp || 0;
    const xpToNext = Math.pow(level, 2) * 200;
    const xpPct = Math.min(100, Math.round((xp % xpToNext) / xpToNext * 100)) || 0;
    const xpEl = document.getElementById('profileXP');
    if (xpEl) xpEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:4px;">
            <span style="color:var(--gold);">⬆️ Level ${level}</span>
            <span style="color:var(--text-dim);">${xp} XP · %${xpPct} → Lv.${level+1}</span>
        </div>
        <div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;">
            <div style="width:${xpPct}%;height:100%;background:linear-gradient(90deg,#D4AF37,#f0d060);border-radius:3px;transition:width 0.5s;"></div>
        </div>`;
};

// ── GUEST PLAYER ──
window.addGuestPlayer = async function() {
    const name = document.getElementById('guestPlayerName')?.value?.trim();
    const pos = document.getElementById('guestPlayerPos')?.value || 'Orta Saha';
    if (!name) return showToast("Misafir oyuncu adı girin!", "error");
    if (!globalMatchId) return;
    if (players.length >= 14) return showToast("Kadro dolu! (14/14)", "error");
    const guestId = 'guest_' + Date.now();
    await runTransaction(db, async (tx) => {
        tx.set(doc(db, "matches", globalMatchId, "players", guestId), {
            uid: guestId, name: name + ' (Misafir)', position: pos,
            power: 1500, hasPaid: false, isGuest: true
        });
        tx.update(doc(db, "matches", globalMatchId), { playerCount: increment(1) });
    });
    if (document.getElementById('guestPlayerName')) document.getElementById('guestPlayerName').value = '';
    showToast(`${name} misafir olarak eklendi! 👤`);
};

// ── ÖDEME TAKİBİ ──
window.togglePayment = async function(uid, docId) {
    const playerRef = doc(db, "matches", globalMatchId, "players", docId);
    const snap = await getDoc(playerRef);
    if (!snap.exists()) return;
    const current = snap.data().hasPaid || false;
    await updateDoc(playerRef, { hasPaid: !current });
    showToast(current ? "Ödeme geri alındı" : "Ödeme onaylandı ✅", current ? "info" : "success");
};

// ══════════════════════════════════════════════════════
// ── 🕸️ FIFA RADAR GRAFİĞİ ──
// ══════════════════════════════════════════════════════
let profileRadar = null;

function renderProfileRadar(user) {
    const ctx = document.getElementById('profileRadarChart');
    if (!ctx) return;
    if (profileRadar) { profileRadar.destroy(); profileRadar = null; }

    const elo = user.power || 1500;
    const pos = user.position || 'Orta Saha';
    const mp = user.matchesPlayed || 1;
    const goals = user.goals || 0;
    const assists = user.assists || 0;
    const saves = user.saves || 0;

    function calcStat(base) { return Math.min(99, Math.max(40, Math.round(base + (elo - 1500) / 45))); }

    let labels, data;
    if (pos === 'Kaleci') {
        labels = ['REFLEKS', 'TUTUŞ', 'PAS', 'POZİSYON', 'HIZ', 'LİDERLİK'];
        const base = calcStat(72);
        const svRatio = Math.min(30, (saves / mp) * 10);
        data = [base + svRatio, base + svRatio - 3, calcStat(60), base + svRatio + 2, calcStat(65), calcStat(68)];
    } else if (pos === 'Defans') {
        labels = ['SAVUNMA', 'FİZİK', 'PAS', 'HIZ', 'MÜDAHALE', 'TOP ÇALMA'];
        data = [calcStat(80), calcStat(75), calcStat(65), calcStat(68), calcStat(78), calcStat(76)];
    } else if (pos === 'Orta Saha') {
        const aRatio = Math.min(25, (assists / mp) * 10);
        labels = ['PAS', 'VİZYON', 'FİZİK', 'HIZ', 'ŞUT', 'SAVUNMA'];
        data = [calcStat(78) + aRatio, calcStat(76) + aRatio, calcStat(72), calcStat(70), calcStat(68), calcStat(62)];
    } else {
        const gRatio = Math.min(25, (goals / mp) * 10);
        labels = ['ŞUT', 'BİTİRİCİLİK', 'HIZ', 'DRİBLİNG', 'PAS', 'POZİSYON'];
        data = [calcStat(78) + gRatio, calcStat(80) + gRatio, calcStat(75), calcStat(72), calcStat(60), calcStat(74) + gRatio];
    }

    // Cap all at 99
    const cappedData = data.map(v => Math.min(99, Math.max(40, Math.round(v))));

    profileRadar = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: labels,
            datasets: [{
                data: cappedData,
                backgroundColor: 'rgba(212,175,55,0.25)',
                borderColor: '#D4AF37',
                pointBackgroundColor: '#fff',
                pointBorderColor: '#D4AF37',
                pointRadius: 3,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 30, max: 100,
                    angleLines: { color: 'rgba(255,255,255,0.08)' },
                    grid: { color: 'rgba(255,255,255,0.08)' },
                    pointLabels: { color: '#D4AF37', font: { size: 10, weight: '700' } },
                    ticks: { display: false }
                }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// ══════════════════════════════════════════════════════
// ── 📰 AI MAÇ SONU GAZETESİ ──
// ══════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════
// ── 📰 AI MAÇ SONU GAZETESİ ──
// ══════════════════════════════════════════════════════════════════════
async function _postMatchReport(sA, sB, mvpName, badges, players) {
    if (!globalMatchId) return;
    const winner = sA > sB ? 'A' : sB > sA ? 'B' : null;
    const diff = Math.abs(sA - sB);
    const tanımlar = diff === 0 ? ['Gerilimli','Çekişmeli','Sıkışık'] : diff === 1 ? ['Nefes kesen','Heyecanlı','Dramatik'] : diff <= 3 ? ['Eğlenceli','Üstün oyunlu','Kontrollü'] : ['Ezici','Muhteşem','Tek yönlü'];
    const tanım = tanımlar[Math.floor(Math.random()*3)];
    let ozet = winner ? `${tanım} bir maçın ardından ${winner} Takımı sahadan ${sA}-${sB} galip ayrıldı!` : `Kıran kırana geçen maç ${sA}-${sB}'lik beraberlikle tamamlandı!`;
    if (mvpName) ozet += ` Gecenin kahramanı tartışmasız ${mvpName} oldu! 🏆`;
    const bLines = [];
    if (badges.duvar) bLines.push(`🧱 ${badges.duvar} duvar gibi oynadı`);
    if (badges.sniper) bLines.push(`🎯 ${badges.sniper} isabetli şutlarıyla öne çıktı`);
    if (badges.kasap) bLines.push(`🪓 ${badges.kasap} kart cezasından kaçamadı`);
    if (badges.gizliKahraman) bLines.push(`🦸 ${badges.gizliKahraman} gecenin gizli kahramanıydı`);
    if (bLines.length) ozet += ' ' + bLines.join(', ') + '.';
    await addDoc(collection(db, "matches", globalMatchId, "messages"), {
        name: "📰 GAZETECİ", text: ozet, type: "event", actionType: "report", createdAt: serverTimestamp()
    });
}

// ══════════════════════════════════════════════════════════════════════
// ── 🔥 WIN STREAK & GÜVENİLİRLİK ──
// ══════════════════════════════════════════════════════════════════════
async function _getWinStreak(uid) {
    try {
        const q = query(collection(db, "users", uid, "history"), orderBy("timestamp","desc"), limit(10));
        const snap = await getDocs(q);
        let streak = 0;
        for (const d of snap.docs) { if (d.data().result === 'Galibiyet') streak++; else break; }
        return streak;
    } catch(e) { return 0; }
}

async function _updateWinStreakAfterMatch(uid, sA, sB) {
    try {
        const myTeam = currentTeamA.find(p => p.uid === uid) ? 'A' : 'B';
        const winnerSide = sA > sB ? 'A' : sB > sA ? 'B' : null;
        const won = winnerSide === myTeam;
        const uRef = doc(db, "users", uid);
        const uSnap = await getDoc(uRef);
        if (!uSnap.exists()) return;
        const curStreak = (uSnap.data().winStreak || 0);
        const newStreak = won ? curStreak + 1 : 0;
        await updateDoc(uRef, { winStreak: newStreak });
        if (newStreak === 3) setTimeout(() => showToast(`🔥 3 Maçlık Galibiyet Serisi! Formdasın!`, "success"), 1500);
        else if (newStreak === 5) setTimeout(() => showToast(`🔥🔥 5 Maçlık İnanılmaz Seri!`, "success"), 1500);
    } catch(e) { console.warn("Streak update:", e); }
}

function _getReliabilityBadge(score) {
    if (score === undefined || score === null) return '';
    if (score >= 90) return `<span style="color:#2ecc71;font-size:10px;font-weight:600;">✅ %${score}</span>`;
    if (score >= 70) return `<span style="color:#f1c40f;font-size:10px;font-weight:600;">⚠️ %${score}</span>`;
    return `<span style="color:#e74c3c;font-size:10px;font-weight:600;">🚩 %${score}</span>`;
}

function _timeAgo(date) {
    if (!date) return '';
    const diff = Math.floor((Date.now() - (date instanceof Date ? date : new Date(date)).getTime()) / 1000);
    if (diff < 60) return 'az önce';
    if (diff < 3600) return `${Math.floor(diff/60)}dk önce`;
    if (diff < 86400) return `${Math.floor(diff/3600)}sa önce`;
    return `${Math.floor(diff/86400)}g önce`;
}

// ══════════════════════════════════════════════════════════════════════
// ── 📰 SOSYAL FEED (TAM VERSİYON) ──
// ══════════════════════════════════════════════════════════════════════
let feedLastDoc = null;
let feedLoading = false;
let unsubFeedLive = null;

window.loadFeed = async function(loadMore = false) {
    const list = document.getElementById('feedList');
    if (!list) return;
    if (!loadMore) {
        feedLastDoc = null;
        list.innerHTML = `<div style="text-align:center;padding:30px;"><div style="font-size:32px;margin-bottom:10px;">⏳</div><p style="color:var(--text-dim);font-size:13px;">Feed yükleniyor...</p></div>`;
    }
    if (feedLoading) return;
    feedLoading = true;

    // Update compose avatar
    const av = document.getElementById('feedAvatarCompose');
    if (av && currentUser) av.innerText = (currentUser.name||'?').charAt(0).toUpperCase();

    try {
        let q;
        if (feedLastDoc) {
            q = query(collection(db, "feed"), orderBy("createdAt","desc"), limit(12), startAfter(feedLastDoc));
        } else {
            q = query(collection(db, "feed"), orderBy("createdAt","desc"), limit(12));
        }

        const snap = await getDocs(q);

        if (!loadMore) {
            list.innerHTML = "";
            // Live listener for new posts
            if (unsubFeedLive) { unsubFeedLive(); unsubFeedLive = null; }
            unsubFeedLive = onSnapshot(
                query(collection(db, "feed"), orderBy("createdAt","desc"), limit(1)),
                (s) => {
                    s.docChanges().forEach(ch => {
                        if (ch.type === 'added') {
                            const d = ch.doc.data();
                            if (d.authorUid !== currentUser.uid) {
                                showToast(`📰 ${d.authorName} yeni bir şey paylaştı!`, "info");
                            }
                        }
                    });
                }
            );
        }

        if (snap.empty && !loadMore) {
            list.innerHTML = `<div style="text-align:center;padding:40px 20px;">
                <div style="font-size:48px;margin-bottom:12px;">🌱</div>
                <div style="font-size:16px;font-weight:700;color:#fff;margin-bottom:6px;">Feed Boş</div>
                <div style="font-size:13px;color:var(--text-dim);">Maç oyna veya yukarıdan bir şeyler paylaş!</div>
            </div>`;
            document.getElementById('feedLoadMore').style.display = 'none';
            feedLoading = false;
            return;
        }

        snap.forEach(d => {
            feedLastDoc = d;
            const p = d.data();
            const t = getTier(p.authorPower || 1500);
            const timeStr = _timeAgo(p.createdAt?.toDate?.() || new Date());
            const isMe = p.authorUid === currentUser.uid;
            const likes = p.likes || 0;
            const hasLiked = (p.likedBy || []).includes(currentUser.uid);
            const streak = p.authorStreak || 0;

            let contentHtml = '';
            if (p.text) {
                contentHtml += `<div style="font-size:14px;color:var(--text);line-height:1.6;margin-bottom:12px;word-break:break-word;">${escapeHTML(p.text)}</div>`;
            }
            if (p.type === 'match_result') {
                const winner = p.scoreA > p.scoreB ? 'A' : p.scoreB > p.scoreA ? 'B' : null;
                contentHtml += `<div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px 16px;margin-bottom:10px;">
                    <div style="font-size:10px;letter-spacing:2px;color:var(--text-dim);text-align:center;margin-bottom:8px;">⚽ MAÇ SONUCU · ${escapeHTML(p.pitch||'')}</div>
                    <div style="display:flex;justify-content:center;align-items:center;gap:20px;">
                        <div style="text-align:center;"><div style="font-size:10px;color:var(--text-dim);">A TAKIMI</div><div style="font-size:42px;font-weight:900;color:${winner==='A'?'#2ecc71':'#e74c3c'};font-family:'Bebas Neue',sans-serif;line-height:1;">${p.scoreA||0}</div></div>
                        <div style="font-size:18px;color:var(--text-dim);">—</div>
                        <div style="text-align:center;"><div style="font-size:10px;color:var(--text-dim);">B TAKIMI</div><div style="font-size:42px;font-weight:900;color:${winner==='B'?'#2ecc71':'#3498db'};font-family:'Bebas Neue',sans-serif;line-height:1;">${p.scoreB||0}</div></div>
                    </div>
                    ${p.mvp ? `<div style="text-align:center;font-size:11px;color:var(--gold);margin-top:8px;">🏆 MVP: ${escapeHTML(p.mvp)}</div>` : ''}
                </div>`;
            }
            if (p.type === 'card') {
                contentHtml += `<div style="background:linear-gradient(135deg,rgba(212,175,55,0.12),rgba(212,175,55,0.04));border:1px solid rgba(212,175,55,0.25);border-radius:12px;padding:12px;text-align:center;margin-bottom:10px;">
                    <div style="font-size:24px;margin-bottom:4px;">🃏</div>
                    <div style="font-size:13px;color:var(--gold);font-weight:700;">${escapeHTML(p.authorName)} oyuncu kartını paylaştı</div>
                    <div style="font-size:11px;color:var(--text-dim);margin-top:3px;">${Math.round(p.authorPower||1500)} ELO · ${p.authorPosition||''}</div>
                </div>`;
            }
            if (p.type === 'sos') {
                contentHtml += `<div style="background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.4);border-radius:12px;padding:12px;margin-bottom:10px;">
                    <div style="font-size:11px;color:#e74c3c;font-weight:700;letter-spacing:1px;margin-bottom:4px;">🆘 ACİL OYUNCU ARANIYOR</div>
                    <div style="font-size:13px;color:#fff;">${escapeHTML(p.sosPosition||'Oyuncu')} aranıyor · ${escapeHTML(p.pitch||'Bilinmeyen Saha')} · ${escapeHTML(p.sosTime||'')}</div>
                </div>`;
            }
            if (p.badge) {
                contentHtml += `<div style="margin-bottom:10px;"><span class="badge">${escapeHTML(p.badge)}</span></div>`;
            }

            const card = document.createElement('div');
            card.className = 'feed-card';
            card.dataset.id = d.id;
            card.innerHTML = `
                <div class="feed-header">
                    <div class="feed-avatar">${(p.authorName||'?').charAt(0).toUpperCase()}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="font-weight:700;font-size:14px;color:#fff;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                            ${escapeHTML(p.authorName||'?')}
                            ${streak>=3 ? `<span style="color:#f39c12;font-size:11px;background:rgba(243,156,18,0.12);border-radius:6px;padding:1px 6px;">🔥${streak}</span>` : ''}
                            <span class="elo-badge ${t.c}" style="font-size:9px;padding:1px 5px;">${Math.round(p.authorPower||1500)}</span>
                        </div>
                        <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${p.authorPosition||''} · ${timeStr}</div>
                    </div>
                    ${isMe ? `<button onclick="deleteFeedPost('${d.id}')" style="background:none;border:none;color:var(--text-dim);font-size:16px;cursor:pointer;padding:4px;">🗑️</button>` : ''}
                </div>
                ${contentHtml}
                <div style="display:flex;align-items:center;gap:8px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.05);">
                    <button onclick="likeFeedPost('${d.id}',this)" data-liked="${hasLiked}" style="display:flex;align-items:center;gap:5px;background:${hasLiked?'rgba(231,76,60,0.15)':'var(--glass)'};border:1px solid ${hasLiked?'rgba(231,76,60,0.4)':'var(--border)'};color:${hasLiked?'#e74c3c':'var(--text-dim)'};border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;transition:all 0.2s;">
                        🔥 <span class="like-count">${likes}</span>
                    </button>
                    <button onclick="toggleFeedComments('${d.id}',this)" style="display:flex;align-items:center;gap:5px;background:var(--glass);border:1px solid var(--border);color:var(--text-dim);border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer;">
                        💬 <span>${p.commentCount||0}</span>
                    </button>
                    ${!isMe ? `<button onclick="openDM('${p.authorUid}','${escapeHTML(p.authorName)}')" style="margin-left:auto;background:none;border:none;color:var(--text-dim);font-size:18px;cursor:pointer;" title="Mesaj Gönder">✉️</button>` : ''}
                </div>
                <div id="feedComments_${d.id}" style="display:none;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.05);"></div>`;
            list.appendChild(card);
        });

        const btn = document.getElementById('feedLoadMore');
        if (btn) btn.style.display = snap.size === 12 ? 'block' : 'none';
    } catch(e) {
        console.error("Feed error:", e);
        if (!loadMore) list.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-dim);">⚠️ Feed yüklenemedi. Lütfen tekrar deneyin.</div>`;
    }
    feedLoading = false;
};

window.postToFeed = async function(type = 'text') {
    const text = document.getElementById('feedPostText')?.value?.trim() || '';
    if (type === 'text' && !text) return showToast("Bir şeyler yaz!", "error");
    const streak = await _getWinStreak(currentUser.uid);
    const post = {
        authorUid: currentUser.uid, authorName: currentUser.name,
        authorPosition: currentUser.position, authorPower: currentUser.power||1500,
        authorStreak: streak, type, text, likes: 0, likedBy: [], commentCount: 0,
        createdAt: serverTimestamp()
    };
    try {
        await addDoc(collection(db, "feed"), post);
        if (document.getElementById('feedPostText')) document.getElementById('feedPostText').value = '';
        showToast("Paylaşıldı! 🚀", "success");
        loadFeed();
    } catch(e) { showToast("Paylaşılamadı!", "error"); }
};

window.likeFeedPost = async function(postId, btn) {
    const postRef = doc(db, "feed", postId);
    try {
        const snap = await getDoc(postRef);
        if (!snap.exists()) return;
        const data = snap.data();
        const likedBy = data.likedBy || [];
        const hasLiked = likedBy.includes(currentUser.uid);
        if (hasLiked) {
            await updateDoc(postRef, { likes: increment(-1), likedBy: likedBy.filter(u => u !== currentUser.uid) });
            btn.style.background='var(--glass)'; btn.style.borderColor='var(--border)'; btn.style.color='var(--text-dim)';
            btn.querySelector('.like-count').innerText = Math.max(0,(data.likes||1)-1);
        } else {
            await updateDoc(postRef, { likes: increment(1), likedBy: [...likedBy, currentUser.uid] });
            btn.style.background='rgba(231,76,60,0.15)'; btn.style.borderColor='rgba(231,76,60,0.4)'; btn.style.color='#e74c3c';
            btn.querySelector('.like-count').innerText = (data.likes||0)+1;
            if (navigator.vibrate) navigator.vibrate(30);
        }
    } catch(e) { console.warn("Like error:", e); }
};

window.toggleFeedComments = async function(postId) {
    const div = document.getElementById(`feedComments_${postId}`);
    if (!div) return;
    if (div.style.display === 'block') { div.style.display = 'none'; return; }
    div.style.display = 'block';
    div.innerHTML = `<div style="font-size:12px;color:var(--text-dim);">Yorumlar yükleniyor...</div>`;
    try {
        const q = query(collection(db, "feed", postId, "comments"), orderBy("createdAt","asc"), limit(20));
        const snap = await getDocs(q);
        let commentsHtml = snap.empty ? '<div style="font-size:12px;color:var(--text-dim);padding:4px 0;">Henüz yorum yok.</div>' : '';
        snap.forEach(d => {
            const c = d.data();
            commentsHtml += `<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);">
                <div style="width:24px;height:24px;border-radius:50%;background:var(--glass);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;">${(c.authorName||'?').charAt(0)}</div>
                <div><div style="font-size:12px;font-weight:700;color:#fff;">${escapeHTML(c.authorName)}</div><div style="font-size:12px;color:var(--text-dim);">${escapeHTML(c.text)}</div></div>
            </div>`;
        });
        div.innerHTML = `<div>${commentsHtml}</div>
            <div style="display:flex;gap:8px;margin-top:8px;">
                <input id="ci_${postId}" type="text" placeholder="Yorum yaz..." style="flex:1;margin:0;padding:8px;font-size:12px;border-radius:8px;background:rgba(255,255,255,0.04);border:1px solid var(--border);color:var(--text);">
                <button onclick="submitComment('${postId}')" style="background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.4);color:var(--gold);border-radius:8px;padding:8px 12px;font-size:13px;cursor:pointer;font-weight:700;">↑</button>
            </div>`;
    } catch(e) { div.innerHTML = '<div style="font-size:12px;color:var(--text-dim);">Yorumlar yüklenemedi.</div>'; }
};

window.submitComment = async function(postId) {
    const inp = document.getElementById(`ci_${postId}`);
    const text = inp?.value?.trim();
    if (!text) return;
    inp.value = '';
    await addDoc(collection(db, "feed", postId, "comments"), {
        authorUid: currentUser.uid, authorName: currentUser.name,
        text, createdAt: serverTimestamp()
    });
    await updateDoc(doc(db, "feed", postId), { commentCount: increment(1) });
    toggleFeedComments(postId);
    setTimeout(() => toggleFeedComments(postId), 100);
};

window.deleteFeedPost = async function(postId) {
    if (!confirm("Bu paylaşımı silmek istediğine emin misin?")) return;
    await deleteDoc(doc(db, "feed", postId));
    showToast("Silindi.", "info");
    loadFeed();
};

async function _autoPostMatchToFeed(sA, sB, mvpN, pitch) {
    try {
        const streak = await _getWinStreak(currentUser.uid);
        const myTeam = currentTeamA.find(p => p.uid === currentUser.uid) ? 'A' : 'B';
        const winner = sA > sB ? 'A' : sB > sA ? 'B' : null;
        const iWon = winner && winner === myTeam;
        let text = '';
        if (winner === null) text = `Berabere kaldık! ${sA}-${sB} 🤝`;
        else if (iWon) { text = `Kazandık! ${sA}-${sB} 💪`; if (streak >= 3) text += ` 🔥 ${streak} maçlık seri devam ediyor!`; }
        else text = `Bu sefer olmadı ${sA}-${sB} 😤 Bir dahaki sefere!`;
        await addDoc(collection(db, "feed"), {
            authorUid: currentUser.uid, authorName: currentUser.name,
            authorPosition: currentUser.position, authorPower: currentUser.power||1500,
            authorStreak: streak, type: 'match_result', text,
            pitch, scoreA: sA, scoreB: sB, mvp: mvpN,
            likes: 0, likedBy: [], commentCount: 0, createdAt: serverTimestamp()
        });
    } catch(e) { console.warn("Auto feed post:", e); }
}

// ══════════════════════════════════════════════════════════════════════
// ── 🔍 TRANSFER MERKEZİ (INDEX-FREE VERSION) ──
// ══════════════════════════════════════════════════════════════════════
window.switchDiscoverTab = function(tab) {
    const isMatch = tab === 'matches';
    const btnM = document.getElementById('btnDiscoverMatches');
    const btnP = document.getElementById('btnDiscoverPlayers');
    if (btnM) { btnM.style.cssText = `flex:1;border-radius:8px;padding:8px;font-size:13px;cursor:pointer;font-weight:${isMatch?'700':'400'};background:${isMatch?'rgba(212,175,55,0.15)':'var(--glass)'};border:1px solid ${isMatch?'rgba(212,175,55,0.4)':'var(--border)'};color:${isMatch?'var(--gold)':'var(--text-dim)'};`; }
    if (btnP) { btnP.style.cssText = `flex:1;border-radius:8px;padding:8px;font-size:13px;cursor:pointer;font-weight:${!isMatch?'700':'400'};background:${!isMatch?'rgba(52,152,219,0.15)':'var(--glass)'};border:1px solid ${!isMatch?'rgba(52,152,219,0.4)':'var(--border)'};color:${!isMatch?'#3498db':'var(--text-dim)'};`; }
    const pml = document.getElementById('publicMatchesList');
    const tcl = document.getElementById('transferCenterList');
    if (pml) pml.style.display = isMatch ? 'block' : 'none';
    if (tcl) tcl.style.display = !isMatch ? 'block' : 'none';
    if (!isMatch) loadTransferCenter();
};

window.loadTransferCenter = async function() {
    const list = document.getElementById('transferCenterList');
    if (!list) return;
    list.innerHTML = `<div style="text-align:center;padding:30px;"><div style="font-size:32px;margin-bottom:8px;">🔍</div><p style="color:var(--text-dim);font-size:13px;">Oyuncular aranıyor...</p></div>`;
    try {
        // NO composite index: just orderBy power, client-side filter by city
        const q = query(collection(db, "users"), orderBy("power","desc"), limit(50));
        const snap = await getDocs(q);
        const cityFilter = document.getElementById('filterCity')?.value || '';
        
        const players_list = snap.docs
            .filter(d => d.id !== currentUser.uid)
            .filter(d => !cityFilter || d.data().city === cityFilter);

        list.innerHTML = `<div style="font-size:11px;color:var(--text-dim);margin-bottom:10px;letter-spacing:1px;">👥 ${players_list.length} OYUNCU BULUNDU${cityFilter ? ' · '+cityFilter : ''}</div>`;

        if (players_list.length === 0) {
            list.innerHTML += `<div style="text-align:center;padding:30px 20px;"><div style="font-size:40px;margin-bottom:8px;">👻</div><p style="color:var(--text-dim);">Oyuncu bulunamadı.</p></div>`;
            return;
        }

        players_list.forEach(d => {
            const u = d.data();
            const t = getTier(u.power);
            const streak = u.winStreak || 0;
            const rel = u.reliability;
            const injured = u.injured || false;
            list.innerHTML += `
            <div style="display:flex;align-items:center;gap:10px;padding:12px;background:var(--glass);border:1px solid ${injured?'rgba(231,76,60,0.3)':'var(--border)'};border-radius:12px;margin-bottom:8px;opacity:${injured?0.7:1};">
                <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,rgba(212,175,55,0.18),transparent);border:1px solid rgba(212,175,55,0.25);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;flex-shrink:0;position:relative;">
                    ${(u.name||'?').charAt(0).toUpperCase()}
                    ${streak>=3 ? `<div style="position:absolute;bottom:-4px;right:-4px;font-size:10px;">🔥</div>` : ''}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;font-size:14px;color:#fff;display:flex;align-items:center;gap:5px;flex-wrap:wrap;">
                        ${escapeHTML(u.name)}
                        ${injured ? '<span style="font-size:10px;background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.3);color:#e74c3c;border-radius:6px;padding:1px 5px;">🤕 Sakat</span>' : ''}
                    </div>
                    <div style="font-size:11px;color:var(--text-dim);margin:2px 0;">${u.position} · Lv.${u.level||1} · ⚽${u.goals||0} 🎯${u.assists||0} · ${u.city||'?'}</div>
                    <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
                        <span class="elo-badge ${t.c}" style="font-size:9px;padding:1px 6px;">${Math.round(u.power||1500)}</span>
                        ${rel !== undefined ? `<span style="font-size:9px;">${_getReliabilityBadge(rel)}</span>` : ''}
                        ${streak>=3 ? `<span style="font-size:9px;color:#f39c12;">🔥 ${streak} seri</span>` : ''}
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0;">
                    ${!injured ? `<button onclick="invitePlayerToMatch('${d.id}','${escapeHTML(u.name)}')" style="background:rgba(46,204,113,0.15);border:1px solid rgba(46,204,113,0.4);color:#2ecc71;border-radius:8px;padding:6px 8px;font-size:11px;cursor:pointer;font-weight:700;">🤝 Davet</button>` : '<div style="font-size:10px;color:var(--text-dim);text-align:center;">Sakat</div>'}
                    <button onclick="openH2H('${d.id}','${escapeHTML(u.name)}')" style="background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.3);color:var(--gold);border-radius:8px;padding:6px 8px;font-size:11px;cursor:pointer;">⚖️ H2H</button>
                    <button onclick="openDM('${d.id}','${escapeHTML(u.name)}')" style="background:rgba(52,152,219,0.1);border:1px solid rgba(52,152,219,0.3);color:#3498db;border-radius:8px;padding:6px 8px;font-size:11px;cursor:pointer;">✉️ DM</button>
                </div>
            </div>`;
        });
    } catch(e) {
        console.error("Transfer Merkezi:", e);
        list.innerHTML = `<div style="text-align:center;padding:30px;"><div style="font-size:32px;margin-bottom:8px;">⚠️</div><p style="color:var(--text-dim);">Yüklenemedi: ${e.message}</p></div>`;
    }
};

// ══════════════════════════════════════════════════════════════════════
// ── 🆘 ACİL OYUNCU BULUCU (SOS MODU) ──
// ══════════════════════════════════════════════════════════════════════
window.openSOSModal = function() {
    const modal = document.getElementById('sosModal');
    if (modal) modal.style.display = 'flex';
};

window.sendSOS = async function() {
    if (!globalMatchId || !currentMatchData) return showToast("Aktif maç odanız olmalı!", "error");
    const pos = document.getElementById('sosPosition')?.value || 'Orta Saha';
    const note = document.getElementById('sosNote')?.value?.trim() || '';
    const city = currentMatchData.city || currentUser.city;

    try {
        // Firestore'a SOS kaydı
        await addDoc(collection(db, "sos_requests"), {
            matchId: globalMatchId, captainUid: currentUser.uid,
            captainName: currentUser.name, pitch: currentMatchData.pitch,
            city, position: pos, matchTime: currentMatchData.time,
            note, status: 'open', respondents: [], createdAt: serverTimestamp()
        });

        // Feed'e SOS paylaşımı
        const streak = await _getWinStreak(currentUser.uid);
        await addDoc(collection(db, "feed"), {
            authorUid: currentUser.uid, authorName: currentUser.name,
            authorPosition: currentUser.position, authorPower: currentUser.power||1500,
            authorStreak: streak, type: 'sos',
            text: note || `${city} için acil ${pos} arıyorum!`,
            sosPosition: pos, pitch: currentMatchData.pitch,
            sosTime: currentMatchData.time, city,
            likes: 0, likedBy: [], commentCount: 0, createdAt: serverTimestamp()
        });

        // Bildirim: şehirdeki uygun oyuncuları bul
        const q = query(collection(db, "users"),
            where("city", "==", city), where("position", "==", pos), limit(15));
        const snap = await getDocs(q);
        const notifPromises = [];
        snap.forEach(d => {
            if (d.id === currentUser.uid) return;
            const u = d.data();
            if (u.injured) return;
            notifPromises.push(addDoc(collection(db, "users", d.id, "notifications"), {
                type: "sos_invite", matchId: globalMatchId,
                matchPitch: currentMatchData.pitch, senderName: currentUser.name,
                position: pos, city, matchTime: currentMatchData.time,
                createdAt: serverTimestamp(), read: false
            }));
        });
        await Promise.all(notifPromises);

        document.getElementById('sosModal').style.display = 'none';
        showToast(`🆘 SOS gönderildi! ${snap.size} ${pos} uyarıldı.`, "success");
        loadFeed();
    } catch(e) { showToast("SOS gönderilemedi!", "error"); console.error(e); }
};

// ══════════════════════════════════════════════════════════════════════
// ── ✉️ DİREKT MESAJLAŞMA (DM) ──
// ══════════════════════════════════════════════════════════════════════
let dmUnsubscribe = null;
let dmCurrentUid = null;
let dmCurrentName = null;

function _getDMConversationId(uid1, uid2) {
    return [uid1, uid2].sort().join('_');
}

window.openDM = function(targetUid, targetName) {
    const modal = document.getElementById('dmModal');
    if (!modal) return;
    dmCurrentUid = targetUid;
    dmCurrentName = targetName;

    document.getElementById('dmTitle').innerText = `✉️ ${targetName}`;
    document.getElementById('dmMessages').innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-dim);font-size:13px;">Mesajlar yükleniyor...</div>`;
    modal.style.display = 'flex';

    const convId = _getDMConversationId(currentUser.uid, targetUid);
    if (dmUnsubscribe) { dmUnsubscribe(); dmUnsubscribe = null; }

    dmUnsubscribe = onSnapshot(
        query(collection(db, "dms", convId, "messages"), orderBy("createdAt","asc"), limit(50)),
        (snap) => {
            const box = document.getElementById('dmMessages');
            if (!box) return;
            box.innerHTML = snap.empty
                ? `<div style="text-align:center;padding:30px;color:var(--text-dim);font-size:13px;">Henüz mesaj yok. İlk selamı sen at! 👋</div>`
                : '';
            snap.forEach(d => {
                const m = d.data();
                const isMe = m.senderUid === currentUser.uid;
                const div = document.createElement('div');
                div.style.cssText = `display:flex;justify-content:${isMe?'flex-end':'flex-start'};margin-bottom:8px;`;
                div.innerHTML = `<div style="max-width:75%;background:${isMe?'linear-gradient(135deg,rgba(212,175,55,0.25),rgba(212,175,55,0.12))':'rgba(255,255,255,0.06)'};border:1px solid ${isMe?'rgba(212,175,55,0.3)':'var(--border)'};border-radius:${isMe?'14px 14px 4px 14px':'14px 14px 14px 4px'};padding:8px 12px;">
                    <div style="font-size:13px;color:#fff;word-break:break-word;">${escapeHTML(m.text||'')}</div>
                    <div style="font-size:10px;color:var(--text-dim);margin-top:3px;text-align:right;">${_timeAgo(m.createdAt?.toDate?.() || new Date())}</div>
                </div>`;
                box.appendChild(div);
            });
            box.scrollTop = box.scrollHeight;
        }
    );
};

window.sendDM = async function() {
    if (!dmCurrentUid) return;
    const inp = document.getElementById('dmInput');
    const text = inp?.value?.trim();
    if (!text) return;
    inp.value = '';
    const convId = _getDMConversationId(currentUser.uid, dmCurrentUid);

    // Create/update conversation metadata
    await setDoc(doc(db, "dms", convId), {
        participants: [currentUser.uid, dmCurrentUid],
        participantNames: { [currentUser.uid]: currentUser.name, [dmCurrentUid]: dmCurrentName },
        lastMessage: text, lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }, { merge: true });

    await addDoc(collection(db, "dms", convId, "messages"), {
        senderUid: currentUser.uid, senderName: currentUser.name,
        text, createdAt: serverTimestamp()
    });

    // Bildirim gönder
    await addDoc(collection(db, "users", dmCurrentUid, "notifications"), {
        type: "dm", senderUid: currentUser.uid, senderName: currentUser.name,
        preview: text.length > 40 ? text.substring(0,40)+'...' : text,
        conversationId: convId, createdAt: serverTimestamp(), read: false
    });
};

window.closeDM = function() {
    if (dmUnsubscribe) { dmUnsubscribe(); dmUnsubscribe = null; }
    dmCurrentUid = null; dmCurrentName = null;
    const modal = document.getElementById('dmModal');
    if (modal) modal.style.display = 'none';
};

// ══════════════════════════════════════════════════════════════════════
// ── 🔔 BİLDİRİM SİSTEMİ (GENIŞLETILMIŞ) ──
// ══════════════════════════════════════════════════════════════════════
let unsubNotifications = null;

window.listenToNotifications = function() {
    if (!currentUser) return;
    if (unsubNotifications) unsubNotifications();
    const q = query(
        collection(db, "users", currentUser.uid, "notifications"),
        where("read", "==", false), orderBy("createdAt","desc"), limit(10)
    );
    unsubNotifications = onSnapshot(q, (snap) => {
        snap.docChanges().forEach(change => {
            if (change.type === "added") {
                const notif = change.doc.data();
                const id = change.doc.id;
                const age = notif.createdAt?.toDate ? (Date.now() - notif.createdAt.toDate().getTime()) : 99999;
                if (age > 30000) return; // 30s'den eski bildirimleri ignore et

                if (notif.type === "match_invite") showInvitePopup(id, notif);
                else if (notif.type === "sos_invite") showSOSPopup(id, notif);
                else if (notif.type === "dm") showDMNotif(id, notif);
            }
        });
        // Notification dot
        const unread = snap.size;
        const navFeed = document.getElementById('navFeed');
        if (navFeed) {
            const existing = navFeed.querySelector('.notif-dot');
            if (unread > 0 && !existing) {
                const dot = document.createElement('div');
                dot.className = 'notif-dot';
                dot.style.cssText = 'width:8px;height:8px;background:#e74c3c;border-radius:50%;position:absolute;top:4px;right:10px;';
                navFeed.style.position = 'relative';
                navFeed.appendChild(dot);
            } else if (unread === 0 && existing) existing.remove();
        }
    });
};

window.invitePlayerToMatch = async function(targetUid, targetName) {
    if (!globalMatchId || !currentMatchData) return showToast("⚠️ Önce aktif bir maç odan olmalı!", "error");
    try {
        await addDoc(collection(db, "users", targetUid, "notifications"), {
            type: "match_invite", matchId: globalMatchId,
            matchPitch: currentMatchData.pitch || "Bilinmeyen Saha",
            senderName: currentUser.name, senderId: currentUser.uid,
            createdAt: serverTimestamp(), read: false
        });
        showToast(`📩 ${targetName} oyuncusuna davet gönderildi!`, "success");
    } catch(e) { showToast("Davet gönderilemedi!", "error"); }
};

function _showNotifPopup(html, onClose) {
    let container = document.getElementById('notifContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notifContainer';
        container.style.cssText = 'position:fixed;top:12px;right:12px;z-index:9999;display:flex;flex-direction:column;gap:8px;width:calc(100% - 24px);max-width:320px;pointer-events:none;';
        document.body.appendChild(container);
    }
    const card = document.createElement('div');
    card.style.cssText = 'background:var(--bg2);border:1px solid rgba(212,175,55,0.4);border-radius:14px;padding:14px;box-shadow:0 8px 30px rgba(0,0,0,0.7);animation:slideInLeft 0.3s ease;pointer-events:all;';
    card.innerHTML = html;
    container.appendChild(card);
    setTimeout(() => { if (card.parentNode) { card.style.opacity='0'; card.style.transform='translateX(20px)'; card.style.transition='all 0.3s'; setTimeout(() => card.remove(), 300); } }, 12000);
    return card;
}

window.showInvitePopup = function(notifId, notif) {
    _showNotifPopup(`
        <div style="font-size:10px;letter-spacing:2px;color:var(--gold);margin-bottom:8px;">📩 MAÇA DAVET</div>
        <div style="font-size:13px;color:#fff;line-height:1.4;margin-bottom:12px;"><strong>${escapeHTML(notif.senderName)}</strong> seni <strong>${escapeHTML(notif.matchPitch||'')}</strong> maçına davet ediyor!</div>
        <div style="display:flex;gap:8px;">
            <button onclick="acceptInvite('${notifId}','${notif.matchId}',this.closest('div[style]'))" style="flex:1;background:#2ecc71;color:#000;border:none;border-radius:8px;padding:8px;font-size:12px;font-weight:700;cursor:pointer;">✅ Kabul</button>
            <button onclick="rejectInvite('${notifId}',this.closest('div[style]'))" style="flex:1;background:rgba(231,76,60,0.15);border:1px solid rgba(231,76,60,0.4);color:#e74c3c;border-radius:8px;padding:8px;font-size:12px;cursor:pointer;">❌ Reddet</button>
        </div>`);
};

window.showSOSPopup = function(notifId, notif) {
    _showNotifPopup(`
        <div style="font-size:10px;letter-spacing:2px;color:#e74c3c;margin-bottom:8px;">🆘 ACİL OYUNCU ARANIYOR</div>
        <div style="font-size:13px;color:#fff;line-height:1.4;margin-bottom:12px;"><strong>${escapeHTML(notif.matchPitch)}</strong> maçı için <strong>${escapeHTML(notif.position)}</strong> arıyor!<br><small style="color:var(--text-dim);">${escapeHTML(notif.senderName)} · ${escapeHTML(notif.city||'')}</small></div>
        <div style="display:flex;gap:8px;">
            <button onclick="acceptInvite('${notifId}','${notif.matchId}',this.closest('div[style]'))" style="flex:1;background:#e74c3c;color:#fff;border:none;border-radius:8px;padding:8px;font-size:12px;font-weight:700;cursor:pointer;">🙋 Gidiyorum!</button>
            <button onclick="rejectInvite('${notifId}',this.closest('div[style]'))" style="flex:1;background:var(--glass);border:1px solid var(--border);color:var(--text-dim);border-radius:8px;padding:8px;font-size:12px;cursor:pointer;">Hayır</button>
        </div>`);
};

window.showDMNotif = function(notifId, notif) {
    _showNotifPopup(`
        <div style="font-size:10px;letter-spacing:2px;color:#3498db;margin-bottom:8px;">✉️ YENİ MESAJ</div>
        <div style="font-size:13px;color:#fff;margin-bottom:10px;"><strong>${escapeHTML(notif.senderName)}</strong>: ${escapeHTML(notif.preview||'')}</div>
        <button onclick="updateDoc(doc(db,'users','${currentUser?.uid}','notifications','${notifId}'),{read:true});openDM('${notif.senderUid}','${escapeHTML(notif.senderName)}');this.closest('div[style]').remove();" style="width:100%;background:rgba(52,152,219,0.2);border:1px solid rgba(52,152,219,0.4);color:#3498db;border-radius:8px;padding:8px;font-size:12px;cursor:pointer;">Yanıtla</button>`);
    updateDoc(doc(db, "users", currentUser.uid, "notifications", notifId), { read: true });
};

window.acceptInvite = async function(notifId, matchId, cardEl) {
    await updateDoc(doc(db, "users", currentUser.uid, "notifications", notifId), { read: true });
    if (cardEl) cardEl.remove();
    requestJoinEngine(matchId);
    switchAppTab('match');
};

window.rejectInvite = async function(notifId, cardEl) {
    await updateDoc(doc(db, "users", currentUser.uid, "notifications", notifId), { read: true });
    if (cardEl) cardEl.remove();
};

// ══════════════════════════════════════════════════════════════════════
// ── ⚖️ H2H KARŞILAŞTIRMA ──
// ══════════════════════════════════════════════════════════════════════
window.openH2H = async function(oppUid, oppName) {
    const modal = document.getElementById('h2hModal');
    const content = document.getElementById('h2hContent');
    if (!modal || !content) return;
    content.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-dim);">⏳ Karşılaştırılıyor...</div>`;
    modal.style.display = 'flex';

    try {
        const [mySnap, oppSnap] = await Promise.all([
            getDoc(doc(db, "users", currentUser.uid)),
            getDoc(doc(db, "users", oppUid))
        ]);
        const me = mySnap.data() || {};
        const opp = oppSnap.data() || {};
        const myTier = getTier(me.power||1500);
        const oppTier = getTier(opp.power||1500);
        const myStreak = await _getWinStreak(currentUser.uid);
        const oppStreak = await _getWinStreak(oppUid);

        const bar = (label, myV, oppV, icon) => {
            const total = Math.max(1, myV + oppV);
            const mp = Math.round(myV/total*100);
            const myC = myV >= oppV ? '#2ecc71' : '#e74c3c';
            return `<div style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-dim);margin-bottom:4px;">
                    <span style="color:#fff;font-weight:700;">${myV}</span><span>${icon} ${label}</span><span style="color:#fff;font-weight:700;">${oppV}</span>
                </div>
                <div style="display:flex;border-radius:6px;overflow:hidden;height:6px;">
                    <div style="width:${mp}%;background:${myC};transition:width 0.8s ease;"></div>
                    <div style="flex:1;background:rgba(255,255,255,0.08);"></div>
                </div>
            </div>`;
        };

        content.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;gap:8px;">
                <div style="text-align:center;flex:1;">
                    <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,rgba(212,175,55,0.25),transparent);border:2px solid rgba(212,175,55,0.5);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;margin:0 auto 6px;">${(me.name||'').charAt(0)}</div>
                    <div style="font-size:12px;font-weight:700;color:#fff;">${escapeHTML(me.name||'Sen')}</div>
                    <span class="elo-badge ${myTier.c}" style="font-size:9px;">${Math.round(me.power||1500)}</span>
                    ${myStreak>=3?`<div style="font-size:10px;color:#f39c12;margin-top:3px;">🔥${myStreak}</div>`:''}
                </div>
                <div style="font-size:22px;font-weight:900;color:var(--gold);">VS</div>
                <div style="text-align:center;flex:1;">
                    <div style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,rgba(52,152,219,0.25),transparent);border:2px solid rgba(52,152,219,0.5);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;margin:0 auto 6px;">${(opp.name||'').charAt(0)}</div>
                    <div style="font-size:12px;font-weight:700;color:#fff;">${escapeHTML(opp.name||oppName)}</div>
                    <span class="elo-badge ${oppTier.c}" style="font-size:9px;">${Math.round(opp.power||1500)}</span>
                    ${oppStreak>=3?`<div style="font-size:10px;color:#f39c12;margin-top:3px;">🔥${oppStreak}</div>`:''}
                </div>
            </div>
            <div style="background:rgba(0,0,0,0.2);border-radius:12px;padding:14px;">
                ${bar('ELO',Math.round(me.power||1500),Math.round(opp.power||1500),'⚡')}
                ${bar('Maç',me.matchesPlayed||0,opp.matchesPlayed||0,'🏟️')}
                ${bar('Gol',me.goals||0,opp.goals||0,'⚽')}
                ${bar('Asist',me.assists||0,opp.assists||0,'🎯')}
                ${bar('Kurtarış',me.saves||0,opp.saves||0,'🧤')}
                ${bar('MVP',me.mvpCount||0,opp.mvpCount||0,'🏆')}
                ${bar('Seviye',me.level||1,opp.level||1,'⬆️')}
            </div>
            <button onclick="document.getElementById('h2hModal').style.display='none'" class="btn-ghost" style="margin-top:12px;width:100%;">Kapat</button>`;
    } catch(e) {
        content.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-dim);">⚠️ Yüklenemedi.</div>`;
    }
};


// ══════════════════════════════════════════════════════════════════════
// ── 🏥 SAKATI MODU ──
// ══════════════════════════════════════════════════════════════════════
window.toggleInjuryMode = async function() {
    const newState = !currentUser.injured;
    await updateDoc(doc(db, "users", currentUser.uid), { injured: newState });
    currentUser.injured = newState;
    const btn = document.getElementById('injuryBtn');
    if (btn) {
        btn.style.background = newState ? 'rgba(231,76,60,0.2)' : 'rgba(46,204,113,0.1)';
        btn.style.borderColor = newState ? 'rgba(231,76,60,0.5)' : 'rgba(46,204,113,0.3)';
        btn.style.color = newState ? '#e74c3c' : '#2ecc71';
        btn.innerText = newState ? '🤕 Sakat (Aktif)' : '✅ Sağlıklı';
    }
    showToast(newState ? '🤕 Sakat moduna geçildi. Davetler gelmeyecek.' : '✅ Sağlıklı moduna geçildi!', newState ? 'error' : 'success');
};

// ══════════════════════════════════════════════════════════════════════
// ── 🔒 KADRO KİLİTLEME (Son 2 Saat) ──
// ══════════════════════════════════════════════════════════════════════
function _isSquadLocked(matchTime) {
    if (!matchTime) return false;
    const matchDate = new Date(matchTime);
    const hoursLeft = (matchDate - Date.now()) / 3600000;
    return hoursLeft <= 2 && hoursLeft > -1;
}

window.leaveMatch = async function() {
    if (!globalMatchId || !currentMatchData) return;
    if (currentMatchData.captainUid === currentUser.uid) return showToast("Kaptan maçtan ayrılamaz, önce iptaller et.", "error");
    if (_isSquadLocked(currentMatchData.time)) {
        const confirm = window.confirm("⚠️ Kadro kilitlendi! Maça 2 saatten az kaldı. Ayrılman güvenilirlik puanını düşürecek. Devam et?");
        if (!confirm) return;
        // Güvenilirlik cezası
        const uSnap = await getDoc(doc(db, "users", currentUser.uid));
        if (uSnap.exists()) {
            const hist = uSnap.data().attendanceHistory || [];
            hist.unshift(0);
            if (hist.length > 10) hist.pop();
            const rel = Math.round(hist.reduce((a,b)=>a+b,0) / hist.length * 100);
            await updateDoc(doc(db, "users", currentUser.uid), { attendanceHistory: hist, reliability: rel, noShowCount: increment(1) });
            // Fair Play ceza kontrolü
            await _applyFairPlayCheck(currentUser.uid);
        }
    }
    await deleteDoc(doc(db, "matches", globalMatchId, "players", currentUser.uid));
    await updateDoc(doc(db, "matches", globalMatchId), { playerCount: increment(-1) });
    _resetMatchRoom();
    showToast("Maçtan ayrıldın.", "info");
};

// ══════════════════════════════════════════════════════════════════════
// ── 🏅 YETENEĞİ ONAYLA (ENDORSEMENT) ──
// ══════════════════════════════════════════════════════════════════════
const ENDORSEMENTS = ['⚡ Hızlı', '🦵 Sert Vurur', '🧠 Zeki', '🎯 İsabetli', '🤝 Takım Oyuncusu', '🛡️ Güvenilir Defans', '🥅 İyi Kaleci', '✨ Teknik'];

window.openEndorsements = async function(targetUid, targetName) {
    const snap = await getDoc(doc(db, "users", targetUid));
    const data = snap.data() || {};
    const endorsements = data.endorsements || {};
    const myEndorsements = data.endorsedBy?.[currentUser.uid] || [];

    const modal = document.createElement('div');
    modal.id = 'endorseModal';
    modal.className = 'modal';
    modal.style.cssText = 'display:flex;align-items:center;padding:16px;';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:360px;width:100%;padding:20px;border-radius:18px;">
            <div style="font-size:11px;letter-spacing:2px;color:var(--gold);margin-bottom:6px;">⭐ YETENEK ONAYLA</div>
            <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:16px;">${escapeHTML(targetName)}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
                ${ENDORSEMENTS.map(e => {
                    const count = endorsements[e] || 0;
                    const endorsed = myEndorsements.includes(e);
                    return `<button onclick="toggleEndorsement('${targetUid}','${e}',this)" style="background:${endorsed?'rgba(212,175,55,0.2)':'rgba(255,255,255,0.04)'};border:1px solid ${endorsed?'rgba(212,175,55,0.5)':'var(--border)'};color:${endorsed?'var(--gold)':'var(--text-dim)'};border-radius:10px;padding:10px;font-size:12px;cursor:pointer;text-align:left;display:flex;justify-content:space-between;align-items:center;">
                        <span>${e}</span>
                        <span style="background:rgba(0,0,0,0.3);border-radius:4px;padding:1px 5px;font-size:10px;">${count}</span>
                    </button>`;
                }).join('')}
            </div>
            <button onclick="document.getElementById('endorseModal').remove()" class="btn-ghost" style="width:100%;">Kapat</button>
        </div>`;
    document.body.appendChild(modal);
};

window.toggleEndorsement = async function(targetUid, skill, btn) {
    const uRef = doc(db, "users", targetUid);
    const snap = await getDoc(uRef);
    if (!snap.exists()) return;
    const data = snap.data();
    const endorsedBy = data.endorsedBy || {};
    const myList = endorsedBy[currentUser.uid] || [];
    const alreadyEndorsed = myList.includes(skill);

    const endorsements = data.endorsements || {};
    if (alreadyEndorsed) {
        myList.splice(myList.indexOf(skill), 1);
        endorsements[skill] = Math.max(0, (endorsements[skill]||1) - 1);
    } else {
        myList.push(skill);
        endorsements[skill] = (endorsements[skill]||0) + 1;
    }
    endorsedBy[currentUser.uid] = myList;
    await updateDoc(uRef, { endorsements, endorsedBy });
    // Update button
    const count = endorsements[skill];
    btn.style.background = alreadyEndorsed ? 'rgba(255,255,255,0.04)' : 'rgba(212,175,55,0.2)';
    btn.style.borderColor = alreadyEndorsed ? 'var(--border)' : 'rgba(212,175,55,0.5)';
    btn.style.color = alreadyEndorsed ? 'var(--text-dim)' : 'var(--gold)';
    btn.querySelector('span:last-child').innerText = count;
    if (!alreadyEndorsed) showToast(`⭐ "${skill}" onaylandı!`, "success");
};

// ══════════════════════════════════════════════════════════════════════
// ── 🔥 FAIR PLAY PUANI & CEZA MEKANİZMASI ──
// ══════════════════════════════════════════════════════════════════════
async function _checkFairPlayBan(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return false;
    const data = snap.data();
    if (!data.fairPlayBanUntil) return false;
    const banDate = data.fairPlayBanUntil.toDate ? data.fairPlayBanUntil.toDate() : new Date(data.fairPlayBanUntil);
    return banDate > new Date();
}

async function _applyFairPlayCheck(uid) {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists()) return;
    const data = snap.data();
    const noShows = data.noShowCount || 0;
    const peerRating = data.avgPeerRating || 5;
    const kasapCount = data.kasapBadgeCount || 0;

    let shouldBan = false;
    let reason = '';
    if (noShows >= 2) { shouldBan = true; reason = '2 kez maça gitmedin'; }
    else if (peerRating < 2 && (data.matchesPlayed||0) >= 5) { shouldBan = true; reason = 'Arkadaş puanın çok düşük'; }
    else if (kasapCount >= 3) { shouldBan = true; reason = '3 kez Kasap rozeti aldın'; }

    if (shouldBan) {
        const banUntil = new Date();
        banUntil.setDate(banUntil.getDate() + 7);
        await updateDoc(doc(db, "users", uid), {
            fairPlayBanned: true, fairPlayBanUntil: banUntil,
            fairPlayBanReason: reason, noShowCount: 0
        });
        showToast(`⛔ Fair Play ihlali: ${reason}. 7 gün boyunca herkese açık maçlara katılamazsın.`, "error");
        return true;
    }
    return false;
}

// ══════════════════════════════════════════════════════════════════════
// ── 🗺️ ISI HARİTASI (HEATMAP) ──
// ══════════════════════════════════════════════════════════════════════
window.openHeatmap = function(uid, name) {
    const modal = document.createElement('div');
    modal.id = 'heatmapModal';
    modal.className = 'modal';
    modal.style.cssText = 'display:flex;align-items:center;padding:16px;';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:380px;width:100%;padding:20px;border-radius:18px;">
            <div style="font-size:11px;letter-spacing:2px;color:var(--gold);margin-bottom:6px;">🗺️ ISI HARİTASI</div>
            <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:14px;">${escapeHTML(name)}</div>
            <div style="position:relative;background:linear-gradient(180deg,rgba(46,204,113,0.08) 0%,rgba(52,152,219,0.06) 50%,rgba(46,204,113,0.08) 100%);border:1px solid rgba(255,255,255,0.1);border-radius:12px;overflow:hidden;aspect-ratio:0.7;">
                <!-- Pitch lines -->
                <div style="position:absolute;inset:8px;border:1px solid rgba(255,255,255,0.15);border-radius:4px;"></div>
                <div style="position:absolute;top:50%;left:8px;right:8px;height:1px;background:rgba(255,255,255,0.12);transform:translateY(-50%);"></div>
                <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:60px;height:60px;border:1px solid rgba(255,255,255,0.12);border-radius:50%;"></div>
                <!-- Heatmap canvas -->
                <canvas id="heatmapCanvas_${uid}" style="position:absolute;inset:0;width:100%;height:100%;cursor:crosshair;" onclick="addHeatmapPoint(event,this,'${uid}')"></canvas>
                <div id="heatmapDots_${uid}" style="position:absolute;inset:0;pointer-events:none;"></div>
            </div>
            <div style="font-size:11px;color:var(--text-dim);text-align:center;margin:8px 0;">Sahaya tıklayarak aksiyon noktası ekle</div>
            <div style="display:flex;gap:8px;margin-top:12px;">
                <button onclick="clearHeatmap('${uid}')" class="btn-ghost" style="flex:1;">Temizle</button>
                <button onclick="saveHeatmap('${uid}','${globalMatchId||''}');document.getElementById('heatmapModal').remove();" style="flex:1;background:rgba(46,204,113,0.15);border:1px solid rgba(46,204,113,0.4);color:#2ecc71;border-radius:10px;padding:10px;font-size:13px;cursor:pointer;font-weight:700;">💾 Kaydet</button>
                <button onclick="document.getElementById('heatmapModal').remove()" class="btn-ghost" style="flex:1;">Kapat</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    // Load existing points
    _loadHeatmapPoints(uid);
};

const heatmapPoints = {};
window.addHeatmapPoint = function(e, canvas, uid) {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width * 100).toFixed(1);
    const y = ((e.clientY - rect.top) / rect.height * 100).toFixed(1);
    if (!heatmapPoints[uid]) heatmapPoints[uid] = [];
    heatmapPoints[uid].push({ x, y });
    _renderHeatmapDots(uid);
};

function _renderHeatmapDots(uid) {
    const container = document.getElementById(`heatmapDots_${uid}`);
    if (!container) return;
    const points = heatmapPoints[uid] || [];
    container.innerHTML = points.map((p, i) => {
        const intensity = Math.min(1, (points.filter(q => Math.abs(q.x-p.x)<8 && Math.abs(q.y-p.y)<8).length) * 0.3 + 0.4);
        return `<div style="position:absolute;left:${p.x}%;top:${p.y}%;transform:translate(-50%,-50%);width:${16+intensity*20}px;height:${16+intensity*20}px;background:radial-gradient(circle,rgba(231,76,60,${intensity}),transparent);border-radius:50%;pointer-events:none;"></div>`;
    }).join('');
}

window.clearHeatmap = function(uid) {
    heatmapPoints[uid] = [];
    _renderHeatmapDots(uid);
};

window.saveHeatmap = async function(uid, matchId) {
    if (!matchId) return;
    try {
        await updateDoc(doc(db, "matches", matchId, "players", uid), {
            heatmapPoints: heatmapPoints[uid] || []
        });
        showToast("Isı haritası kaydedildi!", "success");
    } catch(e) { console.warn("Heatmap save:", e); }
};

async function _loadHeatmapPoints(uid) {
    if (!globalMatchId) return;
    try {
        const snap = await getDoc(doc(db, "matches", globalMatchId, "players", uid));
        if (snap.exists() && snap.data().heatmapPoints) {
            heatmapPoints[uid] = snap.data().heatmapPoints;
            _renderHeatmapDots(uid);
        }
    } catch(e) {}
}

// ══════════════════════════════════════════════════════════════════════
// ── 📅 SEZON SİSTEMİ ──
// ══════════════════════════════════════════════════════════════════════
async function _checkAndInitSeason() {
    try {
        const seasonRef = doc(db, "system", "season");
        const snap = await getDoc(seasonRef);
        const now = new Date();

        if (!snap.exists()) {
            // Initialize first season
            const end = new Date(now);
            end.setMonth(end.getMonth() + 3);
            await setDoc(seasonRef, { number: 1, startDate: now, endDate: end, active: true });
            return;
        }

        const data = snap.data();
        const endDate = data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate);
        if (now > endDate && data.active) {
            // Season ended! Archive + reset
            await _endSeason(data.number);
        }
    } catch(e) { console.warn("Season check:", e); }
}

async function _endSeason(seasonNum) {
    showToast(`🏆 Sezon ${seasonNum} sona erdi! Yeni sezon başlıyor...`, "success");
    // Get top players
    try {
        const q = query(collection(db, "users"), orderBy("power","desc"), limit(3));
        const top = await getDocs(q);
        const champions = [];
        top.forEach(d => champions.push({ uid: d.id, name: d.data().name, power: d.data().power }));

        // Award season badges and reset ELO to 1500 + fraction
        const allSnap = await getDocs(collection(db, "users"));
        const batch = [];
        allSnap.forEach(d => {
            const data = d.data();
            const isChamp = champions.find(c => c.uid === d.id);
            const updates = {
                power: Math.round((data.power||1500) * 0.3 + 1500 * 0.7), // Soft reset
                seasonalGoals: 0, seasonalAssists: 0, seasonalMatchesPlayed: 0,
                lastSeasonPower: data.power || 1500
            };
            if (isChamp) updates['seasonBadges'] = [...(data.seasonBadges||[]), `S${seasonNum} 🏆 #${champions.indexOf(isChamp)+1}`];
            batch.push(updateDoc(doc(db, "users", d.id), updates));
        });
        await Promise.all(batch);

        // Start new season
        const newEnd = new Date();
        newEnd.setMonth(newEnd.getMonth() + 3);
        await setDoc(doc(db, "system", "season"), {
            number: seasonNum + 1, startDate: new Date(), endDate: newEnd, active: true,
            lastSeasonChampions: champions
        });
    } catch(e) { console.warn("End season:", e); }
}

// Show season info on leaderboard
async function _getSeasonInfo() {
    try {
        const snap = await getDoc(doc(db, "system", "season"));
        if (!snap.exists()) return null;
        const data = snap.data();
        const end = data.endDate?.toDate ? data.endDate.toDate() : new Date(data.endDate);
        const daysLeft = Math.max(0, Math.ceil((end - Date.now()) / 86400000));
        return { number: data.number, daysLeft };
    } catch(e) { return null; }
}

// ══════════════════════════════════════════════════════════════════════
// ── ⚡ HIZLI MAÇ (QUICK MATCH / MATCHMAKING) ──
// ══════════════════════════════════════════════════════════════════════
window.openQuickMatch = function() {
    const modal = document.createElement('div');
    modal.id = 'quickMatchModal';
    modal.className = 'modal';
    modal.style.cssText = 'display:flex;align-items:center;padding:16px;';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:360px;width:100%;padding:22px;border-radius:18px;">
            <div style="font-size:11px;letter-spacing:2px;color:var(--gold);margin-bottom:8px;">⚡ HIZLI MAÇ BUL</div>
            <div style="font-size:13px;color:var(--text-dim);margin-bottom:16px;">Sana uygun saattes oynayan maç bul!</div>
            <label style="font-size:12px;color:var(--text-dim);display:block;margin-bottom:6px;">Müsait Saat Aralığı</label>
            <div style="display:flex;gap:8px;margin-bottom:12px;">
                <input type="time" id="qmFrom" style="flex:1;margin:0;padding:10px;text-align:center;" value="19:00">
                <span style="align-self:center;color:var(--text-dim);">—</span>
                <input type="time" id="qmTo" style="flex:1;margin:0;padding:10px;text-align:center;" value="21:00">
            </div>
            <label style="font-size:12px;color:var(--text-dim);display:block;margin-bottom:6px;">Pozisyon</label>
            <select id="qmPos" style="width:100%;margin-bottom:16px;">
                <option value="">Farketmez</option>
                <option value="Kaleci">Kaleci</option>
                <option value="Defans">Defans</option>
                <option value="Orta Saha">Orta Saha</option>
                <option value="Forvet">Forvet</option>
            </select>
            <button onclick="findQuickMatch()" style="width:100%;background:linear-gradient(135deg,rgba(212,175,55,0.3),rgba(212,175,55,0.15));border:1px solid rgba(212,175,55,0.5);color:var(--gold);border-radius:10px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;">⚡ Maç Ara!</button>
            <div id="quickMatchResults" style="margin-top:14px;"></div>
            <button onclick="document.getElementById('quickMatchModal').remove()" class="btn-ghost" style="width:100%;margin-top:8px;">Kapat</button>
        </div>`;
    document.body.appendChild(modal);
};

window.findQuickMatch = async function() {
    const from = document.getElementById('qmFrom')?.value || '00:00';
    const to = document.getElementById('qmTo')?.value || '23:59';
    const pos = document.getElementById('qmPos')?.value || '';
    const res = document.getElementById('quickMatchResults');
    res.innerHTML = `<div style="text-align:center;padding:16px;color:var(--text-dim);">🔍 Aranıyor...</div>`;

    try {
        const today = new Date().toISOString().split('T')[0];
        const q = query(collection(db, "matches"), where("status","==","active"), where("city","==",currentUser.city||''), limit(20));
        const snap = await getDocs(q);
        const matches = [];
        snap.forEach(d => {
            const data = d.data();
            if (!data.time) return;
            const matchTime = data.time.includes('T') ? data.time.split('T')[1]?.substring(0,5) : data.time.substring(11,16);
            if (matchTime >= from && matchTime <= to) matches.push({ id: d.id, ...data, matchTime });
        });

        if (matches.length === 0) {
            // Register interest
            await setDoc(doc(db, "quickmatch_pool", currentUser.uid), {
                uid: currentUser.uid, name: currentUser.name, city: currentUser.city||'',
                position: pos || currentUser.position, availableFrom: from, availableTo: to,
                power: currentUser.power||1500, registeredAt: serverTimestamp()
            });
            res.innerHTML = `<div style="background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);border-radius:10px;padding:14px;text-align:center;">
                <div style="font-size:20px;margin-bottom:6px;">📋</div>
                <div style="font-size:13px;color:#fff;margin-bottom:4px;">Şu an uygun maç yok</div>
                <div style="font-size:11px;color:var(--text-dim);">Havuza eklendik! Maç oluşturulunca bildirim alacaksın.</div>
            </div>`;
            return;
        }

        res.innerHTML = matches.map(m => `
            <div style="background:var(--glass);border:1px solid var(--border);border-radius:10px;padding:10px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-size:13px;font-weight:700;color:#fff;">${escapeHTML(m.pitch||'?')}</div>
                    <div style="font-size:11px;color:var(--text-dim);">${m.matchTime} · ${m.playerCount||0}/14 oyuncu</div>
                </div>
                <button onclick="requestJoinEngine('${m.id}');document.getElementById('quickMatchModal').remove();" style="background:rgba(46,204,113,0.15);border:1px solid rgba(46,204,113,0.4);color:#2ecc71;border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer;font-weight:700;">Katıl</button>
            </div>`).join('');
    } catch(e) {
        res.innerHTML = `<div style="color:var(--text-dim);font-size:12px;text-align:center;">Arama başarısız.</div>`;
    }
};

// ══════════════════════════════════════════════════════════════════════
// ── 🌟 HAFTANIN PANORAMASİ (TOP 7) ──
// ══════════════════════════════════════════════════════════════════════
async function _renderWeeklyTop7() {
    const container = document.getElementById('weeklyTop7');
    if (!container) return;
    try {
        const season = await _getSeasonInfo();
        const q = query(collection(db, "users"), orderBy("power","desc"), limit(7));
        const snap = await getDocs(q);
        const items = [];
        snap.forEach(d => items.push({ uid: d.id, ...d.data() }));

        container.innerHTML = `
            <div style="background:linear-gradient(135deg,rgba(212,175,55,0.1),rgba(212,175,55,0.04));border:1px solid rgba(212,175,55,0.2);border-radius:14px;padding:14px;margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <div style="font-size:11px;letter-spacing:2px;color:var(--gold);">🌟 HAFTANIN 7'Sİ</div>
                    ${season ? `<div style="font-size:10px;color:var(--text-dim);">Sezon ${season.number} · ${season.daysLeft}g kaldı</div>` : ''}
                </div>
                <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;">
                    ${items.map((u, i) => {
                        const t = getTier(u.power);
                        const medals = ['👑','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣'];
                        return `<div style="min-width:80px;text-align:center;flex-shrink:0;" onclick="openH2H('${u.uid}','${escapeHTML(u.name)}')">
                            <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,rgba(212,175,55,0.2),transparent);border:2px solid rgba(212,175,55,${0.6 - i*0.07});display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800;margin:0 auto 4px;cursor:pointer;">${(u.name||'?').charAt(0)}</div>
                            <div style="font-size:10px;color:#fff;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:80px;">${escapeHTML(u.name)}</div>
                            <div style="font-size:9px;color:var(--text-dim);">${medals[i]} ${Math.round(u.power||1500)}</div>
                            ${(u.winStreak||0)>=3 ? `<div style="font-size:9px;color:#f39c12;">🔥${u.winStreak}</div>` : ''}
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
    } catch(e) { console.warn("Weekly top7:", e); }
}

// ══════════════════════════════════════════════════════════════════════
// ── 📊 GELİŞMİŞ FORM GRAFİĞİ ──
// ══════════════════════════════════════════════════════════════════════
async function _renderFormChart(uid) {
    const container = document.getElementById('formChartContainer');
    if (!container) return;
    try {
        const q = query(collection(db, "users", uid, "history"), orderBy("timestamp","desc"), limit(5));
        const snap = await getDocs(q);
        const matches = [];
        snap.forEach(d => matches.push(d.data()));
        matches.reverse();

        if (matches.length === 0) return;

        const maxElo = Math.max(...matches.map(m => parseInt(m.newElo||1500)||1500));
        const minElo = Math.min(...matches.map(m => parseInt(m.newElo||1400)||1400));
        const range = maxElo - minElo || 100;

        const points = matches.map((m, i) => {
            const elo = parseInt(m.newElo||1500)||1500;
            const x = (i / (matches.length-1)) * 100;
            const y = 100 - ((elo - minElo) / range * 80) - 10;
            return `${x},${y}`;
        });

        container.innerHTML = `
            <div style="background:var(--glass);border:1px solid var(--border);border-radius:12px;padding:14px;margin-top:12px;">
                <div style="font-size:10px;letter-spacing:2px;color:var(--text-dim);margin-bottom:8px;">📈 SON 5 MAÇ ELO TREND</div>
                <svg viewBox="0 0 100 60" style="width:100%;height:60px;" preserveAspectRatio="none">
                    <defs><linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:rgba(212,175,55,0.4)"/>
                        <stop offset="100%" style="stop-color:rgba(212,175,55,0)"/>
                    </linearGradient></defs>
                    <polyline points="${points.join(' ')}" fill="none" stroke="rgba(212,175,55,0.8)" stroke-width="1.5" stroke-linejoin="round"/>
                    ${matches.map((m, i) => {
                        const [x, y] = points[i].split(',');
                        const color = m.result==='Galibiyet' ? '#2ecc71' : m.result==='Mağlubiyet' ? '#e74c3c' : '#f1c40f';
                        return `<circle cx="${x}" cy="${y}" r="2.5" fill="${color}"/>`;
                    }).join('')}
                </svg>
                <div style="display:flex;justify-content:space-between;margin-top:4px;">
                    ${matches.map(m => `<div style="font-size:8px;color:${m.result==='Galibiyet'?'#2ecc71':m.result==='Mağlubiyet'?'#e74c3c':'#f1c40f'};text-align:center;">${m.result==='Galibiyet'?'G':m.result==='Mağlubiyet'?'M':'B'}<br>${m.eloChange||''}</div>`).join('')}
                </div>
            </div>`;
    } catch(e) { console.warn("Form chart:", e); }
}

// Call form chart after history loads
const _origLoadHistory = window.loadHistory;
window.loadHistory = async function() {
    if (_origLoadHistory) await _origLoadHistory();
    setTimeout(() => _renderFormChart(currentUser.uid), 300);
};

// Call weekly top7 on discover tab load
const _origLoadPublicMatches = window.loadPublicMatches;
window.loadPublicMatches = async function() {
    _renderWeeklyTop7();
    if (_origLoadPublicMatches) await _origLoadPublicMatches();
};

// ══════════════════════════════════════════════════════════════════════
// ── 📅 GOOGLE TAKVİM ENTEGRASYONU ──
// ══════════════════════════════════════════════════════════════════════
window.addToCalendar = function(pitch, time, city) {
    if (!time) return showToast("Maç saati belirtilmemiş!", "error");
    try {
        const start = new Date(time);
        const end = new Date(start.getTime() + 90 * 60000);
        const fmt = d => d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
            `&text=${encodeURIComponent('⚽ Halı Saha - ' + pitch)}` +
            `&dates=${fmt(start)}/${fmt(end)}` +
            `&details=${encodeURIComponent('Halı Saha PRO ile organize edildi 🏟️')}` +
            `&location=${encodeURIComponent(city||'')}`;
        window.open(url, '_blank');
    } catch(e) { showToast("Takvim açılamadı!", "error"); }
};

// ══════════════════════════════════════════════════════════════════════
// ── 🌓 OTOMATIK KARANLIK/AYDINLIK MOD ──
// ══════════════════════════════════════════════════════════════════════
function _autoTheme() {
    const hour = new Date().getHours();
    const isDark = hour < 7 || hour >= 19;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    // Update every hour
    setTimeout(_autoTheme, 3600000);
}

// ══════════════════════════════════════════════════════════════════════
// ── 🏟️ SAHA PUANLAMA SİSTEMİ ──
// ══════════════════════════════════════════════════════════════════════
window.openVenueRating = function(pitch, city) {
    const modal = document.createElement('div');
    modal.id = 'venueRatingModal';
    modal.className = 'modal';
    modal.style.cssText = 'display:flex;align-items:center;padding:16px;';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:360px;width:100%;padding:22px;border-radius:18px;">
            <div style="font-size:11px;letter-spacing:2px;color:var(--gold);margin-bottom:8px;">🏟️ SAHA PUANLA</div>
            <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:16px;">${escapeHTML(pitch)}</div>
            ${[['Zemin Kalitesi','surface'],['Işıklandırma','lighting'],['Soyunma Odası','locker'],['Genel','overall']].map(([label, field]) => `
                <div style="margin-bottom:14px;">
                    <div style="font-size:12px;color:var(--text-dim);margin-bottom:6px;">${label}</div>
                    <div style="display:flex;gap:6px;">
                        ${[1,2,3,4,5].map(n => `<button onclick="selectVenueScore('${field}',${n})" id="vsBtn_${field}_${n}" style="flex:1;background:rgba(255,255,255,0.04);border:1px solid var(--border);border-radius:8px;padding:8px;font-size:16px;cursor:pointer;">⭐</button>`).join('')}
                    </div>
                </div>`).join('')}
            <button onclick="submitVenueRating('${pitch}','${city}')" style="width:100%;background:linear-gradient(135deg,rgba(212,175,55,0.3),rgba(212,175,55,0.15));border:1px solid rgba(212,175,55,0.5);color:var(--gold);border-radius:10px;padding:12px;font-size:14px;font-weight:700;cursor:pointer;margin-top:4px;">⭐ Puanla</button>
            <button onclick="document.getElementById('venueRatingModal').remove()" class="btn-ghost" style="width:100%;margin-top:8px;">Kapat</button>
        </div>`;
    document.body.appendChild(modal);
};

const _venueScores = {};
window.selectVenueScore = function(field, score) {
    _venueScores[field] = score;
    [1,2,3,4,5].forEach(n => {
        const btn = document.getElementById(`vsBtn_${field}_${n}`);
        if (btn) btn.style.background = n <= score ? 'rgba(212,175,55,0.2)' : 'rgba(255,255,255,0.04)';
    });
};

window.submitVenueRating = async function(pitch, city) {
    const venueId = pitch.toLowerCase().replace(/\s+/g,'_') + '_' + (city||'').toLowerCase().replace(/\s+/g,'_');
    const ratingData = {
        surface: _venueScores.surface || 3, lighting: _venueScores.lighting || 3,
        locker: _venueScores.locker || 3, overall: _venueScores.overall || 3,
        reviewerUid: currentUser.uid, reviewerName: currentUser.name,
        pitch, city, createdAt: serverTimestamp()
    };
    await addDoc(collection(db, "venues", venueId, "ratings"), ratingData);
    // Update venue aggregate
    await setDoc(doc(db, "venues", venueId), {
        pitch, city, lastRated: serverTimestamp(),
        ratingCount: increment(1)
    }, { merge: true });
    document.getElementById('venueRatingModal')?.remove();
    showToast("Saha puanlandı! Teşekkürler 🏟️", "success");
};

// ══════════════════════════════════════════════════════════════════════
// ── 📣 KLAN TRANSFER TEKLİFİ ──
// ══════════════════════════════════════════════════════════════════════
window.sendClanOffer = async function(targetUid, targetName) {
    if (!currentUser.clanId) return showToast("Bir klana lider olmalısın!", "error");
    // Check if user is clan leader
    const clanSnap = await getDoc(doc(db, "clans", currentUser.clanId));
    if (!clanSnap.exists() || clanSnap.data().leaderUid !== currentUser.uid) {
        return showToast("Sadece klan liderleri teklif gönderebilir!", "error");
    }
    await addDoc(collection(db, "users", targetUid, "notifications"), {
        type: "clan_offer", clanId: currentUser.clanId, clanName: currentUser.clanName||'',
        senderName: currentUser.name, senderUid: currentUser.uid,
        createdAt: serverTimestamp(), read: false
    });
    showToast(`📣 ${targetName} kulübüne teklif gönderildi!`, "success");
};

// ══════════════════════════════════════════════════════════════════════
// ── 🎙️ WebRTC SESLİ SOHBET ──
// ══════════════════════════════════════════════════════════════════════
let localStream = null;
let peerConnections = {};
let voiceActive = false;

window.toggleVoiceChat = async function() {
    const btn = document.getElementById('voiceChatBtn');
    if (voiceActive) {
        // Leave voice
        if (localStream) { localStream.getTracks().forEach(t => t.stop()); localStream = null; }
        Object.values(peerConnections).forEach(pc => pc.close());
        peerConnections = {};
        voiceActive = false;
        if (btn) { btn.style.background = 'rgba(255,255,255,0.04)'; btn.style.color = 'var(--text-dim)'; btn.innerText = '🎙️ Sesli Sohbet'; }
        await updateDoc(doc(db, "matches", globalMatchId), { [`voiceParticipants.${currentUser.uid}`]: null });
        showToast("Sesli sohbetten çıkıldı.", "info");
        return;
    }
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        voiceActive = true;
        if (btn) { btn.style.background = 'rgba(231,76,60,0.2)'; btn.style.color = '#e74c3c'; btn.innerText = '🔴 Canlı (Kapat)'; }
        await updateDoc(doc(db, "matches", globalMatchId), {
            [`voiceParticipants.${currentUser.uid}`]: { name: currentUser.name, active: true }
        });
        showToast("🎙️ Sesli sohbet başladı!", "success");
        // Simple peer connection via Firestore signaling
        _setupVoiceSignaling();
    } catch(e) {
        showToast("Mikrofon erişimi reddedildi!", "error");
    }
};

async function _setupVoiceSignaling() {
    if (!globalMatchId) return;
    // Listen for voice participants
    onSnapshot(doc(db, "matches", globalMatchId), async (snap) => {
        const data = snap.data();
        const participants = data?.voiceParticipants || {};
        // For each other participant, establish WebRTC peer connection
        for (const [uid, info] of Object.entries(participants)) {
            if (uid === currentUser.uid || !info?.active) continue;
            if (peerConnections[uid]) continue;
            await _createPeerConnection(uid);
        }
    });
}

async function _createPeerConnection(remoteUid) {
    // Genişletilmiş STUN havuzu — farklı ağlarda (4G/5G) bağlantı için
    const config = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            // Production'da Twilio/Metered TURN ekle:
            // { urls: "turn:global.turn.twilio.com:3478?transport=udp", username: "x", credential: "y" }
        ]
    };
    const pc = new RTCPeerConnection(config);
    peerConnections[remoteUid] = pc;

    // Kendi sesimizi ekle
    if (localStream) localStream.getTracks().forEach(t => pc.addTrack(t, localStream));

    // Karşı tarafın sesi geldiğinde çal
    pc.ontrack = (e) => {
        let audio = document.getElementById(`voiceAudio_${remoteUid}`);
        if (!audio) {
            audio = document.createElement('audio');
            audio.id = `voiceAudio_${remoteUid}`;
            audio.autoplay = true;
            document.body.appendChild(audio);
        }
        audio.srcObject = e.streams[0];
    };

    // Kanal ID'si her iki taraf için aynı: KÜÇÜK_UID_BÜYÜK_UID
    const isCaller = currentUser.uid < remoteUid;
    const channelId = isCaller ? `${currentUser.uid}_${remoteUid}` : `${remoteUid}_${currentUser.uid}`;

    // Maç bazlı Firestore sinyalleşme referansları
    const signalRef = doc(db, "matches", globalMatchId, "voice_signals", channelId);
    const callerCandRef = collection(signalRef, "callerCandidates");
    const calleeCandRef = collection(signalRef, "calleeCandidates");

    // ICE adaylarını Firestore'a yaz
    pc.onicecandidate = async (e) => {
        if (e.candidate) {
            const target = isCaller ? callerCandRef : calleeCandRef;
            await addDoc(target, e.candidate.toJSON());
        }
    };

    if (isCaller) {
        // ARAYAN: Offer oluştur, Firestore'a yaz
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await setDoc(signalRef, { offer: { type: offer.type, sdp: offer.sdp } }, { merge: true });

        // ARAYAN: Answer bekle
        onSnapshot(signalRef, (snap) => {
            const data = snap.data();
            if (data?.answer && !pc.currentRemoteDescription) {
                pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
        });

        // ARAYAN: Karşı tarafın ICE adaylarını dinle
        onSnapshot(calleeCandRef, (snap) => {
            snap.docChanges().forEach(ch => {
                if (ch.type === 'added') pc.addIceCandidate(new RTCIceCandidate(ch.doc.data()));
            });
        });

    } else {
        // ARANAN: Offer bekle → Answer üret
        onSnapshot(signalRef, async (snap) => {
            const data = snap.data();
            if (data?.offer && !pc.currentRemoteDescription) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                await setDoc(signalRef, { answer: { type: answer.type, sdp: answer.sdp } }, { merge: true });
            }
        });

        // ARANAN: Arayanın ICE adaylarını dinle
        onSnapshot(callerCandRef, (snap) => {
            snap.docChanges().forEach(ch => {
                if (ch.type === 'added') pc.addIceCandidate(new RTCIceCandidate(ch.doc.data()));
            });
        });
    }
}

// ══════════════════════════════════════════════════════════════════════
// ── 🚀 INIT NEW FEATURES ON LOGIN ──
// ══════════════════════════════════════════════════════════════════════
// Patch the existing onAuthStateChanged callback to init new features
const _superInit = window._superInit || function(){};
window._postLoginInit = async function() {
    listenToNotifications();
    _checkAndInitSeason();

    // ── FCM Push Token Kaydı ──
    _registerFCMToken();

    // Injury toggle in profile
    const profileActions = document.getElementById('profileActions');
    if (profileActions && !document.getElementById('injuryBtn')) {
        const injBtn = document.createElement('button');
        injBtn.id = 'injuryBtn';
        injBtn.className = 'btn-ghost';
        injBtn.style.cssText = 'margin-top:8px;width:100%;';
        injBtn.innerText = currentUser.injured ? '🤕 Sakat (Aktif)' : '✅ Sağlıklı - Sakatlık Modu';
        injBtn.onclick = () => toggleInjuryMode();
        profileActions.appendChild(injBtn);
    }
    // Voice chat button in match room
    const captainBtns = document.querySelector('.captain-btns');
    if (captainBtns && !document.getElementById('voiceChatBtn')) {
        const vBtn = document.createElement('button');
        vBtn.id = 'voiceChatBtn';
        vBtn.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid var(--border);color:var(--text-dim);border-radius:10px;padding:10px;font-size:13px;cursor:pointer;width:100%;margin-top:0;';
        vBtn.innerText = '🎙️ Sesli Sohbet';
        vBtn.onclick = () => toggleVoiceChat();
        captainBtns.appendChild(vBtn);
    }
    // Weekly top7 placeholder in discover tab
    const discoverTab = document.getElementById('tabDiscover');
    if (discoverTab && !document.getElementById('weeklyTop7')) {
        const w7 = document.createElement('div');
        w7.id = 'weeklyTop7';
        discoverTab.insertBefore(w7, discoverTab.firstChild);
    }
    // Form chart container in history tab
    const histTab = document.getElementById('tabHistory');
    if (histTab && !document.getElementById('formChartContainer')) {
        const fc = document.createElement('div');
        fc.id = 'formChartContainer';
        histTab.insertBefore(fc, histTab.firstChild);
    }
    // Quick match + venue rating buttons in discover
    const filterBar = document.querySelector('#tabDiscover .filter-bar');
    if (filterBar && !document.getElementById('quickMatchBtn')) {
        const qmBtn = document.createElement('button');
        qmBtn.id = 'quickMatchBtn';
        qmBtn.className = 'btn-blue btn-sm';
        qmBtn.style.cssText = 'padding:10px 12px;white-space:nowrap;';
        qmBtn.innerText = '⚡ Hızlı';
        qmBtn.onclick = () => openQuickMatch();
        filterBar.appendChild(qmBtn);
    }
};

// ══════════════════════════════════════════════════════════════════════
// ── 🔔 FCM PUSH TOKEN KAYDI ──
// ══════════════════════════════════════════════════════════════════════
async function _registerFCMToken() {
    try {
        if (!('Notification' in window)) return;
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        // Dynamic Firebase Messaging import
        const { getMessaging, getToken } = await import('https://www.gstatic.com/firebasejs/10.8.1/firebase-messaging.js');
        const messaging = getMessaging();

        // VAPID key - Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
        const VAPID_KEY = 'YOUR_VAPID_KEY_FROM_FIREBASE_CONSOLE';
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });

        if (token) {
            await updateDoc(doc(db, "users", currentUser.uid), {
                fcmToken: token, fcmUpdatedAt: serverTimestamp()
            });
            console.log("✅ FCM Token kaydedildi");
        }
    } catch(e) {
        // FCM opsiyonel - başarısız olursa app çalışmaya devam eder
        console.warn("FCM token kaydı başarısız (opsiyonel):", e.message);
    }
}

// ══════════════════════════════════════════════════════════════════════
// ── 🚀 VİRAL ÖZELLİKLER ──
// ══════════════════════════════════════════════════════════════════════

// ── 1. WhatsApp Kadro Paylaşımı ──
window.shareTeamToWhatsApp = function() {
    if (!currentTeamA.length || !currentTeamB.length) return showToast("Önce takımları kur!", "error");
    const pitch = currentMatchData?.pitch || 'Saha';
    const time = currentMatchData?.time?.replace('T',' ').slice(0,16) || '';

    let msg = `⚽ *${pitch}* ${time}\n`;
    msg += `📊 Kazanma İhtimali: A %${Math.round(avgEloA/(avgEloA+avgEloB)*100)} — B %${Math.round(avgEloB/(avgEloA+avgEloB)*100)}\n\n`;
    msg += `🔵 *A TAKIMI*\n`;
    currentTeamA.forEach((p,i) => { msg += `${i+1}. ${p.name} (${p.position} · ${Math.round(p.power)} ELO)\n`; });
    msg += `\n🔴 *B TAKIMI*\n`;
    currentTeamB.forEach((p,i) => { msg += `${i+1}. ${p.name} (${p.position} · ${Math.round(p.power)} ELO)\n`; });
    msg += `\n📱 _Halı Saha PRO ile oluşturuldu_`;

    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
};

// ── 2. Günlük/Haftalık Görev Sistemi ──
const DAILY_QUESTS = [
    { id: 'play_match', text: '⚽ Bir maç oyna', xp: 50, check: (u) => (u._todayMatchPlayed || false) },
    { id: 'get_assist', text: '🎯 1 asist kayıt et', xp: 30, check: (u) => (u._todayAssist || false) },
    { id: 'win_match', text: '🏆 Bir maç kazan', xp: 80, check: (u) => (u._todayWin || false) },
    { id: 'sos_respond', text: '🆘 Bir SOS çağrısına yanıt ver', xp: 100, check: (u) => false },
    { id: 'rate_teammate', text: '⭐ Bir takım arkadaşını puanla', xp: 20, check: (u) => false },
];

window.openQuests = async function() {
    const modal = document.createElement('div');
    modal.id = 'questModal';
    modal.className = 'modal';
    modal.style.cssText = 'display:flex;align-items:center;padding:16px;';

    const snap = await getDoc(doc(db, "users", currentUser.uid));
    const u = snap.data() || {};
    const today = new Date().toDateString();
    const completedToday = u.questsCompletedDates || {};

    let html = `<div class="modal-content" style="max-width:380px;width:100%;padding:22px;border-radius:18px;">
        <div style="font-size:11px;letter-spacing:2px;color:var(--gold);margin-bottom:6px;">🎯 GÜNLÜK GÖREVLER</div>
        <div style="font-size:13px;color:var(--text-dim);margin-bottom:16px;">Her gün yeni görevler, ekstra XP kazan!</div>`;

    DAILY_QUESTS.forEach(q => {
        const done = completedToday[q.id] === today;
        html += `<div style="display:flex;align-items:center;gap:10px;padding:12px;background:${done?'rgba(46,204,113,0.08)':'rgba(255,255,255,0.03)'};border:1px solid ${done?'rgba(46,204,113,0.3)':'var(--border)'};border-radius:10px;margin-bottom:8px;">
            <div style="font-size:20px;">${done?'✅':'🔲'}</div>
            <div style="flex:1;">
                <div style="font-size:13px;color:${done?'#2ecc71':'#fff'};font-weight:600;text-decoration:${done?'line-through':'none'};">${q.text}</div>
                <div style="font-size:11px;color:var(--text-dim);">+${q.xp} XP</div>
            </div>
            ${!done ? `<button onclick="claimQuest('${q.id}',${q.xp})" style="background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.4);color:var(--gold);border-radius:8px;padding:6px 10px;font-size:11px;cursor:pointer;font-weight:700;">Tamamla</button>` : ''}
        </div>`;
    });

    html += `<button onclick="document.getElementById('questModal').remove()" class="btn-ghost" style="width:100%;margin-top:6px;">Kapat</button></div>`;
    modal.innerHTML = html;
    document.body.appendChild(modal);
};

window.claimQuest = async function(questId, xp) {
    const today = new Date().toDateString();
    const uRef = doc(db, "users", currentUser.uid);
    const snap = await getDoc(uRef);
    const data = snap.data() || {};
    const completed = data.questsCompletedDates || {};

    if (completed[questId] === today) return showToast("Bu görevi bugün zaten tamamladın!", "info");

    completed[questId] = today;
    const newXP = (data.xp || 0) + xp;
    const oldLevel = calcLevel(data.xp || 0);
    const newLevel = calcLevel(newXP);

    await updateDoc(uRef, { xp: newXP, level: newLevel, questsCompletedDates: completed });
    currentUser.xp = newXP;
    currentUser.level = newLevel;
    showToast(`🎯 Görev tamamlandı! +${xp} XP kazandın!`, "success");
    if (newLevel > oldLevel) showToast(`🎉 SEVİYE ATLADIN! Level ${newLevel} ⬆️`, "success");

    document.getElementById('questModal')?.remove();
    setTimeout(openQuests, 200); // Refresh
};

// ── 3. Transfer Tinder (Swipe) Modu ──
let swipePool = [];
let swipeIndex = 0;

window.openSwipeTransfer = async function() {
    const pos = prompt("Hangi pozisyon için oyuncu arıyorsun? (Kaleci/Defans/Orta Saha/Forvet)") || 'Orta Saha';
    const city = currentUser.city || '';

    const q = query(collection(db, "users"), orderBy("power","desc"), limit(30));
    const snap = await getDocs(q);
    swipePool = snap.docs
        .filter(d => d.id !== currentUser.uid)
        .filter(d => !city || d.data().city === city)
        .filter(d => d.data().position === pos)
        .map(d => ({ uid: d.id, ...d.data() }));
    swipeIndex = 0;

    _renderSwipeCard();
};

function _renderSwipeCard() {
    let overlay = document.getElementById('swipeOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'swipeOverlay';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;';
        document.body.appendChild(overlay);
    }

    if (swipeIndex >= swipePool.length) {
        overlay.innerHTML = `<div style="text-align:center;color:#fff;">
            <div style="font-size:48px;margin-bottom:12px;">🏁</div>
            <div style="font-size:18px;font-weight:700;margin-bottom:8px;">Tüm oyuncular görüldü</div>
            <div style="font-size:13px;color:var(--text-dim);margin-bottom:16px;">Davetler gönderildi!</div>
            <button onclick="document.getElementById('swipeOverlay').remove()" style="background:var(--gold);color:#000;border:none;border-radius:10px;padding:12px 24px;font-size:14px;font-weight:700;cursor:pointer;">Kapat</button>
        </div>`;
        return;
    }

    const u = swipePool[swipeIndex];
    const t = getTier(u.power);
    overlay.innerHTML = `<div style="max-width:320px;width:100%;">
        <div style="text-align:center;margin-bottom:12px;font-size:11px;letter-spacing:2px;color:var(--text-dim);">${swipeIndex+1} / ${swipePool.length} · ${u.position}</div>
        <div style="background:linear-gradient(180deg,rgba(212,175,55,0.15) 0%,var(--bg2) 100%);border:1px solid rgba(212,175,55,0.3);border-radius:20px;padding:30px;text-align:center;">
            <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,rgba(212,175,55,0.3),transparent);border:2px solid rgba(212,175,55,0.5);display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:800;margin:0 auto 14px;">${(u.name||'?').charAt(0)}</div>
            <div style="font-size:22px;font-weight:800;color:#fff;margin-bottom:6px;">${escapeHTML(u.name)}</div>
            <span class="elo-badge ${t.c}" style="font-size:14px;padding:4px 14px;">${Math.round(u.power||1500)} ELO</span>
            <div style="margin:14px 0;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
                <div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:8px;"><div style="font-size:18px;font-weight:700;color:#fff;">⚽${u.goals||0}</div><div style="font-size:9px;color:var(--text-dim);">GOL</div></div>
                <div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:8px;"><div style="font-size:18px;font-weight:700;color:#fff;">🎯${u.assists||0}</div><div style="font-size:9px;color:var(--text-dim);">ASİST</div></div>
                <div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:8px;"><div style="font-size:18px;font-weight:700;color:#fff;">🏟️${u.matchesPlayed||0}</div><div style="font-size:9px;color:var(--text-dim);">MAÇ</div></div>
            </div>
            ${(u.winStreak||0)>=3 ? `<div style="color:#f39c12;font-size:13px;margin-bottom:10px;">🔥 ${u.winStreak} Galibiyet Serisi</div>` : ''}
            ${u.reliability !== undefined ? `<div style="margin-bottom:10px;">${_getReliabilityBadge(u.reliability)}</div>` : ''}
        </div>
        <div style="display:flex;gap:12px;margin-top:16px;">
            <button onclick="swipeLeft()" style="flex:1;background:rgba(231,76,60,0.15);border:2px solid rgba(231,76,60,0.5);color:#e74c3c;border-radius:50px;padding:16px;font-size:24px;cursor:pointer;">✗</button>
            <button onclick="swipeRight('${u.uid}','${escapeHTML(u.name)}')" style="flex:1;background:rgba(46,204,113,0.15);border:2px solid rgba(46,204,113,0.5);color:#2ecc71;border-radius:50px;padding:16px;font-size:24px;cursor:pointer;">✓</button>
        </div>
        <div style="text-align:center;margin-top:8px;font-size:11px;color:var(--text-dim);">✗ Geç · ✓ Davet Et</div>
    </div>`;
}

window.swipeLeft = function() {
    swipeIndex++;
    _renderSwipeCard();
};

window.swipeRight = async function(uid, name) {
    swipeIndex++;
    await invitePlayerToMatch(uid, name);
    showToast(`✅ ${name} davet edildi!`, "success");
    _renderSwipeCard();
};

// ── 4. Ezeli Rakip (Nemesis) Sistemi ──
async function _checkNemesis(uid) {
    try {
        const q = query(collection(db, "users", uid, "history"), orderBy("timestamp","desc"), limit(20));
        const snap = await getDocs(q);
        const opponents = {};
        snap.forEach(d => {
            const data = d.data();
            if (data.opponentUid) {
                if (!opponents[data.opponentUid]) opponents[data.opponentUid] = { wins: 0, losses: 0, name: data.opponentName||'?' };
                if (data.result === 'Mağlubiyet') opponents[data.opponentUid].losses++;
                else if (data.result === 'Galibiyet') opponents[data.opponentUid].wins++;
            }
        });
        // Birden fazla karşılaşılan ve en çok kaybedilen kişi
        let nemesis = null;
        let maxLosses = 1;
        Object.entries(opponents).forEach(([oppUid, stats]) => {
            if (stats.losses > maxLosses) { maxLosses = stats.losses; nemesis = { uid: oppUid, ...stats }; }
        });
        return nemesis;
    } catch(e) { return null; }
}

window.showNemesisAlert = async function(upcomingMatchPlayers) {
    const nemesis = await _checkNemesis(currentUser.uid);
    if (!nemesis) return;
    const inMatch = upcomingMatchPlayers.find(p => p.uid === nemesis.uid);
    if (!inMatch) return;
    showToast(`⚔️ Nemesis Uyarısı! ${nemesis.name} bu maçta. Seni ${nemesis.losses} kez yendi. İntikam vakti!`, "error");
    if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 200]);
};

// ── 5. Akıllı Yedek Kulübesi (Auto-Substitute) ──
async function _triggerAutoSubstitute(matchId, position) {
    const matchSnap = await getDoc(doc(db, "matches", matchId));
    if (!matchSnap.exists()) return;
    const matchData = matchSnap.data();

    // Bekleme listesindeki en yüksek ELO'lu oyuncuyu bul
    const waitSnap = await getDocs(collection(db, "matches", matchId, "waitlist"));
    let best = null;
    let bestPower = 0;
    waitSnap.forEach(d => {
        const p = d.data();
        if (p.power > bestPower) { best = { uid: d.id, ...p }; bestPower = p.power; }
    });

    if (!best) return;

    // Bildirim gönder
    await addDoc(collection(db, "users", best.uid, "notifications"), {
        type: "auto_sub", matchId,
        matchPitch: matchData.pitch, senderName: matchData.captainUid,
        message: `⚡ Kadroda boşluk açıldı! ${matchData.pitch} için kadro dolu - 60 saniye içinde onaylarsan maçtasın!`,
        autoSubMatchId: matchId,
        createdAt: serverTimestamp(), read: false,
        expiresAt: new Date(Date.now() + 60000)
    });
    showToast(`⚡ ${best.name} otomatik olarak davet edildi!`, "success");
}

// Override leaveMatch to trigger auto-sub
const _origLeaveMatch = window.leaveMatch;
window.leaveMatch = async function() {
    const prevMatchId = globalMatchId;
    const prevMatchData = currentMatchData ? { ...currentMatchData } : null;
    await _origLeaveMatch?.();
    if (prevMatchId && prevMatchData) {
        setTimeout(() => _triggerAutoSubstitute(prevMatchId, currentUser.position), 1000);
    }
};

// ── 6. Scout (Davet) Rozeti Sistemi ──
async function _checkScoutBadge(uid) {
    try {
        const snap = await getDoc(doc(db, "users", uid));
        const data = snap.data() || {};
        const inviteCount = data.successfulInvites || 0;
        if (inviteCount >= 3 && !data.scoutBadge) {
            await updateDoc(doc(db, "users", uid), { scoutBadge: true, scoutBadgeEarnedAt: serverTimestamp() });
            showToast("🕵️ 'Scout' Rozetini Kazandın! 3 oyuncuyu uygulamaya getirdin!", "success");
        }
    } catch(e) {}
}

// ── 7. Turnuva Ağacı (Bracket) ──
window.openTournamentBracket = async function(tournamentId) {
    const tSnap = await getDoc(doc(db, "turnuvalar", tournamentId));
    if (!tSnap.exists()) return;
    const tData = tSnap.data();
    const parSnap = await getDocs(collection(db, "turnuvalar", tournamentId, "katilimcilar"));
    const teams = [];
    parSnap.forEach(d => teams.push({ uid: d.id, ...d.data() }));

    if (teams.length < 2) return showToast("Yeterli takım yok!", "error");

    // Generate bracket
    const rounds = Math.ceil(Math.log2(teams.length));
    const modal = document.createElement('div');
    modal.id = 'bracketModal';
    modal.className = 'modal';
    modal.style.cssText = 'display:flex;align-items:center;padding:16px;overflow-y:auto;';

    let bracketHTML = `<div class="modal-content" style="max-width:420px;width:100%;padding:22px;border-radius:18px;max-height:85vh;overflow-y:auto;">
        <div style="font-size:11px;letter-spacing:2px;color:var(--gold);margin-bottom:6px;">🏆 ${escapeHTML(tData.name||'Turnuva')} ELEME AĞACI</div>
        <div style="font-size:13px;color:var(--text-dim);margin-bottom:16px;">${teams.length} takım · ${rounds} tur</div>`;

    // Round of 8/4/2/1
    const bye = Math.pow(2, rounds) - teams.length;
    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const matches = [];
    for (let i = 0; i < shuffled.length; i += 2) {
        matches.push({ a: shuffled[i], b: shuffled[i+1] || { name: 'BYE', uid: 'bye' } });
    }

    bracketHTML += `<div style="font-size:10px;letter-spacing:2px;color:var(--text-dim);margin-bottom:8px;">1. TUR EŞLEŞMELERİ</div>`;
    matches.forEach((m, i) => {
        bracketHTML += `<div style="background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:10px;padding:10px;margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:13px;font-weight:700;color:#fff;">${escapeHTML(m.a?.name||'?')}</span>
                <span style="font-size:10px;color:var(--text-dim);background:rgba(255,255,255,0.05);border-radius:4px;padding:2px 6px;">VS</span>
                <span style="font-size:13px;font-weight:700;color:${m.b?.uid==='bye'?'var(--text-dim)':'#fff'}">${escapeHTML(m.b?.name||'BYE')}</span>
            </div>
        </div>`;
    });

    bracketHTML += `<button onclick="document.getElementById('bracketModal').remove()" class="btn-ghost" style="width:100%;margin-top:6px;">Kapat</button></div>`;
    modal.innerHTML = bracketHTML;
    document.body.appendChild(modal);
};

// ── 8. Firestore Security Rules Göster ──
window.showSecurityRulesInfo = function() {
    const info = `Firebase Console → Firestore Database → Rules sekmesine şu kuralları ekle:\n\nDetaylı kurallar için geliştirici dokümantasyonuna bakın.\nÖzet: users sadece kendi ELO'sunu max +150 güncelleyebilir.\nmatches sadece kaptan yönetebilir.\nfeed sadece kendi postlarını düzenleyebilir.`;
    alert(info);
};

// Add quest button to profile
document.addEventListener('DOMContentLoaded', () => {
    // Add quest and swipe buttons to discover tab filter bar
    setTimeout(() => {
        const filterBar = document.querySelector('#tabDiscover .filter-bar');
        if (filterBar && !document.getElementById('questNavBtn')) {
            const qBtn = document.createElement('button');
            qBtn.id = 'questNavBtn';
            qBtn.className = 'btn-ghost btn-sm';
            qBtn.style.cssText = 'padding:10px 10px;white-space:nowrap;font-size:12px;';
            qBtn.innerText = '🎯 Görev';
            qBtn.onclick = openQuests;
            filterBar.appendChild(qBtn);

            const sBtn = document.createElement('button');
            sBtn.className = 'btn-ghost btn-sm';
            sBtn.style.cssText = 'padding:10px 10px;white-space:nowrap;font-size:12px;background:rgba(231,76,60,0.1);border-color:rgba(231,76,60,0.3);color:#e74c3c;';
            sBtn.innerText = '💘 Swipe';
            sBtn.onclick = openSwipeTransfer;
            filterBar.appendChild(sBtn);
        }
    }, 1000);
});