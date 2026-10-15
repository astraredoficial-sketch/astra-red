update public.profiles
set chart = chart - 'julianDay'
where chart ? 'julianDay';
