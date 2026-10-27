-- Category management: admin-controlled categories with visibility, safe deletion and a
-- locked default category for products whose category was removed.

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  slug text generated always as (trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))) stored,
  description text not null default '',
  image text not null default '',
  is_visible boolean not null default true,
  -- The system category receives products from deleted categories. It is always hidden and cannot be removed.
  is_system boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index categories_slug_idx on public.categories (slug);
create unique index categories_single_system_idx on public.categories (is_system) where is_system;
create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

insert into public.categories (name, description, is_visible, is_system, sort_order) values
  ('Uncategorized', 'Holding area for products whose category was deleted. Never shown to shoppers.', false, true, 999),
  ('Cases', '', true, false, 1),
  ('Powerbanks', '', true, false, 2),
  ('Protectors', '', true, false, 3),
  ('Chargers', '', true, false, 4),
  ('Cables', '', true, false, 5),
  ('Stands', '', true, false, 6),
  ('Audio', '', true, false, 7),
  ('Laptop Bags', '', true, false, 8),
  ('Wellness', '', true, false, 9)
on conflict (name) do nothing;

-- Any category already used by existing products becomes a managed category too.
insert into public.categories (name, sort_order)
select distinct trim(category), 100 from public.products
where trim(category) <> '' and trim(category) not in (select name from public.categories)
on conflict (name) do nothing;
update public.products set category = trim(category) where category <> trim(category);
update public.products set category = 'Uncategorized' where trim(category) = '';

-- Products reference categories by name; renames cascade, deletes must go through delete_category().
alter table public.products alter column category set default 'Uncategorized';
alter table public.products
  add constraint products_category_fkey foreign key (category)
  references public.categories (name) on update cascade on delete restrict;
create index products_category_idx on public.products (category);

-- The system category can't be renamed, shown or deleted.
create or replace function public.guard_system_category()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.is_system then raise exception 'The default category cannot be deleted'; end if;
    return old;
  end if;
  if old.is_system and (new.name <> old.name or new.is_visible or not new.is_system) then
    raise exception 'The default category cannot be renamed or made visible';
  end if;
  if new.is_system and not old.is_system then
    raise exception 'Only one default category is allowed';
  end if;
  return new;
end;
$$;
create trigger categories_guard before update or delete on public.categories
  for each row execute function public.guard_system_category();

-- Keep pricing tiers that target a category pointing at it after a rename.
create or replace function public.categories_after_rename()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.name <> old.name then
    update public.pricing set applicable_products = array_replace(applicable_products, old.name, new.name)
    where old.name = any (applicable_products);
  end if;
  return new;
end;
$$;
create trigger categories_rename after update of name on public.categories
  for each row execute function public.categories_after_rename();

-- Deletes a category, first moving its products to p_target_id (or the default category).
create or replace function public.delete_category(p_category_id uuid, p_target_id uuid default null)
returns integer language plpgsql security definer set search_path = public as $$
declare
  src public.categories;
  dst public.categories;
  moved integer;
begin
  if not public.is_staff() then
    raise exception 'Not authorised';
  end if;
  select * into src from public.categories where id = p_category_id for update;
  if not found then raise exception 'Category not found'; end if;
  if src.is_system then raise exception 'The default category cannot be deleted'; end if;

  if p_target_id is null then
    select * into dst from public.categories where is_system;
  else
    select * into dst from public.categories where id = p_target_id;
  end if;
  if dst.id is null then raise exception 'Target category not found'; end if;
  if dst.id = src.id then raise exception 'Choose a different category for the products'; end if;

  update public.products set category = dst.name where category = src.name;
  get diagnostics moved = row_count;
  delete from public.categories where id = src.id;
  return moved;
end;
$$;

-- Shoppers only see visible categories, and only products whose category is visible.
alter table public.categories enable row level security;
create policy "categories: visible or staff" on public.categories for select
  using (is_visible or public.is_staff());
create policy "categories: staff insert" on public.categories for insert with check (public.is_staff() and not is_system);
create policy "categories: staff update" on public.categories for update using (public.is_staff());
-- Deletion only through delete_category() so products are never orphaned.

drop policy "products: public catalog or staff" on public.products;
create policy "products: public catalog or staff" on public.products for select
  using (
    public.is_staff()
    or (is_public and is_active and exists (
      select 1 from public.categories c where c.name = products.category and c.is_visible
    ))
  );

alter publication supabase_realtime add table public.categories;
