alter table public.paf_land_requests add column reviewer_name text;
alter table public.paf_land_reviews add column reviewer_name text;

create function public.paf_land_review(p_id uuid, p_version integer, p_status text, p_comment text, p_actor text, p_reviewer_name text)
returns jsonb language plpgsql set search_path = public as $$
declare result public.paf_land_requests;
begin
  if p_status is null or p_status not in ('EM_ANALISE','DADOS_INCONSISTENTES','AREA_REPROVADA','POSSIVEL_FINANCIAMENTO')
    or p_comment is null or length(trim(p_comment)) not between 10 and 2000
    or p_actor is null or length(trim(p_actor)) = 0
    or p_reviewer_name is null or length(trim(p_reviewer_name)) not between 3 and 160 then
    raise exception 'Invalid review';
  end if;
  update paf_land_requests set status = p_status, comment = trim(p_comment), reviewer_name = trim(p_reviewer_name), version = version + 1, updated_at = now()
    where id = p_id and version = p_version returning * into result;
  if not found then return null; end if;
  insert into paf_land_reviews(request_id, status, comment, actor, reviewer_name)
    values(p_id, p_status, trim(p_comment), p_actor, trim(p_reviewer_name));
  return to_jsonb(result);
end;
$$;
revoke all on function public.paf_land_review(uuid,integer,text,text,text,text) from public, anon, authenticated;
grant execute on function public.paf_land_review(uuid,integer,text,text,text,text) to service_role;
