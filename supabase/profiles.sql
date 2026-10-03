-- 회원(일반 고객) 계정과 관리자 계정을 구분하기 위한 profiles 테이블입니다.
-- 지금까지 /admin은 "로그인만 되어 있으면 누구나 접근 가능"한 구조였는데, 회원가입을 열면
-- 일반 고객도 로그인 후 관리자 페이지에 들어갈 수 있게 되는 문제가 있어 반드시 함께 적용해야 합니다.
-- 사용법: Supabase 대시보드 SQL Editor에 이 파일 전체를 붙여넣고 실행하세요.

create type user_role as enum ('member', 'admin');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'member',
  name text,
  phone text,
  provider text not null default 'email',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "self can view own profile" on profiles for select using (auth.uid() = id);
create policy "self can update own profile" on profiles for update using (auth.uid() = id);
create policy "self can insert own profile" on profiles for insert with check (auth.uid() = id);

-- set_updated_at()는 schema.sql에서 이미 만들어져 있어 재사용합니다 (다시 만들면 이름 충돌 에러가 납니다).

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- 신규 가입(이메일/카카오/구글/네이버) 시 auth.users에 행이 생기면 자동으로 profiles 행도 만듭니다.
-- 기본 역할은 항상 'member'이며, 관리자 승격은 아래처럼 수동으로만 가능합니다.
create function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, name, phone, provider)
  values (
    new.id,
    'member',
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'provider', new.raw_app_meta_data->>'provider', 'email')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- 이 마이그레이션을 실행하는 시점에 이미 auth.users에 있는 계정 = 지금까지 만들어 둔 관리자 스태프
-- 계정이라고 보고 모두 admin으로 지정합니다. 이후 새로 가입하는 일반회원은 위 트리거로 자동 생성되며
-- 항상 기본값 member로 시작합니다. 스태프를 새로 추가할 때는 가입 후 아래처럼 수동으로 승격하세요:
--   update profiles set role = 'admin' where id = (select id from auth.users where email = '담당자이메일');
insert into public.profiles (id, role, name, provider)
select id, 'admin', coalesce(raw_user_meta_data->>'name', email), 'email'
from auth.users
on conflict (id) do update set role = 'admin';
