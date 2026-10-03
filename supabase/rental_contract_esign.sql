-- 렌탈신청 건에 "전자계약(자체 동의 페이지)"을 붙이기 위한 컬럼입니다.
-- 토큰을 아는 사람만 계약서 페이지를 볼 수 있는 방식이라(추측 불가능한 UUID),
-- 별도 RLS 정책 없이 서버(관리자 service role)에서만 조회·기록합니다.
-- 사용법: Supabase 대시보드 SQL Editor에 붙여넣고 실행하세요.

alter table rental_applications add column if not exists contract_token uuid;
alter table rental_applications add column if not exists contract_sent_at timestamptz;
-- 계약서 발송 시점의 조건(요금제·기간·금액 등) 스냅샷. 이후 신청 내용이 바뀌어도
-- 고객이 실제로 동의한 조건 그대로가 여기 남아있어야 분쟁 시 증거가 됩니다.
alter table rental_applications add column if not exists contract_terms_snapshot jsonb;
-- 실제로 화면에 보여준 계약 조항 전문(全文)과 그 해시. 나중에 문구 템플릿이 바뀌어도
-- "그때 정확히 이 내용에 동의했다"를 증명할 수 있도록 원문을 그대로 고정 보관합니다.
alter table rental_applications add column if not exists contract_terms_text text;
alter table rental_applications add column if not exists contract_terms_hash text;
alter table rental_applications add column if not exists contract_agreed_at timestamptz;
alter table rental_applications add column if not exists contract_agreed_name text;
alter table rental_applications add column if not exists contract_agreed_ip text;
alter table rental_applications add column if not exists contract_agreed_user_agent text;

create unique index if not exists rental_applications_contract_token_idx
  on rental_applications (contract_token) where contract_token is not null;
