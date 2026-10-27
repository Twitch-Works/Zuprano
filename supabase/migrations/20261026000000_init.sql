-- Zuprano: storefront + admin CRM schema
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles (one row per auth user; customers and staff)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin', 'manager', 'support')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  addresses jsonb not null default '[]'::jsonb,
  preferences jsonb not null default '{}'::jsonb,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role <> 'customer' and status = 'active'
  );
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, email, phone)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), nullif(new.raw_user_meta_data ->> 'full_name', ''),
             case when new.phone is not null and new.phone <> '' then 'User ' || right(new.phone, 4) else split_part(coalesce(new.email, ''), '@', 1) end),
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'phone', ''), nullif(new.phone, ''))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Customers may edit their own profile but never their role or status.
create or replace function public.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_staff()
     and (new.role is distinct from old.role or new.status is distinct from old.status) then
    raise exception 'Not allowed to change role or status';
  end if;
  return new;
end;
$$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  sku text not null default '',
  brand text not null default '',
  category text not null default 'Cases',
  price numeric(12, 2) not null default 0,
  original_price numeric(12, 2),
  discount numeric(6, 2),
  stock integer not null default 0 check (stock >= 0),
  dealer_id text not null default 'Warehouse',
  dealer_name text,
  images text[] not null default '{}',
  image_url text not null default '',
  thumbnail text not null default '',
  is_public boolean not null default false,
  is_active boolean not null default true,
  tags text[] not null default '{}',
  compatibility text[] not null default '{}',
  variants jsonb not null default '[]'::jsonb,
  rating numeric(3, 2) not null default 0,
  reviews_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_public_idx on public.products (is_public, is_active, created_at desc);
create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Dealers
-- ---------------------------------------------------------------------------
create table public.dealers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact text not null default '',
  location text not null default '',
  gst_number text not null default '',
  pan_number text not null default '',
  status text not null default 'active' check (status in ('active', 'inactive')),
  verification_status text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  address jsonb not null default '{"street":"","city":"","state":"","zip":""}'::jsonb,
  rating numeric(3, 2) not null default 0,
  total_orders integer not null default 0,
  total_revenue numeric(14, 2) not null default 0,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger dealers_updated_at before update on public.dealers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence public.order_number_seq start 10001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique default ('ZUP-' || nextval('public.order_number_seq')),
  user_id uuid references auth.users (id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  shipping_address jsonb not null default '{}'::jsonb,
  dealer_id uuid references public.dealers (id) on delete set null,
  dealer_name text not null default 'Online Store',
  -- [{productId, variantId, name, variant, image, price, quantity}]
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12, 2) not null default 0,
  discount numeric(12, 2) not null default 0,
  tax numeric(12, 2) not null default 0,
  shipping numeric(12, 2) not null default 0,
  total_amount numeric(12, 2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
  payment_method text not null default 'razorpay' check (payment_method in ('razorpay', 'cod', 'manual')),
  razorpay_order_id text unique,
  razorpay_payment_id text,
  tracking_id text unique,
  carrier text not null default 'Delhivery',
  status_history jsonb not null default '[]'::jsonb,
  source text not null default 'store' check (source in ('store', 'admin')),
  stock_committed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_user_idx on public.orders (user_id, created_at desc);
create index orders_created_idx on public.orders (created_at desc);
create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- Keep a status timeline for the tracking page, and put stock back when an order is cancelled.
create or replace function public.orders_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  item jsonb;
begin
  if tg_op = 'INSERT' then
    new.status_history = jsonb_build_array(jsonb_build_object(
      'status', new.status, 'at', now(), 'note', 'Order placed'));
    return new;
  end if;

  if new.status is distinct from old.status then
    new.status_history = coalesce(old.status_history, '[]'::jsonb) || jsonb_build_object(
      'status', new.status, 'at', now(), 'note', null);

    if new.status = 'cancelled' and old.stock_committed then
      for item in select * from jsonb_array_elements(old.items) loop
        update public.products
           set stock = stock + (item ->> 'quantity')::int,
               variants = public.adjust_variant_stock(variants, item ->> 'variantId', (item ->> 'quantity')::int)
         where id = (item ->> 'productId')::uuid;
      end loop;
      if old.dealer_id is not null then
        update public.dealers
           set total_orders = greatest(total_orders - 1, 0),
               total_revenue = greatest(total_revenue - old.total_amount, 0)
         where id = old.dealer_id;
      end if;
      new.stock_committed = false;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.adjust_variant_stock(p_variants jsonb, p_variant_id text, p_delta int)
returns jsonb language sql immutable as $$
  select case
    when p_variants is null or jsonb_typeof(p_variants) <> 'array' or p_variant_id is null then p_variants
    else coalesce((
      select jsonb_agg(
        case when v ->> 'id' = p_variant_id and (v ? 'stock')
          then jsonb_set(v, '{stock}', to_jsonb(greatest(coalesce((v ->> 'stock')::int, 0) + p_delta, 0)))
          else v end
        order by ord)
      from jsonb_array_elements(p_variants) with ordinality as t(v, ord)
    ), '[]'::jsonb)
  end;
$$;

create trigger orders_status_insert before insert on public.orders
  for each row execute function public.orders_status_change();
create trigger orders_status_update before update on public.orders
  for each row execute function public.orders_status_change();

-- Atomically reserve stock for an order. Raises if any line is short.
create or replace function public.commit_order_stock(p_order_id uuid)
returns public.orders language plpgsql security definer set search_path = public as $$
declare
  o public.orders;
  item jsonb;
  qty int;
  touched int;
begin
  select * into o from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Order % not found', p_order_id;
  end if;
  if o.stock_committed then
    return o;
  end if;

  for item in select * from jsonb_array_elements(o.items) loop
    qty := (item ->> 'quantity')::int;
    update public.products
       set stock = stock - qty,
           variants = public.adjust_variant_stock(variants, item ->> 'variantId', -qty)
     where id = (item ->> 'productId')::uuid and stock >= qty;
    get diagnostics touched = row_count;
    if touched = 0 then
      raise exception 'Insufficient stock for %', item ->> 'name' using errcode = 'P0001';
    end if;
  end loop;

  if o.dealer_id is not null then
    update public.dealers
       set total_orders = total_orders + 1,
           total_revenue = total_revenue + o.total_amount
     where id = o.dealer_id;
  end if;

  update public.orders
     set stock_committed = true,
         tracking_id = coalesce(tracking_id, 'TRK' || lpad((floor(random() * 1000000000))::bigint::text, 9, '0'))
   where id = p_order_id
   returning * into o;
  return o;
end;
$$;
revoke execute on function public.commit_order_stock(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Pricing tiers, campaigns, stock movements, settings, wishlist
-- ---------------------------------------------------------------------------
create table public.pricing (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  min_qty integer not null default 1,
  max_qty integer,
  discount_percent numeric(5, 2) not null default 0,
  applicable_products text[] not null default '{}',
  start_date date not null default current_date,
  end_date date,
  status text not null default 'active' check (status in ('active', 'inactive', 'scheduled')),
  created_at timestamptz not null default now()
);

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'Seasonal',
  discount_percent numeric(5, 2) not null default 0,
  budget numeric(14, 2) not null default 0,
  spent numeric(14, 2) not null default 0,
  reach integer not null default 0,
  status text not null default 'Scheduled' check (status in ('Active', 'Completed', 'Scheduled')),
  conversion_rate numeric(5, 2),
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  type text not null check (type in ('restock', 'transfer', 'adjustment')),
  quantity integer not null,
  dealer_id uuid references public.dealers (id) on delete set null,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.settings (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

create table public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

-- Staff can move stock in or out; logged for audit.
create or replace function public.move_stock(p_product_id uuid, p_type text, p_quantity int, p_dealer_id uuid, p_note text)
returns public.products language plpgsql security definer set search_path = public as $$
declare
  p public.products;
begin
  if not public.is_staff() then
    raise exception 'Not authorised';
  end if;
  if p_quantity = 0 then
    raise exception 'Quantity must not be zero';
  end if;
  update public.products set stock = stock + p_quantity where id = p_product_id and stock + p_quantity >= 0
    returning * into p;
  if not found then
    raise exception 'Not enough stock to move';
  end if;
  insert into public.stock_movements (product_id, type, quantity, dealer_id, note, created_by)
  values (p_product_id, p_type, p_quantity, p_dealer_id, p_note, auth.uid());
  return p;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.dealers enable row level security;
alter table public.orders enable row level security;
alter table public.pricing enable row level security;
alter table public.campaigns enable row level security;
alter table public.stock_movements enable row level security;
alter table public.settings enable row level security;
alter table public.wishlist enable row level security;

create policy "profiles: read own or staff" on public.profiles for select
  using (id = auth.uid() or public.is_staff());
create policy "profiles: update own or staff" on public.profiles for update
  using (id = auth.uid() or public.is_staff());
create policy "profiles: staff delete" on public.profiles for delete using (public.is_staff());

create policy "products: public catalog or staff" on public.products for select
  using ((is_public and is_active) or public.is_staff());
create policy "products: staff insert" on public.products for insert with check (public.is_staff());
create policy "products: staff update" on public.products for update using (public.is_staff());
create policy "products: staff delete" on public.products for delete using (public.is_staff());

create policy "dealers: staff all" on public.dealers for all using (public.is_staff()) with check (public.is_staff());

create policy "orders: read own or staff" on public.orders for select
  using (user_id = auth.uid() or public.is_staff());
create policy "orders: staff update" on public.orders for update using (public.is_staff());
create policy "orders: staff delete" on public.orders for delete using (public.is_staff());

create policy "pricing: read active or staff" on public.pricing for select
  using (status = 'active' or public.is_staff());
create policy "pricing: staff write" on public.pricing for insert with check (public.is_staff());
create policy "pricing: staff update" on public.pricing for update using (public.is_staff());
create policy "pricing: staff delete" on public.pricing for delete using (public.is_staff());

create policy "campaigns: staff all" on public.campaigns for all using (public.is_staff()) with check (public.is_staff());
create policy "stock_movements: staff read" on public.stock_movements for select using (public.is_staff());
create policy "settings: staff all" on public.settings for all using (public.is_staff()) with check (public.is_staff());

create policy "wishlist: own rows" on public.wishlist for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Realtime (admin panel listens for live changes, like the original Firestore listeners)
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table
  public.products, public.orders, public.dealers, public.profiles,
  public.pricing, public.campaigns, public.settings;

-- ---------------------------------------------------------------------------
-- Storage bucket for product images
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product images: public read" on storage.objects for select
  using (bucket_id = 'product-images');
create policy "product images: staff upload" on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_staff());
create policy "product images: staff update" on storage.objects for update
  using (bucket_id = 'product-images' and public.is_staff());
create policy "product images: staff delete" on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_staff());
