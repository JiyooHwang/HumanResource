-- 휴직 정보 추가
-- Supabase SQL Editor 에서 실행하세요. (이미 적용돼도 안전하게 다시 실행 가능)

alter table public.employees
  add column if not exists leave_start_date date,
  add column if not exists leave_end_date date,
  add column if not exists leave_reason text,
  add column if not exists leave_reason_detail text;

-- 기존 체크 제약을 다시 만들지 않고, 새 컬럼만 값 제한
do $$
begin
  if not exists (
    select 1 from information_schema.constraint_column_usage
    where table_name = 'employees' and constraint_name = 'employees_leave_reason_check'
  ) then
    alter table public.employees
      add constraint employees_leave_reason_check
      check (leave_reason is null or leave_reason in ('parental','maternity','unpaid','other'));
  end if;
end$$;
