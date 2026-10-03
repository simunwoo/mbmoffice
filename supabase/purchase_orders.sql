-- 구매상품 주문 (상품 상세페이지 "구매 신청" 버튼으로 들어와 토스페이먼츠로 즉시 결제하는 주문입니다)
-- 사용법: schema.sql을 이미 실행한 프로젝트의 SQL Editor에 이 파일을 추가로 붙여넣고 실행하세요.

create type purchase_order_status as enum ('pending', 'paid', 'failed', 'canceled');

create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  unit_price integer not null, -- 주문 당시 1개 구매가 스냅샷
  quantity integer not null default 1,
  amount integer not null, -- unit_price * quantity (토스페이먼츠에 전달·검증하는 최종 결제 금액)
  applicant_name text not null,
  applicant_phone text not null,
  applicant_email text,
  company_name text,
  business_reg_number text,
  receiver_name text not null, -- 수령인 (주문자와 다를 수 있음 — "주문자 정보와 동일" 체크 시 주문자 이름으로 채움)
  receiver_phone text not null,
  zip_code text,
  shipping_address text not null, -- 기본 주소 + 상세 주소
  delivery_memo text,
  notes text,
  toss_order_id text not null unique, -- 우리가 생성해 토스페이먼츠에 전달하는 주문번호
  toss_payment_key text, -- 결제 승인 후 토스페이먼츠가 발급
  status purchase_order_status not null default 'pending',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index purchase_orders_status_idx on purchase_orders (status);
create index purchase_orders_created_at_idx on purchase_orders (created_at desc);
create index purchase_orders_toss_order_id_idx on purchase_orders (toss_order_id);

create trigger purchase_orders_set_updated_at before update on purchase_orders
  for each row execute function set_updated_at();

alter table purchase_orders enable row level security;

-- 주문 생성(결제 시작)은 비로그인 방문자도 가능해야 합니다.
create policy "public_insert_purchase_orders" on purchase_orders for insert
  with check (true);
-- 결제 승인/실패 처리는 서버(결제 콜백)가 service_role 키로만 상태를 갱신합니다 — 일반 사용자의
-- 직접 update는 허용하지 않습니다 (다른 사람 주문을 임의로 'paid' 처리하는 것을 막기 위함).
-- 조회·삭제는 로그인한 관리자만.
create policy "admin_read_purchase_orders" on purchase_orders for select
  using (auth.role() = 'authenticated');
create policy "admin_delete_purchase_orders" on purchase_orders for delete
  using (auth.role() = 'authenticated');

-- 결제 승인 중복 요청 방지 락 — 동시에(또는 새로고침으로) 같은 주문의 승인 콜백이 두 번 들어와도
-- 실제 토스페이먼츠 승인 API 호출은 단 한 번만 나가도록 보장합니다 (operation_key가 PK라 두 번째
-- insert는 조용히 무시됨 — on conflict do nothing).
create table purchase_payment_operations (
  operation_key text primary key, -- 'confirm:' || toss_order_id
  toss_order_id text not null,
  created_at timestamptz not null default now()
);
alter table purchase_payment_operations enable row level security;
-- 일반 사용자는 접근 불가 — claim_purchase_order_operation() 함수(security definer)를 통해서만 기록됩니다.

-- 승인 작업을 "선점"합니다. true를 반환하면 이번 호출이 최초 시도이므로 토스 승인 API를 호출해야 하고,
-- false면 이미 다른 요청이 승인을 시도했으므로(동시 클릭·새로고침) 토스 재조회 API로만 상태를 확인해야 합니다.
create or replace function claim_purchase_order_operation(p_toss_order_id text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare o purchase_orders%rowtype; inserted text;
begin
  select * into o from purchase_orders where toss_order_id = p_toss_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if o.status in ('failed', 'canceled') then raise exception 'ORDER_CLOSED'; end if;
  insert into purchase_payment_operations (operation_key, toss_order_id)
  values ('confirm:' || p_toss_order_id, p_toss_order_id)
  on conflict do nothing
  returning operation_key into inserted;
  return jsonb_build_object('fresh', inserted is not null);
end;
$$;
revoke all on function claim_purchase_order_operation(text) from public, anon, authenticated;
grant execute on function claim_purchase_order_operation(text) to service_role;
