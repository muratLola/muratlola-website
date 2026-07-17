/* Supabase yapılandırılmadan önce sitenin dolu görünmesi için tohum veri.
   Admin'den ilk proje eklendiği anda Supabase devralır ve burası devre dışı kalır. */

export const SEED_PROJECTS = [
  {
    id: 'seed-fora',
    slug: 'fora-creative-studio',
    title: 'Fora Creative Studio',
    category: 'Kurumsal Kimlik',
    year: '2026',
    number: '01',
    summary: 'Kurucu ortağı olduğum yaratıcı stüdyonun uçtan uca kimliği.',
    body: 'Fırat Üniversitesi\'nde Görsel İletişim Tasarımı okurken kurduğum stüdyo. 6 kişilik ekiple markalar için kimlik ve görsel strateji geliştiriyoruz.',
    cover: null,
    images: [],
    featured: true,
  },
  {
    id: 'seed-diaza',
    slug: 'diaza-world-cup',
    title: 'Diaza World Cup',
    category: 'Forma Tasarımı',
    year: '2025',
    number: '03',
    summary: 'Dünya 3.\'sü olan forma tasarımı.',
    body: 'Diaza World Cup forma tasarımı yarışmasında dünya üçüncülüğü.',
    cover: null,
    images: [],
    featured: true,
    award: 'Dünya 3.',
  },
];

export const SEED_JERSEYS = [];
