alter function public.paf_set_updated_at() set search_path = '';

create index if not exists paf_access_accounts_technician_idx
  on public.paf_access_accounts (technician_id);

create index if not exists paf_auth_sessions_access_account_idx
  on public.paf_auth_sessions (access_account_id);

create index if not exists paf_documents_report_idx
  on public.paf_documents (report_id);

create index if not exists paf_documents_visit_idx
  on public.paf_documents (visit_id);

create index if not exists paf_documents_task_idx
  on public.paf_documents (task_id);

create index if not exists paf_tasks_report_idx
  on public.paf_operational_tasks (report_id);

create index if not exists paf_tasks_visit_idx
  on public.paf_operational_tasks (visit_id);

create index if not exists paf_reports_submitted_by_idx
  on public.paf_reports (submitted_by_access_id);

create index if not exists paf_visits_created_by_idx
  on public.paf_technical_visits (created_by_access_id);

create index if not exists paf_visits_report_idx
  on public.paf_technical_visits (report_id);
