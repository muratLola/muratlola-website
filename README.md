# Portfolyo / CV Sitesi

Görsel İletişim Tasarımı öğrencisi için hazırlanmış, çok sayfalı, animasyonlu bir portfolyo ve CV sitesi.

**Tasarım konsepti:** "Baskı Kayıt İşareti" — matbaa/prepress kültüründen ilham alan bir tasarım sistemi. Kayıt işaretleri (reg-mark), CMYK renk ayrımı, kesim çizgileri ve iş fişi numaraları gibi baskı dünyasının görsel diline gönderme yapar. Bu, hem tasarım disiplinine doğrudan bağlı hem de "yapay zeka klişesi" olan kalıpların dışında özgün bir kimlik kurmak için seçildi.

---

## 1) GitHub Pages'e Yayınlama

Bu site tamamen statik HTML/CSS/JS dosyalarından oluşur, herhangi bir derleme (build) adımına ihtiyaç duymaz. GitHub Pages'e yayınlamak için:

1. [github.com](https://github.com) üzerinde yeni bir repo oluştur (örn. `portfolyo` veya `kullaniciadi.github.io`).
2. Bu klasördeki **tüm dosya ve klasörleri** (index.html, css/, js/, assets/ vb.) reponun ana dizinine (root) yükle:
   ```bash
   cd cv-portfolyo
   git init
   git add .
   git commit -m "İlk yayın"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADIN/REPO_ADIN.git
   git push -u origin main
   ```
   (Alternatif olarak GitHub web arayüzünden "Add file → Upload files" ile sürükle-bırak da yapabilirsin.)
3. Repo sayfasında **Settings → Pages** menüsüne git.
4. "Build and deployment" altında **Source: Deploy from a branch** seç.
5. **Branch: main**, klasör: **/ (root)** olarak ayarla ve **Save** de.
6. Birkaç dakika içinde siten şu adreste yayında olacak:
   - Repo adın `kullaniciadi.github.io` ise: `https://kullaniciadi.github.io`
   - Başka bir isimse: `https://kullaniciadi.github.io/repo-adi/`

---

## 2) Dosya Yapısı

```
cv-portfolyo/
├── index.html              → Anasayfa
├── hakkimda.html            → Hakkımda / CV sayfası
├── projeler.html             → Tüm projeler (filtrelenebilir galeri)
├── proje-detay-1.html        → Proje detay: Atlas Kahve (Marka Kimliği)
├── proje-detay-2.html        → Proje detay: Form & Boşluk (Editoryal)
├── proje-detay-3.html        → Proje detay: Kök Çay (Ambalaj)
├── iletisim.html             → İletişim sayfası
├── css/
│   └── style.css            → Tüm tasarım sistemi (tek dosya)
├── js/
│   └── script.js            → Tüm etkileşimler (tek dosya)
└── assets/
    ├── favicon.svg
    └── svg/                  → Proje kapak ve galeri görselleri (örnek/placeholder)
```

---

## 3) Kendi Bilgilerinle Özelleştirme

Site, gerçek bir öğrencinin bilgileriyle değil **placeholder (yer tutucu)** içerikle hazırlandı. Aşağıdaki adımları takip ederek kendi bilgilerinle değiştir:

### a) İsim
Tüm HTML dosyalarında geçen **"AD SOYAD"** ifadesini kendi adınla değiştir (header'daki logo, footer, hero metni, sayfa başlıkları). Bir metin editöründe "Bul ve Değiştir" (Find & Replace) ile tüm dosyalarda tek seferde yapabilirsin.

### b) Profil Fotoğrafı
`hakkimda.html` içinde `.photo-frame` adlı boş çerçeveyi kendi fotoğrafınla doldur:
```html
<div class="photo-frame reveal">
  <img src="assets/foto.jpg" alt="Profil fotoğrafı">
  ...
</div>
```
Fotoğrafını `assets/` klasörüne ekle ve yukarıdaki gibi `<img>` etiketini çerçevenin içine ekle (placeholder ipucu metnini silebilirsin).

### c) E-posta ve Sosyal Medya
`iletisim.html` dosyasında:
- `mailto:adsoyad@example.com` → kendi e-posta adresinle değiştir.
- Instagram / Behance / LinkedIn linklerini (`https://instagram.com/kullaniciadi` vb.) kendi profil adreslerinle değiştir.

### d) CV / Özgeçmiş PDF
`index.html` içindeki "CV İndir" butonu `assets/cv-ad-soyad.pdf` dosyasına işaret ediyor. Kendi CV'nin PDF halini bu isimle (veya istediğin bir isimle, linki güncelleyerek) `assets/` klasörüne ekle.

### e) Proje İçerikleri
Üç örnek proje (Atlas Kahve, Form & Boşluk, Kök Çay) **şablon/örnek** çalışmalardır — kurgusal projelerdir. Kendi gerçek projelerinle değiştirmek için:
1. `proje-detay-1.html`, `proje-detay-2.html`, `proje-detay-3.html` dosyalarındaki başlık, kategori, yıl, rol, araçlar ve metinleri (Problem/Süreç/Sonuç) kendi projenle değiştir.
2. `assets/svg/` klasöründeki görselleri kendi proje görsellerinle değiştir (kendi tasarım dosyalarını JPG/PNG/SVG olarak dışa aktarıp aynı dosya adlarıyla değiştirebilir ya da `<img src="...">` yollarını güncelleyebilirsin).
3. `index.html` ve `projeler.html` içindeki proje kartlarını da aynı şekilde güncelle (kapak görseli, başlık, kategori, iş numarası).

### f) Yeni Proje Ekleme
Dördüncü bir proje eklemek için:
1. `proje-detay-3.html` dosyasını kopyala, `proje-detay-4.html` olarak yeniden adlandır, içeriğini güncelle.
2. `projeler.html` içindeki `.proje-kart--add` ("+ Sıradaki proje buraya gelecek") kartını gerçek bir proje kartına dönüştür ya da üstüne yeni bir `.proje-kart` ekle.
3. Zincirleme gezinme için bir önceki projenin "Sıradaki Proje" linkini yeni sayfana yönlendir (`next-proje` linki).

### g) İletişim Formu
`iletisim.html` sayfasındaki form şu anda **hiçbir yere veri göndermiyor** (GitHub Pages statik barındırma olduğu için sunucu tarafı kod çalıştıramaz). Formu aktif etmek için:
1. [Formspree](https://formspree.io) (ya da Getform, Basin gibi benzer bir servis) üzerinde ücretsiz bir hesap aç.
2. Sana verilen form endpoint adresini kopyala.
3. `iletisim.html` içinde `<form id="contact-form">` etiketine şunu ekle:
   ```html
   <form id="contact-form" action="https://formspree.io/f/SENIN_KODUN" method="POST">
   ```
4. `js/script.js` dosyasındaki form-engelleme kodu, `action` attribute'u eklendiğinde otomatik olarak devre dışı kalır (kod buna göre yazıldı) — formun normal şekilde gönderilmesine izin verir.

---

## 4) Tasarım Sistemi Notları

- **Renkler:** `css/style.css` dosyasının en üstündeki `:root` bloğunda tüm renk, tipografi ve boşluk değişkenleri tanımlı. Vurgu rengini değiştirmek istersen sadece `--magenta` değerini güncellemen yeterli.
- **Yazı tipleri:** Anton (başlıklar), Space Grotesk (gövde metni), Space Mono (etiketler/meta bilgiler) — Google Fonts'tan otomatik yükleniyor, internet bağlantısı gerektirir.
- **Hareket azaltma:** Site, `prefers-reduced-motion` ayarına saygı duyar — bu ayarı aktif eden kullanıcılarda animasyonlar otomatik olarak sadeleşir.
- **Özel imleç:** Sadece fare kullanan masaüstü cihazlarda görünür, dokunmatik cihazlarda otomatik devre dışı kalır.

---

## 5) Yerel Önizleme

Dosyaları doğrudan tarayıcıda açabilirsin, ama bazı tarayıcılar `file://` üzerinden çalışırken güvenlik kısıtlamaları uygulayabilir. En sağlıklısı basit bir yerel sunucu çalıştırmak:

```bash
cd cv-portfolyo
python3 -m http.server 8000
```
Sonra tarayıcıda `http://localhost:8000` adresini aç.

---

İyi şanslar! 🎓
