import { defineConfig } from 'astro/config';

export default defineConfig({
  // Apex (www'suz) birincil adres: Let's Encrypt sertifikası bunu kapsıyor
  // ve çalışan taraf bu. www ayrı bir ada; Netlify'da alias olarak
  // tanımlanana kadar *.netlify.app sertifikası sunulup hata veriyordu.
  // Buradaki değer canonical URL'leri ve og:image adresini belirler —
  // yanlış olursa Google'a ve paylaşımlara kırık adres gider.
  site: 'https://muratlola.com',
  output: 'static',
  devToolbar: { enabled: false },
});
