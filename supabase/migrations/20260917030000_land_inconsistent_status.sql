alter table public.paf_land_requests drop constraint paf_land_requests_status_check;
alter table public.paf_land_requests add constraint paf_land_requests_status_check
  check (status in ('EM_ANALISE','DADOS_INCONSISTENTES','AREA_REPROVADA','POSSIVEL_FINANCIAMENTO'));

create or replace function public.paf_land_review(p_id uuid, p_version integer, p_status text, p_comment text, p_actor text)
returns jsonb language plpgsql set search_path = public as $$
declare result public.paf_land_requests;
begin
  if p_status not in ('EM_ANALISE','DADOS_INCONSISTENTES','AREA_REPROVADA','POSSIVEL_FINANCIAMENTO')
    or length(trim(p_comment)) not between 10 and 2000 or length(trim(p_actor)) = 0 then
    raise exception 'Invalid review';
  end if;
  update paf_land_requests set status = p_status, comment = trim(p_comment), version = version + 1, updated_at = now()
    where id = p_id and version = p_version returning * into result;
  if not found then return null; end if;
  insert into paf_land_reviews(request_id, status, comment, actor) values(p_id, p_status, trim(p_comment), p_actor);
  return to_jsonb(result);
end;
$$;
revoke all on function public.paf_land_rate(text,integer,integer), public.paf_land_review(uuid,integer,text,text,text) from public, anon, authenticated;
grant execute on function public.paf_land_rate(text,integer,integer), public.paf_land_review(uuid,integer,text,text,text) to service_role;
