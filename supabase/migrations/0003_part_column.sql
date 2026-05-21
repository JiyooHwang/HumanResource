-- 부서 내 파트 (예: "1파트", "캐릭터파트") 컬럼 추가
alter table public.employees add column if not exists part text;
