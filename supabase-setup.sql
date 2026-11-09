-- CLICKLER PHOTOBOOTH: run once in Supabase SQL Editor.
-- Creates a PUBLIC storage bucket for finished photobooth photos.
-- Public links can be opened by anyone who has the QR/link.

insert into storage.buckets (id, name, public)
values ('booth-photos', 'booth-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "CLICKLER allow booth uploads" on storage.objects;
create policy "CLICKLER allow booth uploads"
on storage.objects for insert
to anon
with check (bucket_id = 'booth-photos');

-- Public read is required so guests can open the QR link without signing in.
drop policy if exists "CLICKLER public photo reads" on storage.objects;
create policy "CLICKLER public photo reads"
on storage.objects for select
to anon
using (bucket_id = 'booth-photos');
