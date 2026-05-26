-- 본부/소속 목록을 DB에서 관리하기 위한 테이블

-- 본부 목록
create table if not exists public.headquarters_list (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 소속 목록
create table if not exists public.department_list (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- RLS 활성화
alter table public.headquarters_list enable row level security;
alter table public.department_list enable row level security;

-- 인증된 사용자만 CRUD 가능
create policy "Authenticated users can read headquarters_list"
  on public.headquarters_list for select
  to authenticated using (true);

create policy "Authenticated users can insert headquarters_list"
  on public.headquarters_list for insert
  to authenticated with check (true);

create policy "Authenticated users can update headquarters_list"
  on public.headquarters_list for update
  to authenticated using (true) with check (true);

create policy "Authenticated users can delete headquarters_list"
  on public.headquarters_list for delete
  to authenticated using (true);

create policy "Authenticated users can read department_list"
  on public.department_list for select
  to authenticated using (true);

create policy "Authenticated users can insert department_list"
  on public.department_list for insert
  to authenticated with check (true);

create policy "Authenticated users can update department_list"
  on public.department_list for update
  to authenticated using (true) with check (true);

create policy "Authenticated users can delete department_list"
  on public.department_list for delete
  to authenticated using (true);

-- 기존 하드코딩된 본부 목록 시드
insert into public.headquarters_list (name, sort_order) values
  ('주식회사 로커스', 0),
  ('Studio X', 1),
  ('VFX Studios', 2),
  ('Animation Studios', 3),
  ('실감영상기술연구소', 4),
  ('기업부설창작연구소', 5),
  ('AI 애니메이션연구소', 6),
  ('전략본부', 7),
  ('신규사업실', 8)
on conflict (name) do nothing;

-- 기존 하드코딩된 소속 목록 시드
insert into public.department_list (name, sort_order) values
  ('부사장', 0),
  ('글로벌 사업 개발실', 1),
  ('IP사업실', 2),
  ('IP전략실', 3),
  ('PD', 4),
  ('Supervisor실', 5),
  ('Directing실', 6),
  ('StoryDevelopment', 7),
  ('VisualDevelopment', 8),
  ('Directing', 9),
  ('modeling', 10),
  ('Look Development', 11),
  ('CFX', 12),
  ('Animation', 13),
  ('Lighting', 14),
  ('FX', 15),
  ('Blender', 16),
  ('Composite', 17),
  ('Unreal', 18),
  ('제작기획팀', 19),
  ('Art팀', 20),
  ('3D팀', 21),
  ('Flame1팀', 22),
  ('Flame2팀', 23),
  ('Flame3팀', 24),
  ('Flame4팀', 25),
  ('AI팀', 26),
  ('DI팀', 27),
  ('파이프라인', 28),
  ('플랫폼', 29),
  ('AI 에이전트', 30),
  ('경영지원실', 31),
  ('HR팀', 32),
  ('GA팀', 33),
  ('EA팀', 34),
  ('투자전략실', 35),
  ('재무기획실', 36),
  ('기술연구팀', 37),
  ('기술보안팀', 38),
  ('CT기획팀', 39)
on conflict (name) do nothing;
