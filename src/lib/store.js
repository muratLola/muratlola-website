/* Supabase istemcisi — tarayıcı tarafı.
   Anon key herkese açıktır, olması gereken de budur: yazma yetkisini
   RLS politikaları + oturum açmış kullanıcı korur, anahtarın gizliliği değil.
   Kurulum adımları KURULUM.md'de. */

import { createClient } from '@supabase/supabase-js';
import { SEED_PROJECTS, SEED_JERSEYS } from './seed.js';

const URL  = import.meta.env.PUBLIC_SUPABASE_URL;
const ANON = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

export const isConfigured = Boolean(URL && ANON);

export const supabase = isConfigured
  ? createClient(URL, ANON, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

const BUCKET = 'media';

/** Storage yolunu tam URL'ye çevirir. Zaten http ise dokunmaz. */
export function mediaUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  if (!supabase) return path;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Supabase satırını arayüzün beklediği şekle sokar.
   Ham storage yolları da saklanır: admin'de projeyi düzenlerken yeni kapak
   yüklenmezse geri yazılacak değer tam URL değil, bu yol olmalı. */
function shape(row) {
  return {
    ...row,
    cover_path: row.cover ?? null,
    images_paths: Array.isArray(row.images) ? row.images : [],
    cover: mediaUrl(row.cover),
    images: Array.isArray(row.images) ? row.images.map(mediaUrl) : [],
  };
}

export async function getProjects() {
  if (!supabase) return SEED_PROJECTS;
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('sort', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) { console.warn('[projects]', error.message); return SEED_PROJECTS; }
  // Tablo boşsa tohum veriyi göster; site asla boş görünmesin.
  return data?.length ? data.map(shape) : SEED_PROJECTS;
}

export async function getProject(slug) {
  if (!supabase) return SEED_PROJECTS.find(p => p.slug === slug) ?? null;
  const { data, error } = await supabase.from('projects').select('*').eq('slug', slug).maybeSingle();
  if (error || !data) return SEED_PROJECTS.find(p => p.slug === slug) ?? null;
  return shape(data);
}

export async function getJerseys() {
  if (!supabase) return SEED_JERSEYS;
  const { data, error } = await supabase
    .from('jerseys')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) { console.warn('[jerseys]', error.message); return SEED_JERSEYS; }
  return (data ?? []).map(shape);
}

/* ── Admin ── */

export async function signIn(email, password) {
  if (!supabase) throw new Error('Supabase yapılandırılmamış. KURULUM.md\'ye bak.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() { await supabase?.auth.signOut(); }

/** Açılıştaki oturum kontrolü.
   getUser() yerine getSession(): getSession yereldeki oturumu okur, ağa
   çıkmaz ve auth kilidini uzun süre tutmaz. getUser() her açılışta istek
   atıyor ve birden fazla sekme açıkken kilit çekişmesi yaratıp
   signInWithPassword'ü süresiz bekletebiliyordu. */
export async function currentUser() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session?.user ?? null;
}

/** Dosyayı storage'a yükler, saklanacak yolu döner. */
export async function upload(file, folder = 'projects') {
  if (!supabase) throw new Error('Supabase yapılandırılmamış.');
  const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const path = `${folder}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function saveProject(row) {
  const { data, error } = await supabase.from('projects').upsert(row).select().maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveJersey(row) {
  const { data, error } = await supabase.from('jerseys').upsert(row).select().maybeSingle();
  if (error) throw error;
  return data;
}

export async function remove(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}
