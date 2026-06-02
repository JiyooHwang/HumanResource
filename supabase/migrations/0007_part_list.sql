-- 파트 목록 테이블
create table if not exists public.part_list (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.part_list enable row level security;

create policy "auth read part" on public.part_list for select to authenticated using (true);
create policy "auth insert part" on public.part_list for insert to authenticated with check (true);
create policy "auth update part" on public.part_list for update to authenticated using (true) with check (true);
create policy "auth delete part" on public.part_list for delete to authenticated using (true);

insert into public.part_list (name, sort_order) values
  ('1파트', 0),
  ('2파트', 1),
  ('3파트', 2),
  ('4파트', 3)
on conflict (name) do nothing;
