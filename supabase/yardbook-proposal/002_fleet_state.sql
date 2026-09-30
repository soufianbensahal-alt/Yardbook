-- YARDBOOK PROPOSAL: not applied. Fresh hosted Supabase project only.
-- Review README.md before use; never combine with the legacy migrations.

begin;

create table public.fleet_state (
  id text primary key,
  user_id uuid,
  state jsonb not null,
  updated_at timestamptz not null default now()
);


create unique index fleet_state_user_id_key
  on public.fleet_state (user_id);

create index fleet_state_user_id_updated_at_idx
  on public.fleet_state (user_id, updated_at desc);

alter table public.fleet_state enable row level security;
alter table public.fleet_state force row level security;

revoke all on table public.fleet_state from public, anon, authenticated;
grant select, insert, update, delete on table public.fleet_state to authenticated;


create policy "fleet_state_authenticated_select"
on public.fleet_state
for select
to authenticated
using (auth.uid() = user_id);

create policy "fleet_state_authenticated_insert"
on public.fleet_state
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "fleet_state_authenticated_update"
on public.fleet_state
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "fleet_state_authenticated_delete"
on public.fleet_state
for delete
to authenticated
using (auth.uid() = user_id);

grant select, insert, update, delete on public.fleet_state to service_role;

-- Debt ledgers use the existing owner-isolated state. Validate them transactionally
-- so stale clients cannot erase payment history or replace the original principal.
create function public.fleet_validate_debts() returns trigger language plpgsql set search_path='' as $$
declare d jsonb;p jsonb;previous jsonb;paid numeric;
begin
  if tg_op='UPDATE' then
    if not (new.state ? 'debts') and old.state ? 'debts' then new.state=jsonb_set(new.state,'{debts}',old.state->'debts');end if;
    if not (new.state ? 'debtPayments') and old.state ? 'debtPayments' then new.state=jsonb_set(new.state,'{debtPayments}',old.state->'debtPayments');end if;
    for previous in select value from jsonb_array_elements(coalesce(old.state->'debtPayments','[]')) loop
      if not exists(select 1 from jsonb_array_elements(coalesce(new.state->'debtPayments','[]')) n where n=previous) then raise exception 'Debt payment history is immutable';end if;
    end loop;
    for previous in select value from jsonb_array_elements(coalesce(old.state->'debts','[]')) loop
      if not exists(select 1 from jsonb_array_elements(coalesce(new.state->'debts','[]')) n where n->>'id'=previous->>'id' and n->>'originalAmount'=previous->>'originalAmount' and n->>'customerId'=previous->>'customerId') then raise exception 'Debt principal and ownership must be preserved';end if;
    end loop;
  end if;
  if (select count(*)<>count(distinct x->>'id') from jsonb_array_elements(coalesce(new.state->'debts','[]')) x)
    or (select count(*)<>count(distinct x->>'id') from jsonb_array_elements(coalesce(new.state->'debtPayments','[]')) x) then raise exception 'Duplicate debt ledger ID';end if;
  for d in select value from jsonb_array_elements(coalesce(new.state->'debts','[]')) loop
    if coalesce((d->>'originalAmount')::numeric,0)<=0 then raise exception 'Invalid debt amount';end if;
    select coalesce(sum((x->>'amount')::numeric),0) into paid from jsonb_array_elements(coalesce(new.state->'debtPayments','[]')) x where x->>'debtId'=d->>'id';
    if round(paid,2)>round((d->>'originalAmount')::numeric,2) then raise exception 'Debt overpayment';end if;
  end loop;
  for p in select value from jsonb_array_elements(coalesce(new.state->'debtPayments','[]')) loop
    if coalesce((p->>'amount')::numeric,0)<=0 or not exists(select 1 from jsonb_array_elements(coalesce(new.state->'debts','[]')) x where x->>'id'=p->>'debtId' and x->>'customerId'=p->>'customerId') then raise exception 'Invalid debt payment';end if;
  end loop;
  return new;
end; $$;
revoke all on function public.fleet_validate_debts() from public,anon,authenticated;
create trigger fleet_validate_debts before insert or update of state on public.fleet_state for each row execute function public.fleet_validate_debts();

commit;
