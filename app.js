/* ═══════════════════════════════════════════
   formaLOLA — app.js
═══════════════════════════════════════════ */

/* ══════════ ADMIN AYARLARI ══════════ */
// SADECE BURAYA YAZDIĞIN MAİLLER ADMİN PANELİNİ GÖREBİLİR
// Admin yetkisi Firestore users.role üzerinden yönetilir
const ADMIN_EMAILS = [];
const ROLE_LABELS = { designer: 'Tasarımcı', club: 'Takım / Kulüp', admin: 'Admin' };

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
const functionsApi = typeof firebase.functions === "function" ? firebase.app().functions() : null;
const FORMA_CFG = {
  recaptchaSiteKey: window.FORMA_RECAPTCHA_SITE_KEY || "YOUR_RECAPTCHA_SITE_KEY",
  functionsEnabled: !!(typeof firebase.functions === "function")
};
/* ═══════════════════════════════════════ */

/* ══════════ MOCK DATA (Örnek Vitrin) ══════════ */
const MOCK_DESIGNS = [];

const MOCK_DESIGNERS = [];

const MOCK_COMPETITIONS = [];

/* ══════════ STATE ══════════ */
// SİTEDEKİ TÜM TASARIMLAR BURADA TOPLANACAK (Gerçekler + Örnekler)
let ALL_DESIGNS = [];
let currentPage = 'home';
let previousPage = 'home';
let currentUser = null;
let favorites = new Set();
let currentDesignId = null;
let exploreOffset = 0;
let selectedColors = new Set();
let currentUploadStep = 1;
const SLOT_LABELS = { 's-front': 'Ön Görünüm *', 's-back': 'Arka Görünüm *', 's-detail': 'Yakın Detay *', 's-flat': 'Flat Design *', 's-model': 'Model Mockup', 's-tex': 'Kumaş Texture', 's-pat': 'Pattern Zoom', 's-var': 'Renk Varyasyonu', 's-field': 'Saha Mockup', 's-pkg': 'Packaging' };
let uploadedImages = {};
let pendingUploadAfterRole = false;

function sanitizeHTML(str) {
  if (str === null || str === undefined) return "";
  const temp = document.createElement('div');
  temp.textContent = String(str);
  return temp.innerHTML;
}

function escapeAttr(str) {
  return sanitizeHTML(str).replace(/"/g, "&quot;");
}

function getFunctions() {
  if (!functionsApi) throw new Error('Firebase Functions SDK yüklenmemiş.');
  return functionsApi;
}

/* ══════════════════════════════════════════
   DİL SİSTEMİ (i18n) — 10 Dil
   Varsayılan: Türkçe
══════════════════════════════════════════ */
const LANGS = {
  tr: {
    code: 'tr', name: 'Türkçe', flag: '🇹🇷', dir: 'ltr',
    nav_explore: 'Keşfet', nav_competitions: 'Yarışmalar', nav_designers: 'Tasarımcılar',
    nav_how: 'Nasıl Çalışır', nav_login: 'Giriş Yap', nav_upload: '+ Tasarım Yükle',
    hero_title1: 'Forma tasarımını', hero_accent1: 'sat.', hero_title2: 'Hayalini',
    hero_accent2: 'bul.', hero_sub: 'Tasarımcılar yükler — Takımlar satın alır — Anında teslim',
    hero_btn1: 'Tasarımları Keşfet', hero_btn2: 'Tasarım Yükle',
    sec_categories: 'Kategoriler', sec_trending: 'Trend Tasarımlar',
    sec_designers: 'Öne Çıkan Tasarımcılar', sec_competitions: 'Aktif Yarışmalar',
    see_all: 'Tümünü Gör →', tab_today: 'Bugün', tab_week: 'Bu Hafta', tab_all: 'Tüm Zamanlar',
    how_title: 'Nasıl Çalışır', how1_t: 'Tasarımını Yükle', how1_p: '4 zorunlu görsel, 5 adımlı kolay süreç. Renk, spor dalı ve lisansını seç.',
    how2_t: 'Takımlar Keşfeder', how2_p: 'Renk, stil ve spor filtresiyle binlerce takım seni bulur.',
    how3_t: 'Kazan', how3_p: 'Ödeme onaylanır, üretim dosyası teslim edilir. Her satıştan %80 senin.',
    cta_title: 'Tasarımlarını para kazandıran\nbir platforma taşı.',
    cta_sub: 'Ücretsiz kaydol, ilk tasarımını bugün yayınla.',
    cta_btn: 'Hemen Başla',
    filter_sport: 'Spor Dalı', filter_color: 'Renk', filter_style: 'Stil',
    filter_pattern: 'Desen', filter_license: 'Lisans', filter_price: 'Fiyat (₺)',
    filter_clear: 'Temizle', sort_popular: 'En Popüler', sort_newest: 'En Yeni',
    sort_price_asc: 'Fiyat ↑', sort_price_desc: 'Fiyat ↓', sort_bestseller: 'Çok Satan',
    buy_btn: 'Satın Al', fav_add: '♡ Favorilere Ekle', fav_remove: '♥ Favorilerden Çıkar',
    license_std: 'Standart Lisans', license_std_desc: 'Birden fazla takım satın alabilir',
    license_excl: 'Exclusive Lisans', license_excl_desc: 'Tek kulüp alır — tasarım yayından kalkar',
    login_title: 'Giriş Yap', register_title: 'Kayıt Ol',
    field_email: 'E-posta', field_pass: 'Şifre', field_name: 'İsim', field_role: 'Hesap Tipi',
    role_designer: 'Tasarımcı', role_team: 'Takım / Kulüp',
    google_btn: 'Google ile Devam Et', logout: 'Çıkış Yap',
    upload_title: 'Tasarım Yükle', step_images: 'Görseller', step_info: 'Bilgiler',
    step_colors: 'Renkler', step_files: 'Dosyalar', step_price: 'Fiyat',
    publish_btn: 'Tasarımı Yayınla 🚀', next_btn: 'Devam Et →', back_btn_txt: '← Geri',
    copyright_check: 'Bu tasarım tamamen bana aittir ve telif hakkı bende olduğunu beyan ederim.',
    toast_fav_added: 'Favorilere eklendi ♥', toast_fav_removed: 'Favorilerden çıkarıldı',
    toast_login_required: 'Giriş yapmalısınız', toast_published: '🚀 Tasarım yüklendi! Admin onayı bekleniyor.',
    designs_found: 'tasarım bulundu', load_more: 'Daha Fazla Yükle',
    back: '← Geri', by: 'by', earnings_title: 'Kazançlar',
    dash_designs: 'Tasarım Sayısı', dash_sales: 'Toplam Satış',
    dash_likes: 'Toplam Beğeni', dash_pending: 'Onay Bekleyen',
    footer_tagline: 'Forma tasarım ekosistemi.\nTasarımcılar, takımlar ve üreticiler için.',
    footer_platform: 'Platform', footer_account: 'Hesap', footer_support: 'Destek',
    footer_copy: '© 2026 formaLOLA · Tüm hakları saklıdır',
    footer_payment: 'iyzico ile güvenli ödeme',
    sport_football: 'Futbol', sport_basketball: 'Basketbol', sport_volleyball: 'Voleybol',
    sport_esports: 'E-Spor', sport_rugby: 'Rugby', sport_american: 'Amerikan Fut.',
    welcome: 'Hoş geldin',
  },
  en: {
    code: 'en', name: 'English', flag: '🇬🇧', dir: 'ltr',
    nav_explore: 'Explore', nav_competitions: 'Competitions', nav_designers: 'Designers',
    nav_how: 'How It Works', nav_login: 'Sign In', nav_upload: '+ Upload Design',
    hero_title1: 'Sell your jersey', hero_accent1: 'design.', hero_title2: 'Find your dream',
    hero_accent2: 'kit.', hero_sub: 'Designers upload — Teams buy — Instant delivery',
    hero_btn1: 'Explore Designs', hero_btn2: 'Upload Design',
    sec_categories: 'Categories', sec_trending: 'Trending Designs',
    sec_designers: 'Featured Designers', sec_competitions: 'Active Competitions',
    see_all: 'View All →', tab_today: 'Today', tab_week: 'This Week', tab_all: 'All Time',
    how_title: 'How It Works', how1_t: 'Upload Your Design', how1_p: '4 required images, 5-step easy process. Set color, sport and license.',
    how2_t: 'Teams Discover', how2_p: 'Thousands of teams find you via color, style, and sport filters.',
    how3_t: 'Earn', how3_p: 'Payment confirmed, production files delivered. You keep 80% of each sale.',
    cta_title: 'Move your designs to a\nplatform that earns money.',
    cta_sub: 'Sign up free, publish your first design today.',
    cta_btn: 'Get Started',
    filter_sport: 'Sport', filter_color: 'Color', filter_style: 'Style',
    filter_pattern: 'Pattern', filter_license: 'License', filter_price: 'Price (₺)',
    filter_clear: 'Clear', sort_popular: 'Most Popular', sort_newest: 'Newest',
    sort_price_asc: 'Price ↑', sort_price_desc: 'Price ↓', sort_bestseller: 'Best Selling',
    buy_btn: 'Buy Now', fav_add: '♡ Add to Favorites', fav_remove: '♥ Remove from Favorites',
    license_std: 'Standard License', license_std_desc: 'Multiple teams can purchase',
    license_excl: 'Exclusive License', license_excl_desc: 'One club only — design removed after sale',
    login_title: 'Sign In', register_title: 'Register',
    field_email: 'Email', field_pass: 'Password', field_name: 'Name', field_role: 'Account Type',
    role_designer: 'Designer', role_team: 'Team / Club',
    google_btn: 'Continue with Google', logout: 'Sign Out',
    upload_title: 'Upload Design', step_images: 'Images', step_info: 'Info',
    step_colors: 'Colors', step_files: 'Files', step_price: 'Pricing',
    publish_btn: 'Publish Design 🚀', next_btn: 'Continue →', back_btn_txt: '← Back',
    copyright_check: 'This design is entirely mine and I declare that I own the copyright.',
    toast_fav_added: 'Added to favorites ♥', toast_fav_removed: 'Removed from favorites',
    toast_login_required: 'Please sign in', toast_published: '🚀 Design uploaded! Awaiting admin review.',
    designs_found: 'designs found', load_more: 'Load More',
    back: '← Back', by: 'by', earnings_title: 'Earnings',
    dash_designs: 'Total Designs', dash_sales: 'Total Sales',
    dash_likes: 'Total Likes', dash_pending: 'Pending Review',
    footer_tagline: 'Jersey design ecosystem.\nFor designers, teams and manufacturers.',
    footer_platform: 'Platform', footer_account: 'Account', footer_support: 'Support',
    footer_copy: '© 2026 formaLOLA · All rights reserved',
    footer_payment: 'Secure payment via iyzico',
    sport_football: 'Football', sport_basketball: 'Basketball', sport_volleyball: 'Volleyball',
    sport_esports: 'Esports', sport_rugby: 'Rugby', sport_american: 'American Football',
    welcome: 'Welcome',
  },
  de: {
    code: 'de', name: 'Deutsch', flag: '🇩🇪', dir: 'ltr',
    nav_explore: 'Entdecken', nav_competitions: 'Wettbewerbe', nav_designers: 'Designer',
    nav_how: 'Wie es funktioniert', nav_login: 'Anmelden', nav_upload: '+ Design hochladen',
    hero_title1: 'Verkauf dein Trikot', hero_accent1: 'design.', hero_title2: 'Finde dein Traum',
    hero_accent2: 'kit.', hero_sub: 'Designer laden hoch — Teams kaufen — Sofortige Lieferung',
    hero_btn1: 'Designs entdecken', hero_btn2: 'Design hochladen',
    sec_categories: 'Kategorien', sec_trending: 'Trenddesigns',
    sec_designers: 'Ausgewählte Designer', sec_competitions: 'Aktive Wettbewerbe',
    see_all: 'Alle anzeigen →', tab_today: 'Heute', tab_week: 'Diese Woche', tab_all: 'Alle Zeit',
    how_title: 'Wie es funktioniert', how1_t: 'Design hochladen', how1_p: '4 erforderliche Bilder, 5-stufiger Prozess.',
    how2_t: 'Teams entdecken', how2_p: 'Tausende Teams finden dich über Filter.',
    how3_t: 'Verdienen', how3_p: 'Zahlung bestätigt, Dateien geliefert. 80% gehören dir.',
    cta_title: 'Bring deine Designs auf eine\nPlattform, die Geld verdient.',
    cta_sub: 'Kostenlos registrieren, erstes Design heute veröffentlichen.',
    cta_btn: 'Jetzt starten',
    filter_sport: 'Sport', filter_color: 'Farbe', filter_style: 'Stil',
    filter_pattern: 'Muster', filter_license: 'Lizenz', filter_price: 'Preis (₺)',
    filter_clear: 'Zurücksetzen', sort_popular: 'Beliebteste', sort_newest: 'Neueste',
    sort_price_asc: 'Preis ↑', sort_price_desc: 'Preis ↓', sort_bestseller: 'Bestseller',
    buy_btn: 'Kaufen', fav_add: '♡ Favoriten', fav_remove: '♥ Aus Favoriten',
    license_std: 'Standardlizenz', license_std_desc: 'Mehrere Teams können kaufen',
    license_excl: 'Exklusivlizenz', license_excl_desc: 'Nur ein Verein — wird nach Kauf entfernt',
    login_title: 'Anmelden', register_title: 'Registrieren',
    field_email: 'E-Mail', field_pass: 'Passwort', field_name: 'Name', field_role: 'Kontotyp',
    role_designer: 'Designer', role_team: 'Team / Verein',
    google_btn: 'Mit Google fortfahren', logout: 'Abmelden',
    upload_title: 'Design hochladen', step_images: 'Bilder', step_info: 'Info',
    step_colors: 'Farben', step_files: 'Dateien', step_price: 'Preis',
    publish_btn: 'Design veröffentlichen 🚀', next_btn: 'Weiter →', back_btn_txt: '← Zurück',
    copyright_check: 'Dieses Design gehört mir und ich erkläre das Urheberrecht.',
    toast_fav_added: 'Zu Favoriten hinzugefügt ♥', toast_fav_removed: 'Aus Favoriten entfernt',
    toast_login_required: 'Bitte anmelden', toast_published: '🚀 Design hochgeladen! Warten auf Genehmigung.',
    designs_found: 'Designs gefunden', load_more: 'Mehr laden',
    back: '← Zurück', by: 'von', earnings_title: 'Einnahmen',
    dash_designs: 'Designs', dash_sales: 'Verkäufe', dash_likes: 'Likes', dash_pending: 'Ausstehend',
    footer_tagline: 'Trikot-Design-Ökosystem.', footer_platform: 'Plattform',
    footer_account: 'Konto', footer_support: 'Support',
    footer_copy: '© 2026 formaLOLA · Alle Rechte vorbehalten',
    footer_payment: 'Sichere Zahlung via iyzico',
    sport_football: 'Fußball', sport_basketball: 'Basketball', sport_volleyball: 'Volleyball',
    sport_esports: 'Esports', sport_rugby: 'Rugby', sport_american: 'American Football',
    welcome: 'Willkommen',
  },
  fr: {
    code: 'fr', name: 'Français', flag: '🇫🇷', dir: 'ltr',
    nav_explore: 'Explorer', nav_competitions: 'Compétitions', nav_designers: 'Designers',
    nav_how: 'Comment ça marche', nav_login: 'Connexion', nav_upload: '+ Uploader un design',
    hero_title1: 'Vendez votre design', hero_accent1: 'de maillot.', hero_title2: 'Trouvez votre',
    hero_accent2: 'kit idéal.', hero_sub: 'Les designers uploadent — Les équipes achètent — Livraison instantanée',
    hero_btn1: 'Explorer les designs', hero_btn2: 'Uploader un design',
    sec_categories: 'Catégories', sec_trending: 'Designs tendance',
    sec_designers: 'Designers en vedette', sec_competitions: 'Compétitions actives',
    see_all: 'Voir tout →', tab_today: "Aujourd'hui", tab_week: 'Cette semaine', tab_all: 'Tout le temps',
    how_title: 'Comment ça marche', how1_t: 'Uploadez votre design', how1_p: '4 images requises, processus en 5 étapes.',
    how2_t: 'Les équipes découvrent', how2_p: 'Des milliers d\'équipes vous trouvent via les filtres.',
    how3_t: 'Gagnez', how3_p: 'Paiement confirmé, fichiers livrés. 80% pour vous.',
    cta_title: 'Déplacez vos designs vers\nune plateforme qui rapporte.',
    cta_sub: 'Inscrivez-vous gratuitement, publiez aujourd\'hui.',
    cta_btn: 'Commencer',
    filter_sport: 'Sport', filter_color: 'Couleur', filter_style: 'Style',
    filter_pattern: 'Motif', filter_license: 'Licence', filter_price: 'Prix (₺)',
    filter_clear: 'Effacer', sort_popular: 'Plus populaires', sort_newest: 'Plus récents',
    sort_price_asc: 'Prix ↑', sort_price_desc: 'Prix ↓', sort_bestseller: 'Meilleures ventes',
    buy_btn: 'Acheter', fav_add: '♡ Favoris', fav_remove: '♥ Retirer des favoris',
    license_std: 'Licence standard', license_std_desc: 'Plusieurs équipes peuvent acheter',
    license_excl: 'Licence exclusive', license_excl_desc: 'Un seul club — retiré après vente',
    login_title: 'Connexion', register_title: 'Inscription',
    field_email: 'E-mail', field_pass: 'Mot de passe', field_name: 'Nom', field_role: 'Type de compte',
    role_designer: 'Designer', role_team: 'Équipe / Club',
    google_btn: 'Continuer avec Google', logout: 'Déconnexion',
    upload_title: 'Uploader un design', step_images: 'Images', step_info: 'Infos',
    step_colors: 'Couleurs', step_files: 'Fichiers', step_price: 'Tarif',
    publish_btn: 'Publier le design 🚀', next_btn: 'Continuer →', back_btn_txt: '← Retour',
    copyright_check: 'Ce design m\'appartient entièrement et j\'en détiens les droits.',
    toast_fav_added: 'Ajouté aux favoris ♥', toast_fav_removed: 'Retiré des favoris',
    toast_login_required: 'Veuillez vous connecter', toast_published: '🚀 Design uploadé! En attente d\'approbation.',
    designs_found: 'designs trouvés', load_more: 'Charger plus',
    back: '← Retour', by: 'par', earnings_title: 'Revenus',
    dash_designs: 'Designs', dash_sales: 'Ventes', dash_likes: 'Likes', dash_pending: 'En attente',
    footer_tagline: 'Écosystème de design de maillots.', footer_platform: 'Plateforme',
    footer_account: 'Compte', footer_support: 'Support',
    footer_copy: '© 2026 formaLOLA · Tous droits réservés',
    footer_payment: 'Paiement sécurisé via iyzico',
    sport_football: 'Football', sport_basketball: 'Basketball', sport_volleyball: 'Volleyball',
    sport_esports: 'Esports', sport_rugby: 'Rugby', sport_american: 'Football américain',
    welcome: 'Bienvenue',
  },
  es: {
    code: 'es', name: 'Español', flag: '🇪🇸', dir: 'ltr',
    nav_explore: 'Explorar', nav_competitions: 'Competiciones', nav_designers: 'Diseñadores',
    nav_how: 'Cómo funciona', nav_login: 'Iniciar sesión', nav_upload: '+ Subir diseño',
    hero_title1: 'Vende tu diseño', hero_accent1: 'de camiseta.', hero_title2: 'Encuentra tu',
    hero_accent2: 'kit ideal.', hero_sub: 'Diseñadores suben — Equipos compran — Entrega instantánea',
    hero_btn1: 'Explorar diseños', hero_btn2: 'Subir diseño',
    sec_categories: 'Categorías', sec_trending: 'Diseños tendencia',
    sec_designers: 'Diseñadores destacados', sec_competitions: 'Competiciones activas',
    see_all: 'Ver todo →', tab_today: 'Hoy', tab_week: 'Esta semana', tab_all: 'Todo el tiempo',
    how_title: 'Cómo funciona', how1_t: 'Sube tu diseño', how1_p: '4 imágenes requeridas, proceso de 5 pasos.',
    how2_t: 'Los equipos descubren', how2_p: 'Miles de equipos te encuentran con filtros.',
    how3_t: 'Gana dinero', how3_p: 'Pago confirmado, archivos entregados. 80% para ti.',
    cta_title: 'Lleva tus diseños a una\nplataforma que genera dinero.',
    cta_sub: 'Regístrate gratis, publica hoy.',
    cta_btn: 'Empezar ahora',
    filter_sport: 'Deporte', filter_color: 'Color', filter_style: 'Estilo',
    filter_pattern: 'Patrón', filter_license: 'Licencia', filter_price: 'Precio (₺)',
    filter_clear: 'Limpiar', sort_popular: 'Más populares', sort_newest: 'Más recientes',
    sort_price_asc: 'Precio ↑', sort_price_desc: 'Precio ↓', sort_bestseller: 'Más vendidos',
    buy_btn: 'Comprar', fav_add: '♡ Favoritos', fav_remove: '♥ Quitar de favoritos',
    license_std: 'Licencia estándar', license_std_desc: 'Varios equipos pueden comprar',
    license_excl: 'Licencia exclusiva', license_excl_desc: 'Solo un club — eliminado tras la venta',
    login_title: 'Iniciar sesión', register_title: 'Registrarse',
    field_email: 'Correo', field_pass: 'Contraseña', field_name: 'Nombre', field_role: 'Tipo de cuenta',
    role_designer: 'Diseñador', role_team: 'Equipo / Club',
    google_btn: 'Continuar con Google', logout: 'Cerrar sesión',
    upload_title: 'Subir diseño', step_images: 'Imágenes', step_info: 'Info',
    step_colors: 'Colores', step_files: 'Archivos', step_price: 'Precio',
    publish_btn: 'Publicar diseño 🚀', next_btn: 'Continuar →', back_btn_txt: '← Atrás',
    copyright_check: 'Este diseño es completamente mío y declaro tener los derechos de autor.',
    toast_fav_added: 'Añadido a favoritos ♥', toast_fav_removed: 'Eliminado de favoritos',
    toast_login_required: 'Por favor inicia sesión', toast_published: '🚀 ¡Diseño subido! Esperando aprobación.',
    designs_found: 'diseños encontrados', load_more: 'Cargar más',
    back: '← Atrás', by: 'por', earnings_title: 'Ganancias',
    dash_designs: 'Diseños', dash_sales: 'Ventas', dash_likes: 'Likes', dash_pending: 'Pendiente',
    footer_tagline: 'Ecosistema de diseño de camisetas.', footer_platform: 'Plataforma',
    footer_account: 'Cuenta', footer_support: 'Soporte',
    footer_copy: '© 2026 formaLOLA · Todos los derechos reservados',
    footer_payment: 'Pago seguro via iyzico',
    sport_football: 'Fútbol', sport_basketball: 'Baloncesto', sport_volleyball: 'Voleibol',
    sport_esports: 'Esports', sport_rugby: 'Rugby', sport_american: 'Fútbol americano',
    welcome: 'Bienvenido',
  },
  ar: {
    code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl',
    nav_explore: 'استكشف', nav_competitions: 'المسابقات', nav_designers: 'المصممون',
    nav_how: 'كيف يعمل', nav_login: 'تسجيل الدخول', nav_upload: '+ رفع تصميم',
    hero_title1: 'بع تصميم', hero_accent1: 'قميصك.', hero_title2: 'اعثر على',
    hero_accent2: 'طقمك.', hero_sub: 'المصممون يرفعون — الفرق تشتري — تسليم فوري',
    hero_btn1: 'استكشف التصاميم', hero_btn2: 'رفع تصميم',
    sec_categories: 'الفئات', sec_trending: 'تصاميم رائجة',
    sec_designers: 'مصممون مميزون', sec_competitions: 'مسابقات نشطة',
    see_all: 'عرض الكل →', tab_today: 'اليوم', tab_week: 'هذا الأسبوع', tab_all: 'كل الوقت',
    how_title: 'كيف يعمل', how1_t: 'ارفع تصميمك', how1_p: '4 صور مطلوبة، عملية من 5 خطوات.',
    how2_t: 'الفرق تكتشف', how2_p: 'آلاف الفرق تجدك عبر الفلاتر.',
    how3_t: 'اكسب', how3_p: 'تأكيد الدفع، تسليم الملفات. 80٪ لك.',
    cta_title: 'انقل تصاميمك إلى منصة\nتجني المال.',
    cta_sub: 'سجّل مجاناً، انشر أول تصميم اليوم.',
    cta_btn: 'ابدأ الآن',
    filter_sport: 'الرياضة', filter_color: 'اللون', filter_style: 'الأسلوب',
    filter_pattern: 'النمط', filter_license: 'الترخيص', filter_price: 'السعر (₺)',
    filter_clear: 'مسح', sort_popular: 'الأكثر شهرة', sort_newest: 'الأحدث',
    sort_price_asc: 'السعر ↑', sort_price_desc: 'السعر ↓', sort_bestseller: 'الأكثر مبيعاً',
    buy_btn: 'شراء', fav_add: '♡ إضافة للمفضلة', fav_remove: '♥ إزالة من المفضلة',
    license_std: 'ترخيص قياسي', license_std_desc: 'يمكن لعدة فرق الشراء',
    license_excl: 'ترخيص حصري', license_excl_desc: 'نادٍ واحد فقط — يُزال بعد البيع',
    login_title: 'تسجيل الدخول', register_title: 'إنشاء حساب',
    field_email: 'البريد الإلكتروني', field_pass: 'كلمة المرور', field_name: 'الاسم', field_role: 'نوع الحساب',
    role_designer: 'مصمم', role_team: 'فريق / نادٍ',
    google_btn: 'المتابعة مع Google', logout: 'تسجيل الخروج',
    upload_title: 'رفع تصميم', step_images: 'الصور', step_info: 'المعلومات',
    step_colors: 'الألوان', step_files: 'الملفات', step_price: 'السعر',
    publish_btn: 'نشر التصميم 🚀', next_btn: 'متابعة →', back_btn_txt: '← رجوع',
    copyright_check: 'هذا التصميم ملكي تماماً وأعلن حقوق النشر.',
    toast_fav_added: 'أُضيف إلى المفضلة ♥', toast_fav_removed: 'أُزيل من المفضلة',
    toast_login_required: 'يرجى تسجيل الدخول', toast_published: '🚀 تم رفع التصميم! بانتظار الموافقة.',
    designs_found: 'تصميم موجود', load_more: 'تحميل المزيد',
    back: '← رجوع', by: 'بقلم', earnings_title: 'الأرباح',
    dash_designs: 'التصاميم', dash_sales: 'المبيعات', dash_likes: 'الإعجابات', dash_pending: 'قيد المراجعة',
    footer_tagline: 'منظومة تصميم القمصان.', footer_platform: 'المنصة',
    footer_account: 'الحساب', footer_support: 'الدعم',
    footer_copy: '© 2026 formaLOLA · جميع الحقوق محفوظة',
    footer_payment: 'دفع آمن عبر iyzico',
    sport_football: 'كرة القدم', sport_basketball: 'كرة السلة', sport_volleyball: 'كرة الطائرة',
    sport_esports: 'رياضات إلكترونية', sport_rugby: 'الرجبي', sport_american: 'كرة القدم الأمريكية',
    welcome: 'مرحباً',
  },
  pt: {
    code: 'pt', name: 'Português', flag: '🇧🇷', dir: 'ltr',
    nav_explore: 'Explorar', nav_competitions: 'Competições', nav_designers: 'Designers',
    nav_how: 'Como funciona', nav_login: 'Entrar', nav_upload: '+ Enviar design',
    hero_title1: 'Venda seu design', hero_accent1: 'de camisa.', hero_title2: 'Encontre seu',
    hero_accent2: 'kit ideal.', hero_sub: 'Designers enviam — Times compram — Entrega instantânea',
    hero_btn1: 'Explorar designs', hero_btn2: 'Enviar design',
    sec_categories: 'Categorias', sec_trending: 'Designs em alta',
    sec_designers: 'Designers em destaque', sec_competitions: 'Competições ativas',
    see_all: 'Ver tudo →', tab_today: 'Hoje', tab_week: 'Esta semana', tab_all: 'Todos os tempos',
    how_title: 'Como funciona', how1_t: 'Envie seu design', how1_p: '4 imagens obrigatórias, processo em 5 etapas.',
    how2_t: 'Times descobrem', how2_p: 'Milhares de times te encontram com filtros.',
    how3_t: 'Ganhe', how3_p: 'Pagamento confirmado, arquivos entregues. 80% é seu.',
    cta_title: 'Leve seus designs para uma\nplataforma que gera dinheiro.',
    cta_sub: 'Cadastre-se grátis, publique hoje.',
    cta_btn: 'Começar agora',
    filter_sport: 'Esporte', filter_color: 'Cor', filter_style: 'Estilo',
    filter_pattern: 'Padrão', filter_license: 'Licença', filter_price: 'Preço (₺)',
    filter_clear: 'Limpar', sort_popular: 'Mais populares', sort_newest: 'Mais recentes',
    sort_price_asc: 'Preço ↑', sort_price_desc: 'Preço ↓', sort_bestseller: 'Mais vendidos',
    buy_btn: 'Comprar', fav_add: '♡ Favoritos', fav_remove: '♥ Remover dos favoritos',
    license_std: 'Licença padrão', license_std_desc: 'Vários times podem comprar',
    license_excl: 'Licença exclusiva', license_excl_desc: 'Apenas um clube — removido após venda',
    login_title: 'Entrar', register_title: 'Cadastrar',
    field_email: 'E-mail', field_pass: 'Senha', field_name: 'Nome', field_role: 'Tipo de conta',
    role_designer: 'Designer', role_team: 'Time / Clube',
    google_btn: 'Continuar com Google', logout: 'Sair',
    upload_title: 'Enviar design', step_images: 'Imagens', step_info: 'Info',
    step_colors: 'Cores', step_files: 'Arquivos', step_price: 'Preço',
    publish_btn: 'Publicar design 🚀', next_btn: 'Continuar →', back_btn_txt: '← Voltar',
    copyright_check: 'Este design é totalmente meu e declaro que detenho os direitos autorais.',
    toast_fav_added: 'Adicionado aos favoritos ♥', toast_fav_removed: 'Removido dos favoritos',
    toast_login_required: 'Por favor faça login', toast_published: '🚀 Design enviado! Aguardando aprovação.',
    designs_found: 'designs encontrados', load_more: 'Carregar mais',
    back: '← Voltar', by: 'por', earnings_title: 'Ganhos',
    dash_designs: 'Designs', dash_sales: 'Vendas', dash_likes: 'Curtidas', dash_pending: 'Pendente',
    footer_tagline: 'Ecossistema de design de camisas.', footer_platform: 'Plataforma',
    footer_account: 'Conta', footer_support: 'Suporte',
    footer_copy: '© 2026 formaLOLA · Todos os direitos reservados',
    footer_payment: 'Pagamento seguro via iyzico',
    sport_football: 'Futebol', sport_basketball: 'Basquete', sport_volleyball: 'Vôlei',
    sport_esports: 'Esports', sport_rugby: 'Rugby', sport_american: 'Futebol americano',
    welcome: 'Bem-vindo',
  },
  it: {
    code: 'it', name: 'Italiano', flag: '🇮🇹', dir: 'ltr',
    nav_explore: 'Esplora', nav_competitions: 'Competizioni', nav_designers: 'Designer',
    nav_how: 'Come funziona', nav_login: 'Accedi', nav_upload: '+ Carica design',
    hero_title1: 'Vendi il tuo design', hero_accent1: 'di maglia.', hero_title2: 'Trova il tuo',
    hero_accent2: 'kit ideale.', hero_sub: 'I designer caricano — Le squadre comprano — Consegna istantanea',
    hero_btn1: 'Esplora i design', hero_btn2: 'Carica design',
    sec_categories: 'Categorie', sec_trending: 'Design di tendenza',
    sec_designers: 'Designer in evidenza', sec_competitions: 'Competizioni attive',
    see_all: 'Vedi tutto →', tab_today: 'Oggi', tab_week: 'Questa settimana', tab_all: 'Sempre',
    how_title: 'Come funziona', how1_t: 'Carica il tuo design', how1_p: '4 immagini richieste, processo in 5 passaggi.',
    how2_t: 'Le squadre scoprono', how2_p: 'Migliaia di squadre ti trovano tramite filtri.',
    how3_t: 'Guadagna', how3_p: 'Pagamento confermato, file consegnati. L\'80% è tuo.',
    cta_title: 'Porta i tuoi design su una\npiattaforma che guadagna.',
    cta_sub: 'Registrati gratis, pubblica oggi.',
    cta_btn: 'Inizia ora',
    filter_sport: 'Sport', filter_color: 'Colore', filter_style: 'Stile',
    filter_pattern: 'Motivo', filter_license: 'Licenza', filter_price: 'Prezzo (₺)',
    filter_clear: 'Cancella', sort_popular: 'Più popolari', sort_newest: 'Più recenti',
    sort_price_asc: 'Prezzo ↑', sort_price_desc: 'Prezzo ↓', sort_bestseller: 'Più venduti',
    buy_btn: 'Acquista', fav_add: '♡ Preferiti', fav_remove: '♥ Rimuovi dai preferiti',
    license_std: 'Licenza standard', license_std_desc: 'Più squadre possono acquistare',
    license_excl: 'Licenza esclusiva', license_excl_desc: 'Solo un club — rimosso dopo la vendita',
    login_title: 'Accedi', register_title: 'Registrati',
    field_email: 'E-mail', field_pass: 'Password', field_name: 'Nome', field_role: 'Tipo di account',
    role_designer: 'Designer', role_team: 'Squadra / Club',
    google_btn: 'Continua con Google', logout: 'Esci',
    upload_title: 'Carica design', step_images: 'Immagini', step_info: 'Info',
    step_colors: 'Colori', step_files: 'File', step_price: 'Prezzo',
    publish_btn: 'Pubblica design 🚀', next_btn: 'Continua →', back_btn_txt: '← Indietro',
    copyright_check: 'Questo design è completamente mio e dichiaro di possederne il copyright.',
    toast_fav_added: 'Aggiunto ai preferiti ♥', toast_fav_removed: 'Rimosso dai preferiti',
    toast_login_required: 'Effettua il login', toast_published: '🚀 Design caricato! In attesa di approvazione.',
    designs_found: 'design trovati', load_more: 'Carica altro',
    back: '← Indietro', by: 'di', earnings_title: 'Guadagni',
    dash_designs: 'Design', dash_sales: 'Vendite', dash_likes: 'Like', dash_pending: 'In attesa',
    footer_tagline: 'Ecosistema di design di maglie.', footer_platform: 'Piattaforma',
    footer_account: 'Account', footer_support: 'Supporto',
    footer_copy: '© 2026 formaLOLA · Tutti i diritti riservati',
    footer_payment: 'Pagamento sicuro via iyzico',
    sport_football: 'Calcio', sport_basketball: 'Basket', sport_volleyball: 'Pallavolo',
    sport_esports: 'Esports', sport_rugby: 'Rugby', sport_american: 'Football americano',
    welcome: 'Benvenuto',
  },
  ru: {
    code: 'ru', name: 'Русский', flag: '🇷🇺', dir: 'ltr',
    nav_explore: 'Обзор', nav_competitions: 'Конкурсы', nav_designers: 'Дизайнеры',
    nav_how: 'Как это работает', nav_login: 'Войти', nav_upload: '+ Загрузить дизайн',
    hero_title1: 'Продай свой дизайн', hero_accent1: 'формы.', hero_title2: 'Найди свой',
    hero_accent2: 'идеальный комплект.', hero_sub: 'Дизайнеры загружают — Команды покупают — Мгновенная доставка',
    hero_btn1: 'Обзор дизайнов', hero_btn2: 'Загрузить дизайн',
    sec_categories: 'Категории', sec_trending: 'Трендовые дизайны',
    sec_designers: 'Избранные дизайнеры', sec_competitions: 'Активные конкурсы',
    see_all: 'Смотреть всё →', tab_today: 'Сегодня', tab_week: 'На этой неделе', tab_all: 'Всё время',
    how_title: 'Как это работает', how1_t: 'Загрузи дизайн', how1_p: '4 обязательных изображения, 5 шагов.',
    how2_t: 'Команды находят', how2_p: 'Тысячи команд находят тебя через фильтры.',
    how3_t: 'Зарабатывай', how3_p: 'Оплата подтверждена, файлы доставлены. 80% твои.',
    cta_title: 'Переведи свои дизайны на\nплатформу, которая зарабатывает.',
    cta_sub: 'Зарегистрируйся бесплатно, опубликуй сегодня.',
    cta_btn: 'Начать',
    filter_sport: 'Спорт', filter_color: 'Цвет', filter_style: 'Стиль',
    filter_pattern: 'Узор', filter_license: 'Лицензия', filter_price: 'Цена (₺)',
    filter_clear: 'Очистить', sort_popular: 'Популярные', sort_newest: 'Новейшие',
    sort_price_asc: 'Цена ↑', sort_price_desc: 'Цена ↓', sort_bestseller: 'Бестселлеры',
    buy_btn: 'Купить', fav_add: '♡ В избранное', fav_remove: '♥ Из избранного',
    license_std: 'Стандартная лицензия', license_std_desc: 'Несколько команд могут купить',
    license_excl: 'Эксклюзивная лицензия', license_excl_desc: 'Только один клуб — удаляется после продажи',
    login_title: 'Войти', register_title: 'Регистрация',
    field_email: 'Эл. почта', field_pass: 'Пароль', field_name: 'Имя', field_role: 'Тип аккаунта',
    role_designer: 'Дизайнер', role_team: 'Команда / Клуб',
    google_btn: 'Продолжить с Google', logout: 'Выйти',
    upload_title: 'Загрузить дизайн', step_images: 'Изображения', step_info: 'Инфо',
    step_colors: 'Цвета', step_files: 'Файлы', step_price: 'Цена',
    publish_btn: 'Опубликовать 🚀', next_btn: 'Далее →', back_btn_txt: '← Назад',
    copyright_check: 'Этот дизайн полностью мой и я заявляю об авторских правах.',
    toast_fav_added: 'Добавлено в избранное ♥', toast_fav_removed: 'Удалено из избранного',
    toast_login_required: 'Пожалуйста войдите', toast_published: '🚀 Дизайн загружен! Ожидает одобрения.',
    designs_found: 'дизайнов найдено', load_more: 'Загрузить ещё',
    back: '← Назад', by: 'by', earnings_title: 'Доходы',
    dash_designs: 'Дизайны', dash_sales: 'Продажи', dash_likes: 'Лайки', dash_pending: 'На проверке',
    footer_tagline: 'Экосистема дизайна форм.', footer_platform: 'Платформа',
    footer_account: 'Аккаунт', footer_support: 'Поддержка',
    footer_copy: '© 2026 formaLOLA · Все права защищены',
    footer_payment: 'Безопасная оплата через iyzico',
    sport_football: 'Футбол', sport_basketball: 'Баскетбол', sport_volleyball: 'Волейбол',
    sport_esports: 'Киберспорт', sport_rugby: 'Регби', sport_american: 'Американский футбол',
    welcome: 'Добро пожаловать',
  },
  ja: {
    code: 'ja', name: '日本語', flag: '🇯🇵', dir: 'ltr',
    nav_explore: '探索', nav_competitions: 'コンテスト', nav_designers: 'デザイナー',
    nav_how: '仕組み', nav_login: 'ログイン', nav_upload: '+ デザインをアップ',
    hero_title1: 'ユニフォームデザインを', hero_accent1: '売ろう。', hero_title2: '理想の',
    hero_accent2: 'キットを見つけよう。', hero_sub: 'デザイナーがアップ — チームが購入 — 即座に届く',
    hero_btn1: 'デザインを探す', hero_btn2: 'デザインをアップ',
    sec_categories: 'カテゴリ', sec_trending: 'トレンドデザイン',
    sec_designers: '注目デザイナー', sec_competitions: 'アクティブコンテスト',
    see_all: 'すべて見る →', tab_today: '今日', tab_week: '今週', tab_all: '全期間',
    how_title: '仕組み', how1_t: 'デザインをアップ', how1_p: '4枚の必須画像、5ステップの簡単プロセス。',
    how2_t: 'チームが発見', how2_p: '何千ものチームがフィルターであなたを見つける。',
    how3_t: '稼ぐ', how3_p: '支払い確認、ファイル納品。売上の80%があなたのもの。',
    cta_title: 'デザインを収益化できる\nプラットフォームに移行しよう。',
    cta_sub: '無料登録、今日最初のデザインを公開。',
    cta_btn: '今すぐ始める',
    filter_sport: 'スポーツ', filter_color: '色', filter_style: 'スタイル',
    filter_pattern: 'パターン', filter_license: 'ライセンス', filter_price: '価格 (₺)',
    filter_clear: 'クリア', sort_popular: '人気順', sort_newest: '新着順',
    sort_price_asc: '価格 ↑', sort_price_desc: '価格 ↓', sort_bestseller: 'ベストセラー',
    buy_btn: '購入', fav_add: '♡ お気に入り', fav_remove: '♥ お気に入りから削除',
    license_std: 'スタンダードライセンス', license_std_desc: '複数のチームが購入可能',
    license_excl: 'エクスクルーシブライセンス', license_excl_desc: '1クラブのみ — 販売後に削除',
    login_title: 'ログイン', register_title: '登録',
    field_email: 'メール', field_pass: 'パスワード', field_name: '名前', field_role: 'アカウントタイプ',
    role_designer: 'デザイナー', role_team: 'チーム / クラブ',
    google_btn: 'Googleで続ける', logout: 'ログアウト',
    upload_title: 'デザインをアップ', step_images: '画像', step_info: '情報',
    step_colors: '色', step_files: 'ファイル', step_price: '価格',
    publish_btn: 'デザインを公開 🚀', next_btn: '次へ →', back_btn_txt: '← 戻る',
    copyright_check: 'このデザインは完全に私のものであり、著作権を所有することを宣言します。',
    toast_fav_added: 'お気に入りに追加 ♥', toast_fav_removed: 'お気に入りから削除',
    toast_login_required: 'ログインしてください', toast_published: '🚀 デザインがアップされました！承認待ちです。',
    designs_found: 'デザインが見つかりました', load_more: 'もっと読み込む',
    back: '← 戻る', by: 'by', earnings_title: '収益',
    dash_designs: 'デザイン', dash_sales: '売上', dash_likes: 'いいね', dash_pending: '審査中',
    footer_tagline: 'ユニフォームデザインエコシステム。', footer_platform: 'プラットフォーム',
    footer_account: 'アカウント', footer_support: 'サポート',
    footer_copy: '© 2026 formaLOLA · 全著作権所有',
    footer_payment: 'iyzico経由の安全な支払い',
    sport_football: 'サッカー', sport_basketball: 'バスケ', sport_volleyball: 'バレー',
    sport_esports: 'eスポーツ', sport_rugby: 'ラグビー', sport_american: 'アメフト',
    welcome: 'ようこそ',
  },
};

// Aktif dil state
let currentLang = localStorage.getItem('fl_lang') || 'tr';
let t = LANGS[currentLang] || LANGS.tr; // aktif çeviri kısayolu

function setLang(code) {
  if (!LANGS[code]) return;
  currentLang = code;
  t = LANGS[code];
  localStorage.setItem('fl_lang', code);
  document.documentElement.lang = code;
  document.documentElement.dir = t.dir || 'ltr';
  document.body.classList.toggle('rtl', t.dir === 'rtl');
  // Dil butonunu güncelle
  const btnTxt = document.getElementById('langBtnTxt');
  if (btnTxt) btnTxt.textContent = code.toUpperCase();
  const _lb=document.getElementById('langBtnTxt'); if(_lb) _lb.textContent=code.toUpperCase();
  document.body.classList.toggle('rtl', t.dir==='rtl');
  applyLangToPage();
  buildLangModal(); // aktif olanı güncelle
  closeModal('langModal');
  showToast(`${t.flag} ${t.name}`, '');
}

function applyLangToPage() {
  // Nav
  setTxt('nav-explore-txt', t.nav_explore);
  setTxt('nav-competitions-txt', t.nav_competitions);
  setTxt('nav-designers-txt', t.nav_designers);
  setTxt('nav-how-txt', t.nav_how);
  setTxt('navLoginBtn', t.nav_login);
  setTxt('nav-upload-btn', t.nav_upload);
  // Dil butonu
  setTxt('langBtnTxt', t.code.toUpperCase());
  // Hero
  setTxt('hero-t1', t.hero_title1);
  setTxt('hero-a1', t.hero_accent1);
  setTxt('hero-t2', t.hero_title2);
  setTxt('hero-a2', t.hero_accent2);
  setTxt('hero-sub-txt', t.hero_sub);
  setTxt('hero-btn1', t.hero_btn1);
  setTxt('hero-btn2', t.hero_btn2);
  // Sections
  setTxt('sec-cats-title', t.sec_categories);
  setTxt('sec-trend-title', t.sec_trending);
  setTxt('sec-designers-title', t.sec_designers);
  setTxt('sec-comps-title', t.sec_competitions);
  // How
  setTxt('how-main-title', t.how_title);
  setTxt('how1-title', t.how1_t); setTxt('how1-p', t.how1_p);
  setTxt('how2-title', t.how2_t); setTxt('how2-p', t.how2_p);
  setTxt('how3-title', t.how3_t); setTxt('how3-p', t.how3_p);
  // CTA
  setTxt('cta-title-txt', t.cta_title);
  setTxt('cta-sub-txt', t.cta_sub);
  setTxt('cta-btn-txt', t.cta_btn);
  // Filters
  setTxt('fp-label-sport', t.filter_sport);
  setTxt('fp-label-color', t.filter_color);
  setTxt('fp-label-style', t.filter_style);
  setTxt('fp-label-pattern', t.filter_pattern);
  setTxt('fp-label-license', t.filter_license);
  setTxt('fp-label-price', t.filter_price);
  setTxt('fp-clear-btn', t.filter_clear);
  // Sort
  const sortSel = document.getElementById('sortSel');
  if (sortSel) {
    sortSel.options[0].text = t.sort_popular;
    sortSel.options[1].text = t.sort_newest;
    sortSel.options[2].text = t.sort_price_asc;
    sortSel.options[3].text = t.sort_price_desc;
    sortSel.options[4].text = t.sort_bestseller;
  }
  // Load more
  setTxt('load-more-btn', t.load_more);
  // Upload modal
  setTxt('upload-modal-title', t.upload_title);
  setTxt('ws1', `1 · ${t.step_images}`);
  setTxt('ws2', `2 · ${t.step_info}`);
  setTxt('ws3', `3 · ${t.step_colors}`);
  setTxt('ws4', `4 · ${t.step_files}`);
  setTxt('ws5', `5 · ${t.step_price}`);
  // Login modal
  setTxt('login-modal-tab', t.login_title);
  setTxt('register-modal-tab', t.register_title);
  // Footer
  setTxt('footer-copy-txt', t.footer_copy);
  setTxt('footer-payment-txt', t.footer_payment);
  // RTL desteği için body class
  document.body.classList.toggle('rtl', t.dir === 'rtl');
  // Gridi yenile (çeviri gerektiren kartlar için)
  renderHomeDesigns();
  if (currentPage === 'explore') applyFilters();
}

function setTxt(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined) el.textContent = val;
}

// Dil seçici modal — langGrid doldur sonra aç
function openLangModal() {
  buildLangModal(); // her zaman güncel grid
  showModal('langModal');
}

function buildLangModal() {
  const grid = document.getElementById('langGrid');
  if (!grid) return;
  grid.innerHTML = Object.values(LANGS).map(l => `
    <button class="lang-option ${l.code === currentLang ? 'active' : ''}"
      data-lang="${l.code}"
      onclick="setLang('${l.code}')">
      <span class="lang-flag">${l.flag}</span>
      <span class="lang-name">${l.name}</span>
      ${l.code === currentLang ? '<span class="lang-check">✓</span>' : ''}
    </button>
  `).join('');
}

/* ══════════ INIT ══════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Dil sistemini başlat
  t = LANGS[currentLang] || LANGS.tr;
  document.documentElement.lang = currentLang;
  document.documentElement.dir = t.dir || 'ltr';
  document.body.classList.toggle('rtl', t.dir === 'rtl');
  // Dil butonu metnini ayarla
  const langBtn = document.getElementById('langBtnTxt');
  if (langBtn) langBtn.textContent = currentLang.toUpperCase();
  const _initLb=document.getElementById('langBtnTxt'); if(_initLb) _initLb.textContent=currentLang.toUpperCase();
  buildLangModal();
  applyLangToPage();

  renderHomeDesigns();
  renderSpotlight();
  renderHomeComps();
  calcEarnings();
  bindUploadPreviewEvents();
  initScrollNav();
  fetchApprovedDesigns();
  loadPlatformStats();
  // Review textarea karakter sayacı
  const rt = document.getElementById('reviewText');
  if (rt) rt.addEventListener('input', () => {
    const cc = document.getElementById('reviewCharCount');
    if (cc) cc.textContent = `${rt.value.length}/500`;
  });
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
    // orderBy kaldırıldı — Firestore composite index gerektiriyor ve sessizce boş dönüyor.
    // Sıralama JS tarafında yapılıyor.
    const snapshot = await db.collection('designs').where('status', '==', 'approved').get();
    const realDesigns = [];

    snapshot.forEach(doc => {
      const d = doc.data();
      const col1 = (d.colors && d.colors[0]) || '#1f1f26';
      const col2 = (d.colors && d.colors[1]) || '#0c0c0e';
      realDesigns.push({
        id: doc.id,
        title: d.title || 'Tasarım',
        designer: d.designerName || 'Anonim',
        designerInitials: d.designerInitials || '?',
        sport: d.sport || 'Futbol',
        style: d.style || 'modern',
        pattern: d.pattern || 'minimal',
        colors: d.colors || [],
        price: d.price || 0,
        exclusivePrice: d.exclusivePrice || 0,
        sales: d.sales || 0,
        likes: d.likes || 0,
        license: d.exclusivePrice > 0 ? 'exclusive' : 'standard',
        coverUrl: d.coverUrl || '',
        coverThumb: d.coverThumb || '',
        imageUrls: d.imageUrls || {},
        bg: `linear-gradient(140deg, ${col1}, ${col2})`,
        num: String(Math.floor(Math.random() * 11) + 1),
        kit: d.kit || 'Ev',
        designerId: d.designerId || '',
        desc: d.desc || '',
        // createdAt timestamp (Firestore Timestamp objesi)
        _ts: d.createdAt ? (d.createdAt.toMillis ? d.createdAt.toMillis() : 0) : 0
      });
    });

    // En yeni önce gelsin (JS sıralaması)
    realDesigns.sort((a, b) => b._ts - a._ts);

    // Gerçek tasarımlar öne, mock arkaya
    ALL_DESIGNS = [...realDesigns];

    renderHomeDesigns();
    if (currentPage === 'explore') applyFilters();

    console.log(`✓ ${realDesigns.length} onaylı tasarım yüklendi.`);

  } catch (error) {
    console.error('Tasarımlar çekilemedi:', error);
    ALL_DESIGNS = [];
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

    if (pageId === 'explore')          renderExplore();
    if (pageId === 'designers')        renderDesignersPage();
    if (pageId === 'competitions')     renderCompetitionsPage();
    if (pageId === 'dashboard')        renderDashboard();
    // Yasal sayfalar — HTML'de mevcut, active class yeterli
    // designer-public — showDesignerPublicProfile ile render edilir
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
function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function getFreshnessBoost(design) {
  const created = design?.createdAt?.toDate ? design.createdAt.toDate() : null;
  if (!created) return 0;
  const diffDays = (Date.now() - created.getTime()) / 86400000;
  if (diffDays <= 3) return 20;
  if (diffDays <= 7) return 10;
  if (diffDays <= 14) return 5;
  return 0;
}

function renderGridById(id, list) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = list.map(d => designCard(d)).join('');
}

function renderHomeDesigns() {
  const approved = ALL_DESIGNS.filter(d => !d.status || d.status === 'approved');
  const pool = approved.length ? approved : ALL_DESIGNS;
  if (!pool.length) {
    const empty = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px">
      <div style="font-size:48px;margin-bottom:16px">🎨</div>
      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:10px">Platform Yeni Açıldı!</h3>
      <p style="color:var(--text2);margin-bottom:24px;line-height:1.6;max-width:420px;margin-left:auto;margin-right:auto">
        Tasarımcılar tasarım yükleyip onay aldıkça burada görünecek.<br>İlk sen yükle!
      </p>
      <button class="btn-cta" onclick="authThenUpload()">Tasarım Yükle</button>
    </div>`;
    ['featuredGrid','homeGrid','newGrid','editorsGrid'].forEach(id=>{
      const g=document.getElementById(id); if(g) g.innerHTML=empty;
    });
    return;
  }
  const featuredPool = shuffleArray(pool.filter(d => d.license === 'exclusive' || (d.sales || 0) >= 35 || (d.likes || 0) >= 80));
  const featured = (featuredPool.length ? featuredPool : shuffleArray(pool)).slice(0, 8);

  const trendingPool = [...pool].sort((a, b) => {
    const aScore = (a.views || ((a.likes || 0) * 6)) + ((a.likes || 0) * 4) + ((a.sales || 0) * 10) + getFreshnessBoost(a);
    const bScore = (b.views || ((b.likes || 0) * 6)) + ((b.likes || 0) * 4) + ((b.sales || 0) * 10) + getFreshnessBoost(b);
    return bScore - aScore;
  });
  const trending = trendingPool.slice(0, 6);

  const newest = [...pool].sort((a, b) => {
    const ad = a?.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
    const bd = b?.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
    if (ad || bd) return bd - ad;
    return String(b.id).localeCompare(String(a.id));
  }).slice(0, 8);

  const editors = shuffleArray(pool.filter(d => (d.pattern === 'geometric' || d.style === 'minimal' || d.style === 'retro' || d.license === 'exclusive'))).slice(0, 4);

  renderGridById('featuredGrid', featured);
  renderGridById('homeGrid', trending);
  renderGridById('newGrid', newest);
  renderGridById('editorsGrid', editors);
}

function renderSpotlight() {
  const el = document.getElementById('spotlightGrid');
  if (!el) return;
  if (!MOCK_DESIGNERS.length) { el.innerHTML='<p style="color:var(--text3);padding:20px 0;font-size:13px">Tasarımcılar yakında burada görünecek.</p>'; return; }
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
  if (!MOCK_COMPETITIONS.length) { el.innerHTML='<p style="color:var(--text3);padding:20px 0;font-size:13px">Aktif yarışma bulunmuyor. Yakında açılacak!</p>'; return; }
  el.innerHTML = MOCK_COMPETITIONS.map(c => compCard(c)).join('');
}

/* ══════════ DESIGN CARD ══════════ */
function designCard(d) {
  const isFav = favorites.has(String(d.id));
  const safeTitle = sanitizeHTML(d.title || 'İsimsiz Tasarım');
  const safeDesigner = sanitizeHTML(d.designer || d.designerName || 'formaLOLA Studio');
  const safeSport = sanitizeHTML(d.sport || 'Sport');
  const safeDesc = sanitizeHTML(d.desc || `${d.style || 'premium'} ${d.pattern || 'kit'} diliyle hazırlanan, kulüpler için hazır lisanslanabilir tasarım.`);
  const colDots = (d.colors || []).slice(0, 5).map(c => `<div class="dc-color-dot" style="background:${c}"></div>`).join('');
  const licenseText = d.license === 'exclusive' ? 'Exclusive' : 'Standart';
  const primaryBadge = d.license === 'exclusive'
    ? `<span class="tag tag-excl" style="font-size:10px;padding:3px 8px">Exclusive</span>`
    : (d.sales > 80
      ? `<span class="tag tag-hot" style="font-size:10px;padding:3px 8px">Çok Satan</span>`
      : `<span class="tag tag-new" style="font-size:10px;padding:3px 8px">Yeni Sezon</span>`);
  const views = d.views || ((d.likes || 0) * 7 + (d.sales || 0) * 13);
  const imgContent = d.coverUrl
    ? `<img src="${escapeAttr(d.coverThumb || d.coverUrl)}" alt="${escapeAttr(d.title || '')}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const placeholderStyle = d.coverUrl ? 'display:none' : 'display:flex';

  return `
    <article class="design-card" onclick="showDesignDetail('${d.id}')">
      <div class="dc-img">
        <div style="width:100%;height:100%;position:relative;overflow:hidden">
          ${imgContent}
          <div class="dc-img-placeholder" style="background:${d.bg};width:100%;height:100%;position:${d.coverUrl ? 'absolute' : 'relative'};inset:0;${placeholderStyle};align-items:center;justify-content:center">
            <div style="width:78px;height:92px;background:rgba(255,255,255,0.12);border-radius:8px 8px 16px 16px;display:flex;align-items:center;justify-content:center;position:relative;border:1px solid rgba(255,255,255,0.08)">
              <div style="position:absolute;left:0;right:0;height:3px;top:50%;transform:translateY(-50%);background:${d.colors && d.colors[1] ? d.colors[1] : 'rgba(255,255,255,0.4)'}"></div>
              <span style="font-family:'Bebas Neue',sans-serif;font-size:28px;color:rgba(255,255,255,0.78);position:relative;z-index:1">${d.num || '9'}</span>
            </div>
          </div>
        </div>
        <div class="dc-topline">
          <div class="dc-badge-top">${primaryBadge}</div>
          <span class="dc-stat-chip">👁 ${views.toLocaleString('tr-TR')}</span>
        </div>
        <div class="dc-overlay">
          <div class="dc-actions">
            <button class="dc-action-secondary" onclick="event.stopPropagation();showDesignDetail('${d.id}')">Önizle</button>
            <button class="dc-action" onclick="event.stopPropagation();openBuyModal('${d.id}')">${t.buy_btn}</button>
          </div>
          <button class="dc-fav ${isFav ? 'fav-active' : ''}" onclick="event.stopPropagation();toggleFav('${d.id}',this)">${isFav ? '♥' : '♡'}</button>
        </div>
      </div>
      <div class="dc-body">
        <div class="dc-sport-row">
          <div class="dc-sport">${safeSport}</div>
          <span class="dc-license-pill">${licenseText}</span>
        </div>
        <div class="dc-title">${safeTitle}</div>
        <div class="dc-designer">by <span onclick="event.stopPropagation();showDesignerProfile('${d.id}')">${safeDesigner}</span></div>
        <div class="dc-desc">${safeDesc}</div>
        <div class="dc-bottom">
          <div>
            <div class="dc-colors">${colDots}</div>
            <div class="dc-metrics">
              <span class="dc-metric">♥ ${(d.likes || 0).toLocaleString('tr-TR')}</span>
              <span class="dc-metric">🛒 ${(d.sales || 0).toLocaleString('tr-TR')}</span>
            </div>
          </div>
          <div class="dc-price-wrap">
            <span class="dc-price">₺${(d.price || 0).toLocaleString('tr-TR')}</span>
            <span class="dc-price-note">Standart lisans başlangıcı</span>
          </div>
        </div>
      </div>
    </article>
  `;
}

/* ══════════ COMPETITION CARD ══════════ */
function compCard(c) {
  return `
    <div class="comp-card">
      <div class="comp-club">${sanitizeHTML(c.club)}</div>
      <div class="comp-desc">${sanitizeHTML(c.desc)}</div>
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
  if (!filtered.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:60px 20px"><div style="font-size:40px;margin-bottom:14px">🔍</div><p style="color:var(--text2);margin-bottom:18px">Henüz onaylı tasarım yok veya filtre eşleşmiyor.</p><button class="btn-out" onclick="clearFilters()">Filtreleri Temizle</button></div>`;
    const c2=document.getElementById('resultsCount'); if(c2) c2.textContent='0 tasarım'; return;
  }
  grid.innerHTML = filtered.slice(0, exploreOffset).map(d => designCard(d)).join('');
  const count = document.getElementById('resultsCount');
  if (count) count.textContent = `${filtered.length} ${t.designs_found}`;
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
    ? `<img src="${d.coverUrl}" alt="${safeTitle}" style="width:100%;height:100%;object-fit:contain">`
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
        <div class="detail-sport-badge">${safeSport} · ${d.kit}</div>
        <h1 class="detail-title">${safeTitle}</h1>
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
      <div class="comp-club">${sanitizeHTML(c.club)}</div>
      <div class="comp-desc">${sanitizeHTML(c.desc)}</div>
      <div class="comp-meta">
        <span class="comp-prize">${c.prize}</span>
        <span class="comp-deadline">${c.deadline}</span>
      </div>
      <span class="comp-badge">${c.entries} katılımcı</span>
      <button style="margin-top:14px;width:100%;padding:10px;background:var(--accent);border:none;border-radius:var(--r);color:#fff;font-size:13px;cursor:pointer" onclick="showToast('Yarışmaya katılmak için giriş yapın','')">Katıl</button>
    </div>
  `).join('');
}

async function loadPurchases() {
  const el = document.getElementById('purchasesContent');
  if (!el || !currentUser) return;
  try {
    const snap = await db.collection('purchases').where('buyerId','==',currentUser.uid).get();
    if (snap.empty) {
      el.innerHTML = `<div style="text-align:center;padding:60px 20px">
        <div style="font-size:40px;margin-bottom:12px">🛒</div>
        <p style="color:var(--text2);margin-bottom:16px">Henüz bir tasarım satın almadın.</p>
        <button class="btn-cta" onclick="showPage('explore')">Tasarımları Keşfet</button>
      </div>`;
      return;
    }
    const rows = [];
    snap.forEach(doc => {
      const p = doc.data();
      const ts = p.purchasedAt?.toDate?.() ? p.purchasedAt.toDate().toLocaleDateString('tr-TR') : '—';
      rows.push(`
        <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:grid;grid-template-columns:1fr auto auto;gap:16px;align-items:center">
          <div>
            <div style="font-size:14px;font-weight:500">${p.designId}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px">${p.license === 'exclusive' ? 'Exclusive' : 'Standart'} · ${ts}</div>
          </div>
          <span style="font-family:var(--font-mono);color:var(--accent)">₺${(p.price||0).toLocaleString('tr-TR')}</span>
          <span style="background:rgba(42,157,143,0.15);color:#4ecdc4;font-size:11px;padding:3px 10px;border-radius:4px">✓ Teslim edildi</span>
        </div>
      `);
    });
    el.innerHTML = `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden">${rows.join('')}</div>`;
  } catch(e) {
    el.innerHTML = `<p style="color:var(--text2)">Veriler yüklenemedi.</p>`;
    console.error(e);
  }
}

/* ══════════ DASHBOARD GERÇEK VERİ ══════════ */
async function loadDashboardOverview() {
  if (!currentUser) return;
  try {
    const snapshot = await db.collection('designs')
      .where('designerId', '==', currentUser.uid)
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
          <button class="btn-cta" onclick="authThenUpload()">+ İlk Tasarımını Yükle</button>
        </div>`;
      } else {
        recentEl.innerHTML = `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden">
          ${recentDesigns.map(d => `
            <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center" onclick="showDesignDetail('${d.id}')" style="cursor:pointer">
              <div>
                <div style="font-size:14px;font-weight:500">${safeTitle}</div>
                <div style="font-size:11px;color:var(--text3);margin-top:2px">${safeSport} · ₺${d.price}</div>
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
  } else if (tab === 'purchases') {
    el.innerHTML = `
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:24px">Satın Aldıklarım</h2>
      <div id="purchasesContent" style="color:var(--text2)">Yükleniyor...</div>
    `;
    loadPurchases();
  } else if (tab === 'mydesigns') {
    // Sadece giriş yapan kullanıcının tasarımlarını göster
    const myDesigns = ALL_DESIGNS.filter(d => d.designerId === currentUser?.uid || d.designer === currentUser?.name);
    
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px">Tasarımlarım</h2>
        <button class="btn-primary" onclick="authThenUpload()">+ Yeni Yükle</button>
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
        <div id="salesDataRows" style="padding:18px;text-align:center;color:var(--text2)">Gerçek satışlar Firestore'dan yükleniyor...</div>
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
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:24px; color:var(--accent)">Admin Paneli</h2>
      <div style="display:grid;gap:22px">
        <div>
          <h3 style="font-size:15px;margin-bottom:12px;color:var(--text)">Onay Bekleyen Tasarımlar</h3>
          <div id="adminPendingGrid" class="designs-grid" style="grid-template-columns:1fr;">Yükleniyor...</div>
        </div>
        <div>
          <h3 style="font-size:15px;margin-bottom:12px;color:var(--text)">Bekleyen Ödeme Talepleri</h3>
          <div id="adminPendingPayouts" style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px">Yükleniyor...</div>
        </div>
      </div>
    `;
    loadPendingDesigns();
    loadPendingPayouts();
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
            <div style="font-size:16px; font-weight:500; margin-bottom:4px;">${safeTitle}</div>
            <div style="font-size:12px; color:var(--text2); font-family:var(--font-mono)">
              <span style="color:var(--accent)">by ${d.designerName}</span> • ${safeSport} • ₺${d.price}
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

async function handleDesignModeration(designId, action) {
  const rejectReason = action === 'reject' ? prompt('Reddetme sebebini yazın:') : null;
  if (action === 'reject' && !rejectReason) return;
  try {
    const fn = getFunctions().httpsCallable('moderateDesign');
    await fn({ designId, action, rejectReason });
    showToast('İşlem başarılı!', 'success');
    loadPendingDesigns();
    fetchApprovedDesigns();
  } catch (e) {
    showToast('Hata: ' + e.message, 'error');
  }
}

async function approveDesign(id) { return handleDesignModeration(id, 'approve'); }
async function rejectDesign(id) { return handleDesignModeration(id, 'reject'); }


async function ensureUserDoc(user) {
  if (!user) return null;
  const ref = db.collection('users').doc(user.uid);
  const snap = await ref.get();
  if (!snap.exists) {
    const baseProfile = {
      name: user.displayName || user.email.split('@')[0],
      email: user.email || '',
      role: null,
      status: 'active',
      level: 'rookie',
      country: null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await ref.set(baseProfile, { merge: true });
    return baseProfile;
  }
  const data = snap.data() || {};
  const patch = {};
  if (!data.email && user.email) patch.email = user.email;
  if (!data.name) patch.name = user.displayName || user.email.split('@')[0];
  if (!('status' in data)) patch.status = 'active';
  if (Object.keys(patch).length) {
    patch.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
    await ref.set(patch, { merge: true });
  }
  return { ...data, ...patch };
}

function requireRoleSelection() {
  pendingUploadAfterRole = true;
  showModal('roleModal');
  showToast('Önce hesap tipini seçmelisin', '');
}

async function selectAccountRole(role) {
  if (!currentUser?.uid) {
    closeModal('roleModal');
    showModal('loginModal');
    return;
  }
  if (!['designer','club'].includes(role)) return;
  try {
    await db.collection('users').doc(currentUser.uid).set({
      name: currentUser.name || currentUser.email?.split('@')[0] || 'User',
      email: currentUser.email || null,
      role,
      status: currentUser.status || 'active',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    currentUser.role = role;
    closeModal('roleModal');
    showToast(`Hesap tipi güncellendi: ${ROLE_LABELS[role]}`, 'success');
    if (pendingUploadAfterRole && role === 'designer') {
      pendingUploadAfterRole = false;
      setTimeout(() => showModal('uploadModal'), 120);
    } else {
      pendingUploadAfterRole = false;
      if (role === 'club') showToast('Kulüp hesabı ile tasarım yükleyemezsin.', '');
    }
  } catch (e) {
    showToast('Rol kaydedilemedi: ' + e.message, 'error');
  }
}

function formatStatNumber(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('tr-TR').format(n);
}

async function loadPlatformStats() {
  try {
    const [designSnap, userSnap, orderSnap] = await Promise.all([
      db.collection('designs').where('status', '==', 'approved').get(),
      db.collection('users').get(),
      db.collection('purchases').get()
    ]);

    const approvedDesigns = designSnap.size;
    const users = userSnap.docs.map(d => d.data() || {});
    const designers = users.filter(u => u.role === 'designer' && u.status !== 'banned').length;
    const sales = orderSnap.docs.filter(d => {
      const x = d.data() || {};
      return x.paymentStatus === 'paid' || x.status === 'paid' || x.status === 'completed';
    }).length;
    const countries = new Set(users.map(u => (u.country || '').trim()).filter(Boolean)).size;

    const sets = {
      heroStatDesigns: `${formatStatNumber(approvedDesigns)} Tasarım`,
      heroStatDesigners: `${formatStatNumber(designers)} Tasarımcı`,
      heroStatSales: `${formatStatNumber(sales)} Satış`,
      statDesigns: formatStatNumber(approvedDesigns),
      statDesigners: formatStatNumber(designers),
      statSales: formatStatNumber(sales),
      statCountries: countries ? formatStatNumber(countries) : '—'
    };
    Object.entries(sets).forEach(([id,val]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    });
  } catch (e) {
    console.warn('Platform stats yüklenemedi:', e.message);
  }
}

function refreshCategoryCounts() {
  const counts = {};
  (ALL_DESIGNS || []).forEach(d => {
    const sport = d.sport || 'Diğer';
    counts[sport] = (counts[sport] || 0) + 1;
  });
  document.querySelectorAll('[data-sport-count]').forEach(el => {
    const key = el.getAttribute('data-sport-count');
    el.textContent = formatStatNumber(counts[key] || 0);
  });
  document.querySelectorAll('[data-filter-count]').forEach(el => {
    const key = el.getAttribute('data-filter-count');
    el.textContent = formatStatNumber(counts[key] || 0);
  });
}

/* ══════════ AUTH (GERÇEK FIREBASE) ══════════ */
auth.onAuthStateChanged(async (user) => {
  const loginBtn  = document.getElementById('navLoginBtn');
  const avatar    = document.getElementById('navAvatar');
  const dashAv    = document.getElementById('dashAv');
  const dashUname = document.getElementById('dashUname');
  const adminBtn  = document.getElementById('dashAdminBtn');
  const notifBtn  = document.getElementById('navNotifBtn');

  if (user) {
    let profile = null;
    try {
      profile = await ensureUserDoc(user);
    } catch(e) { console.warn('Profil okunamadı:', e.message); }

    const role = profile?.role || null;
    const isAdmin = role === 'admin';

    currentUser = {
      name:    profile?.name || user.displayName || user.email.split('@')[0],
      email:   user.email,
      uid:     user.uid,
      role:    role,
      status:  profile?.status || 'active',
      isAdmin: isAdmin
    };

    if (loginBtn) loginBtn.classList.add('hidden');
    if (avatar)   { avatar.classList.remove('hidden'); avatar.textContent = currentUser.name[0].toUpperCase(); }
    if (dashAv)   dashAv.textContent    = currentUser.name[0].toUpperCase();
    if (dashUname)dashUname.textContent = currentUser.name;
    if (notifBtn) notifBtn.classList.remove('hidden');
    // Admin butonu - Firestore role tabanlı
    if (adminBtn) adminBtn.classList.toggle('hidden', !isAdmin);
    buildNotifsContent();
    if (!role) showModal('roleModal');
  } else {
    currentUser = null;
    if (loginBtn) loginBtn.classList.remove('hidden');
    if (avatar)   avatar.classList.add('hidden');
    if (notifBtn) notifBtn.classList.add('hidden');
    if (adminBtn) adminBtn.classList.add('hidden');
  }
});

// Upload butonu — giriş yoksa login modal aç
function authThenUpload() {
  if (!currentUser) {
    showModal('loginModal');
    showToast('Tasarım yüklemek için giriş yapın', '');
    return;
  }
  if (!currentUser.role) {
    pendingUploadAfterRole = true;
    requireRoleSelection();
    return;
  }
  if (currentUser.role !== 'designer' && !currentUser.isAdmin) {
    showToast('Tasarım yüklemek için tasarımcı hesabı gerekli', 'error');
    return;
  }
  showModal('uploadModal');
}

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
  const role = (document.getElementById('regRole')?.value || 'designer') === 'team' ? 'club' : (document.getElementById('regRole')?.value || 'designer');
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
      status: 'active',
      level: 'rookie',
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
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
    const result = await auth.signInWithPopup(provider);
    await ensureUserDoc(result.user);
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

/* ══════════ BUY MODAL — CHECKOUT AKIŞI ══════════ */
let currentBuyDesignId = null;
let currentBuyPrice = 0;
let currentBuyLicense = 'standard';

function openBuyModal(id) {
  const d = ALL_DESIGNS.find(x => String(x.id) === String(id));
  if (!d) return;
  currentBuyDesignId = id;
  currentBuyPrice = d.price || 0;
  currentBuyLicense = 'standard';

  const el = document.getElementById('buyContent');
  const thumb = d.coverThumb || d.coverUrl || '';

  el.innerHTML = `
    <!-- ADIM 1: Ürün + Lisans Seçimi -->
    <div id="buyStep1">
      <div class="buy-design-row">
        <div class="buy-thumb" style="background:${d.bg};overflow:hidden">
          ${thumb
            ? `<img src="${thumb}" style="width:100%;height:100%;object-fit:cover">`
            : `<span style="font-family:'Bebas Neue',sans-serif;font-size:22px;color:rgba(255,255,255,0.6)">${d.num}</span>`}
        </div>
        <div style="flex:1;min-width:0">
          <div class="buy-title">${safeTitle}</div>
          <div class="buy-designer">${t.by} ${d.designer}</div>
          <div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">
            <span style="font-size:11px;background:var(--bg4);border:1px solid var(--border);border-radius:4px;padding:2px 8px;color:var(--text3)">${safeSport}</span>
            <span style="font-size:11px;background:var(--bg4);border:1px solid var(--border);border-radius:4px;padding:2px 8px;color:var(--text3)">${d.kit || 'Ev'}</span>
          </div>
        </div>
      </div>

      <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:var(--text3);margin-bottom:10px;font-family:var(--font-mono)">Lisans Seç</div>
      <div class="buy-license">
        <div class="buy-lic-opt sel" id="buyOptStd" onclick="selectBuyLicense(this,'standard',${d.price})">
          <input type="radio" name="buyLic" checked>
          <div style="flex:1;padding:0 10px">
            <div class="buy-lic-name">${t.license_std}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px">${t.license_std_desc}</div>
          </div>
          <span class="buy-lic-price">₺${(d.price||0).toLocaleString('tr-TR')}</span>
        </div>
        <div class="buy-lic-opt" id="buyOptExcl" onclick="selectBuyLicense(this,'exclusive',${d.exclusivePrice})">
          <input type="radio" name="buyLic">
          <div style="flex:1;padding:0 10px">
            <div class="buy-lic-name">${t.license_excl}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px">${t.license_excl_desc}</div>
          </div>
          <span class="buy-lic-price">₺${(d.exclusivePrice||0).toLocaleString('tr-TR')}</span>
        </div>
      </div>

      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);padding:12px 16px;margin-bottom:16px">
        <div style="font-size:11px;color:var(--text3);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.08em;font-family:var(--font-mono)">Teslim Edilecek Dosyalar</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">
          ${['PNG','AI','SVG','PDF'].map(f=>`<span style="background:var(--bg4);border:1px solid var(--border);border-radius:5px;padding:3px 10px;font-size:11px;font-family:var(--font-mono);color:var(--text2)">${f}</span>`).join('')}
        </div>
      </div>

      <div class="buy-total">
        <span style="color:var(--text2);font-size:14px">Toplam (KDV dahil)</span>
        <span class="buy-total-price" id="buyTotal">₺${(d.price||0).toLocaleString('tr-TR')}</span>
      </div>

      <div style="background:rgba(42,157,143,0.06);border:1px solid rgba(42,157,143,0.2);border-radius:var(--r);padding:10px 14px;margin-bottom:16px;font-size:12px;color:#4ecdc4">
        ✓ Ödeme onaylandıktan sonra tüm dosyalar <strong>anında</strong> hesabınıza eklenir
      </div>

      <button class="btn-form" onclick="proceedToPayment('${d.id}')">
        Ödemeye Geç →
      </button>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:12px">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1L8 9M5 6l3 3 3-3" stroke="#4ecdc4" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="#4ecdc4" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span style="font-size:11px;color:var(--text3)">iyzico · SSL · 256-bit şifreleme · Visa · Mastercard · Troy</span>
      </div>
    </div>

    <!-- ADIM 2: Ödeme Formu -->
    <div id="buyStep2" class="hidden">
      <button onclick="document.getElementById('buyStep2').classList.add('hidden');document.getElementById('buyStep1').classList.remove('hidden')" style="background:none;border:none;color:var(--text3);font-size:13px;cursor:pointer;margin-bottom:16px;padding:0">← Geri dön</button>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);padding:14px 16px;margin-bottom:20px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13px;color:var(--text2)" id="buyStep2Summary">—</span>
        <span style="font-family:var(--font-mono);font-size:16px;color:var(--accent)" id="buyStep2Price">₺0</span>
      </div>

      <div class="fg"><label>Kart Üzerindeki İsim</label><input type="text" id="cardName" placeholder="AD SOYAD" style="text-transform:uppercase"></div>
      <div class="fg"><label>Kart Numarası</label>
        <input type="text" id="cardNumber" placeholder="0000 0000 0000 0000" maxlength="19" oninput="formatCardNumber(this)">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
        <div class="fg"><label>Son Kullanma</label><input type="text" id="cardExpiry" placeholder="AA/YY" maxlength="5" oninput="formatExpiry(this)"></div>
        <div class="fg"><label>CVV</label><input type="text" id="cardCvv" placeholder="000" maxlength="3"></div>
      </div>

      <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:var(--r);padding:10px 14px;margin-bottom:16px;font-size:12px;color:var(--gold)">
        ⚠ Kart bilgileriniz iyzico'nun güvenli altyapısında işlenir. Tarafımızca saklanmaz.
      </div>

      <div class="fg" style="margin-bottom:16px">
        <label class="chk-label" id="caymaOnayLabel">
          <input type="checkbox" id="caymaOnay">
          Dijital içerik satışında cayma hakkımın bulunmadığını ve satın alma tamamlandığında dosyaların anında teslim edileceğini onaylıyorum.
          <a href="#" onclick="event.preventDefault();closeModal('buyModal');showPage('legal-refund')" style="color:var(--accent);text-decoration:underline">İptal Koşulları</a>
        </label>
      </div>

      <button class="btn-form btn-pay" id="payNowBtn" onclick="finalizePayment('${d.id}')">
        <span id="payBtnText">💳 Ödemeyi Tamamla</span>
      </button>

      <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:14px;flex-wrap:wrap">
        <div style="height:20px;background:#1A1A2E;border-radius:3px;padding:0 8px;display:flex;align-items:center">
          <span style="font-family:Arial;font-weight:bold;font-size:10px;color:#00D4AA">iyzico</span>
        </div>
        <div style="height:20px;background:#1A1F71;border-radius:3px;padding:0 8px;display:flex;align-items:center">
          <span style="font-family:Arial;font-weight:900;font-size:10px;color:white;letter-spacing:1px">VISA</span>
        </div>
        <div style="height:20px;width:32px;background:#252525;border-radius:3px;display:flex;align-items:center;justify-content:center;gap:0">
          <div style="width:10px;height:10px;border-radius:50%;background:#EB001B;margin-right:-4px;position:relative;z-index:1"></div>
          <div style="width:10px;height:10px;border-radius:50%;background:#F79E1B"></div>
        </div>
        <div style="height:20px;background:#0066CC;border-radius:3px;padding:0 8px;display:flex;align-items:center">
          <span style="font-family:Arial;font-weight:bold;font-size:10px;color:white">troy</span>
        </div>
        <div style="height:20px;background:#2D7D46;border-radius:3px;padding:0 8px;display:flex;align-items:center;gap:4px">
          <span style="font-size:9px">🔒</span>
          <span style="font-family:Arial;font-weight:bold;font-size:10px;color:white">SSL</span>
        </div>
      </div>
    </div>

    <!-- ADIM 3: Başarı -->
    <div id="buyStep3" class="hidden" style="text-align:center;padding:20px 0">
      <div style="font-size:48px;margin-bottom:16px">🎉</div>
      <h3 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:10px;letter-spacing:0.5px">Satın Alma Tamamlandı!</h3>
      <p style="font-size:14px;color:var(--text2);margin-bottom:24px;line-height:1.6">Üretim dosyaları hesabınıza eklendi.<br>Dashboard > Satın Aldıklarım bölümünden indirebilirsiniz.</p>
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:20px;text-align:left">
        <div style="font-size:12px;color:var(--text3);margin-bottom:8px">Sipariş Özeti</div>
        <div style="display:flex;justify-content:space-between;font-size:14px" id="orderSummary"></div>
      </div>
      <button class="btn-form" onclick="closeModal('buyModal');showPage('dashboard')">Dashboard'a Git</button>
    </div>
  `;
  showModal('buyModal');
}

function selectBuyLicense(el, type, price) {
  document.querySelectorAll('.buy-lic-opt').forEach(o => o.classList.remove('sel'));
  el.classList.add('sel');
  el.querySelector('input').checked = true;
  currentBuyPrice = price;
  currentBuyLicense = type;
  document.getElementById('buyTotal').textContent = `₺${price.toLocaleString('tr-TR')}`;
}

function proceedToPayment(id) {
  if (!currentUser) {
    closeModal('buyModal');
    showModal('loginModal');
    showToast(t.toast_login_required || 'Giriş yapmalısınız', '');
    return;
  }
  const d = ALL_DESIGNS.find(x => String(x.id) === String(id));
  const s2 = document.getElementById('buyStep2');
  const s1 = document.getElementById('buyStep1');
  if (!s2 || !s1) return;
  s1.classList.add('hidden');
  s2.classList.remove('hidden');
  const sumEl = document.getElementById('buyStep2Summary');
  const priceEl = document.getElementById('buyStep2Price');
  if (sumEl) sumEl.textContent = `${d?.title || ''} · ${currentBuyLicense === 'exclusive' ? 'Exclusive' : 'Standart'} Lisans`;
  if (priceEl) priceEl.textContent = `₺${currentBuyPrice.toLocaleString('tr-TR')}`;
}

async function finalizePayment(id) {
  if (!document.getElementById('caymaOnay')?.checked) {
    showToast('Lütfen cayma hakkı onayını işaretleyin', 'error');
    return;
  }
  const cardName = document.getElementById('cardName')?.value?.trim();
  const cardNum  = document.getElementById('cardNumber')?.value?.replace(/\s/g,'');
  const expiryRaw = document.getElementById('cardExpiry')?.value;
  const cvc      = document.getElementById('cardCvv')?.value;
  if (!cardName || cardNum?.length < 16 || !expiryRaw || cvc?.length < 3) {
    showToast('Kart bilgilerini eksiksiz doldurun', 'error');
    return;
  }
  const [expireMonth, expireYearShort] = expiryRaw.split('/');
  const expireYear = '20' + (expireYearShort || '');
  const btn = document.getElementById('payNowBtn');
  const btnTxt = document.getElementById('payBtnText');
  if (btn) btn.disabled = true;
  if (btnTxt) btnTxt.textContent = '⏳ Güvenli ödeme işleniyor...';
  try {
    const processPaymentFn = getFunctions().httpsCallable('processPayment');
    const response = await processPaymentFn({ designId: id, licenseType: currentBuyLicense, cardName, cardNumber: cardNum, expireMonth, expireYear, cvc });
    if (!response?.data?.success) throw new Error(response?.data?.message || 'Ödeme tamamlanamadı.');
    const s2 = document.getElementById('buyStep2');
    const s3 = document.getElementById('buyStep3');
    if (s2) s2.classList.add('hidden');
    if (s3) {
      s3.classList.remove('hidden');
      const d = ALL_DESIGNS.find(x => String(x.id) === String(id));
      const sumEl = document.getElementById('orderSummary');
      if (sumEl) sumEl.innerHTML = `<span>${sanitizeHTML(d?.title || 'Tasarım')} (${currentBuyLicense === 'exclusive' ? 'Exclusive' : 'Standart'})</span><span style="color:var(--accent);font-family:var(--font-mono)">₺${currentBuyPrice.toLocaleString('tr-TR')}</span>`;
    }
    showToast('Ödeme başarıyla alındı ✓', 'success');
  } catch (error) {
    console.error('Ödeme hatası:', error);
    showToast('Ödeme başarısız: ' + (error.message || 'Bilinmeyen hata'), 'error');
    if (btn) btn.disabled = false;
    if (btnTxt) btnTxt.textContent = '💳 Ödemeyi Tamamla';
  }
}

function formatCardNumber(input) {
  let v = input.value.replace(/\D/g,'').substring(0,16);
  input.value = v.replace(/(.{4})/g,'$1 ').trim();
}
function formatExpiry(input) {
  let v = input.value.replace(/\D/g,'');
  if (v.length >= 2) v = v.substring(0,2) + '/' + v.substring(2,4);
  input.value = v;
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

/* ══════════ UPLOAD PREVIEW HELPERS ══════════ */
function getUploadImageData(slotId) {
  const img = document.getElementById(slotId)?.querySelector('img');
  return img?.src || '';
}

function updateUploadProgress(step = currentUploadStep) {
  const fill = document.getElementById('uploadProgressFill');
  const text = document.getElementById('uploadProgressText');
  const label = document.getElementById('uploadStageLabel');
  const map = {
    1: 'Temel görsellerini yükle',
    2: 'Tasarım bilgilerini doldur',
    3: 'Renk paletini netleştir',
    4: 'Teslim dosyalarını hazırla',
    5: 'Fiyatı belirle ve yayınla'
  };
  if (fill) fill.style.width = `${step * 20}%`;
  if (label) label.textContent = `Adım ${step} / 5`;
  if (text) text.textContent = map[step] || 'Yayın akışı';
}

function buildUploadChecklist() {
  const items = [
    { label: '4 zorunlu görsel', done: ['s-front','s-back','s-detail','s-flat'].every(id => getUploadImageData(id)) },
    { label: 'Tasarım adı', done: !!document.getElementById('upTitle')?.value.trim() },
    { label: 'Açıklama', done: (document.getElementById('upDesc')?.value.trim().length || 0) >= 40 },
    { label: 'Renk paleti', done: !!document.getElementById('c1h')?.value.trim() },
    { label: 'Standart fiyat', done: (Number(document.getElementById('stdPrice')?.value) || 0) > 0 },
    { label: 'Telif onayı', done: !!document.getElementById('upCopyright')?.checked }
  ];
  const host = document.getElementById('uploadChecklist');
  if (!host) return;
  host.innerHTML = items.map(item => `
    <div class="upload-check-item ${item.done ? 'done' : ''}">
      <span>${item.label}</span>
      <span>${item.done ? 'Hazır' : 'Bekliyor'}</span>
    </div>
  `).join('');
}

function updateUploadPreview() {
  const title = document.getElementById('upTitle')?.value.trim() || 'Tasarım adı burada görünecek';
  const sport = document.getElementById('upSport')?.value || 'Futbol';
  const kit = document.getElementById('upKit')?.value || 'Ev';
  const desc = document.getElementById('upDesc')?.value.trim();
  const image = getUploadImageData('s-front') || getUploadImageData('s-flat');
  const c1 = document.getElementById('c1h')?.value || '#e63946';
  const c2 = document.getElementById('c2h')?.value || '#1d1d1d';
  const c3 = document.getElementById('c3h')?.value || '#ffffff';
  const stdPrice = Number(document.getElementById('stdPrice')?.value) || 499;
  const exclEnabled = !!document.getElementById('pcExcl')?.checked;
  const status = document.getElementById('upPreviewStatus');
  const imgHost = document.getElementById('upPreviewImage');
  const colorsHost = document.getElementById('upPreviewColors');

  const previewTitle = document.getElementById('upPreviewTitle');
  const previewMeta = document.getElementById('upPreviewMeta');
  const previewPrice = document.getElementById('upPreviewPrice');
  const previewLicense = document.getElementById('upPreviewLicense');

  if (previewTitle) previewTitle.textContent = title;
  if (previewMeta) previewMeta.textContent = `${sport} · ${kit}`;
  if (previewPrice) previewPrice.textContent = `₺${stdPrice.toLocaleString('tr-TR')}`;
  if (previewLicense) previewLicense.textContent = exclEnabled ? 'Standart + Exclusive' : 'Standart Lisans';
  if (status) status.textContent = desc.length >= 40 ? 'Güçlü listeleme' : 'Taslak';

  if (colorsHost) colorsHost.innerHTML = [c1, c2, c3].filter(Boolean).map(color => `<span class="uprev-color" style="background:${color}"></span>`).join('');
  if (imgHost) {
    imgHost.innerHTML = image
      ? `<img src="${image}" alt="Önizleme">`
      : `<div class="uprev-image-inner">formaLOLA</div>`;
  }
  buildUploadChecklist();
}

function bindUploadPreviewEvents() {
  ['upTitle','upSport','upKit','upDesc','stdPrice','exclPrice','pcExcl','upCopyright','c1h','c2h','c3h'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', updateUploadPreview);
    el.addEventListener('change', updateUploadPreview);
  });
  updateUploadProgress(1);
  updateUploadPreview();
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
  updateUploadProgress(step);
  updateUploadPreview();
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
      updateUploadPreview();
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
      views: 0,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'pending'
    };

    await db.collection('designs').add(newDesign);
    
    if (publishBtn) { publishBtn.disabled = false; publishBtn.textContent = 'Tasarımı Yayınla 🚀'; }
    closeModal('uploadModal');
    showToast('🚀 Tasarım yüklendi! Admin onayı bekleniyor (max 24 saat).', 'success');
    resetUploadForm();
    updateUploadPreview();

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
  document.getElementById('stdPrice').value = 499;
  document.getElementById('exclPrice').value = 4999;
  document.getElementById('pcStd').checked = true;
  document.getElementById('pcExcl').checked = false;
  ['c1h','c2h','c3h'].forEach((id, idx) => {
    const defaults = ['#e63946', '#1d1d1d', '#ffffff'];
    const input = document.getElementById(id);
    const color = document.getElementById(`c${idx + 1}`);
    if (input) input.value = defaults[idx];
    if (color) color.value = defaults[idx];
  });
  Object.entries(SLOT_LABELS).forEach(([id, label]) => {
    const el = document.getElementById(id);
    if (el) {
      const slot = el.closest('.img-slot');
      const fileInput = slot?.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      el.innerHTML = `<div class="is-plus">+</div><div class="is-lbl">${label}</div>`;
      slot?.classList.remove('filled');
    }
  });
  calcEarnings();
  updateUploadProgress(1);
  updateUploadPreview();
}

function calcEarnings() {
  const std = parseFloat(document.getElementById('stdPrice')?.value) || 0;
  const excl = parseFloat(document.getElementById('exclPrice')?.value) || 0;
  const stdEl = document.getElementById('stdEarn');
  const exclEl = document.getElementById('exclEarn');
  if (stdEl) stdEl.textContent = `₺${Math.round(std * 0.8).toLocaleString('tr-TR')}`;
  if (exclEl) exclEl.textContent = `₺${Math.round(excl * 0.8).toLocaleString('tr-TR')}`;
  updateUploadPreview();
}


/* ══════════ COLOR SYNC ══════════ */
function syncColor(colorId, hexId) {
  const el = document.getElementById(hexId);
  if (el) el.value = document.getElementById(colorId).value;
  updateUploadPreview();
}

function syncHex(hexId, colorId) {
  const hex = document.getElementById(hexId).value;
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    document.getElementById(colorId).value = hex;
    updateUploadPreview();
  }
}

/* ══════════ FAVORITES ══════════ */
function toggleFav(id, btn) {
  const stringId = String(id);
  if (favorites.has(stringId)) {
    favorites.delete(stringId);
    showToast('Favorilerden çıkarıldı', '');
    if (btn) { btn.textContent = btn.classList.contains('btn-fav-full') ? '♡ Favorilere Ekle' : '♡'; btn.classList.remove('fav-active'); }
  } else {
    favorites.add(stringId);
    showToast('Favorilere eklendi ♥', 'success');
    if (btn) { btn.textContent = btn.classList.contains('btn-fav-full') ? '♥ Favorilerden Çıkar' : '♥'; btn.classList.add('fav-active'); }
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

/* ════════════════════════════════════════════════════════════════════════
   formaLOLA Premium — Eklenen Özellikler
   ✓ Bildirim Sistemi
   ✓ Yorum & Puan Sistemi (Firestore)
   ✓ Tasarımcı Takip Sistemi (Firestore)
   ✓ Tasarımcı Public Profil Sayfası
   ✓ Paylaşım Modalı
   ✓ Dashboard — Satın Aldıklarım (Firestore gerçek veri)
   ✓ Dashboard — Tasarımlarım (Firestore gerçek veri + durum + istatistik)
   ✓ Dashboard — Satışlar (Firestore gerçek veri)
   ✓ Dashboard — Kazançlar (Firestore hesaplamalı)
   ✓ CompCard ile Yarışmaya Katılma
   ✓ Auth — authThenUpload
   ✓ Pagination limit(20) Firestore
════════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════
   BİLDİRİM SİSTEMİ
════════════════════════════════ */

// Okunmamış sayısını global tut
let _unreadNotifCount = 0;

// Bildirim modalını aç
function openNotifsModal() {
  buildNotifsContent();
  showModal('notifsModal');
  // Tümünü okundu işaretle (badge sıfırla)
  setTimeout(() => {
    _unreadNotifCount = 0;
    const badge = document.getElementById('navNotifBadge');
    if (badge) badge.classList.add('hidden');
  }, 400);
}

// Tüm bildirimleri okundu işaretle
function markAllRead() {
  _unreadNotifCount = 0;
  const badge = document.getElementById('navNotifBadge');
  if (badge) badge.classList.add('hidden');
  document.querySelectorAll('.notif-item').forEach(el => el.classList.add('read'));
  document.querySelectorAll('.notif-unread-dot').forEach(el => el.remove());
  showToast('Tüm bildirimler okundu ✓', 'success');
}

// Bildirimler içeriğini oluştur
function buildNotifsContent() {
  const el = document.getElementById('notifsContent');
  if (!el) return;

  // Firestore'dan gerçek bildirimler
  const notifs = [];

  _unreadNotifCount = notifs.filter(n => !n.read).length;
  const badge = document.getElementById('navNotifBadge');
  if (badge) {
    if (_unreadNotifCount > 0) {
      badge.textContent = _unreadNotifCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  if (!notifs.length) {
    el.innerHTML = `<div style="text-align:center;padding:40px 20px;color:var(--text3)">
      <div style="font-size:32px;margin-bottom:10px">🔔</div>
      <p>Henüz bildirim yok</p>
    </div>`;
    return;
  }

  const typeClass = { sale: 'sale', review: 'review', badge: 'badge', comp: 'comp', info: 'info' };
  el.innerHTML = notifs.map(n => `
    <div class="notif-item ${n.read ? 'read' : ''}" onclick="this.classList.add('read');this.querySelector('.notif-unread-dot')?.remove()">
      <div class="notif-icon-wrap ${typeClass[n.type] || 'info'}">${n.icon}</div>
      <div style="flex:1;min-width:0">
        <div class="notif-body-title">${n.title}</div>
        <div class="notif-body-sub">${n.sub}</div>
        <div class="notif-body-time">${n.time}</div>
      </div>
      ${!n.read ? '<div class="notif-unread-dot"></div>' : ''}
    </div>
  `).join('');
}

/* ════════════════════════════════
   TASARIMCI PUBLIC PROFİL
════════════════════════════════ */

// Tasarımcı profiline git (tasarım kartındaki "by" linkinden veya tasarımcılar sayfasından)
async function showDesignerPublicProfile(designerIdOrMockId, designerNameOverride) {
  // Sayfayı geç
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-designer-public');
  if (!page) return;
  previousPage = currentPage;
  currentPage = 'designer-public';
  page.classList.add('active');
  window.scrollTo(0, 0);

  const el = document.getElementById('designerPublicContent');
  if (!el) return;
  el.innerHTML = `<div style="padding:80px 0;text-align:center"><div class="spinner" style="margin:0 auto;width:32px;height:32px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 0.8s linear infinite"></div></div>`;

  // Mock tasarımcıyı bul
  const mockDsgn = MOCK_DESIGNERS.find(d => String(d.id) === String(designerIdOrMockId) || d.name === designerNameOverride);

  // Bu tasarımcıya ait tasarımlar
  let designs = ALL_DESIGNS.filter(d =>
    d.designer === (mockDsgn?.name || designerNameOverride) ||
    d.designerId === designerIdOrMockId
  );
  if (!designs.length) designs = ALL_DESIGNS.slice(0, 4); // fallback

  // Firestore'dan gerçek tasarımcı tasarımlarını dene
  try {
    const snap = await db.collection('designs')
      .where('status', '==', 'approved')
      .where('designerId', '==', designerIdOrMockId)
      .limit(20)
      .get();
    if (!snap.empty) {
      const real = [];
      snap.forEach(doc => {
        const d = doc.data();
        const c1 = (d.colors && d.colors[0]) || '#1f1f26';
        const c2 = (d.colors && d.colors[1]) || '#0c0c0e';
        real.push({
          id: doc.id, title: d.title || 'Tasarım', designer: d.designerName || '',
          designerInitials: d.designerInitials || '?', sport: d.sport || 'Futbol',
          style: d.style || 'modern', pattern: d.pattern || 'minimal',
          colors: d.colors || [], price: d.price || 0, exclusivePrice: d.exclusivePrice || 0,
          sales: d.sales || 0, likes: d.likes || 0, license: d.exclusivePrice > 0 ? 'exclusive' : 'standard',
          coverUrl: d.coverUrl || '', coverThumb: d.coverThumb || '', imageUrls: d.imageUrls || {},
          bg: `linear-gradient(140deg,${c1},${c2})`, num: '10', kit: d.kit || 'Ev',
          designerId: d.designerId || '', desc: d.desc || '',
          _ts: d.createdAt ? (d.createdAt.toMillis ? d.createdAt.toMillis() : 0) : 0
        });
      });
      designs = real;
    }
  } catch(e) { console.error('Designer designs:', e); }

  // Firestore'dan yorumları çek
  let reviews = [];
  try {
    const rSnap = await db.collection('reviews')
      .where('designerId', '==', designerIdOrMockId)
      .orderBy && false // orderBy composite index gerektirir, atla
      ? null
      : await db.collection('reviews').where('designerId', '==', designerIdOrMockId).get();
    if (rSnap) rSnap.forEach(doc => reviews.push({ id: doc.id, ...doc.data() }));
    // Tarihe göre sırala
    reviews.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return tb - ta;
    });
  } catch(e) { console.error('Reviews:', e); }

  // İstatistikler hesapla
  const totalSales = designs.reduce((a, d) => a + (d.sales || 0), 0);
  const totalLikes = designs.reduce((a, d) => a + (d.likes || 0), 0);
  const avgRating  = reviews.length
    ? (reviews.reduce((a, r) => a + (r.rating || 5), 0) / reviews.length).toFixed(1)
    : (mockDsgn?.rating || '5.0');

  // Takip durumu
  let isFollowing = false;
  if (currentUser) {
    try {
      const fDoc = await db.collection('follows').doc(`${currentUser.uid}_${designerIdOrMockId}`).get();
      isFollowing = fDoc.exists;
    } catch(e) {}
  }

  const dName  = mockDsgn?.name || designerNameOverride || 'Tasarımcı';
  const dInits = mockDsgn?.initials || (dName.substring(0, 2).toUpperCase());
  const dBio   = mockDsgn?.bio || 'formaLOLA tasarımcısı';
  const dLevel = mockDsgn?.level || 'rookie';
  const levelMap = { rookie: '🥉 Rookie', pro: '🥈 Pro', elite: '🏅 Elite', master: '🏆 Master' };

  el.innerHTML = `
    <button class="back-btn" onclick="goBack()" style="margin-top:28px">← Geri</button>

    <!-- ─── PROFIL HEADER ─── -->
    <div class="dpub-header">
      <div class="dpub-av">${dInits}</div>
      <div class="dpub-info">
        <h1 class="dpub-name">${dName}</h1>
        <p class="dpub-bio">${dBio}</p>
        <div class="dpub-badges">
          <span class="dpub-badge ${dLevel}">${levelMap[dLevel]}</span>
          ${designs.length > 10 ? '<span class="dpub-badge dpub-badge-extra">✨ Üretken</span>' : ''}
          ${totalSales > 50    ? '<span class="dpub-badge dpub-badge-extra">🔥 Çok Satan</span>' : ''}
          ${reviews.length > 5 ? '<span class="dpub-badge dpub-badge-extra">💬 Yorumlanan</span>' : ''}
        </div>
      </div>
      <div class="dpub-actions">
        <button id="dpubFollowBtn"
          class="dpub-follow-btn ${isFollowing ? 'following' : ''}"
          onclick="toggleFollow('${designerIdOrMockId}','${dName}')">
          ${isFollowing ? '✓ Takip Ediliyor' : '+ Takip Et'}
        </button>
        <button class="dpub-msg-btn" onclick="showToast('Mesajlaşma özelliği yakında!','')">✉ Mesaj</button>
      </div>
    </div>

    <!-- ─── İSTATİSTİKLER ─── -->
    <div class="dpub-stats">
      <div class="dpub-stat"><div class="dpub-stat-n">${designs.length}</div><div class="dpub-stat-l">Tasarım</div></div>
      <div class="dpub-stat"><div class="dpub-stat-n">${totalSales}</div><div class="dpub-stat-l">Satış</div></div>
      <div class="dpub-stat"><div class="dpub-stat-n">${totalLikes}</div><div class="dpub-stat-l">Beğeni</div></div>
      <div class="dpub-stat"><div class="dpub-stat-n">${avgRating}★</div><div class="dpub-stat-l">Puan</div></div>
      <div class="dpub-stat"><div class="dpub-stat-n">${reviews.length}</div><div class="dpub-stat-l">Yorum</div></div>
    </div>

    <!-- ─── TASARIMLAR ─── -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px">
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:.5px">Tasarımları</h2>
      <span style="font-size:12px;color:var(--text3)">${designs.length} tasarım</span>
    </div>
    <div class="designs-grid" style="margin-bottom:48px">
      ${designs.length
        ? designs.map(d => designCard(d)).join('')
        : `<p style="color:var(--text2);grid-column:1/-1;padding:20px 0">Henüz onaylı tasarım yok.</p>`}
    </div>

    <!-- ─── YORUMLAR ─── -->
    <div style="margin-bottom:60px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;flex-wrap:wrap;gap:10px">
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:.5px">
          Yorumlar <span style="font-size:16px;font-weight:400;color:var(--text3)">(${reviews.length})</span>
        </h2>
        ${currentUser
          ? `<button onclick="openReviewModal('${designerIdOrMockId}','${dName}')"
               style="padding:9px 20px;background:transparent;border:1px solid var(--accent);border-radius:var(--r);color:var(--accent);font-size:13px;font-weight:500;cursor:pointer;transition:all var(--tr)"
               onmouseover="this.style.background='var(--accent)';this.style.color='#fff'"
               onmouseout="this.style.background='transparent';this.style.color='var(--accent)'">
               + Yorum Yaz
             </button>`
          : `<button onclick="showModal('loginModal')"
               style="padding:9px 20px;background:transparent;border:1px solid var(--border);border-radius:var(--r);color:var(--text2);font-size:13px;cursor:pointer">
               Giriş Yap & Yorum Yaz
             </button>`}
      </div>

      ${reviews.length ? `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px">
          ${reviews.map(r => {
            const rName  = r.reviewerName || 'Anonim';
            const rInits = rName[0] || 'A';
            const rDate  = r.createdAt?.toDate?.()?.toLocaleDateString('tr-TR') || '—';
            const stars  = '★'.repeat(Math.min(r.rating || 5, 5));
            const empty  = '☆'.repeat(Math.max(5 - (r.rating || 5), 0));
            return `
              <div class="review-card">
                <div class="review-card-header">
                  <div class="review-av">${rInits}</div>
                  <div>
                    <div class="review-author">${rName}</div>
                    <div class="review-date">${rDate}</div>
                  </div>
                  <div class="review-stars">${stars}<span style="color:var(--text3)">${empty}</span></div>
                </div>
                <p class="review-text">${r.text || ''}</p>
              </div>
            `;
          }).join('')}
        </div>
      ` : `
        <div style="text-align:center;padding:48px 20px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-lg)">
          <div style="font-size:36px;margin-bottom:12px">💬</div>
          <p style="color:var(--text2);margin-bottom:16px">Henüz yorum yapılmamış. İlk yorumu sen yaz!</p>
          ${currentUser
            ? `<button onclick="openReviewModal('${designerIdOrMockId}','${dName}')"
                 style="padding:10px 22px;background:var(--accent);border:none;border-radius:var(--r);color:#fff;font-size:13px;font-weight:500;cursor:pointer">
                 Yorum Yaz
               </button>`
            : `<button onclick="showModal('loginModal')"
                 style="padding:10px 22px;background:var(--accent);border:none;border-radius:var(--r);color:#fff;font-size:13px;font-weight:500;cursor:pointer">
                 Giriş Yap
               </button>`}
        </div>
      `}
    </div>
  `;
}

/* ════════════════════════════════
   TASARIMCI TAKİP
════════════════════════════════ */
async function toggleFollow(designerId, designerName) {
  if (!currentUser) {
    showModal('loginModal');
    showToast('Takip etmek için giriş yapın', '');
    return;
  }
  const btn = document.getElementById('dpubFollowBtn');
  const isNow = btn?.classList.contains('following');
  const docId = `${currentUser.uid}_${designerId}`;

  try {
    if (isNow) {
      await db.collection('follows').doc(docId).delete();
      if (btn) { btn.classList.remove('following'); btn.textContent = '+ Takip Et'; }
      showToast(`${designerName} takipten çıkarıldı`, '');
    } else {
      await db.collection('follows').doc(docId).set({
        followerId:    currentUser.uid,
        followerName:  currentUser.name,
        followerEmail: currentUser.email,
        designerId,
        designerName,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      if (btn) { btn.classList.add('following'); btn.textContent = '✓ Takip Ediliyor'; }
      showToast(`${designerName} takip edildi! 🎉`, 'success');
    }
  } catch(e) {
    showToast('Hata: ' + e.message, 'error');
    console.error('Follow error:', e);
  }
}

/* ════════════════════════════════
   YORUM SİSTEMİ
════════════════════════════════ */
let _reviewTargetDesignerId  = null;
let _reviewTargetDesignerName = null;
let _reviewCurrentRating     = 5;

function openReviewModal(designerId, designerName) {
  if (!currentUser) { showModal('loginModal'); return; }
  _reviewTargetDesignerId   = designerId;
  _reviewTargetDesignerName = designerName;
  _reviewCurrentRating = 5;
  // Star'ları sıfırla
  setReviewRating(5);
  // Textarea sıfırla
  const ta = document.getElementById('reviewText');
  if (ta) ta.value = '';
  const cc = document.getElementById('reviewCharCount');
  if (cc) cc.textContent = '0/500';
  // Tasarımcı bilgisi göster
  const infoEl = document.getElementById('reviewDesignInfo');
  if (infoEl) infoEl.innerHTML = `
    <span style="color:var(--text3);font-size:12px;text-transform:uppercase;letter-spacing:.06em;font-family:var(--font-mono)">Yorum yapılacak: </span>
    <span style="font-weight:500;color:var(--text)">${designerName}</span>
  `;
  showModal('reviewModal');
}

function setReviewRating(val) {
  _reviewCurrentRating = val;
  document.querySelectorAll('.star-btn').forEach((btn, i) => {
    const isLit = i < val;
    btn.classList.toggle('star-lit', isLit);
    btn.style.color = isLit ? 'var(--gold)' : 'var(--text3)';
    btn.style.transform = isLit ? 'scale(1.15)' : 'scale(1)';
  });
}

async function submitReview() {
  if (!currentUser) { closeModal('reviewModal'); showModal('loginModal'); return; }
  const text = document.getElementById('reviewText')?.value?.trim();
  if (!text || text.length < 20) {
    showToast('Yorum en az 20 karakter olmalı', 'error');
    return;
  }
  const btn = document.querySelector('#reviewModal .btn-form');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Gönderiliyor...'; }

  try {
    await db.collection('reviews').add({
      designerId:    _reviewTargetDesignerId,
      designerName:  _reviewTargetDesignerName,
      reviewerId:    currentUser.uid,
      reviewerName:  currentUser.name,
      reviewerEmail: currentUser.email,
      rating:        _reviewCurrentRating,
      text,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    closeModal('reviewModal');
    showToast('Yorumun yayınlandı! ✓', 'success');
    // Profil sayfasındaysak yenile
    if (currentPage === 'designer-public') {
      showDesignerPublicProfile(_reviewTargetDesignerId, _reviewTargetDesignerName);
    }
  } catch(e) {
    showToast('Hata: ' + e.message, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Yorumu Gönder'; }
    console.error('Review submit:', e);
  }
}

/* ════════════════════════════════
   PAYLAŞIM MODAL
════════════════════════════════ */
function openShareModal(designId) {
  const d = ALL_DESIGNS.find(x => String(x.id) === String(designId));
  if (!d) return;
  const url     = `https://muratlola.com/#design-${designId}`;
  const title   = encodeURIComponent(`${safeTitle} — formaLOLA`);
  const urlEnc  = encodeURIComponent(url);

  const el = document.getElementById('shareContent');
  if (!el) return;
  el.innerHTML = `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r);padding:12px 14px;margin-bottom:18px">
      <div style="font-size:11px;color:var(--text3);margin-bottom:7px;font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.06em">Link</div>
      <div style="display:flex;gap:8px">
        <input id="shareUrlInput" type="text" value="${url}" readonly
          style="flex:1;background:var(--bg4);border:1px solid var(--border);border-radius:var(--r);padding:9px 12px;color:var(--text);font-size:12px;font-family:var(--font-mono);min-width:0">
        <button onclick="copyShareUrl()"
          style="padding:9px 14px;background:var(--accent);border:none;border-radius:var(--r);color:#fff;font-size:13px;cursor:pointer;white-space:nowrap;transition:all var(--tr)"
          onmouseover="this.style.background='var(--accent2)'"
          onmouseout="this.style.background='var(--accent)'">
          Kopyala
        </button>
      </div>
    </div>

    <div style="font-size:11px;color:var(--text3);margin-bottom:10px;text-transform:uppercase;letter-spacing:.06em;font-family:var(--font-mono)">Platformda Paylaş</div>

    <button class="share-btn share-btn-x"
      onclick="window.open('https://twitter.com/intent/tweet?text=${title}&url=${urlEnc}','_blank')">
      𝕏 Twitter / X
    </button>
    <button class="share-btn share-btn-wa"
      onclick="window.open('https://wa.me/?text=${title}%20${urlEnc}','_blank')">
      💬 WhatsApp
    </button>
    <button class="share-btn share-btn-tg"
      onclick="window.open('https://t.me/share/url?url=${urlEnc}&text=${title}','_blank')">
      📲 Telegram
    </button>
    <button class="share-btn share-btn-cp" onclick="copyShareUrl()">
      📋 Linki Kopyala
    </button>
  `;
  showModal('shareModal');
}

function copyShareUrl() {
  const input = document.getElementById('shareUrlInput');
  if (!input) return;
  navigator.clipboard.writeText(input.value)
    .then(() => showToast('Link kopyalandı! ✓', 'success'))
    .catch(() => {
      input.select();
      document.execCommand('copy');
      showToast('Link kopyalandı! ✓', 'success');
    });
}

/* ════════════════════════════════
   DESIGNERS PAGE — GELİŞTİRİLMİŞ
   (Tasarımcı adına tıklayınca profil açılsın)
════════════════════════════════ */
// Mevcut renderDesignersPage fonksiyonunu override et
// (app.js'de zaten var, burada genişletiyoruz)
const _origRenderDesignersPage = renderDesignersPage;
renderDesignersPage = function() {
  const grid = document.getElementById('designersGrid');
  if (!grid) return;

  // Gerçek tasarımcılar Firestore'dan gelir
  const allDesigners = [];

  if (!allDesigners.length) { grid.innerHTML='<div style="text-align:center;padding:60px 20px"><div style="font-size:40px;margin-bottom:14px">👥</div><p style="color:var(--text2);margin-bottom:18px">Henüz kayıtlı tasarımcı bulunmuyor.</p><button class="btn-cta" onclick="showModal(\"loginModal\")">Tasarımcı Olarak Katıl</button></div>'; return; }
  grid.innerHTML = allDesigners.map(d => `
    <div class="designer-card" onclick="showDesignerPublicProfile('${d.id}','${d.name}')">
      <div class="designer-card-top">
        <div class="dcard-av">${d.initials}</div>
        <div>
          <div class="dcard-name">${d.name}</div>
          <div class="dcard-level">${levelLabel(d.level)}</div>
        </div>
      </div>
      <div style="font-size:12px;color:var(--text2);margin:8px 0 14px;line-height:1.5">${d.bio}</div>
      <div class="dcard-stats">
        <div class="dcard-stat"><div class="dcard-stat-n">${d.designs}</div><div class="dcard-stat-l">Tasarım</div></div>
        <div class="dcard-stat"><div class="dcard-stat-n">${d.sales}</div><div class="dcard-stat-l">Satış</div></div>
        <div class="dcard-stat"><div class="dcard-stat-n">${d.rating}★</div><div class="dcard-stat-l">Puan</div></div>
      </div>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button class="btn-follow-sm" onclick="event.stopPropagation();toggleFollow('${d.id}','${d.name}')">+ Takip</button>
        <button onclick="event.stopPropagation();showDesignerPublicProfile('${d.id}','${d.name}')"
          style="flex:1;padding:7px 12px;background:transparent;border:1px solid var(--border);border-radius:var(--r);color:var(--text2);font-size:12px;cursor:pointer;transition:all var(--tr)"
          onmouseover="this.style.background='var(--bg4)';this.style.color='var(--text)'"
          onmouseout="this.style.background='transparent';this.style.color='var(--text2)'">
          Profili Gör
        </button>
      </div>
    </div>
  `).join('');
};

/* ════════════════════════════════
   COMPETITIONS — KATILMA
════════════════════════════════ */
const _origRenderCompsPage = renderCompetitionsPage;
renderCompetitionsPage = function() {
  const grid = document.getElementById('compsGrid');
  if (!grid) return;
  const comps = [];

  if (!comps.length) { grid.innerHTML='<div style="text-align:center;padding:60px 20px"><div style="font-size:40px;margin-bottom:14px">🏆</div><p style="color:var(--text2)">Şu an aktif yarışma bulunmuyor.</p></div>'; return; }
  grid.innerHTML = comps.map(c => `
    <div class="comp-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div class="comp-club">${sanitizeHTML(c.club)}</div>
        <span class="comp-badge">${c.entries} katılımcı</span>
      </div>
      <div class="comp-desc">${sanitizeHTML(c.desc)}</div>
      <div class="comp-meta" style="margin-top:14px">
        <span class="comp-prize">${c.prize}</span>
        <span class="comp-deadline">${c.deadline}</span>
      </div>
      <div style="margin-top:14px;display:flex;gap:8px">
        <button
          style="flex:1;padding:10px;background:var(--accent);border:none;border-radius:var(--r);color:#fff;font-size:13px;font-weight:500;cursor:pointer;transition:all var(--tr)"
          onmouseover="this.style.background='var(--accent2)'"
          onmouseout="this.style.background='var(--accent)'"
          onclick="joinCompetition('${c.id}','${c.club}')">
          Katıl
        </button>
        <button
          style="padding:10px 14px;background:transparent;border:1px solid var(--border);border-radius:var(--r);color:var(--text2);font-size:13px;cursor:pointer;transition:all var(--tr)"
          onmouseover="this.style.background='var(--bg3)'"
          onmouseout="this.style.background='transparent'"
          onclick="showToast('Yarışma detayları yakında!','')">
          Detay
        </button>
      </div>
    </div>
  `).join('');
};

async function joinCompetition(compId, clubName) {
  if (!currentUser) {
    showModal('loginModal');
    showToast('Yarışmaya katılmak için giriş yapın', '');
    return;
  }
  try {
    await db.collection('competition_entries').add({
      compId,
      clubName,
      userId:    currentUser.uid,
      userName:  currentUser.name,
      userEmail: currentUser.email,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    showToast(`🏆 ${clubName} yarışmasına katıldın! Başarılar!`, 'success');
  } catch(e) {
    showToast('Hata: ' + e.message, 'error');
  }
}

/* ════════════════════════════════
   DASHBOARD — TAM GERÇEK VERİ
════════════════════════════════ */

// dashTab override — purchases ve mydesigns gerçek Firestore verisiyle
const _origDashTab = dashTab;
dashTab = function(tab, btn) {
  document.querySelectorAll('.dn-item').forEach(i => i.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const el = document.getElementById('dashContent');
  if (!el) return;

  if (tab === 'overview') {
    el.innerHTML = `
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:24px">
        Hoş geldin, ${currentUser?.name || 'Tasarımcı'} 👋
      </h2>
      <div class="dash-stats" id="dashStatsGrid">
        <div class="ds-card"><div class="ds-label">Yükleniyor...</div><div class="ds-val">—</div></div>
      </div>
      <div class="dash-section-title" style="margin-top:24px">Son Tasarımlarım</div>
      <div id="dashRecentDesigns" style="color:var(--text2);font-size:13px">Yükleniyor...</div>
    `;
    loadDashboardOverview();

  } else if (tab === 'purchases') {
    el.innerHTML = `
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:24px">Satın Aldıklarım</h2>
      <div id="purchasesContent" style="color:var(--text2)">Yükleniyor...</div>
    `;
    loadPurchasesReal();

  } else if (tab === 'mydesigns') {
    el.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px">Tasarımlarım</h2>
        <button class="btn-primary" onclick="authThenUpload()">+ Yeni Yükle</button>
      </div>
      <div id="myDesignsContainer" style="color:var(--text2)">Yükleniyor...</div>
    `;
    loadMyDesignsReal();

  } else if (tab === 'sales') {
    el.innerHTML = `
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:24px">Satışlar</h2>
      <div id="salesContainer" style="color:var(--text2)">Yükleniyor...</div>
    `;
    loadSalesReal();

  } else if (tab === 'earnings') {
    el.innerHTML = `
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:24px">Kazançlar</h2>
      <div class="dash-stats" id="earningsStats">
        <div class="ds-card"><div class="ds-label">Yükleniyor...</div><div class="ds-val">—</div></div>
      </div>
      <div style="margin-top:20px;background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-lg);padding:22px;text-align:center">
        <div style="font-size:13px;color:var(--text2);margin-bottom:14px">Minimum ₺500 tutarında ödeme talebi oluşturabilirsin.</div>
        <button class="btn-cta" onclick="showToast('iyzico ödeme entegrasyonu aktif olduğunda kullanılabilir.','')">Ödeme İste</button>
      </div>
    `;
    loadEarningsReal();

  } else if (tab === 'favorites') {
    const favDesigns = ALL_DESIGNS.filter(d => favorites.has(String(d.id)));
    el.innerHTML = `
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:24px">Favorilerim</h2>
      ${favDesigns.length === 0
        ? `<div style="text-align:center;padding:60px 20px">
            <div style="font-size:40px;margin-bottom:14px">❤️</div>
            <p style="color:var(--text2);margin-bottom:18px">Henüz favori tasarımın yok.</p>
            <button class="btn-cta" onclick="showPage('explore')">Tasarımları Keşfet</button>
           </div>`
        : `<div class="designs-grid">${favDesigns.map(d => designCard(d)).join('')}</div>`}
    `;

  } else if (tab === 'settings') {
    el.innerHTML = `
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:24px">Ayarlar</h2>
      <div style="max-width:520px">
        <div class="fg"><label>İsim</label><input type="text" id="settingsName" value="${currentUser?.name || ''}"></div>
        <div class="fg"><label>E-posta</label><input type="email" value="${currentUser?.email || ''}" disabled style="opacity:.55"></div>
        <div class="fg"><label>Bio</label><textarea rows="3" placeholder="Kendini tanıt..."></textarea></div>
        <button class="btn-form" onclick="saveProfileSettings()">Kaydet</button>
        <div style="margin-top:24px;padding-top:22px;border-top:1px solid var(--border)">
          <button
            style="padding:10px 18px;background:transparent;border:1px solid rgba(230,57,70,.4);color:var(--accent);border-radius:var(--r);font-size:13px;cursor:pointer;transition:all var(--tr)"
            onmouseover="this.style.background='rgba(230,57,70,.08)'"
            onmouseout="this.style.background='transparent'"
            onclick="doLogout()">
            Çıkış Yap
          </button>
        </div>
      </div>
    `;

  } else if (tab === 'adminPanel') {
    el.innerHTML = `
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:28px;margin-bottom:24px;color:var(--accent)">
        Admin Paneli
      </h2>
      <div style="display:grid;gap:22px">
        <div>
          <h3 style="font-size:15px;margin-bottom:12px;color:var(--text)">Onay Bekleyen Tasarımlar</h3>
          <div id="adminPendingGrid" class="designs-grid" style="grid-template-columns:1fr">Yükleniyor...</div>
        </div>
        <div>
          <h3 style="font-size:15px;margin-bottom:12px;color:var(--text)">Bekleyen Ödeme Talepleri</h3>
          <div id="adminPendingPayouts" style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-lg);padding:14px">Yükleniyor...</div>
        </div>
      </div>
    `;
    loadPendingDesigns();
    loadPendingPayouts();
  }
};

// Profil kaydet
async function saveProfileSettings() {
  const name = document.getElementById('settingsName')?.value?.trim();
  if (!name) { showToast('İsim boş olamaz', 'error'); return; }
  try {
    await auth.currentUser?.updateProfile({ displayName: name });
    if (currentUser) currentUser.name = name;
    showToast('Profil güncellendi ✓', 'success');
  } catch(e) { showToast('Hata: ' + e.message, 'error'); }
}

/* ─── Satın Aldıklarım (Firestore gerçek + güvenli indirme) ─── */
async function loadPurchasesReal() {
  const el = document.getElementById('purchasesContent');
  if (!el || !currentUser) return;
  try {
    const snap = await db.collection('purchases').where('buyerId', '==', currentUser.uid).where('status', '==', 'completed').get();
    if (snap.empty) {
      el.innerHTML = `<div style="text-align:center;padding:60px 20px"><div style="font-size:40px;margin-bottom:14px">🛒</div><p style="color:var(--text2);margin-bottom:18px">Henüz bir tasarım satın almadın.</p><button class="btn-cta" onclick="showPage('explore')">Tasarımları Keşfet</button></div>`;
      return;
    }
    const rows = [];
    snap.forEach(doc => {
      const p = doc.data();
      const ts = p.purchasedAt?.toDate?.() ? p.purchasedAt.toDate().toLocaleDateString('tr-TR') : '—';
      rows.push(`<div style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;"><div><div style="font-size:15px;font-weight:500;color:var(--text)">${sanitizeHTML(p.designTitle || 'İsimsiz Tasarım')}</div><div style="font-size:12px;color:var(--text3);margin-top:4px">${p.license === 'exclusive' ? 'Exclusive Lisans' : 'Standart Lisans'} · <span style="color:var(--accent)">₺${(p.price||0).toLocaleString('tr-TR')}</span> · ${ts}</div></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button onclick="downloadSecureFile('${p.designId}', 'ai')" style="padding:8px 14px;background:rgba(230,57,70,0.15);color:var(--accent);border:1px solid var(--accent);border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;">↓ İndir (AI)</button><button onclick="downloadSecureFile('${p.designId}', 'pdf')" style="padding:8px 14px;background:rgba(42,157,143,0.15);color:#4ecdc4;border:1px solid #4ecdc4;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;">↓ İndir (PDF)</button></div></div>`);
    });
    el.innerHTML = `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden">${rows.join('')}</div>`;
  } catch(e) {
    el.innerHTML = `<p style="color:var(--text2)">Veriler yüklenemedi: ${e.message}</p>`;
    console.error(e);
  }
}

async function downloadSecureFile(designId, fileType) {
  showToast(`${fileType.toUpperCase()} dosyası hazırlanıyor...`, '');
  try {
    const fn = getFunctions().httpsCallable('getSecureDownloadUrl');
    const response = await fn({ designId, fileType });
    const url = response?.data?.downloadUrl;
    if (!url) throw new Error('İndirme linki üretilemedi.');
    window.open(url, '_blank', 'noopener');
    showToast('İndirme başlatıldı ✓', 'success');
  } catch (error) {
    console.error('İndirme hatası:', error);
    showToast('Dosya indirilemedi: ' + error.message, 'error');
  }
}

async function handlePayoutRequest() {
  const amount = parseFloat(prompt('Çekmek istediğiniz tutarı girin (Min 500 TL):') || '0');
  if (!amount || amount < 500) return showToast('Minimum 500 TL çekebilirsin.', 'error');
  const fullName = prompt('Banka Hesabı Sahibinin Adı Soyadı:');
  const iban = prompt('IBAN Numaranız (TR...):');
  if (!fullName || !iban) return showToast('Ad ve IBAN zorunludur.', 'error');
  try {
    const fn = getFunctions().httpsCallable('requestPayout');
    await fn({ amount, iban, fullName });
    showToast('Ödeme talebiniz oluşturuldu.', 'success');
  } catch (error) {
    showToast('Hata: ' + error.message, 'error');
  }
}

async function loadPendingPayouts() {
  const el = document.getElementById('adminPendingPayouts');
  if (!el) return;
  try {
    const snap = await db.collection('payout_requests').where('status', '==', 'pending').get();
    if (snap.empty) { el.innerHTML = '<p style="color:var(--text2)">Bekleyen ödeme talebi yok.</p>'; return; }
    let html = '<table style="width:100%;text-align:left;border-collapse:collapse"><tr style="border-bottom:1px solid var(--border)"><th style="padding:10px">Tasarımcı</th><th style="padding:10px">Tutar</th><th style="padding:10px">IBAN</th><th style="padding:10px">İşlem</th></tr>';
    snap.forEach(doc => {
      const data = doc.data();
      html += `<tr style="border-bottom:1px solid var(--border2)"><td style="padding:10px">${sanitizeHTML(data.fullName || '—')}</td><td style="padding:10px;color:var(--accent)">₺${Number(data.amount||0).toLocaleString('tr-TR')}</td><td style="padding:10px;font-family:var(--font-mono);font-size:12px">${sanitizeHTML(data.iban || '—')}</td><td style="padding:10px;display:flex;gap:8px;flex-wrap:wrap"><button onclick="processPayoutAction('${doc.id}','approve')" style="background:green;color:#fff;padding:6px 10px;border:none;border-radius:4px;cursor:pointer">Ödendi</button><button onclick="processPayoutAction('${doc.id}','reject')" style="background:#a22;color:#fff;padding:6px 10px;border:none;border-radius:4px;cursor:pointer">Reddet</button></td></tr>`;
    });
    html += '</table>';
    el.innerHTML = html;
  } catch (error) {
    el.innerHTML = `<p style="color:var(--accent)">Ödemeler yüklenemedi: ${sanitizeHTML(error.message)}</p>`;
  }
}

async function processPayoutAction(payoutId, action) {
  if (action === 'approve' && !confirm('Parayı bankadan gönderdiğini onaylıyor musun?')) return;
  if (action === 'reject' && !confirm('Talebi reddetmek istediğine emin misin?')) return;
  try {
    const fn = getFunctions().httpsCallable('processPayout');
    await fn({ payoutId, action });
    showToast(action === 'approve' ? 'Ödeme tamamlandı.' : 'Talep reddedildi.', 'success');
    loadPendingPayouts();
  } catch (error) {
    showToast('Hata: ' + error.message, 'error');
  }
}

/* ─── Tasarımlarım (Firestore gerçek + durum badge + istatistik) ─── */
async function loadMyDesignsReal() {
  const el = document.getElementById('myDesignsContainer');
  if (!el || !currentUser) return;
  try {
    const snap = await db.collection('designs')
      .where('designerId', '==', currentUser.uid)
      .get();
    if (snap.empty) {
      el.innerHTML = `<div style="text-align:center;padding:60px 20px">
        <div style="font-size:40px;margin-bottom:14px">🎨</div>
        <p style="color:var(--text2);margin-bottom:18px">Henüz tasarım yüklemedin.</p>
        <button class="btn-cta" onclick="authThenUpload()">+ İlk Tasarımını Yükle</button>
      </div>`;
      return;
    }
    const designs = [];
    snap.forEach(doc => designs.push({ id: doc.id, ...doc.data() }));

    el.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px">
      ${designs.map(d => {
        const c1 = (d.colors && d.colors[0]) || '#1f1f26';
        const c2 = (d.colors && d.colors[1]) || '#0c0c0e';
        const bg = `linear-gradient(140deg,${c1},${c2})`;
        const statusCls = d.status === 'approved' ? 'rgba(42,157,143,.8)' : d.status === 'pending' ? 'rgba(201,168,76,.8)' : 'rgba(230,57,70,.8)';
        const statusTxt = d.status === 'approved' ? '✓ Yayında' : d.status === 'pending' ? '⏳ Bekliyor' : '✕ Reddedildi';
        return `
          <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden;transition:all var(--tr)"
            onmouseover="this.style.borderColor='var(--border2)';this.style.transform='translateY(-2px)'"
            onmouseout="this.style.borderColor='var(--border)';this.style.transform='translateY(0)'">
            <div style="height:140px;background:${bg};position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center">
              ${d.coverThumb
                ? `<img src="${d.coverThumb}" style="width:100%;height:100%;object-fit:cover">`
                : `<div style="width:60px;height:72px;background:rgba(255,255,255,.12);border-radius:6px 6px 10px 10px;display:flex;align-items:center;justify-content:center">
                     <span style="font-family:'Bebas Neue',sans-serif;font-size:24px;color:rgba(255,255,255,.7)">10</span>
                   </div>`}
              <div style="position:absolute;top:8px;right:8px">
                <span style="font-size:10px;padding:3px 9px;border-radius:4px;background:${statusCls};color:#fff;font-weight:500">${statusTxt}</span>
              </div>
            </div>
            <div style="padding:12px 15px">
              <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px">${d.title || '—'}</div>
              <div style="font-size:11px;color:var(--text3);margin-bottom:10px">${d.sport || ''}</div>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:500">₺${(d.price||0).toLocaleString('tr-TR')}</span>
                <div style="display:flex;gap:10px;font-size:12px;color:var(--text3)">
                  <span title="Beğeni">♥ ${d.likes || 0}</span>
                  <span title="Satış">🛒 ${d.sales || 0}</span>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>`;
  } catch(e) {
    el.innerHTML = `<p style="color:var(--accent)">Veriler çekilemedi: ${e.message}</p>`;
    console.error(e);
  }
}

/* ─── Satışlar (Firestore gerçek) ─── */
async function loadSalesReal() {
  const el = document.getElementById('salesContainer');
  if (!el || !currentUser) return;
  try {
    const snap = await db.collection('purchases')
      .where('designerId', '==', currentUser.uid)
      .get();
    if (snap.empty) {
      el.innerHTML = `<div style="text-align:center;padding:60px 20px">
        <div style="font-size:40px;margin-bottom:14px">📊</div>
        <p style="color:var(--text2)">Henüz satış yapılmadı. Tasarımlarını paylaşmaya devam et!</p>
      </div>`;
      return;
    }
    const rows = [];
    snap.forEach(doc => {
      const p = doc.data();
      const ts = p.purchasedAt?.toDate?.() ? p.purchasedAt.toDate().toLocaleDateString('tr-TR') : '—';
      rows.push({ ...p, ts });
    });
    // En yeni önce
    rows.sort((a, b) => {
      const ta = a.purchasedAt?.toMillis?.() || 0;
      const tb = b.purchasedAt?.toMillis?.() || 0;
      return tb - ta;
    });

    el.innerHTML = `
      <div style="background:var(--bg3);border:1px solid var(--border);border-radius:var(--r-lg);overflow:hidden">
        <div style="padding:12px 18px;border-bottom:1px solid var(--border);display:grid;grid-template-columns:1fr 1fr 1fr 1fr;font-size:11px;color:var(--text3);font-family:var(--font-mono);text-transform:uppercase;letter-spacing:.08em">
          <span>Tasarım</span><span>Alıcı</span><span>Fiyat</span><span>Tarih</span>
        </div>
        ${rows.map(s => `
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:grid;grid-template-columns:1fr 1fr 1fr 1fr;font-size:13px;align-items:center">
            <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.designTitle || s.designId || '—'}</span>
            <span style="color:var(--text2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.buyerEmail || '—'}</span>
            <span style="color:var(--accent);font-family:var(--font-mono);font-weight:500">₺${(s.price||0).toLocaleString('tr-TR')}</span>
            <span style="color:var(--text3);font-size:12px">${s.ts}</span>
          </div>
        `).join('')}
      </div>
    `;
  } catch(e) {
    el.innerHTML = `<p style="color:var(--accent)">Veriler çekilemedi: ${e.message}</p>`;
    console.error(e);
  }
}

/* ─── Kazançlar (Firestore hesaplamalı) ─── */
async function loadEarningsReal() {
  const el = document.getElementById('earningsStats');
  if (!el || !currentUser) return;
  try {
    const snap = await db.collection('purchases')
      .where('designerId', '==', currentUser.uid)
      .get();
    let totalEarnings = 0, thisMonthEarnings = 0;
    const now = new Date();
    snap.forEach(doc => {
      const p = doc.data();
      const earn = (p.price || 0) * 0.8;
      totalEarnings += earn;
      const pd = p.purchasedAt?.toDate?.();
      if (pd && pd.getMonth() === now.getMonth() && pd.getFullYear() === now.getFullYear()) {
        thisMonthEarnings += earn;
      }
    });
    el.innerHTML = `
      <div class="ds-card"><div class="ds-label">Bu Ay</div><div class="ds-val gold">₺${Math.round(thisMonthEarnings).toLocaleString('tr-TR')}</div></div>
      <div class="ds-card"><div class="ds-label">Toplam</div><div class="ds-val gold">₺${Math.round(totalEarnings).toLocaleString('tr-TR')}</div></div>
      <div class="ds-card"><div class="ds-label">Komisyon Oranı</div><div class="ds-val">%20</div></div>
      <div class="ds-card"><div class="ds-label">Senin Payın</div><div class="ds-val">%80</div></div>
    `;
  } catch(e) {
    el.innerHTML = `<div class="ds-card"><div class="ds-label">Veri yüklenemedi</div><div class="ds-val">—</div></div>`;
    console.error(e);
  }
}

/* ════════════════════════════════
   DESIGN CARD — TASARIMCI PROF LİNKİ
   (designCard içindeki by linkini güncelle)
════════════════════════════════ */
// Tasarım kartındaki tasarımcı adına tıklayınca profil sayfası açılır.
// Mevcut designCard fonksiyonu showDesignerProfile(d.id) çağırıyor.
// Bunu showDesignerPublicProfile'a yönlendiriyoruz.
const _origShowDesignerProfile = showDesignerProfile;
showDesignerProfile = function(id) {
  // Önce tasarım ID'sinden designer ID'yi al
  const design = ALL_DESIGNS.find(x => String(x.id) === String(id));
  if (design && design.designerId) {
    showDesignerPublicProfile(design.designerId, design.designer);
  } else if (design) {
    showDesignerPublicProfile(id, design?.designer || '');
  } else {
    // Mock designer — eski fonksiyonu çağır
    _origShowDesignerProfile(id);
  }
};

/* ════════════════════════════════
   CSS ANIMATION — Spinner
════════════════════════════════ */
(function injectSpinnerCSS() {
  if (document.getElementById('fl-extra-css')) return;
  const style = document.createElement('style');
  style.id = 'fl-extra-css';
  style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    .spinner { width:32px;height:32px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin .8s linear infinite; }
  `;
  document.head.appendChild(style);
})();


/* ════════════════════════════════════════════════════════════════════
   FINAL PUBLISH — Son Güncellemeler
   ✓ Mock data kaldırıldı (sadece Firestore gerçek veri)
   ✓ SEO sayfa routing
   ✓ Dynamic page title
   ✓ Contact form (Firestore)
   ✓ Sitemap helper
   ✓ Google AdSense hazırlık
   ✓ About / Contact pages
   ✓ Cookie policy page
   ✓ SEO landing page renders
════════════════════════════════════════════════════════════════════ */

/* ════════════════════════════════
   MOBİL NAV OVERLAY KAPATMA
════════════════════════════════ */
// Sayfa değiştiğinde mobil menüyü kapat
const _origShowPageForNav = showPage;
showPage = function(pageId) {
  // Mobil nav'ı kapat
  const navMob = document.getElementById('navMobileMenu');
  if (navMob) navMob.classList.add('hidden');
  // Dynamic title güncelle
  updatePageTitle(pageId);
  // SEO sayfaları için render
  if (pageId === 'seo-kitdesign') renderSeoKitGrid();
  if (pageId === 'seo-jerseyideas') renderSeoJerseyGrid();
  // Orijinal fonksiyon
  _origShowPageForNav(pageId);
};

/* ════════════════════════════════
   DYNAMIC PAGE TITLE (SEO)
════════════════════════════════ */
function updatePageTitle(pageId) {
  const titles = {
    'home':              'formaLOLA — Global Football Kit Design Marketplace',
    'explore':           'Forma Tasarımlarını Keşfet — formaLOLA',
    'designers':         'En İyi Forma Tasarımcıları — formaLOLA',
    'competitions':      'Forma Tasarım Yarışmaları — formaLOLA',
    'how':               'Nasıl Çalışır — formaLOLA',
    'dashboard':         'Dashboard — formaLOLA',
    'about':             'Hakkımızda — formaLOLA',
    'contact':           'İletişim — formaLOLA',
    'legal-privacy':     'Gizlilik Politikası — formaLOLA',
    'legal-sales':       'Mesafeli Satış Sözleşmesi — formaLOLA',
    'legal-refund':      'İptal ve İade Koşulları — formaLOLA',
    'legal-terms':       'Kullanım Koşulları — formaLOLA',
    'legal-cookies':     'Çerez Politikası — formaLOLA',
    'seo-kitdesign':     'Football Kit Design Marketplace — formaLOLA',
    'seo-jerseyideas':   'Jersey Design Ideas & Inspiration — formaLOLA',
    'designer-public':   'Tasarımcı Profili — formaLOLA',
  };
  const title = titles[pageId];
  if (title) document.title = title;
}

/* ════════════════════════════════
   SEO LANDING PAGE RENDERS
════════════════════════════════ */
function renderSeoKitGrid() {
  const grid = document.getElementById('seoKitGrid');
  if (!grid) return;
  // Onaylı tasarımları göster (ALL_DESIGNS içinden)
  const designs = ALL_DESIGNS.slice(0, 12);
  grid.innerHTML = designs.map(d => designCard(d)).join('');
}

function renderSeoJerseyGrid() {
  const grid = document.getElementById('seoJerseyGrid');
  if (!grid) return;
  const designs = ALL_DESIGNS.slice(0, 8);
  grid.innerHTML = designs.map(d => designCard(d)).join('');
}

/* ════════════════════════════════
   CONTACT FORM (Firestore)
════════════════════════════════ */
async function sendContactForm() {
  const name    = document.getElementById('contactName')?.value?.trim();
  const email   = document.getElementById('contactEmail')?.value?.trim();
  const subject = document.getElementById('contactSubject')?.value;
  const msg     = document.getElementById('contactMsg')?.value?.trim();

  if (!name || !email || !msg) {
    showToast('Lütfen tüm alanları doldurun', 'error');
    return;
  }
  if (msg.length < 10) {
    showToast('Mesaj en az 10 karakter olmalı', 'error');
    return;
  }

  const btn = document.querySelector('#page-contact .btn-form');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Gönderiliyor...'; }

  try {
    await db.collection('contact_messages').add({
      name, email, subject, message: msg,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      status: 'new',
      userId: currentUser?.uid || null
    });

    // Formu temizle
    ['contactName','contactEmail','contactMsg'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    if (btn) { btn.disabled = false; btn.textContent = 'Mesaj Gönder'; }
    showToast('Mesajınız gönderildi! En kısa sürede dönüş yapacağız. ✓', 'success');
  } catch(e) {
    if (btn) { btn.disabled = false; btn.textContent = 'Mesaj Gönder'; }
    showToast(e.code === 'permission-denied' ? 'İletişim formu için Firestore rules izni gerekli.' : ('Gönderim hatası: ' + e.message), 'error');
    console.error('Contact form:', e);
  }
}

/* ════════════════════════════════
   MOCK DATA TEMİZLEME
   Gerçek veriler gelince mock gösterilmesin
════════════════════════════════ */
// fetchApprovedDesigns çalıştıktan sonra gerçek veri varsa mock'ları gizle
const _origFetchApproved = fetchApprovedDesigns;
fetchApprovedDesigns = async function() {
  await _origFetchApproved();
  // Gerçek tasarım sayısı mock'tan fazlaysa sadece gerçekleri göster
  const realCount = ALL_DESIGNS.filter(d => !String(d.id).startsWith('m')).length;
  if (realCount >= 6) {
    // Yeterli gerçek içerik var — mock'ları filtrele
    ALL_DESIGNS = ALL_DESIGNS.filter(d => !String(d.id).startsWith('m'));
    renderHomeDesigns();
    console.log(`✓ ${realCount} gerçek tasarım var — mock data kaldırıldı`);
  }
};

/* ════════════════════════════════
   COMPETITIONS — SADECE GERÇEK FİRESTORE
   Mock yarışmaları kaldır, gerçek Firestore'dan çek
════════════════════════════════ */
// Yarışmaları Firestore'dan çek + mock fallback
async function fetchCompetitions() {
  try {
    const snap = await db.collection('competitions')
      .where('status', '==', 'active')
      .limit(10)
      .get();
    if (!snap.empty) {
      const real = [];
      snap.forEach(doc => {
        const c = doc.data();
        real.push({
          id: doc.id,
          club: c.club || c.clubName || '—',
          desc: c.description || c.desc || '',
          prize: c.prize || '—',
          deadline: c.deadline || '—',
          entries: c.entriesCount || 0
        });
      });
      // MOCK_COMPETITIONS'ı gerçekle güncelle
      MOCK_COMPETITIONS.length = 0;
      real.forEach(c => MOCK_COMPETITIONS.push(c));
      if (currentPage === 'competitions') renderCompetitionsPage();
    }
  } catch(e) {
    console.log('Competitions Firestore:', e.message, '— mock kullanılıyor');
  }
}

/* ════════════════════════════════
   DESIGNERS — SADECE GERÇEK FİRESTORE
   Mock tasarımcıları kaldır, Firestore'dan çek
════════════════════════════════ */
async function fetchDesigners() {
  try {
    const snap = await db.collection('users')
      .where('role', '==', 'designer')
      .limit(20)
      .get();
    if (!snap.empty && snap.size > 0) {
      const real = [];
      snap.forEach(doc => {
        const u = doc.data();
        real.push({
          id: doc.id,
          name:     u.name || u.displayName || '—',
          initials: (u.name || '?').substring(0, 2).toUpperCase(),
          bio:      u.bio || 'formaLOLA tasarımcısı',
          sales:    u.salesCount    || 0,
          designs:  u.designsCount  || 0,
          rating:   u.rating        || 5.0,
          level:    u.level         || 'rookie'
        });
      });
      // Gerçek tasarımcı varsa mock'u güncelle
      if (real.length > 0) {
        MOCK_DESIGNERS.length = 0;
        real.forEach(d => MOCK_DESIGNERS.push(d));
        if (currentPage === 'designers') renderDesignersPage();
        console.log(`✓ ${real.length} gerçek tasarımcı yüklendi`);
      }
    }
  } catch(e) {
    console.log('Designers Firestore:', e.message, '— mock kullanılıyor');
  }
}

/* ════════════════════════════════
   INIT GENİŞLETME
   Gerçek veri fetch'lerini çalıştır
════════════════════════════════ */
// DOMContentLoaded'dan sonra gerçek veriyi çek
document.addEventListener('DOMContentLoaded', function onFinalInit() {
  document.removeEventListener('DOMContentLoaded', onFinalInit);
  // Gerçek yarışmalar ve tasarımcıları çek (mock fallback var)
  setTimeout(() => {
    fetchCompetitions();
    fetchDesigners();
  }, 1500); // Firebase init'ten sonra çalış
});

/* ════════════════════════════════
   NAV — ABOUT / CONTACT LİNKLERİ
   Mobile nav'a da ekle
════════════════════════════════ */
// Nav router helper - nav linkleri için
function navTo(pageId) {
  const mob = document.getElementById('navMobileMenu');
  if (mob) mob.classList.add('hidden');
  showPage(pageId);
}

/* ════════════════════════════════
   GOOGLE ADSENSE HAZIRLIK
   Sayfalar arası geçişte reklam slotlarını yenile
════════════════════════════════ */
function refreshAds() {
  // AdSense yüklü değilse sessizce geç
  if (typeof adsbygoogle === 'undefined') return;
  try {
    // Mevcut tüm ins.adsbygoogle elementlerini yenile
    document.querySelectorAll('ins.adsbygoogle[data-ad-status="done"]').forEach(el => {
      el.removeAttribute('data-ad-status');
    });
    (adsbygoogle = window.adsbygoogle || []).push({});
  } catch(e) {}
}

/* ════════════════════════════════
   DESIGN DETAIL — DYNAMIC META
   Tasarım detay sayfasında title güncelle
════════════════════════════════ */
const _origShowDesignDetail = showDesignDetail;
showDesignDetail = function(id) {
  _origShowDesignDetail(id);
  const d = ALL_DESIGNS.find(x => String(x.id) === String(id));
  if (d) {
    document.title = `${safeTitle} — ${safeSport} Kit Design | formaLOLA`;
    // OG meta güncelle (dinamik)
    let ogTitle = document.querySelector('meta[property="og:title"]');
    let ogDesc  = document.querySelector('meta[property="og:description"]');
    if (ogTitle) ogTitle.setAttribute('content', `${safeTitle} by ${d.designer} — formaLOLA`);
    if (ogDesc)  ogDesc.setAttribute('content', `Professional ${safeSport} kit design. ${d.license === 'exclusive' ? 'Exclusive license available.' : 'Standard license.'} Starting from ₺${d.price}.`);
  }
};

/* ════════════════════════════════
   STRUCTURED DATA — DESIGN PAGE
   Google'ın tasarımı ürün olarak tanıması için
════════════════════════════════ */
function injectDesignStructuredData(d) {
  // Eski structured data'yı kaldır
  const old = document.getElementById('design-ld');
  if (old) old.remove();

  const script = document.createElement('script');
  script.id   = 'design-ld';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Product',
    'name': d.title,
    'description': d.desc || `Professional ${safeSport} kit design by ${d.designer}`,
    'image': d.coverUrl || '',
    'brand': { '@type': 'Brand', 'name': d.designer },
    'offers': {
      '@type': 'Offer',
      'price': d.price,
      'priceCurrency': 'TRY',
      'availability': 'https://schema.org/InStock',
      'seller': { '@type': 'Organization', 'name': 'formaLOLA' }
    }
  });
  document.head.appendChild(script);
}

// showDesignDetail'e structured data enjeksiyonu ekle
const _origShowDesignDetail2 = showDesignDetail;
showDesignDetail = function(id) {
  _origShowDesignDetail2(id);
  const d = ALL_DESIGNS.find(x => String(x.id) === String(id));
  if (d) injectDesignStructuredData(d);
};

/* ════════════════════════════════
   TRENDING ALGORİTMASI
   Sadece göster, backend skoru yok
════════════════════════════════ */
function getTrendingDesigns(count = 8) {
  return [...ALL_DESIGNS]
    .sort((a, b) => {
      const scoreA = (a.likes || 0) * 5 + (a.sales || 0) * 10;
      const scoreB = (b.likes || 0) * 5 + (b.sales || 0) * 10;
      return scoreB - scoreA;
    })
    .slice(0, count);
}

/* ════════════════════════════════
   PAGINATION — Explore için
   Firestore .limit() ile sayfalama
════════════════════════════════ */
let _lastVisibleDoc = null;
let _allLoaded = false;

async function loadMoreFirestore() {
  if (_allLoaded || !currentUser) { loadMore(); return; }
  try {
    let query = db.collection('designs')
      .where('status', '==', 'approved')
      .limit(8);
    if (_lastVisibleDoc) query = query.startAfter(_lastVisibleDoc);

    const snap = await query.get();
    if (snap.empty || snap.docs.length < 8) _allLoaded = true;

    _lastVisibleDoc = snap.docs[snap.docs.length - 1];

    const grid = document.getElementById('exploreGrid');
    if (!grid) return;

    snap.forEach(doc => {
      const d = doc.data();
      const c1 = (d.colors && d.colors[0]) || '#1f1f26';
      const c2 = (d.colors && d.colors[1]) || '#0c0c0e';
      const design = {
        id: doc.id, title: d.title || 'Tasarım',
        designer: d.designerName || '—', designerInitials: d.designerInitials || '?',
        sport: d.sport || 'Futbol', style: d.style || 'modern', pattern: d.pattern || 'minimal',
        colors: d.colors || [], price: d.price || 0, exclusivePrice: d.exclusivePrice || 0,
        sales: d.sales || 0, likes: d.likes || 0, license: d.exclusivePrice > 0 ? 'exclusive' : 'standard',
        coverUrl: d.coverUrl || '', coverThumb: d.coverThumb || '', imageUrls: d.imageUrls || {},
        bg: `linear-gradient(140deg,${c1},${c2})`, num: '10', kit: d.kit || 'Ev',
        designerId: d.designerId || '', desc: d.desc || ''
      };
      // ALL_DESIGNS'a ekle (duplicate kontrolü)
      if (!ALL_DESIGNS.find(x => x.id === design.id)) ALL_DESIGNS.push(design);
      grid.innerHTML += designCard(design);
    });

    if (_allLoaded) {
      const btn = document.getElementById('loadMoreBtn') || document.querySelector('.btn-load');
      if (btn) btn.style.display = 'none';
    }
  } catch(e) {
    // Firestore pagination başarısız olursa local array'den yükle
    loadMore();
  }
}

/* ════════════════════════════════
   SITEMAP.XML DATA HELPER
   (Gerçekte sunucu tarafında üretilmeli)
════════════════════════════════ */
function getSitemapData() {
  const base = 'https://muratlola.com';
  const staticPages = [
    { url: `${base}/`, priority: '1.0', changefreq: 'daily' },
    { url: `${base}/#explore`, priority: '0.9', changefreq: 'daily' },
    { url: `${base}/#designers`, priority: '0.8', changefreq: 'weekly' },
    { url: `${base}/#competitions`, priority: '0.8', changefreq: 'daily' },
    { url: `${base}/#seo-kitdesign`, priority: '0.9', changefreq: 'weekly' },
    { url: `${base}/#seo-jerseyideas`, priority: '0.8', changefreq: 'weekly' },
    { url: `${base}/#about`, priority: '0.5', changefreq: 'monthly' },
    { url: `${base}/#contact`, priority: '0.5', changefreq: 'monthly' },
  ];
  const designPages = ALL_DESIGNS.filter(d => !String(d.id).startsWith('m')).map(d => ({
    url: `${base}/#design-${d.id}`,
    priority: '0.7',
    changefreq: 'weekly'
  }));
  return [...staticPages, ...designPages];
}



/* ════════════════════════════════
   SHARE / DEEP LINKING
════════════════════════════════ */
function copyShareLink(designId) {
  const shareUrl = `${window.location.origin}/?design=${designId}`;
  navigator.clipboard.writeText(shareUrl)
    .then(() => showToast('🔗 Tasarım linki kopyalandı!', 'success'))
    .catch(() => showToast('Link kopyalanamadı.', 'error'));
}

const _origShowDesignDetail3 = showDesignDetail;
showDesignDetail = function(id) {
  _origShowDesignDetail3(id);
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('design', id);
    window.history.pushState({ design: id }, '', url.toString());
  } catch (e) {}
  const wrap = document.getElementById('designDetailContent');
  if (wrap && !document.getElementById('shareDesignBtn')) {
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;justify-content:flex-end;margin-bottom:12px';
    bar.innerHTML = `<button id="shareDesignBtn" class="btn-ghost2" onclick="copyShareLink('${id}')">🔗 Paylaş</button>`;
    wrap.prepend(bar);
  }
};

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedDesignId = urlParams.get('design');
    if (!sharedDesignId) return;
    if (!ALL_DESIGNS.length) await fetchApprovedDesigns();
    setTimeout(() => showDesignDetail(sharedDesignId), 200);
  } catch (error) {
    console.error('Paylaşılan tasarım açılamadı:', error);
  }
});
