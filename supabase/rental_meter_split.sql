-- 개시메타를 흑백/컬러/A3컬러로 나눠서 관리합니다 (요금이 매수 종류별로 다르게 청구되기 때문).
alter table rental_applications
  add column if not exists install_initial_meter_mono integer,
  add column if not exists install_initial_meter_color integer,
  add column if not exists install_initial_meter_a3_color integer;

alter table rental_applications drop column if exists install_initial_meter;
