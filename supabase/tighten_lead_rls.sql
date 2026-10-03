-- 보안 강화: 지금까지 inquiries(리드)·rental_applications(렌탈신청)의 조회·수정·삭제 정책이
-- "auth.role() = 'authenticated'" (로그인만 하면 누구나) 로 되어 있었습니다. 그동안은 로그인 자체가
-- 관리자 스태프만 가능해서 문제가 없었지만, 이제 일반 회원가입을 열었기 때문에 이 상태로 두면
-- 일반 회원도 다른 고객의 리드·렌탈신청을 전부 조회할 수 있게 됩니다. profiles.role = 'admin'인
-- 계정만 접근하도록 좁힙니다.
-- 사용법: profiles.sql을 먼저 실행한 뒤, Supabase 대시보드 SQL Editor에 이 파일을 실행하세요.

create or replace function is_admin(uid uuid)
returns boolean
language sql security definer stable
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = uid and role = 'admin');
$$;

drop policy if exists "admin_read_inquiries" on inquiries;
drop policy if exists "admin_update_inquiries" on inquiries;
drop policy if exists "admin_delete_inquiries" on inquiries;
create policy "admin_read_inquiries" on inquiries for select using (is_admin(auth.uid()));
create policy "admin_update_inquiries" on inquiries for update using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "admin_delete_inquiries" on inquiries for delete using (is_admin(auth.uid()));

drop policy if exists "admin_read_rental_applications" on rental_applications;
drop policy if exists "admin_update_rental_applications" on rental_applications;
drop policy if exists "admin_delete_rental_applications" on rental_applications;
create policy "admin_read_rental_applications" on rental_applications for select using (is_admin(auth.uid()));
create policy "admin_update_rental_applications" on rental_applications for update using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "admin_delete_rental_applications" on rental_applications for delete using (is_admin(auth.uid()));
