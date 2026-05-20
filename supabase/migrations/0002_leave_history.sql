-- 휴직 이력 테이블 + 상태 변경 시 자동 보관 트리거
-- Supabase SQL Editor 에서 실행하세요 (멱등성 보장).

create table if not exists public.leave_history (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  start_date date,
  end_date date,
  reason text check (reason is null or reason in ('parental','maternity','unpaid','other')),
  reason_detail text,
  created_at timestamptz not null default now()
);

create index if not exists leave_history_employee_idx
  on public.leave_history(employee_id);

alter table public.leave_history enable row level security;

drop policy if exists "auth read leave_history" on public.leave_history;
drop policy if exists "auth write leave_history" on public.leave_history;
create policy "auth read leave_history" on public.leave_history
  for select to authenticated using (true);
create policy "auth write leave_history" on public.leave_history
  for all to authenticated using (true) with check (true);

-- 상태가 on_leave → 다른 값으로 바뀔 때 자동 이력 저장 + 현재 휴직 필드 초기화
create or replace function public.archive_leave_on_status_change()
returns trigger as $$
begin
  if old.status = 'on_leave' and new.status <> 'on_leave' then
    if old.leave_start_date is not null or old.leave_reason is not null then
      insert into public.leave_history (employee_id, start_date, end_date, reason, reason_detail)
      values (
        old.id,
        old.leave_start_date,
        coalesce(new.leave_end_date, old.leave_end_date, current_date),
        old.leave_reason,
        old.leave_reason_detail
      );
    end if;
    new.leave_start_date = null;
    new.leave_end_date = null;
    new.leave_reason = null;
    new.leave_reason_detail = null;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists employees_archive_leave on public.employees;
create trigger employees_archive_leave
  before update on public.employees
  for each row execute procedure public.archive_leave_on_status_change();
