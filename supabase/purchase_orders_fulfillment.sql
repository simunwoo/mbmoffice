-- 결제 완료 이후의 배송 처리 단계(상품준비중/배송대기/배송중/배송완료/취소접수/반품접수)와
-- 택배사·송장번호를 관리합니다. 결제 상태(status)는 그대로 두고, 배송 진행 상태만 별도로 둡니다.
alter table purchase_orders
  add column if not exists fulfillment_status text
    check (fulfillment_status in ('preparing', 'ready_to_ship', 'shipping', 'delivered', 'cancel_requested', 'return_requested')),
  add column if not exists carrier text,
  add column if not exists tracking_number text;

-- 이미 결제 완료된 기존 주문은 기본값으로 "상품준비중"부터 시작하게 채워둡니다.
update purchase_orders set fulfillment_status = 'preparing' where status = 'paid' and fulfillment_status is null;
