-- Grocery list items (Groceries tab) — synced per user across devices.

create table if not exists public.grocery_items (
  id text not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  category text,
  quantity integer not null default 1,
  unit text,
  status text not null default 'list',
  priority text default 'medium',
  completed boolean not null default false,
  notes text,
  added_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint grocery_items_pkey primary key (id),
  constraint grocery_items_quantity_check check (quantity >= 0 and quantity <= 999),
  constraint grocery_items_status_check check (
    status in ('list', 'bought', 'fridge')
  ),
  constraint grocery_items_priority_check check (
    priority is null
    or priority in ('high', 'medium', 'low')
  )
);

create index if not exists grocery_items_user_id_idx on public.grocery_items (user_id);

alter table public.grocery_items enable row level security;

drop policy if exists "grocery_items_select_own" on public.grocery_items;
create policy "grocery_items_select_own"
  on public.grocery_items
  for select
  to authenticated
  using (auth.uid () = user_id);

drop policy if exists "grocery_items_insert_own" on public.grocery_items;
create policy "grocery_items_insert_own"
  on public.grocery_items
  for insert
  to authenticated
  with check (auth.uid () = user_id);

drop policy if exists "grocery_items_update_own" on public.grocery_items;
create policy "grocery_items_update_own"
  on public.grocery_items
  for update
  to authenticated
  using (auth.uid () = user_id)
  with check (auth.uid () = user_id);

drop policy if exists "grocery_items_delete_own" on public.grocery_items;
create policy "grocery_items_delete_own"
  on public.grocery_items
  for delete
  to authenticated
  using (auth.uid () = user_id);
