-- 상품 상세 설명(에디터로 작성하는 리치 텍스트) 컬럼 추가. products 테이블은 이미 존재하므로 컬럼만 추가합니다.
-- 사용법: SQL Editor에 붙여넣고 실행하세요.
alter table products add column if not exists description_html text;
