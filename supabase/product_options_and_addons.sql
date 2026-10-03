-- 상품 옵션(조합형, 재고 관리) + 추가 구매 상품(상품별 지정) + 주문 추가 항목
-- 사용법: schema.sql, purchase_orders.sql을 이미 실행한 프로젝트의 SQL Editor에 이어서 실행하세요.

-- 옵션 그룹 (예: "색상" → {"빨강","파랑"})
create table product_option_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  values text[] not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_option_groups_product_id_idx on product_option_groups (product_id);

-- 옵션 조합별 재고·추가금 (그룹의 값들을 조합해 관리자 화면에서 자동 생성합니다)
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  option_combo jsonb not null, -- 예: {"색상":"빨강","용량":"256GB"}
  label text not null, -- 예: "빨강 / 256GB" (화면 표시용)
  price_delta integer not null default 0, -- 기본 구매가에 더해지는 금액(음수 가능)
  stock integer not null default 0,
  status text not null default 'selling' check (status in ('selling', 'soldout')),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_variants_product_id_idx on product_variants (product_id);

-- 추가 구매 상품(상품 상세페이지에서 "함께 구매하면 좋은 상품"으로 보여줄 다른 상품, 상품별 지정)
create table product_addons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade, -- 이 상품 페이지에
  addon_product_id uuid not null references products(id) on delete cascade, -- 이 상품을 추가 구매 옵션으로 노출
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, addon_product_id)
);
create index product_addons_product_id_idx on product_addons (product_id);

alter table product_option_groups enable row level security;
alter table product_variants enable row level security;
alter table product_addons enable row level security;

create policy "public_read_option_groups" on product_option_groups for select using (true);
create policy "admin_write_option_groups" on product_option_groups for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public_read_variants" on product_variants for select using (true);
create policy "admin_write_variants" on product_variants for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "public_read_addons" on product_addons for select using (true);
create policy "admin_write_addons" on product_addons for all
  using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 주문의 대표 상품이 어떤 옵션 조합으로 담겼는지 스냅샷 (옵션이 없는 상품은 둘 다 null)
alter table purchase_orders
  add column if not exists variant_id uuid references product_variants(id) on delete set null,
  add column if not exists option_label text;

-- 추가 구매 상품으로 함께 담은 항목들 (대표 상품 1개는 purchase_orders 본문에 그대로 유지하고,
-- 추가로 담긴 상품만 여기에 한 줄씩 저장합니다)
create table purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references purchase_orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  unit_price integer not null,
  quantity integer not null default 1,
  line_amount integer not null,
  created_at timestamptz not null default now()
);
create index purchase_order_items_order_id_idx on purchase_order_items (order_id);

alter table purchase_order_items enable row level security;
create policy "public_insert_order_items" on purchase_order_items for insert with check (true);
create policy "admin_read_order_items" on purchase_order_items for select
  using (auth.role() = 'authenticated');
create policy "admin_delete_order_items" on purchase_order_items for delete
  using (auth.role() = 'authenticated');
