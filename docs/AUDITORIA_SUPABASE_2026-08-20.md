# Auditoria do Supabase PAF

Data: 20/08/2026

## Ambiente auditado

- Projeto: `paf-vna`
- Referência: `auisvfbloziehspzpnvg`
- Região: `sa-east-1`
- PostgreSQL: 17.6
- Edge Function: `paf-api`, versão 5, ativa
- Storage PAF: bucket privado `paf-documents`

## Resultado

O banco está operacional e o domínio PAF permanece isolado pelo prefixo
`paf_`. Todas as 15 tabelas PAF têm RLS ativo e não concedem acesso direto a
`anon` ou `authenticated`. O aplicativo usa a Edge Function com `service_role`,
mantida exclusivamente no servidor.

Foram preservados os 364 produtores e a conta administrativa ativa. Não foram
encontrados vínculos órfãos, constraints inválidas, índices inválidos, tokens
duplicados ou IDs de submissão duplicados.

## Correções aplicadas

Migration: `paf_database_security_hardening`

1. Removido `USAGE` de todas as sequências `paf_*` para `anon` e
   `authenticated`.
2. Mantido acesso às sequências somente para `service_role`.
3. Removido o acesso anônimo às funções legadas `current_profile_id()` e
   `is_admin()`.
4. Preservado o acesso autenticado dessas funções porque as policies do módulo
   legado dependem delas.
5. Fixado o `search_path` de `set_updated_at()` e bloqueada sua execução direta
   pelos papéis do navegador.
6. Criados índices para as FKs `forms.device_id` e `sync_logs.device_id`.
7. Removidas duas policies `SELECT` que duplicavam exatamente policies `ALL`.
8. Adicionados 12 testes pgTAP para privilégios, funções, sequências e RLS.

## Verificações após a migration

- Produtores: 364
- Administradores ativos: 1
- Vínculos órfãos: 0
- Tabelas PAF sem RLS: 0
- Grants PAF para papéis do navegador: 0
- Grants de sequências PAF para papéis do navegador: 0
- Bucket PAF público: não
- Objetos PAF no Storage: 0
- API de saúde em produção: HTTP 200
- Auditoria npm: 0 vulnerabilidades

## Avisos mantidos intencionalmente

O Security Advisor ainda informa que `current_profile_id()` e `is_admin()` são
funções `SECURITY DEFINER` executáveis por `authenticated`. Isso é necessário
para as policies RLS do módulo legado, que possui dados reais no mesmo projeto.
O papel `anon` não pode mais executá-las.

Os avisos `rls_enabled_no_policy` das tabelas PAF também são intencionais. Sem
policies e sem grants para os papéis do navegador, o comportamento é negar todo
o acesso direto; somente a Edge Function acessa essas tabelas.

Os índices marcados como não utilizados foram mantidos. As tabelas operacionais
ainda estão vazias e a ausência de uso neste momento não comprova que os índices
sejam desnecessários para o piloto.

Referências:

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/functions

## Qualidade dos dados importados

A auditoria identificou sete grupos com CPF repetido, três CPFs com quantidade
de dígitos diferente de 11 e 364 produtores sem comunidade informada. Esses
registros vieram da planilha de origem e não foram alterados automaticamente,
pois exigem conferência administrativa para evitar excluir ou fundir produtores
reais incorretamente.

## Continuidade no plano Free

O cron diário da Vercel chama `/api/health` às `09:17 UTC`. A rota executa uma
consulta real e somente leitura em `paf_producers`, mantendo atividade sem criar
registros artificiais. O mecanismo reduz o risco de pausa por inatividade, mas
não substitui a garantia de disponibilidade de um plano pago.
