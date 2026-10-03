-- 계약서 제2조(대상복합기)의 기종·기계번호·요금계산개시일·개시메타는 설치 당일에야 확정되는
-- 값이라, 담당 직원이 관리자 페이지에서 직접 입력할 수 있도록 컬럼을 추가합니다.
-- 사용법: Supabase 대시보드 SQL Editor에 붙여넣고 실행하세요.

alter table rental_applications add column if not exists install_model text;
alter table rental_applications add column if not exists install_serial_number text;
alter table rental_applications add column if not exists install_billing_start_date date;
alter table rental_applications add column if not exists install_initial_meter integer;
