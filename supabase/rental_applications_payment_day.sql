-- 렌탈 신청서에 희망 월 렌탈료 결제일(5/10/15/20/25/30일)을 추가합니다.
alter table rental_applications add column if not exists payment_day integer;
