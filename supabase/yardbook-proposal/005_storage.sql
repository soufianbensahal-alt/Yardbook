-- YARDBOOK PROPOSAL: not applied. Fresh hosted Supabase project only.
-- Review README.md before use; never combine with the legacy migrations.

begin;

-- Private, owner-scoped compressed images. References remain in fleet_state.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('maintenance-materials','maintenance-materials',false,1500000,array['image/webp','image/jpeg']);
create policy materials_owner_read on storage.objects for select to authenticated
using(bucket_id='maintenance-materials' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy materials_owner_insert on storage.objects for insert to authenticated
with check(bucket_id='maintenance-materials' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy materials_owner_delete on storage.objects for delete to authenticated
using(bucket_id='maintenance-materials' and (storage.foldername(name))[1]=(select auth.uid())::text);


insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values
 ('maintenance-files','maintenance-files',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']),
 ('rental-documents','rental-documents',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']);

create policy "maintenance_files_storage_select" on storage.objects for select to authenticated using (bucket_id='maintenance-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "maintenance_files_storage_insert" on storage.objects for insert to authenticated with check (bucket_id='maintenance-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "maintenance_files_storage_update" on storage.objects for update to authenticated using (bucket_id='maintenance-files' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='maintenance-files' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "maintenance_files_storage_delete" on storage.objects for delete to authenticated using (bucket_id='maintenance-files' and (storage.foldername(name))[1]=(select auth.uid())::text);

create policy "rental_documents_storage_select" on storage.objects for select to authenticated using (bucket_id='rental-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "rental_documents_storage_insert" on storage.objects for insert to authenticated with check (bucket_id='rental-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "rental_documents_storage_update" on storage.objects for update to authenticated using (bucket_id='rental-documents' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='rental-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "rental_documents_storage_delete" on storage.objects for delete to authenticated using (bucket_id='rental-documents' and (storage.foldername(name))[1]=(select auth.uid())::text);

commit;
