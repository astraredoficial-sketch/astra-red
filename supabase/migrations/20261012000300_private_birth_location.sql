update public.profiles
set location_country = '',
    location_city = '',
    city_id = ''
where location_country <> ''
   or location_city <> ''
   or city_id <> '';

revoke select (location_country, location_city, city_id)
  on public.profiles
  from authenticated;

revoke insert (location_country, location_city, city_id)
  on public.profiles
  from authenticated;

revoke update (location_country, location_city, city_id)
  on public.profiles
  from authenticated;
