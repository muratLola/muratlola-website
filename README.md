# muratLola — Portfolyo

Murat Ogur (muratLola) — Görsel İletişim Tasarımcısı & Art Director.

**Astro + GSAP + Supabase.** Beyaz galeri, dev serif tipografi, aydınlık/karanlık mod.
Projeler ve formalar `/admin` panelinden yüklenir; site anında görür, yeniden build gerekmez.

---

## Yerelde çalıştır

```bash
npm install
npm run dev        # http://localhost:4321
```

`.env.example` dosyasını `.env` olarak kopyala ve Supabase bilgilerini gir.
`.env` olmadan da site açılır (projeler `src/lib/seed.js`'ten gelir), ama admin çalışmaz.

## Yayına al

### Cloudflare Pages (önerilen)
1. Bu repoyu GitHub'a at.
2. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**
3. Ayarlar:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output directory: `dist`
4. **Settings → Environment variables** → şu ikisini ekle:
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`

   ⚠️ Bunu yapmazsan canlıda admin paneli çalışmaz. `.env` GitHub'a gitmiyor (bilerek).
5. **Custom domains** → `muratlola.com`

### Netlify
Aynısı: build command `npm run build`, publish directory `dist`,
aynı iki environment variable.

## Güncelleme

```bash
git add -A
git commit -m "değişiklik"
git push
```
Cloudflare/Netlify push'u görüp otomatik build alır (~1 dk).

**Proje/forma eklemek için push GEREKMEZ** — `/admin`'den yükle, site anında görür.
Push yalnızca kod/metin değişince gerekir.

---

## Yapı

```
src/
  pages/        index, projeler, proje, formalar, hakkimda, iletisim, admin
  layouts/      Base.astro  (tema betiği head'de — FOUC olmasın diye)
  components/   Header, Footer
  scripts/      app.js (açılış, imleç, tema)  dom.js (yardımcılar)  kits.js (kartlar)
  lib/          store.js (Supabase)  seed.js (Supabase yokken tohum veri)
  styles/       global.css
public/         img/, admin.css
```

## Supabase

Kurulum adımları: **`KURULUM.md`**
Tablolar + RLS + depo tek dosyada: **`supabase-kurulum.sql`** (SQL Editor'e yapıştır)

Güvenlik: `anon` (publishable) anahtar tarayıcıya gider, olması gereken budur.
Veriyi RLS politikaları korur. **`service_role` / secret anahtarı ASLA bu repoya girmemeli** —
girerse her ziyaretçi veritabanını silebilir.

## Notlar

- **Türkçe İ**: `"İ".toLowerCase()` → `i` + U+0307 (ayrı nokta). Slug üretiminde
  Türkçe harfler `toLowerCase()`'ten ÖNCE ASCII'ye çevrilir, yoksa `İzmir` → `i-zmir` olur.
- **`[hidden]`**: author CSS'teki `display` tarayıcının `[hidden]{display:none}` kuralını ezer.
  `admin.css`'te `[hidden]{display:none !important}` var — kaldırma.
- Doğrulama tarifi: `.claude/skills/verify/SKILL.md`
