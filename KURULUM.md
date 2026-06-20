# muratLola — Kurulum Rehberi

## Admin paneline girmek için 3 adım

### 1. GitHub reposunu Netlify'a bağla
- https://app.netlify.com adresine git (ücretsiz üye ol)
- "Add new site" → "Import an existing project" → GitHub seç
- muratlola reposunu seç → Deploy et

### 2. Netlify Identity'yi aç
- Netlify panelinde: Site → Identity → Enable Identity
- "Registration" → "Invite only" seç
- "Invite users" ile kendi e-postanı gir
- Gelen e-postadaki linke tıkla, şifre belirle

### 3. GitHub OAuth bağla (admin için gerekli)
- Netlify paneli → Site settings → Identity → Services → Enable GitHub
- Ekrana gelen Client ID ve Secret'ı kopyala
- GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
  - Homepage URL: https://muratlola.com
  - Callback URL: https://api.netlify.com/auth/done

### Kullanım
- Admin: https://muratlola.com/admin
- Kullanıcı adı: e-posta adresin
- Şifre: Netlify'dan belirlediğin şifre

---

## config.yml'de değiştirmen gereken tek şey:
```
backend:
  repo: BURAYA_GITHUB_KULLANICI_ADIN/muratlola
```

## Domain bağlama (muratlola.com)
- Netlify → Domain settings → Add custom domain → muratlola.com
- DNS kayıtlarını domain sağlayıcında güncelle:
  - A kaydı: 75.2.60.5
  - CNAME: senin-netlify-sitesi.netlify.app

---
Herhangi bir adımda takılırsan sorabilirsin.
