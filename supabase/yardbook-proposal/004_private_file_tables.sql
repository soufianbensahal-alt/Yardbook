-- YARDBOOK PROPOSAL: not applied. Fresh hosted Supabase project only.
-- Review README.md before use; never combine with the legacy migrations.

begin;

create table public.maintenance_files (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  maintenance_id text not null,
  vehicle_id text not null,
  file_name text not null,
  storage_path text not null unique,
  thumbnail_path text,
  mime_type text not null,
  file_size bigint not null check (file_size >= 0 and file_size <= 10485760),
  file_type text not null check (file_type in ('image','pdf')),
  created_at timestamptz not null default now()
);
create table public.rental_documents (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  rental_id text not null,
  vehicle_id text not null,
  customer_id text not null,
  document_type text not null check (document_type in ('signed_contract','delivery_document','return_document','other')),
  file_name text not null,
  storage_path text not null unique,
  thumbnail_path text,
  mime_type text not null,
  file_size bigint not null check (file_size >= 0 and file_size <= 10485760),
  created_at timestamptz not null default now()
);
create index maintenance_files_user_id_idx on public.maintenance_files(user_id);
create index maintenance_files_record_idx on public.maintenance_files(user_id,maintenance_id);
create index rental_documents_user_id_idx on public.rental_documents(user_id);
create index rental_documents_record_idx on public.rental_documents(user_id,rental_id);

alter table public.maintenance_files enable row level security;
alter table public.maintenance_files force row level security;
alter table public.rental_documents enable row level security;
alter table public.rental_documents force row level security;
revoke all on public.maintenance_files, public.rental_documents from public, anon, authenticated;
grant select, insert, update, delete on public.maintenance_files, public.rental_documents to authenticated;

create policy "maintenance_files_owner_select" on public.maintenance_files for select to authenticated using ((select auth.uid()) = user_id);
create policy "maintenance_files_owner_insert" on public.maintenance_files for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "maintenance_files_owner_update" on public.maintenance_files for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "maintenance_files_owner_delete" on public.maintenance_files for delete to authenticated using ((select auth.uid()) = user_id);

create policy "rental_documents_owner_select" on public.rental_documents for select to authenticated using ((select auth.uid()) = user_id);
create policy "rental_documents_owner_insert" on public.rental_documents for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "rental_documents_owner_update" on public.rental_documents for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "rental_documents_owner_delete" on public.rental_documents for delete to authenticated using ((select auth.uid()) = user_id);


grant select, insert, update, delete on public.maintenance_files, public.rental_documents to service_role;

commit;
