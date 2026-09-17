create function public.paf_land_delete(p_id uuid, p_version integer, p_protocol text)
returns boolean language plpgsql set search_path = public as $$
begin
  perform 1 from paf_land_requests where id = p_id and version = p_version and protocol = p_protocol for update;
  if not found then return false; end if;
  delete from paf_land_reviews where request_id = p_id;
  delete from paf_land_requests where id = p_id;
  return true;
end;
$$;
revoke all on function public.paf_land_delete(uuid,integer,text) from public, anon, authenticated;
grant execute on function public.paf_land_delete(uuid,integer,text) to service_role;
