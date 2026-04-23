create extension if not exists pgcrypto;

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  position numeric(20, 6) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references public.columns(id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  position numeric(20, 6) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_boards_user_id on public.boards(user_id);
create index idx_columns_board_id_position on public.columns(board_id, position);
create index idx_cards_column_id_position on public.cards(column_id, position);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at_boards
before update on public.boards
for each row
execute function public.set_updated_at();

create trigger set_updated_at_columns
before update on public.columns
for each row
execute function public.set_updated_at();

create trigger set_updated_at_cards
before update on public.cards
for each row
execute function public.set_updated_at();

alter table public.boards enable row level security;
alter table public.columns enable row level security;
alter table public.cards enable row level security;

create policy "boards_select_own"
on public.boards
for select
using (user_id = auth.uid());

create policy "boards_insert_own"
on public.boards
for insert
with check (user_id = auth.uid());

create policy "boards_update_own"
on public.boards
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "boards_delete_own"
on public.boards
for delete
using (user_id = auth.uid());

create policy "columns_select_via_board_owner"
on public.columns
for select
using (
  exists (
    select 1
    from public.boards b
    where b.id = columns.board_id
      and b.user_id = auth.uid()
  )
);

create policy "columns_insert_via_board_owner"
on public.columns
for insert
with check (
  exists (
    select 1
    from public.boards b
    where b.id = columns.board_id
      and b.user_id = auth.uid()
  )
);

create policy "columns_update_via_board_owner"
on public.columns
for update
using (
  exists (
    select 1
    from public.boards b
    where b.id = columns.board_id
      and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.boards b
    where b.id = columns.board_id
      and b.user_id = auth.uid()
  )
);

create policy "columns_delete_via_board_owner"
on public.columns
for delete
using (
  exists (
    select 1
    from public.boards b
    where b.id = columns.board_id
      and b.user_id = auth.uid()
  )
);

create policy "cards_select_via_board_owner"
on public.cards
for select
using (
  exists (
    select 1
    from public.columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and b.user_id = auth.uid()
  )
);

create policy "cards_insert_via_board_owner"
on public.cards
for insert
with check (
  exists (
    select 1
    from public.columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and b.user_id = auth.uid()
  )
);

create policy "cards_update_via_board_owner"
on public.cards
for update
using (
  exists (
    select 1
    from public.columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and b.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and b.user_id = auth.uid()
  )
);

create policy "cards_delete_via_board_owner"
on public.cards
for delete
using (
  exists (
    select 1
    from public.columns c
    join public.boards b on b.id = c.board_id
    where c.id = cards.column_id
      and b.user_id = auth.uid()
  )
);
