-- YARDBOOK PROPOSAL: not applied. Fresh hosted Supabase project only.
-- Review README.md before use; never combine with the legacy migrations.

begin;

-- No secrets, URLs or VAPID keys are created by this migration.
-- Server-only access to notification configuration. Private values never reach the browser.
create function public.notification_server_config() returns jsonb
language sql security definer set search_path='' as $$
  select coalesce(jsonb_object_agg(upper(replace(name,'yardbook_','')),decrypted_secret),'{}'::jsonb)
  from vault.decrypted_secrets where name in ('yardbook_app_origin','yardbook_vapid_subject','yardbook_vapid_public_key','yardbook_vapid_private_key','yardbook_notification_cron_secret');
$$;
revoke all on function public.notification_server_config() from public,anon,authenticated;
grant execute on function public.notification_server_config() to service_role;

create function public.notification_initialize_vapid(public_key text,private_key text) returns jsonb
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtext('yardbook_notification_vapid'));
  if not exists(select 1 from vault.secrets where name='yardbook_vapid_private_key') then
    perform vault.create_secret(public_key,'yardbook_vapid_public_key');
    perform vault.create_secret(private_key,'yardbook_vapid_private_key');
  end if;
  return public.notification_server_config();
end;
$$;
revoke all on function public.notification_initialize_vapid(text,text) from public,anon,authenticated;
grant execute on function public.notification_initialize_vapid(text,text) to service_role;

commit;
