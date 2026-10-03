-- 마이페이지 "A/S·토너 요청" 기능용 테이블입니다.
-- 로그인한 회원만 자신의 요청을 남기고/볼 수 있고, 관리자는 서비스 role로 전체를 조회합니다.
-- 사용법: Supabase 대시보드 SQL Editor에 붙여넣고 실행하세요. (profiles.sql을 먼저 실행해 두셔야 합니다.)

create type as_request_status as enum ('new', 'in_progress', 'done');
create type as_request_type as enum ('as', 'toner');

create table as_requests (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references auth.users(id) on delete cascade,
  rental_application_id uuid references rental_applications(id) on delete set null,
  contract_label text,
  request_type as_request_type not null default 'as',
  description text,
  status as_request_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index as_requests_member_id_idx on as_requests (member_id);
create index as_requests_created_at_idx on as_requests (created_at desc);

create trigger as_requests_set_updated_at
  before update on as_requests
  for each row execute function set_updated_at();

alter table as_requests enable row level security;

create policy "self can view own as_requests" on as_requests for select using (auth.uid() = member_id);
create policy "self can insert own as_requests" on as_requests for insert with check (auth.uid() = member_id);
