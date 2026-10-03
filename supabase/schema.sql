-- MBM 어드민 DB 스키마
-- 사용법: Supabase 프로젝트 생성 후 SQL Editor에 이 파일 전체를 붙여넣고 실행하세요.
-- 이후 supabase/seed.sql 을 실행하면 기존에 수집한 실제 상품/설치사례/블로그 데이터가 채워집니다.

create extension if not exists pgcrypto;

create type product_category as enum ('mfp', 'printer', 'pc', 'notebook', 'nas', 'shredder', 'maintenance', 'supplies', 'parts');
create type product_size as enum ('a3', 'a4');
create type product_color as enum ('color', 'mono');
create type print_tech as enum ('laser', 'inkjet');
create type pricing_type as enum ('rental', 'purchase');
create type product_status as enum ('selling', 'soldout', 'hidden');
create type post_status as enum ('published', 'draft');

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text not null,
  category product_category not null,
  size product_size,
  color product_color,
  print_tech print_tech,
  volume_min integer,
  volume_max integer,
  term_months integer,
  price_monthly integer,
  list_price integer,
  purchase_price integer,
  pricing_type pricing_type not null default 'rental',
  price_note text,
  specs text[] not null default '{}',
  images text[] not null default '{}',
  stock integer,
  status product_status not null default 'selling',
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table install_cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  region text,
  region_slug text,
  industry text,
  industry_slug text,
  brand text,
  model text,
  body text not null,
  body_html text,
  images text[] not null default '{}',
  case_date date,
  status post_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  body text not null,
  body_html text,
  images text[] not null default '{}',
  post_date date,
  source text not null default 'admin', -- 'site' | 'naver' | 'admin'
  status post_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on products (category);
create index products_size_color_idx on products (size, color);
create index install_cases_region_slug_idx on install_cases (region_slug);
create index install_cases_industry_slug_idx on install_cases (industry_slug);

-- updated_at 자동 갱신
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_set_updated_at before update on products
  for each row execute function set_updated_at();
create trigger install_cases_set_updated_at before update on install_cases
  for each row execute function set_updated_at();
create trigger blog_posts_set_updated_at before update on blog_posts
  for each row execute function set_updated_at();

-- Row Level Security: 공개 홈페이지는 누구나 조회 가능(비공개/숨김 제외), 쓰기는 로그인한 관리자만.
alter table products enable row level security;
alter table install_cases enable row level security;
alter table blog_posts enable row level security;

create policy "public_read_products" on products for select
  using (status <> 'hidden');
create policy "admin_write_products" on products for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public_read_cases" on install_cases for select
  using (status = 'published');
create policy "admin_write_cases" on install_cases for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public_read_blog" on blog_posts for select
  using (status = 'published');
create policy "admin_write_blog" on blog_posts for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 이미지 업로드용 Storage 버킷
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "public_read_media" on storage.objects for select
  using (bucket_id = 'media');
create policy "admin_upload_media" on storage.objects for insert
  with check (bucket_id = 'media' and auth.role() = 'authenticated');
create policy "admin_update_media" on storage.objects for update
  using (bucket_id = 'media' and auth.role() = 'authenticated');
create policy "admin_delete_media" on storage.objects for delete
  using (bucket_id = 'media' and auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────
-- 무료 견적문의 (홈페이지 핵심 리드 수집 폼)
-- ─────────────────────────────────────────────────────────
create type inquiry_status as enum ('new', 'contacted', 'closed');

create table inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  company_name text, -- 선택 입력
  interest text, -- 관심 상품 (예: "복합기 렌탈")
  message text,
  attachments text[] not null default '{}', -- storage 'inquiries' 버킷 내 파일 경로 목록 (현재 폼 UI엔 없지만 확장 대비 유지)
  status inquiry_status not null default 'new',
  created_at timestamptz not null default now()
);

create index inquiries_status_idx on inquiries (status);
create index inquiries_created_at_idx on inquiries (created_at desc);

alter table inquiries enable row level security;

-- 홈페이지 방문객(비로그인)도 문의는 등록할 수 있어야 합니다.
create policy "public_insert_inquiries" on inquiries for insert
  with check (true);
-- 조회·상태 변경·삭제는 로그인한 관리자만.
create policy "admin_read_inquiries" on inquiries for select
  using (auth.role() = 'authenticated');
create policy "admin_update_inquiries" on inquiries for update
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "admin_delete_inquiries" on inquiries for delete
  using (auth.role() = 'authenticated');

-- 문의 첨부파일(현장 사진 등)은 비공개 버킷 + signed URL로만 열람합니다 (개인정보/현장 사진 보호).
insert into storage.buckets (id, name, public)
values ('inquiries', 'inquiries', false)
on conflict (id) do nothing;

create policy "public_upload_inquiry_files" on storage.objects for insert
  with check (bucket_id = 'inquiries');
create policy "admin_read_inquiry_files" on storage.objects for select
  using (bucket_id = 'inquiries' and auth.role() = 'authenticated');
create policy "admin_delete_inquiry_files" on storage.objects for delete
  using (bucket_id = 'inquiries' and auth.role() = 'authenticated');
