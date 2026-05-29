-- 자주 쓰는 쿼리 가속용 인덱스

-- 상태별 필터링 (이미 0001에 있지만 확인 차원)
create index if not exists employees_status_idx on public.employees(status);

-- 휴직 종료일 기준 자동 복귀 쿼리
create index if not exists employees_leave_end_idx
  on public.employees(leave_end_date)
  where status = 'on_leave';

-- 입사일 필터 (연도별 재직 현황)
create index if not exists employees_hire_date_idx on public.employees(hire_date);
create index if not exists employees_resignation_date_idx on public.employees(resignation_date);

-- 본부+소속 정렬
create index if not exists employees_hq_dept_idx on public.employees(headquarters, department);

-- 이름 검색 (대소문자 무관)
create index if not exists employees_name_lower_idx on public.employees(lower(name));
