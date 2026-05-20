-- 인력 관리 (입퇴사) 스키마
-- Supabase SQL 에디터에서 그대로 실행하세요.

create extension if not exists "pgcrypto";

-- 직원
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_number text unique,
  name text not null,
  email text,
  phone text,
  department text,
  position text,
  hire_date date,
  resignation_date date,
  status text not null default 'active' check (status in ('active','on_leave','resigned')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employees_status_idx on public.employees(status);
create index if not exists employees_hire_date_idx on public.employees(hire_date);
create index if not exists employees_resignation_date_idx on public.employees(resignation_date);

-- 체크리스트 항목 (입사/퇴사 공용)
create table if not exists public.checklist_items (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  kind text not null check (kind in ('onboarding','offboarding')),
  task text not null,
  completed boolean not null default false,
  completed_at timestamptz,
  completed_by text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists checklist_items_employee_kind_idx
  on public.checklist_items(employee_id, kind);

-- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists employees_set_updated_at on public.employees;
create trigger employees_set_updated_at
  before update on public.employees
  for each row execute procedure public.set_updated_at();

-- RLS: 로그인한 사용자만 접근
alter table public.employees enable row level security;
alter table public.checklist_items enable row level security;

drop policy if exists "auth read employees" on public.employees;
drop policy if exists "auth write employees" on public.employees;
create policy "auth read employees" on public.employees
  for select to authenticated using (true);
create policy "auth write employees" on public.employees
  for all to authenticated using (true) with check (true);

drop policy if exists "auth read checklist" on public.checklist_items;
drop policy if exists "auth write checklist" on public.checklist_items;
create policy "auth read checklist" on public.checklist_items
  for select to authenticated using (true);
create policy "auth write checklist" on public.checklist_items
  for all to authenticated using (true) with check (true);
