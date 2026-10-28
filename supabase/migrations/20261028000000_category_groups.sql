-- Mobile-first catalogue: categories become a two-level tree (group -> subcategory) and products
-- gain an ordered spec sheet. The store is organised around three groups: Mobile Phones (by brand),
-- Phone Accessories and Mobile Protection. Existing categories are folded into these groups.

alter table public.categories add column parent_id uuid references public.categories (id) on delete restrict;
create index categories_parent_idx on public.categories (parent_id);

-- [{label, value}] in display order, e.g. Display, Processor, RAM, Storage, Camera, Battery.
alter table public.products add column specs jsonb not null default '[]'::jsonb;

-- Only one level of nesting, and the default category stays outside the tree.
create or replace function public.guard_category_parent()
returns trigger language plpgsql as $$
declare
  parent public.categories;
begin
  if new.parent_id is null then return new; end if;
  if new.is_system then raise exception 'The default category cannot be a subcategory'; end if;
  if new.parent_id = new.id then raise exception 'A category cannot be its own parent'; end if;
  select * into parent from public.categories where id = new.parent_id;
  if not found then raise exception 'Parent category not found'; end if;
  if parent.is_system then raise exception 'Subcategories cannot be added to the default category'; end if;
  if parent.parent_id is not null then raise exception 'Subcategories can only be one level deep'; end if;
  if exists (select 1 from public.categories where parent_id = new.id) then
    raise exception 'A category that has subcategories cannot become a subcategory';
  end if;
  return new;
end;
$$;
create trigger categories_parent_guard before insert or update of parent_id on public.categories
  for each row execute function public.guard_category_parent();

-- A category is live when it and its parent group (if any) are visible.
create or replace function public.category_is_live(p_name text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.categories c
    left join public.categories g on g.id = c.parent_id
    where c.name = p_name and c.is_visible and (g.id is null or g.is_visible)
  );
$$;

drop policy "categories: visible or staff" on public.categories;
create policy "categories: visible or staff" on public.categories for select
  using (public.category_is_live(name) or public.is_staff());

drop policy "products: public catalog or staff" on public.products;
create policy "products: public catalog or staff" on public.products for select
  using (public.is_staff() or (is_public and is_active and public.category_is_live(category)));

-- A group can only be deleted once its subcategories are moved or deleted.
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
  if exists (select 1 from public.categories where parent_id = src.id) then
    raise exception 'Move or delete the subcategories of "%" first', src.name;
  end if;

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

-- ---------------------------------------------------------------- default tree
insert into public.categories (name, description, image, sort_order) values
  ('Mobile Phones', 'The latest smartphones from every major brand, with brand warranty.',
   'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&q=80&w=900', 1),
  ('Phone Accessories', 'Chargers, cables, power banks, audio and wearables for your phone.',
   'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=900', 2),
  ('Mobile Protection', 'Cases, covers and screen protection for every model.',
   'https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&q=80&w=900', 3)
on conflict (name) do nothing;

-- Existing categories that match a new subcategory are renamed, so their products move with them
-- (products and pricing tiers follow renames automatically).
do $$
declare
  r record;
begin
  for r in select * from (values
    ('Cases', 'Phone Cases & Covers'),
    ('Protectors', 'Tempered Glass'),
    ('Chargers', 'Chargers & Adapters'),
    ('Cables', 'Charging Cables'),
    ('Powerbanks', 'Power Banks'),
    ('Stands', 'Phone Holders & Stands'),
    ('Audio', 'Earbuds & Headphones')
  ) as m(old_name, new_name)
  loop
    if not exists (select 1 from public.categories where name = r.new_name) then
      update public.categories set name = r.new_name where name = r.old_name and not is_system;
    end if;
  end loop;
end;
$$;

insert into public.categories (name, parent_id, sort_order, image)
select s.name, g.id, s.ord, s.image
from (values
  ('Mobile Phones', 'Apple', 1, ''),
  ('Mobile Phones', 'Samsung', 2, ''),
  ('Mobile Phones', 'OnePlus', 3, ''),
  ('Mobile Phones', 'Xiaomi', 4, ''),
  ('Mobile Phones', 'Redmi', 5, ''),
  ('Mobile Phones', 'Realme', 6, ''),
  ('Mobile Phones', 'Vivo', 7, ''),
  ('Mobile Phones', 'Oppo', 8, ''),
  ('Mobile Phones', 'Motorola', 9, ''),
  ('Mobile Phones', 'Nothing', 10, ''),
  ('Mobile Phones', 'Google Pixel', 11, ''),
  ('Phone Accessories', 'Chargers & Adapters', 1, 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&q=80&w=600'),
  ('Phone Accessories', 'Charging Cables', 2, ''),
  ('Phone Accessories', 'Power Banks', 3, 'https://spigen.in/cdn/shop/files/71jmlm3jb-L._SL1500_1200x1200.jpg?v=1772618437'),
  ('Phone Accessories', 'Wireless Chargers', 4, 'https://images.unsplash.com/photo-1615526675159-e248c3021d3f?auto=format&fit=crop&q=80&w=600'),
  ('Phone Accessories', 'Earbuds & Headphones', 5, 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?auto=format&fit=crop&q=80&w=600'),
  ('Phone Accessories', 'Smartwatches', 6, 'https://images.unsplash.com/photo-1631281956016-3cdc1b2fe5fb?auto=format&fit=crop&q=80&w=600'),
  ('Phone Accessories', 'Car Chargers', 7, ''),
  ('Phone Accessories', 'Phone Holders & Stands', 8, 'https://m.media-amazon.com/images/I/51PZOJa6yFL.jpg'),
  ('Mobile Protection', 'Phone Cases & Covers', 1, 'https://media-ik.croma.com/prod/https://media.tatacroma.com/Croma%20Assets/Communication/Cases%20and%20Covers/Images/239888_0_yfszpc.png'),
  ('Mobile Protection', 'Tempered Glass', 2, 'https://incredideals.co/cdn/shop/files/S500946272_1_eac5eeb3-b5bd-40df-b46e-172085c91871.webp?v=1766600404'),
  ('Mobile Protection', 'Privacy Screen Protectors', 3, ''),
  ('Mobile Protection', 'Hydrogel Screen Protectors', 4, ''),
  ('Mobile Protection', 'Camera Lens Protectors', 5, ''),
  ('Mobile Protection', 'Rugged & Shockproof Cases', 6, ''),
  ('Mobile Protection', 'Transparent Cases', 7, 'https://media.tatacroma.com/Croma%20Assets/Communication/Mobile%20Accessories/Images/239847_15_qvwl9g.png'),
  ('Mobile Protection', 'Silicone Cases', 8, '')
) as s(grp, name, ord, image)
join public.categories g on g.name = s.grp and g.parent_id is null
on conflict (name) do update set
  parent_id = excluded.parent_id,
  sort_order = excluded.sort_order,
  image = case when public.categories.image = '' then excluded.image else public.categories.image end;

-- Anything left at the top level (e.g. Laptop Bags, Wellness) is listed after the three groups.
update public.categories set sort_order = sort_order + 10
where parent_id is null and not is_system
  and name not in ('Mobile Phones', 'Phone Accessories', 'Mobile Protection')
  and not exists (select 1 from public.categories c where c.parent_id = public.categories.id)
  and sort_order < 10;
