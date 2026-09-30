-- Mobile clients use authenticated RLS; legacy dashboard tables are API-only.
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname='public'
    and (tablename like 'paf\_%' escape '\' or tablename like 'mobile\_%' escape '\')
  loop
    execute format('revoke all on table public.%I from anon',t.tablename);
    execute format('revoke truncate,references,trigger on table public.%I from authenticated',t.tablename);
  end loop;
end $$;
revoke all on table
  public.paf_producers, public.paf_technicians, public.paf_access_accounts,
  public.paf_access_account_producers, public.paf_auth_sessions,
  public.paf_login_attempts, public.paf_reports, public.paf_technical_visits,
  public.paf_operational_tasks, public.paf_documents, public.paf_fuel_drivers,
  public.paf_fuel_vehicles, public.paf_fuel_records, public.paf_import_batches,
  public.paf_audit_logs
from authenticated;
