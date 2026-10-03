-- 리드(견적문의)·렌탈신청 상태에 "계약성공(won)"/"계약실패(lost)"를 추가합니다.
-- 기존 "종결(closed)" 값은 그대로 유지하고(과거 데이터 보존), 새 신청 건부터는 종결 대신
-- 계약성공/계약실패 중 하나를 선택해서 실제 계약 전환 여부를 바로 확인할 수 있습니다.
-- 사용법: SQL Editor에 이 파일을 붙여넣고 실행하세요.

alter type inquiry_status add value if not exists 'won';
alter type inquiry_status add value if not exists 'lost';

alter type rental_application_status add value if not exists 'won';
alter type rental_application_status add value if not exists 'lost';
