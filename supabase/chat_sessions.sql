-- AI 상담 챗봇 대화 기록. session_id(브라우저에서 생성한 uuid)를 id로 upsert합니다.
create table chat_sessions (
  id uuid primary key,
  messages jsonb not null default '[]'::jsonb,
  page text,
  ip text,
  ua text,
  member_id uuid references profiles(id) on delete set null,
  member_name text,
  inquiry_id uuid references inquiries(id) on delete set null,
  fallback boolean not null default false,
  message_count integer not null default 0,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chat_sessions_updated_at_idx on chat_sessions (updated_at desc);
create index chat_sessions_inquiry_id_idx on chat_sessions (inquiry_id);

create trigger chat_sessions_set_updated_at before update on chat_sessions
  for each row execute function set_updated_at();

alter table chat_sessions enable row level security;

-- 비로그인 방문자도 상담 중 메시지를 계속 저장(upsert)할 수 있어야 합니다. session id는 브라우저가
-- 생성한 추측 불가능한 uuid라, 다른 사람 세션을 건드릴 위험은 낮습니다.
create policy "public_write_chat_sessions" on chat_sessions for insert with check (true);
create policy "public_update_chat_sessions" on chat_sessions for update using (true) with check (true);

-- 조회·삭제는 관리자만.
create policy "admin_read_chat_sessions" on chat_sessions for select
  using (auth.role() = 'authenticated');
create policy "admin_delete_chat_sessions" on chat_sessions for delete
  using (auth.role() = 'authenticated');
