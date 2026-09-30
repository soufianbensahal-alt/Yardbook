-- YARDBOOK PROPOSAL: not applied. Fresh hosted Supabase project only.
-- Review README.md before use; never combine with the legacy migrations.

begin;

-- Managed auth/storage schemas and API roles come from Supabase itself.
-- Enabling extensions does not schedule any job or create any application secret.
create schema if not exists extensions;
-- No direct pgcrypto or uuid-ossp dependency remains in application SQL.
-- gen_random_uuid() is built into supported PostgreSQL versions.
-- CASCADE below installs only dependencies required by the Vault extension.
create extension if not exists supabase_vault cascade;
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

grant usage on schema public to authenticated, service_role;

commit;
