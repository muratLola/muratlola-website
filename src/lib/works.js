/* Sabit iş arşivi — depoda durur, Supabase'e ihtiyaç duymaz.

   Neden burada: bu işlerin görselleri public/is/ altında depoyla birlikte
   geliyor. Yeni bir iş eklemek için panele girmek, dosya yüklemek ve deploy
   tetiklemek gerekmiyor; depoya yüklemek yetiyor.

   Panelden eklenen projeler Supabase'de yaşamaya devam eder. store.js ikisini
   birleştirir; aynı slug iki yerde varsa Supabase'deki kazanır, yani buradaki
   bir işi panelden düzenleyip ezmek mümkün.

   sort: küçük olan önce. Supabase satırları varsayılan 10 ile en öne geçer,
   böylece en yeni işler (Arsenal, Beşiktaş) listenin başında kalır. */

export const WORKS = [
  {
    slug: 'fenerium-urun-gorsellestirme',
    sort: 20,
    title: 'Fenerium — Ürün Görselleştirme',
    category: 'Ürün görselleştirme',
    year: 2025,
    cover: '/is/fenerium-urun-gorsellestirme/kapak.jpg',
    images: [
      '/is/fenerium-urun-gorsellestirme/01.jpg',
      '/is/fenerium-urun-gorsellestirme/02.jpg',
      '/is/fenerium-urun-gorsellestirme/03.jpg',
      '/is/fenerium-urun-gorsellestirme/04.jpg',
      '/is/fenerium-urun-gorsellestirme/05.jpg',
      '/is/fenerium-urun-gorsellestirme/06.jpg',
      '/is/fenerium-urun-gorsellestirme/07.jpg',
    ],
    summary:
      'Bir kış koleksiyonunun katalog görselleri: üç ürün, üç oyuncu, tek stüdyo. Ayrı ayrı çekilmiş parçaların aynı ışığa ve aynı zemine oturduğu tek bir kare.',
    body:
      'Perakende görselinin işi ürünü satmaktır; bunun için üç şeyin doğru olması gerekir — kumaşın dokusu okunmalı, renk mağazadaki renkle aynı olmalı, ve kare bir koleksiyon gibi görünmeli, üç ayrı ürün fotoğrafı gibi değil.\n\nÜç parçayı — kırık beyaz sherpa, dijital kamuflaj rüzgârlık ve lacivert polar — ortak bir stüdyo kurgusunda birleştirdim. Zemin, gölge yönü ve renk sıcaklığı üçünde de tek kaynaktan geliyor; oyuncular farklı oturuşlarla yerleştirilerek kare bir grup çekimi ritmine kavuştu. Kamuflaj deseninin mavi basamakları, baskıda bantlaşmayacak şekilde sadeleştirildi.\n\nKişisel konsept çalışmasıdır. Ürünler markanın kendi ürünleridir; kurgu, ışık ve görselleştirme bana aittir. Fenerbahçe SK veya Fenerium ile resmî bir bağı yoktur.',
    title_en: 'Fenerium — Product Visualisation',
    category_en: 'Product visualisation',
    summary_en:
      'Catalogue imagery for a winter collection: three products, three players, one studio. Separately shot pieces brought into a single frame under one light.',
    body_en:
      "A retail image has one job — to sell the product. Three things have to be right for that: the fabric has to read, the colour has to match the colour in store, and the frame has to look like a collection rather than three separate product shots.\n\nI brought three pieces together — an off-white sherpa, a digital-camo windrunner and a navy fleece — into a shared studio set-up. Ground, shadow direction and colour temperature come from a single source across all three; the players are seated differently to give the frame the rhythm of a group shoot. The blue steps in the camo pattern were simplified so they wouldn't band in print.\n\nPersonal concept work. The garments are the brand's own products; the staging, lighting and visualisation are mine. Not affiliated with or endorsed by Fenerbahçe SK or Fenerium.",
  },

  {
    slug: 'fenerbahce-cubuklu-konsept',
    sort: 25,
    title: 'Fenerbahçe — Çubuklu Konsept',
    category: 'Forma konsepti · CLO3D',
    year: 2025,
    cover: '/is/fenerbahce-cubuklu-konsept/kapak.jpg',
    images: [
      '/is/fenerbahce-cubuklu-konsept/01.jpg',
      '/is/fenerbahce-cubuklu-konsept/02.jpg',
      '/is/fenerbahce-cubuklu-konsept/03.jpg',
      '/is/fenerbahce-cubuklu-konsept/04.jpg',
      '/is/fenerbahce-cubuklu-konsept/05.jpg',
      '/is/fenerbahce-cubuklu-konsept/06.jpg',
    ],
    summary:
      'Çubuklunun genişliği üzerine bir çalışma. Sarı ve lacivert eşit paylaştığında forma bir şey söylüyor, incelttiğinde başka bir şey.',
    body:
      'Fenerbahçe çubuklusunda tasarımcının elindeki tek gerçek değişken çubuğun genişliği. Bir milimetre kalınlaşınca forma ağırlaşıyor, inceldiğinde uzaktan tek renge dönüyor. Bu konsept, kalın ve geniş çubuğun peşinden gitti: gövdede az sayıda, net ayrılmış sarı bant, kollarda ise düz lacivert.\n\nOmuzda üç bant sarıya çekilerek çubukla aynı dile sokuldu; yaka ve kol ağzı, gövdeyle yarışmasın diye tek renk lacivert bırakıldı. Göğüs baskısı beyaz, çünkü sarının üstünde lacivert bir logo çubuk hizasına denk geldiğinde okunurluğu düşüyor.\n\nCLO3D\'de dikişten kurgulandı, kumaş dökümü ve baskı yerleşimi gerçek panel şeması üzerinden çalışıldı. Kişisel konsept çalışmasıdır; kulüp veya sponsorlarla resmî bir bağı yoktur.',
    title_en: 'Fenerbahçe — Stripe Concept',
    category_en: 'Kit concept · CLO3D',
    summary_en:
      'A study in stripe width. When yellow and navy split the body evenly the shirt says one thing; thin the stripe and it says another.',
    body_en:
      "On a Fenerbahçe striped shirt the designer's only real variable is the width of the stripe. A millimetre wider and the shirt gets heavy; thinner and it collapses into a single colour at distance. This concept followed the wide stripe: few, cleanly separated yellow bands across the body, plain navy on the sleeves.\n\nThe three shoulder stripes were pulled to yellow so they speak the same language as the body stripe; collar and cuffs were left single-colour navy so they don't compete with it. The chest print is white — a navy mark sitting over yellow loses legibility wherever it meets a stripe edge.\n\nBuilt from the seam up in CLO3D, with fabric drape and print placement worked out on the real panel layout. Personal concept work, not affiliated with the club or its sponsors.",
  },

  {
    slug: 'bayer-leverkusen-konsept',
    sort: 30,
    title: 'Bayer 04 Leverkusen — Siyah',
    category: 'Forma konsepti · CLO3D',
    year: 2026,
    cover: '/is/bayer-leverkusen-konsept/kapak.jpg',
    images: [
      '/is/bayer-leverkusen-konsept/01.jpg',
      '/is/bayer-leverkusen-konsept/02.jpg',
      '/is/bayer-leverkusen-konsept/03.jpg',
      '/is/bayer-leverkusen-konsept/04.jpg',
      '/is/bayer-leverkusen-konsept/05.jpg',
    ],
    summary:
      'Siyah üstüne siyah. Desen renkle değil, kumaşın ışığı tutuş biçimiyle görünüyor.',
    body:
      'Tek renk forma tasarlamanın zorluğu şu: kontrast yoksa desen de yok. Bu konsept deseni renge değil yüzeye yıktı — omuz ve kol panelleri mat siyahın üstüne hafif parlak, kırık taş dokusuyla basıldı. Doğrudan bakınca düz siyah; ışık açı değiştirdiğinde desen ortaya çıkıyor.\n\nArma, marka işareti ve sponsor tek bir gri tonda tutuldu, hiçbiri beyaza çıkmadı; forma yakından bir malzeme çalışması gibi okunuyor, uzaktan tamamen siyah bir siluet. Sırt yazısı da aynı gri, gövdeden yalnızca yarım ton ayrı.\n\nDetay kareleri arma ve marka işaretinin kabartma yüksekliğini göstermek için ayrıca render edildi — kabartmanın gerçekten göründüğü tek yer bu tür yakın plan. Kişisel konsept çalışmasıdır.',
    title_en: 'Bayer 04 Leverkusen — Black',
    category_en: 'Kit concept · CLO3D',
    summary_en:
      'Black on black. The pattern shows up not through colour but through how the fabric catches light.',
    body_en:
      'The difficulty with a single-colour kit is simple: no contrast, no pattern. This concept moved the pattern off colour and onto surface — shoulder and sleeve panels printed in a faintly glossy fractured-stone texture over matte black. Head-on it reads as flat black; the moment the light shifts, the pattern appears.\n\nCrest, brand mark and sponsor are all held in one grey, none of them lifted to white, so the shirt reads as a material study up close and a fully black silhouette at distance. The back nameplate sits in the same grey, half a tone off the body.\n\nThe detail frames were rendered separately to show the emboss height on the crest and brand mark — close range is the only place emboss actually reads. Personal concept work.',
  },

  {
    slug: 'fenerbahce-stranger-things',
    sort: 35,
    title: 'Derbi Günü — Upside Down',
    category: 'Maç günü grafiği',
    year: 2025,
    cover: '/is/fenerbahce-stranger-things/kapak.jpg',
    images: [
      '/is/fenerbahce-stranger-things/01.jpg',
      '/is/fenerbahce-stranger-things/02.jpg',
      '/is/fenerbahce-stranger-things/03.jpg',
    ],
    summary:
      'Bir derbi için hazırlanmış maç günü seti. İstanbul, Stranger Things\'in ters dünyasına çevrildi.',
    body:
      'Maç günü grafiğinin ömrü birkaç saat; o yüzden ilk saniyede kavranması gerekiyor. Bu set tek bir görsel fikre bağlandı: şehir ters dünyaya düşmüş. Kızıl yarık gökyüzü, havada asılı kalan kül, düşey şimşekler ve dizinin kendi tipografisi — hepsi aynı sahnenin parçaları.\n\nDört parça hazırlandı: stadyumun içeriden ters açıyla göründüğü ana kare, siluetlerin ormanda dizildiği duyuru, Galata ve Ortaköy\'ün yandığı iki şehir manzarası. Aynı kızıl-siyah paleti, aynı grenli film dokusu ve aynı başlık ailesi dördünü birbirine bağlıyor; ayrı ayrı paylaşıldıklarında bile tek kampanya gibi duruyorlar.\n\nKişisel konsept çalışmasıdır; kulüplerle veya dizinin hak sahipleriyle resmî bir bağı yoktur.',
    title_en: 'Derby Day — Upside Down',
    category_en: 'Matchday graphics',
    summary_en:
      "A matchday set built for a derby. Istanbul redrawn as the Upside Down.",
    body_en:
      "A matchday graphic lives for a few hours, so it has to land in the first second. This set hung on one visual idea: the city has fallen into the Upside Down. A torn red sky, ash suspended in the air, vertical lightning and the show's own typography — all parts of the same scene.\n\nFour pieces: the stadium seen from inside at an inverted angle, an announcement frame with silhouettes lined up in the forest, and two cityscapes with Galata and Ortaköy burning. One red-black palette, one grain, one display family ties all four together — shared separately, they still read as a single campaign.\n\nPersonal concept work, not affiliated with either club or with the rights holders of the series.",
  },

  {
    slug: 'czr-litos-marka-kimligi',
    sort: 40,
    title: 'CZR & LÎTOS — Marka Kimliği',
    category: 'Marka kimliği · Ambalaj',
    year: 2026,
    cover: '/is/czr-litos-marka-kimligi/kapak.jpg',
    images: [
      '/is/czr-litos-marka-kimligi/01.jpg',
      '/is/czr-litos-marka-kimligi/02.jpg',
      '/is/czr-litos-marka-kimligi/03.jpg',
    ],
    summary:
      'İki yöresel tatlı, iki ayrı marka dünyası: biri turuncu ve dolaysız, diğeri siyah ve altın.',
    body:
      'Aynı kategoride iki marka — Mersin cezeryesi ve taş kadayıf — kasıtlı olarak birbirinin zıddı kuruldu.\n\nCZR dolaysız olanı seçti: geometrik kesilmiş bir harf işareti, tek bir turuncu, siyah kutu üstünde yüksek kontrast. Havucun rengini markanın rengi yaptı; rafta iki metreden tanınması gereken bir ambalaj için doğru olan bu.\n\nLÎTOS ters yöne gitti — siyah üstüne altın, ay ve alev birleşiminden bir işaret, ince serif ve el yazısı bir vurgu. Kadayıfın tel tel inceliğini tipografiye taşıdı.\n\nHer iki marka için işaret, ambalaj, ürün tanıtım afişi, A4 dergi ilanı, broşür ve kısa tanıtım videosu üretildi. Kişisel marka çalışmasıdır.',
    title_en: 'CZR & LÎTOS — Brand Identity',
    category_en: 'Brand identity · Packaging',
    summary_en:
      'Two regional confections, two opposite brand worlds: one orange and direct, the other black and gold.',
    body_en:
      "Two brands in the same category — Mersin cezerye and stone kadayıf — deliberately built as opposites.\n\nCZR took the direct route: a geometrically cut letter mark, one orange, high contrast on a black box. It made the colour of the carrot the colour of the brand, which is the right call for packaging that has to be recognised from two metres away on a shelf.\n\nLÎTOS went the other way — gold on black, a mark combining crescent and flame, a fine serif with a script accent. It carried the thread-fine quality of kadayıf into the typography.\n\nFor both brands: mark, packaging, product poster, A4 magazine ad, brochure and a short promo film. Personal brand work.",
  },

  {
    slug: 'kirmizi-baslikli-kiz',
    sort: 45,
    title: 'Kırmızı Başlıklı Kız',
    category: 'İllüstrasyon',
    year: 2026,
    cover: '/is/kirmizi-baslikli-kiz/kapak.jpg',
    images: [
      '/is/kirmizi-baslikli-kiz/01.jpg',
      '/is/kirmizi-baslikli-kiz/02.jpg',
      '/is/kirmizi-baslikli-kiz/03.jpg',
      '/is/kirmizi-baslikli-kiz/04.jpg',
      '/is/kirmizi-baslikli-kiz/05.jpg',
      '/is/kirmizi-baslikli-kiz/06.jpg',
      '/is/kirmizi-baslikli-kiz/07.jpg',
    ],
    summary:
      'Sekiz sayfalık resimli kitap. Kurt kötü değil, kız da canavar — masal, korkulacak tarafını kaybedince başka bir şey anlatmaya başlıyor.',
    body:
      'Tamamı grafik tablet ve Photoshop ile, elden çizildi.\n\nHikâye bilinen masalı tersine çevirdi: kırmızı başlıklı kız da, büyükanne de, kurt da birer canavar. Kimse kimseden korkmuyor; anlaşmazlık kurdun kekleri paylaşmamasından çıkıyor ve piknikle bitiyor. Arka kapak, çocuğa dört maddede ne anlatıldığını yazıyor — önyargı, paylaşma, affetme, kendi yolunda yürüme.\n\nGörsel dil buna göre kuruldu: yuvarlatılmış siluetler, keskin köşe yok, mor–turkuaz–şeftali aralığında sıcak bir palet. Orman sahnelerinde renk soğutuluyor ama karanlık tutulmuyor; korku değil merak isteniyor. Konuşma balonları çizimin üstüne değil, kompozisyonun boş bıraktığı yerlere oturuyor.',
    title_en: 'Little Red Riding Hood',
    category_en: 'Illustration',
    summary_en:
      "An eight-page picture book. The wolf isn't the villain and the girl is a monster too — once a fairy tale loses its scary side, it starts telling a different story.",
    body_en:
      "Drawn entirely by hand on a graphics tablet in Photoshop.\n\nThe story inverts the familiar tale: the girl in the red hood, the grandmother and the wolf are all monsters. Nobody is afraid of anybody; the conflict comes from the wolf not sharing the cakes, and it ends in a picnic. The back cover sets out, in four points, what the child is actually being told — prejudice, sharing, forgiveness, and going your own way.\n\nThe visual language follows from that: rounded silhouettes, no sharp corners, a warm palette running from purple through turquoise to peach. Forest scenes cool the colour without darkening it — the aim is curiosity, not fear. Speech bubbles sit in the gaps the composition leaves rather than on top of the drawing.",
  },

  {
    slug: 'asensio-portre',
    sort: 47,
    title: 'Asensio — Portre',
    category: 'İllüstrasyon · Dijital çizim',
    year: 2026,
    cover: '/is/asensio-portre/kapak.jpg',
    images: [],
    summary:
      'Tek karede bir oyuncu. Anime çizgisiyle çalışılmış portre: gölge renkle değil, tarama çizgisiyle kuruluyor.',
    body:
      'Grafik tablet ve Photoshop ile elden çizildi.\n\nPortrenin bütün yükü çizgide: yüzdeki hacim gri tonlarla değil, yön değiştiren ince tarama çizgileriyle veriliyor — çenenin altında dikey, elmacık kemiğinde yatay, boyunda uzun ve seyrek. Renk yalnızca dolgu; modelleme çizginin işi.\n\nGözler kasıtlı olarak abartıldı. Kırık cam deseni verilen mavi iris ve keskin kaş açısı, sakin bir portreyi yarı gülümseyen bir meydan okumaya çeviriyor — bu tür bir portrenin taraftar grafiğinde işe yaraması için gereken şey de bu.\n\nZemin, formanın laciverdinden türetilmiş düz bir geçiş; arkada hiçbir şey yok ki bakış yüzden ayrılmasın.',
    title_en: 'Asensio — Portrait',
    category_en: 'Illustration · Digital drawing',
    summary_en:
      'One player, one frame. A portrait worked in an anime line: shadow built from hatching rather than colour.',
    body_en:
      "Drawn by hand on a graphics tablet in Photoshop.\n\nThe whole weight of the portrait sits in the line: volume in the face comes not from grey tones but from fine hatching that changes direction — vertical under the jaw, horizontal across the cheekbone, long and sparse down the neck. Colour is only fill; the modelling is the line's job.\n\nThe eyes are deliberately exaggerated. A cracked-glass pattern in the blue iris and a sharp brow angle turn a calm portrait into a half-smiling challenge — which is exactly what this kind of portrait needs to work as supporter graphics.\n\nThe ground is a flat gradient derived from the navy of the shirt; there is nothing behind it, so the eye never leaves the face.",
  },

  {
    slug: 'kimlik-calismalari',
    sort: 50,
    title: 'Kimlik Çalışmaları — Hatay, Mersin, Pervari',
    category: 'Kurumsal kimlik',
    year: 2025,
    cover: '/is/kimlik-calismalari/kapak.jpg',
    images: [
      '/is/kimlik-calismalari/01.jpg',
      '/is/kimlik-calismalari/02.jpg',
      '/is/kimlik-calismalari/03.jpg',
      '/is/kimlik-calismalari/04.jpg',
      '/is/kimlik-calismalari/05.jpg',
      '/is/kimlik-calismalari/06.jpg',
      '/is/kimlik-calismalari/07.jpg',
      '/is/kimlik-calismalari/08.jpg',
      '/is/kimlik-calismalari/09.jpg',
      '/is/kimlik-calismalari/10.jpg',
      '/is/kimlik-calismalari/11.jpg',
    ],
    summary:
      'Üç yer, üç işaret ve her birinin basılı karşılığı: antetli, kartvizit, zarf, disk.',
    body:
      'Bir işaretin iyi olup olmadığı ekranda değil, uygulandığı yerde anlaşılıyor. Bu seri üç yer adı için işaret ve tam basılı set üretti.\n\nHatay bir zeytin dalı ve ince bir serif üzerine kuruldu; koyu yeşil tek renk, antetlinin altında dalgalı bir taban. Pervari dairesel bir manzara işareti — dağ, yol, çam ve güneş — turizm tanıtımı için okunaklı ve tek renge indirilebilir olacak şekilde çizildi. Mersin ise tipografik bir işaret: her harf şehrin bir parçası, kale, deniz, portakal, güneş.\n\nHer kimlik için antetli kâğıt, kartvizitin iki yüzü, zarf ve disk uygulaması hazırlandı; işaretlerin küçük boyda ne kadar dayandığını görmek için küçültülmüş versiyonları ayrıca çalışıldı. Kişisel çalışmadır; örneklerdeki isim ve iletişim bilgileri temsilîdir.',
    title_en: 'Identity Studies — Hatay, Mersin, Pervari',
    category_en: 'Brand identity',
    summary_en:
      'Three places, three marks, and the printed set behind each: letterhead, business card, envelope, disc.',
    body_en:
      "You can't tell whether a mark is good on screen — only where it gets applied. This series produced a mark and a full printed set for three place names.\n\nHatay was built on an olive branch and a fine serif: a single dark green, a waved base beneath the letterhead. Pervari is a circular landscape mark — mountain, road, pine and sun — drawn to stay legible and reducible to one colour for tourism use. Mersin is a typographic mark: each letter is a piece of the city — the castle, the sea, an orange, the sun.\n\nEach identity comes with letterhead, both sides of a business card, envelope and disc application, plus reduced versions worked up separately to see how far the marks hold at small size. Personal work; the names and contact details shown are placeholders.",
  },
];
