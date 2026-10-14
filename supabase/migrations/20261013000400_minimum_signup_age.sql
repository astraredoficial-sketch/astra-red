create or replace function public.enforce_astrared_minimum_signup_age()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  submitted_birth_date date;
begin
  if coalesce(new.raw_user_meta_data ->> 'birth_date', '') !~ '^\d{4}-\d{2}-\d{2}$' then
    raise exception using
      errcode = '22023',
      message = 'AstraRed requiere una fecha de nacimiento y es solo para mayores de edad.';
  end if;

  begin
    submitted_birth_date := (new.raw_user_meta_data ->> 'birth_date')::date;
  exception
    when invalid_datetime_format or datetime_field_overflow then
      raise exception using
        errcode = '22023',
        message = 'AstraRed requiere una fecha válida para crear una cuenta.';
  end;

  if current_date < (submitted_birth_date + interval '18 years')::date then
    raise exception using
      errcode = '22023',
      message = 'AstraRed es solo para personas mayores de 18 años.';
  end if;

  return new;
end;
$function$;

revoke all on function public.enforce_astrared_minimum_signup_age() from public, anon, authenticated;

drop trigger if exists enforce_astrared_minimum_signup_age on auth.users;

create trigger enforce_astrared_minimum_signup_age
  before insert on auth.users
  for each row
  execute function public.enforce_astrared_minimum_signup_age();
