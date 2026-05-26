-- 입퇴사 관리 확장 컬럼 추가
-- Supabase SQL Editor에서 실행하세요.

alter table public.employees
  add column if not exists headquarters text,
  add column if not exists work_location text,
  add column if not exists first_work_date date,
  add column if not exists last_work_date date,
  add column if not exists return_from_leave_date date,
  add column if not exists personal_email text,
  add column if not exists badge_card_returned text;
