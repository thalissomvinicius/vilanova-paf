# Matriz de prontidão do Sistema PAF

Atualizada em 20 de agosto de 2026. Esta matriz separa o que está validado no código do que ainda exige infraestrutura ou aparelho externo.

## Situação executiva

- Prontidão geral calculada no produto: **86%**.
- Aplicação e operação local: prontas para homologação controlada.
- Produção: bloqueada até existir um projeto Supabase exclusivo do PAF.
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
| Sincronização sem duplicidade | Validado com tentativas repetidas | `tests/e2e/offline-sync.spec.js` |
| Reabertura do PWA totalmente offline | Validado para técnico e produtor | `tests/pwa/offline-shell.spec.js` |
| Sessão offline com expiração | Validado em 72 horas | `tests/pwa/offline-shell.spec.js` |
| Dashboard, filtros e responsividade | Validado em quatro larguras | `tests/e2e/responsive-admin.spec.js` |
| Motorista, veículo e abastecimento | Validado pela interface e banco | `tests/e2e/fuel-workflow.spec.js` |
| Build, tipos e testes de unidade | Validado | `npm run check` |
| Dependências vulneráveis de alta severidade | Nenhuma encontrada | `npm run audit` |
| RLS, escopo e migrations Supabase | Preparado para CI | `.github/workflows/ci.yml` e `supabase/tests/paf_access_scope_test.sql` |
| Atividade preventiva do Supabase Free | Implementada | Cron diário da Vercel em `/api/health` e `tests/deployment-config.test.mjs` |
| APK Android | Gerado e assinado para depuração | `releases/VilaNova-PAF-piloto-debug.apk` |
| Supabase de produção | Bloqueado | Projeto exclusivo ainda não criado/vinculado |
| Teste em Android físico | Pendente | Requer aparelho conectado e roteiro de aceite |

## Critérios para liberar o primeiro piloto

1. Criar e vincular o projeto Supabase exclusivo do PAF.
2. Aplicar migrations, publicar a Edge Function e criar o administrador definitivo.
3. Configurar Vercel e APK para o novo backend e validar `/api/health`.
4. Cadastrar um técnico e de três a cinco produtores reais de teste.
5. Executar o roteiro de aceite em um Android físico com 4G e modo avião.
6. Registrar o aceite da gestão e da equipe de campo.

## Limites conhecidos do piloto

- Um produtor usa uma propriedade principal; múltiplas propriedades ficam para a etapa posterior ao piloto.
- Exportações executivas em PDF/Excel e notificações automáticas ficam para a evolução após o aceite.
- A sessão offline contém apenas o último perfil autenticado e dados operacionais necessários; nenhum código de acesso é armazenado pelo cache da aplicação.
- A rotina diária reduz a chance de pausa por baixa atividade no Free, mas não constitui SLA nem substitui o plano Pro para operação crítica.
