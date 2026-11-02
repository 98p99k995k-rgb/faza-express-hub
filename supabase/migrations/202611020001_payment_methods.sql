create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  moyasar_token_id text not null unique,
  brand text not null check (brand in ('mada', 'visa', 'mastercard', 'other')),
  last_four text not null check (last_four ~ '^[0-9]{4}$'),
  cardholder_name text not null,
  exp_month smallint not null check (exp_month between 1 and 12),
  exp_year smallint not null check (exp_year between 2000 and 2200),
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists payment_methods_one_default_per_user
  on public.payment_methods (user_id)
  where is_default;

create index if not exists payment_methods_user_created_at
  on public.payment_methods (user_id, created_at desc);

alter table public.payment_methods enable row level security;
revoke all on public.payment_methods from anon, authenticated;
grant all on public.payment_methods to service_role;

create or replace function public.create_payment_method(
  p_user_id uuid,
  p_token_id text,
  p_brand text,
  p_last_four text,
  p_cardholder_name text,
  p_exp_month smallint,
  p_exp_year smallint
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_id uuid;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'service role required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));

  insert into public.payment_methods as current_method (
    user_id,
    moyasar_token_id,
    brand,
    last_four,
    cardholder_name,
    exp_month,
    exp_year,
    is_default
  )
  values (
    p_user_id,
    p_token_id,
    p_brand,
    p_last_four,
    p_cardholder_name,
    p_exp_month,
    p_exp_year,
    not exists (
      select 1
      from public.payment_methods
      where user_id = p_user_id
        and is_default
    )
  )
  on conflict (moyasar_token_id) do update
    set brand = excluded.brand,
        last_four = excluded.last_four,
        cardholder_name = excluded.cardholder_name,
        exp_month = excluded.exp_month,
        exp_year = excluded.exp_year
    where current_method.user_id = p_user_id
  returning id into new_id;

  if new_id is null then
    raise exception 'payment method belongs to another user';
  end if;

  return new_id;
end;
$$;

create or replace function public.set_default_payment_method(
  p_user_id uuid,
  p_method_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'service role required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));

  perform 1
  from public.payment_methods
  where id = p_method_id
    and user_id = p_user_id
  for update;

  if not found then
    raise exception 'payment method not found';
  end if;

  update public.payment_methods
  set is_default = false
  where user_id = p_user_id
    and is_default;

  update public.payment_methods
  set is_default = true
  where id = p_method_id
    and user_id = p_user_id;
end;
$$;

create or replace function public.delete_payment_method(
  p_user_id uuid,
  p_method_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  was_default boolean;
  replacement_id uuid;
begin
  if coalesce(current_setting('request.jwt.claim.role', true), '') <> 'service_role' then
    raise exception 'service role required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 0));

  delete from public.payment_methods
  where id = p_method_id
    and user_id = p_user_id
  returning payment_methods.is_default into was_default;

  if was_default is null then
    raise exception 'payment method not found';
  end if;

  if was_default then
    select id
    into replacement_id
    from public.payment_methods
    where user_id = p_user_id
    order by created_at asc
    limit 1
    for update;

    if replacement_id is not null then
      update public.payment_methods
      set is_default = true
      where id = replacement_id;
    end if;
  end if;
end;
$$;

revoke all on function public.create_payment_method(uuid, text, text, text, text, smallint, smallint) from public, anon, authenticated;
revoke all on function public.set_default_payment_method(uuid, uuid) from public, anon, authenticated;
revoke all on function public.delete_payment_method(uuid, uuid) from public, anon, authenticated;
grant execute on function public.create_payment_method(uuid, text, text, text, text, smallint, smallint) to service_role;
grant execute on function public.set_default_payment_method(uuid, uuid) to service_role;
grant execute on function public.delete_payment_method(uuid, uuid) to service_role;
