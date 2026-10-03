-- 보안 강화: storage의 media 버킷 업로드·수정·삭제 정책이 "로그인만 하면 누구나"(authenticated)로
-- 되어 있었습니다. 회원가입을 연 지금은 일반 회원도 파일을 올리거나 지울 수 있는 상태라, 관리자만
-- 가능하도록 좁힙니다. (is_admin() 함수는 tighten_lead_rls.sql에서 이미 만들었습니다 — 먼저 실행하세요.)
-- 사용법: Supabase 대시보드 SQL Editor에서 실행하세요.

drop policy if exists "admin_upload_media" on storage.objects;
drop policy if exists "admin_update_media" on storage.objects;
drop policy if exists "admin_delete_media" on storage.objects;

create policy "admin_upload_media" on storage.objects for insert
  with check (bucket_id = 'media' and is_admin(auth.uid()));
create policy "admin_update_media" on storage.objects for update
  using (bucket_id = 'media' and is_admin(auth.uid()));
create policy "admin_delete_media" on storage.objects for delete
  using (bucket_id = 'media' and is_admin(auth.uid()));
