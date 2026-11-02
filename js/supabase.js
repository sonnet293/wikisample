// js/supabase.js
// 이미지 파일은 Supabase Storage에 저장한다.
// 인증은 Firebase Auth를 그대로 쓰고, Supabase의 "Third-party Auth(Firebase)" 기능으로
// Firebase ID 토큰을 Supabase에 전달한다. (설정 방법: SETUP.md 참고)
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/+esm';
import { auth } from './firebase.js';

// Supabase 대시보드 > Project Settings > API 에서 복사해 넣으세요.
export const SUPABASE_URL = 'https://uysfefncmkusywuqnamz.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5c2ZlZm5jbWt1c3l3dXFuYW16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM2MDgwODUsImV4cCI6MjEwOTE4NDA4NX0.eMjanHTGIeL4W0mtz5wEoqjJOaQqlasqaV0ANeAV_Pc';
export const BUCKET = 'wiki-images';

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

export const isSupabaseConfigured = !SUPABASE_URL.includes('YOUR-') && !SUPABASE_ANON_KEY.includes('YOUR-');

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      // 요청마다 현재 로그인한 Firebase 사용자의 ID 토큰을 붙인다.
      accessToken: async () => (auth.currentUser ? auth.currentUser.getIdToken() : null),
    })
  : null;

const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/webp': 'webp' };

// Storage 객체 키에는 한글을 쓸 수 없으므로 무작위 키로 저장하고 공개 URL을 돌려준다.
export async function uploadImage(file) {
  if (!isSupabaseConfigured) throw new Error('Supabase가 설정되지 않았습니다. js/supabase.js 를 확인하세요.');
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('PNG, JPG, GIF, WEBP 이미지만 올릴 수 있습니다.');
  if (file.size > MAX_FILE_SIZE) throw new Error('파일 크기는 5MB 이하여야 합니다.');

  const now = new Date();
  const path = `images/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${crypto.randomUUID()}.${EXT[file.type]}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw new Error('이미지 업로드 실패: ' + error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}
