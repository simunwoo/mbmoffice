-- 판매 방식(pricing_type)에 "유지보수"(월 정액 서비스) 값을 추가합니다.
-- 사용법: SQL Editor에 붙여넣고 실행하세요.
alter type pricing_type add value if not exists 'maintenance';
