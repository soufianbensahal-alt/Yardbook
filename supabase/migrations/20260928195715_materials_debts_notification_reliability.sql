-- Private, owner-scoped compressed images. References remain in fleet_state.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('maintenance-materials','maintenance-materials',false,1500000,array['image/webp','image/jpeg'])
on conflict(id) do nothing;
create policy materials_owner_read on storage.objects for select to authenticated
using(bucket_id='maintenance-materials' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy materials_owner_insert on storage.objects for insert to authenticated
with check(bucket_id='maintenance-materials' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy materials_owner_delete on storage.objects for delete to authenticated
using(bucket_id='maintenance-materials' and (storage.foldername(name))[1]=(select auth.uid())::text);

alter table public.notification_subscriptions add column device_name text not null default 'Dispositivo',
add column platform text not null default 'Desconocida', add column active boolean not null default true,
add column updated_at timestamptz not null default now(),add column last_used_at timestamptz;
alter table public.notification_deliveries drop constraint notification_deliveries_status_check;
alter table public.notification_deliveries add constraint notification_deliveries_status_check check(status in ('pending','claimed','sent','failed','cancelled'));
alter table public.notification_deliveries add column attempts integer not null default 0,
add column next_attempt_at timestamptz,add column event_type text,add column title text,
add column updated_at timestamptz not null default now();
-- Preserve historical attempts and do not replay old failures.
update public.notification_deliveries set attempts=case when status='failed' then 3 else 1 end;
create table public.notification_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_id text not null references public.notification_deliveries(delivery_key),
  event_type text,scheduled_at timestamptz not null,attempted_at timestamptz not null,
  sent_at timestamptz,status text not null,error_message text,device_id uuid,attempt integer not null
);
alter table public.notification_logs enable row level security;
alter table public.notification_logs force row level security;
revoke all on public.notification_logs from public,anon,authenticated;
grant select on public.notification_logs to authenticated;
grant all on public.notification_logs to service_role;
grant usage,select on sequence public.notification_logs_id_seq to service_role;
create policy notification_logs_owner on public.notification_logs for select to authenticated using((select auth.uid())=user_id);
create index notification_logs_owner_time on public.notification_logs(user_id,attempted_at desc);

create function public.notification_log_attempt() returns trigger language plpgsql security definer set search_path='' as $$
begin
  new.updated_at=now();
  if new.status in ('sent','failed','cancelled') and new.status is distinct from old.status then
    insert into public.notification_logs(user_id,reminder_id,event_type,scheduled_at,attempted_at,sent_at,status,error_message,device_id,attempt)
    values(new.user_id,new.delivery_key,new.event_type,new.scheduled_at,new.claimed_at,new.notification_sent_at,new.status,new.error_code,new.device_id,new.attempts);
  end if;
  return new;
end; $$;
revoke all on function public.notification_log_attempt() from public,anon,authenticated;
create trigger notification_log_attempt before update on public.notification_deliveries for each row execute function public.notification_log_attempt();

create function public.notification_schedule(p_device uuid,p_event text,p_revision text,p_key text,p_scheduled timestamptz) returns boolean
language plpgsql security definer set search_path='' as $$
declare device public.notification_subscriptions; current_state jsonb; event jsonb;
begin
  select * into device from public.notification_subscriptions where id=p_device and active;
  if device.id is null or not public.notification_session_active(device.user_id,device.session_id) then return false; end if;
  select state into current_state from public.fleet_state where user_id=device.user_id;
  select item into event from jsonb_array_elements(coalesce(current_state->'events','[]')) item where item->>'id'=p_event limit 1;
  if event is null or event->>'revision' is distinct from p_revision or event->>'status' in ('completed','cancelled') then return false; end if;
  if current_state#>>'{adminSettings,notifications,enabled}' is distinct from 'true' or not coalesce((current_state#>'{adminSettings,notifications,categories}') ? (event->>'type'),false) then return false; end if;
  if p_scheduled>now()+interval '31 days' or p_scheduled<now()-interval '24 hours' then return false; end if;
  insert into public.notification_deliveries(delivery_key,user_id,device_id,event_id,revision,scheduled_at,status,event_type,title)
    values(p_key,device.user_id,device.id,p_event,p_revision,p_scheduled,'pending',event->>'type',left(event->>'title',160)) on conflict do nothing;
  return true;
end; $$;
revoke all on function public.notification_schedule(uuid,text,text,text,timestamptz) from public,anon,authenticated;
grant execute on function public.notification_schedule(uuid,text,text,text,timestamptz) to service_role;

create or replace function public.notification_claim(p_device uuid,p_event text,p_revision text,p_key text,p_scheduled timestamptz) returns boolean
language plpgsql security definer set search_path='' as $$
declare changed integer;
begin
  if p_scheduled>now() or not public.notification_schedule(p_device,p_event,p_revision,p_key,p_scheduled) then return false; end if;
  update public.notification_deliveries set status='claimed',attempts=attempts+1,claimed_at=now(),error_code=null
  where delivery_key=p_key and device_id=p_device and event_id=p_event and revision=p_revision and attempts<3
    and (status='pending' or (status='failed' and next_attempt_at<=now()) or (status='claimed' and claimed_at<now()-interval '5 minutes'));
  get diagnostics changed=row_count;
  return changed=1;
end; $$;

create or replace function public.notification_cancel_stale() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  update public.notification_deliveries d set status='cancelled'
  where d.user_id=new.user_id and d.status in ('pending','claimed','failed') and not exists(
    select 1 from jsonb_array_elements(coalesce(new.state->'events','[]')) e
    where e->>'id'=d.event_id and e->>'revision'=d.revision and coalesce(e->>'status','active')='active'
      and new.state#>>'{adminSettings,notifications,enabled}'='true'
      and coalesce((new.state#>'{adminSettings,notifications,categories}') ? (e->>'type'),false)
  );
  return new;
end; $$;

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
