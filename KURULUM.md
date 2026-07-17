# muratLola — Kurulum

## Yerelde çalıştır

```bash
npm install
npm run dev
```

→ http://localhost:4321

Supabase bağlamadan da site çalışır: projeler `src/lib/seed.js` içindeki
tohum veriden gelir. Admin paneli ise Supabase olmadan çalışmaz.

---

## Supabase kurulumu (admin paneli için)

### 1. Proje aç
[supabase.com](https://supabase.com) → **New project**. Ücretsiz katman yeter.
Bölge olarak **Frankfurt (eu-central-1)** seç — Türkiye'ye en yakını.

### 2. Anahtarları al
**Project Settings → API**. Şu ikisini kopyala:
- `Project URL`
- `anon` `public` anahtarı

Proje kökünde `.env` dosyası oluştur:

```
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

> `anon` anahtarı herkese açıktır, olması gereken de budur — tarayıcıya gider.
> Verini koruyan şey anahtarın gizliliği değil, aşağıdaki **RLS politikaları**.
> `service_role` anahtarını ASLA buraya koyma; o gerçekten gizli.

### 3. Tabloları ve güvenliği kur
**SQL Editor**'e yapıştır ve çalıştır:

```sql
-- ── Tablolar ──
create table if not exists projects (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  sort       int default 0,
  slug       text unique not null,
  title      text not null,
  category   text,
  year       text,
  number     text,
  award      text,
  summary    text,
  body       text,
  cover      text,
  images     text[] default '{}',
  featured   boolean default false
);

create table if not exists jerseys (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  title      text not null,
  club       text,
  season     text,
  number     text,
  cover      text
);

-- ── RLS: herkes okur, yalnızca giriş yapmış kullanıcı yazar ──
alter table projects enable row level security;
alter table jerseys  enable row level security;

create policy "projects herkese açık okuma"
  on projects for select using (true);
create policy "projects yalnızca yetkili yazar"
  on projects for all to authenticated
  using (true) with check (true);

create policy "jerseys herkese açık okuma"
  on jerseys for select using (true);
create policy "jerseys yalnızca yetkili yazar"
  on jerseys for all to authenticated
  using (true) with check (true);
```

### 4. Görsel deposu
**Storage → New bucket** → adı `media`, **Public bucket** işaretli.

Sonra SQL Editor'de:

```sql
create policy "media herkese açık okuma"
  on storage.objects for select
  using (bucket_id = 'media');

create policy "media yalnızca yetkili yükler"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media');

create policy "media yalnızca yetkili siler"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media');
```

### 5. Kendine kullanıcı aç
**Authentication → Users → Add user → Create new user**.
E-posta + güçlü bir şifre gir, **Auto Confirm User** işaretle.

Giriş bilgilerin bunlar olacak.

> **Önemli:** **Authentication → Providers → Email** altında
> **"Enable sign ups"** seçeneğini **KAPAT**. Açık kalırsa herkes
> kendine hesap açıp admin'e girebilir — RLS `authenticated` rolüne
> güvendiği için bu paneli herkese açar. Bu, kurulumun en kritik adımı.

### 6. Dene
```bash
npm run dev
```
→ http://localhost:4321/admin

---

## Yayına alma

### Cloudflare Pages
1. Kodu GitHub'a at.
2. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**.
3. Ayarlar:
   - Framework preset: **Astro**
   - Build command: `npm run build`
   - Build output: `dist`
4. **Settings → Environment variables** → `PUBLIC_SUPABASE_URL` ve
   `PUBLIC_SUPABASE_ANON_KEY` ekle. **Bunu yapmazsan admin canlıda çalışmaz.**
5. Custom domain → `muratlola.com`.

### Netlify
Aynısı; build command `npm run build`, publish directory `dist`,
environment variables aynı iki değişken.

---

## Günlük kullanım

Proje/forma eklemek için **rebuild gerekmiyor** — admin'den yükle, site anında görür.
Veri tarayıcıdan doğrudan Supabase'ten okunuyor.

Site metnini (hakkımda yazısı, rakamlar) değiştirmek istersen o kod içinde:
`src/pages/*.astro`. Onlar değişince push et, otomatik build alır.
