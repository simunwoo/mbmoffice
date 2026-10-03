-- 회원관리 상세페이지에서 관리자가 남기는 메모(고객 특이사항 등),
-- 그리고 마이페이지 "회원 정보"에 쓰는 회사명 컬럼을 추가합니다.
-- 사용법: Supabase 대시보드 SQL Editor에 붙여넣고 실행하세요.

alter table profiles add column if not exists admin_note text;
alter table profiles add column if not exists company_name text;
