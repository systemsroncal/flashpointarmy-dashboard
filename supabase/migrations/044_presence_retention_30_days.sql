-- Extend dashboard presence retention from 7 to 30 UTC calendar days (including today).

create or replace function public.dashboard_presence_cleanup_old()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff date := (timezone('utc', now()))::date - 29;
  deleted integer;
begin
  delete from public.dashboard_presence_daily
  where day_utc < cutoff;
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;
