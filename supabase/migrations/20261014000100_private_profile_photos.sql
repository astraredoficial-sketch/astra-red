update storage.buckets
set public = false
where id = 'profile-photos';

drop policy if exists "Authenticated users can view profile photos"
  on storage.objects;
drop policy if exists "Users can upload their own profile photos"
  on storage.objects;
drop policy if exists "Users can update their own profile photos"
  on storage.objects;
