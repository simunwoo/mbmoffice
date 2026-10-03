-- rental_applications 테이블에 흑백/컬러 매수(요금제 내 사용량 선택) 정보를 추가합니다.
-- 사용법: rental_applications.sql을 이미 실행한 프로젝트의 SQL Editor에 이 파일을 추가로 실행하세요.

alter table rental_applications
  add column if not exists usage_summary text; -- 예: "흑백 3,000매 / 컬러 100매", 잉크젯은 "월 1,000매 (흑백·컬러 구분없음)"
