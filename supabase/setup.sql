-- supabase/setup.sql
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 Run 하세요.
-- (먼저 Authentication > Third-party Auth 에서 Firebase 를 추가해야 합니다. SETUP.md 참고)

-- 1) 공개 이미지 버킷 (5MB, 이미지 형식만. SVG는 XSS 위험 때문에 제외)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('wiki-images', 'wiki-images', true, 5242880,
        array['image/png', 'image/jpeg', 'image/gif', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) 업로드 정책: 이 Firebase 프로젝트(wiki-c09b9)에서 발급한 ID 토큰을 가진 요청만 허용.
--    Firebase 토큰에는 기본적으로 role 클레임이 없어 anon 역할로 처리되므로
--    anon, authenticated 모두에 정책을 걸고 토큰의 발급자(iss)/대상(aud)으로 검증한다.
drop policy if exists "wiki-images: firebase users can upload" on storage.objects;
create policy "wiki-images: firebase users can upload"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'wiki-images'
  and (storage.foldername(name))[1] = 'images'
  and (auth.jwt() ->> 'iss') = 'https://securetoken.google.com/wiki-c09b9'
  and (auth.jwt() ->> 'aud') = 'wiki-c09b9'
);

-- 3) 읽기: 버킷이 public 이라 공개 URL 로는 정책 없이 읽힌다.
--    수정/삭제 정책은 만들지 않는다 (= 아무도 덮어쓰거나 지울 수 없음).
