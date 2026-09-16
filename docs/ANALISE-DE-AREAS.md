# Solicitacoes publicas de analise de area

- Formulario e consulta: `/analise-de-area`.
- Gestao: `/admin/analises-areas`, restrita a administradores ativos, tanto do login legado quanto da identidade Supabase integrada.
- Dados: nome, CPF valido, nascimento, municipio, comunidade e telefone de contato opcional.
- Protocolo aleatorio de 96 bits, gerado pelo servidor, sem sequencia enumeravel. Consulta exige protocolo e CPF.
- Estados: EM_ANALISE, AREA_REPROVADA, POSSIVEL_FINANCIAMENTO. O ultimo nao significa aprovacao bancaria.
- Comentario de 10 a 2000 caracteres obrigatorio em toda alteracao. Visivel ao solicitante.
- Historico imutavel pela interface com autor, data e parecer. Controle de versao impede sobrescrita concorrente.
- Consulta publica retorna somente protocolo, situacao, datas e pareceres; nunca nome, CPF, nascimento, telefone ou identidade do analista.
- Atualizacao: lista administrativa a cada 30 segundos; consulta publica aberta e visivel a cada 60 segundos.
- Cadastros nao criam produtores automaticamente. A equipe faz a analise no sistema da instituicao financeira e registra o resultado no PAF.

## Persistencia e seguranca

Migracao `20260917010000_land_applications.sql`: tabelas com RLS e sem permissoes para anon/authenticated; somente a API com service_role pode operar. Funcoes de revisao e limite de tentativas tambem restritas a service_role. Limite persistente por IP anonimizado: 12 envios/hora e 120 consultas/hora. Corpo de requisicao limitado a 12 KB. Campos validados no servidor. Nenhum dado pessoal salvo em localStorage, URL ou cache publico.

Reenvio com o mesmo clientId e mesmos dados retorna o mesmo protocolo. Dados alterados com o mesmo clientId geram conflito. Recarregar a pagina inicia um novo envio; nao ha deduplicacao por CPF entre solicitacoes diferentes, pois uma pessoa pode solicitar analise de mais de uma area.

O protocolo deve ser salvo no comprovante. Recuperacao por identidade nao foi automatizada para evitar exposicao de dados; a equipe pode localizar o cadastro por CPF no painel. Antes de campanhas amplas, definir contato oficial para direitos/correcao e politica institucional de retencao. A protecao de volume atual e limite por IP; considerar CAPTCHA para campanhas de grande alcance.

Desenvolvimento local: `server/land-store.mjs`, SQLite em `data/land-requests.sqlite`, separado de producao. `npm run dev` inicia o servidor. Testes: `npm run test:land`, `npx playwright test tests/e2e/land-applications.spec.js`, SQL transacional em `supabase/tests/land_applications_test.sql` (rollback).
