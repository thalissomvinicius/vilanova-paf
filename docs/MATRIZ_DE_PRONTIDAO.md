# Matriz de prontidão do Sistema PAF

Atualizada em 20 de agosto de 2026. Esta matriz separa o que está validado no código do que ainda exige infraestrutura ou aparelho externo.

## Situação executiva

- Prontidão geral calculada no produto: **97%**.
- Aplicação e operação local: prontas para homologação controlada.
- Produção: Supabase conectado, migrations aplicadas, Edge Function publicada e jornada completa homologada.
- Android: APK de piloto gerado; instalação e uso em aparelho físico ainda precisam de aceite.

## Requisitos e evidências

| Área | Situação | Evidência principal |
| --- | --- | --- |
| Login administrativo | Validado localmente | `tests/e2e/pilot-smoke.spec.js` |
| Login de técnico/organização | Validado localmente | `tests/e2e/pilot-journey.spec.js` |
| Login de produtor | Validado localmente | `tests/e2e/pilot-journey.spec.js` |
| Cadastro de produtor e técnico | Validado pela interface | `tests/e2e/admin-crud.spec.js` |
| Criar, vincular, bloquear e excluir acesso | Validado pela interface | `tests/e2e/admin-crud.spec.js` |
| Organização com vários produtores | Implementado e coberto pelo modelo de acesso | `supabase/tests/paf_access_scope_test.sql` |
| Relatório do produtor e histórico | Validado de ponta a ponta | `tests/e2e/pilot-journey.spec.js` |
| Visita do técnico com GPS e foto | Validado de ponta a ponta | `tests/e2e/pilot-journey.spec.js` |
| Múltiplas visitas sem internet | Validado com fechamento e reabertura | `tests/e2e/offline-sync.spec.js` |
| Relatório sem internet | Validado com fechamento e reabertura | `tests/e2e/offline-sync.spec.js` |
| Múltiplos relatórios sem internet | Validado inclusive após limpar o formulário | `tests/e2e/offline-sync.spec.js` |
| Sincronização sem duplicidade | Validado com tentativas repetidas | `tests/e2e/offline-sync.spec.js` |
| Reabertura do PWA totalmente offline | Validado para técnico e produtor | `tests/pwa/offline-shell.spec.js` |
| Sessão offline com expiração | Validado em 72 horas | `tests/pwa/offline-shell.spec.js` |
| Dashboard, filtros e responsividade | Validado em quatro larguras | `tests/e2e/responsive-admin.spec.js` |
| Motorista, veículo e abastecimento | Validado pela interface e banco | `tests/e2e/fuel-workflow.spec.js` |
| Build, tipos e testes de unidade | Validado | `npm run check` |
| Dependências vulneráveis de alta severidade | Nenhuma encontrada | `npm run audit` |
| Isolamento de perfis e rotas proibidas | Validado no navegador e API | `tests/e2e/profile-boundaries.spec.js` |
| Revogação imediata de sessão bloqueada | Validada pela interface | `tests/e2e/admin-crud.spec.js` |
| Criação atômica de acesso e vínculo | Validada localmente e no PostgreSQL | `20260820101500_paf_atomic_access_creation.sql` |
| RLS, escopo e migrations Supabase | Validado em CI | `.github/workflows/ci.yml` e `supabase/tests/paf_access_scope_test.sql` |
| Atividade preventiva do Supabase Free | Implementada | Cron diário da Vercel em `/api/health` e `tests/deployment-config.test.mjs` |
| APK Android | Gerado e assinado para depuração | `releases/VilaNova-PAF-piloto-debug.apk` |
| Rotas públicas em produção | Validadas em desktop e celular | `/admin`, `/tecnico` e `/produtor`, sem overflow, erro de console ou API `5xx` |
| Supabase de produção | Validado | Projeto `paf-vna`, migrations atuais e Edge Function `paf-api` v5 |
| Jornada completa em produção | Validada e limpa | Admin, produtor, técnico, relatório, visita, GPS, foto, idempotência e isolamento de perfis |
| Teste em Android físico | Pendente | Requer aparelho conectado e roteiro de aceite |

## Critérios para liberar o primeiro piloto

1. Trocar a senha administrativa temporária no primeiro acesso.
2. Cadastrar um técnico e de três a cinco produtores reais para o piloto.
3. Executar o roteiro de aceite em um Android físico com 4G e modo avião.
4. Registrar o aceite da gestão e da equipe de campo.

## Limites conhecidos do piloto

- Um produtor usa uma propriedade principal; múltiplas propriedades ficam para a etapa posterior ao piloto.
- Exportações executivas em PDF/Excel e notificações automáticas ficam para a evolução após o aceite.
- A sessão offline contém apenas o último perfil autenticado e dados operacionais necessários; nenhum código de acesso é armazenado pelo cache da aplicação.
- A rotina diária reduz a chance de pausa por baixa atividade no Free, mas não constitui SLA nem substitui o plano Pro para operação crítica.
