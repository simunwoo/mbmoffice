-- 구매주문 관리자 상태변경이 실제로는 적용되지 않던 버그를 고칩니다: purchase_orders에는 그동안
-- update 권한을 주는 RLS 정책이 하나도 없어서, 관리자 화면에서 상태를 바꿔도 DB에는 반영되지
-- 않았습니다(에러도 나지 않아 겉으로는 작동하는 것처럼 보였습니다). 다른 테이블(inquiries,
-- rental_applications)과 같은 방식으로 is_admin() 기준 정책을 새로 추가합니다.
-- 사용법: Supabase 대시보드 SQL Editor에 이 파일을 붙여넣고 실행하세요.

drop policy if exists "admin_read_purchase_orders" on purchase_orders;
drop policy if exists "admin_update_purchase_orders" on purchase_orders;
drop policy if exists "admin_delete_purchase_orders" on purchase_orders;
create policy "admin_read_purchase_orders" on purchase_orders for select using (is_admin(auth.uid()));
create policy "admin_update_purchase_orders" on purchase_orders for update using (is_admin(auth.uid())) with check (is_admin(auth.uid()));
create policy "admin_delete_purchase_orders" on purchase_orders for delete using (is_admin(auth.uid()));

-- 배송완료 주문을 "구매확정" 처리할 때, 더는 행을 삭제하지 않고 이 시각을 채워 정산 내역으로
-- 남깁니다(매출 기록이 사라지지 않도록). null이면 아직 정산 전입니다.
alter table purchase_orders add column if not exists settled_at timestamptz;
create index if not exists purchase_orders_settled_at_idx on purchase_orders (settled_at);
