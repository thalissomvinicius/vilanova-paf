-- Fresh installations need an organization before the historical dashboard binding.
insert into public.paf_organizacoes(slug,nome,nome_fantasia)
select 'vilanova-paf','Vila Nova Agroindustrial','PAF VNA'
where not exists(select 1 from public.paf_organizacoes);
