-- 렌탈 신청 (상품 상세페이지 "렌탈 신청" 버튼으로 들어오는 신청 접수 — 어드민에서 확인 후 직접 연락합니다)
-- 사용법: schema.sql을 이미 실행한 프로젝트의 SQL Editor에 이 파일을 추가로 붙여넣고 실행하세요.

create type rental_application_status as enum ('new', 'contacted', 'closed');

create table rental_applications (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  plan_label text, -- Starter/Professional/Enterprise/맞춤상담 등 (선택 당시 스냅샷)
  term_months integer,
  fax_option boolean not null default false,
  monthly_price integer, -- 선택 당시 계산된 월 예상 금액 (맞춤상담이면 null)
  applicant_name text not null,
  applicant_phone text not null,
  applicant_email text,
  company_name text,
  business_reg_number text,
  install_address text not null,
  install_date date,
  notes text,
  usage_summary text, -- 예: "흑백 3,000매 / 컬러 100매", 잉크젯은 "월 1,000매 (흑백·컬러 구분없음)"
  status rental_application_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index rental_applications_status_idx on rental_applications (status);
create index rental_applications_created_at_idx on rental_applications (created_at desc);

create trigger rental_applications_set_updated_at before update on rental_applications
  for each row execute function set_updated_at();

alter table rental_applications enable row level security;

-- 신청 접수는 비로그인 방문자도 가능해야 합니다.
create policy "public_insert_rental_applications" on rental_applications for insert
  with check (true);
-- 조회·상태 변경·삭제는 로그인한 관리자만.
create policy "admin_read_rental_applications" on rental_applications for select
  using (auth.role() = 'authenticated');
create policy "admin_update_rental_applications" on rental_applications for update
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_delete_rental_applications" on rental_applications for delete
  using (auth.role() = 'authenticated');
