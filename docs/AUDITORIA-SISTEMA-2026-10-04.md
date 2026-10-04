# Auditoria PAF VNA - 4 de outubro de 2026

## Escopo e critérios

Dashboard React, quatro acessos web, formulário público, API Supabase,
permissões do banco compartilhado e código/aplicação web do aplicativo.
Auditoria baseada em leitura de código, testes automatizados, screenshots,
advisors do Supabase e verificações HTTP. Não equivale a um pentest independente,
teste de carga ou homologação física Android em campo.

## Problemas encontrados e corrigidos

| Prioridade | Problema comprovado | Correção |
| --- | --- | --- |
| Alta | Coordenador podia alterar acessos pelo RPC/trigger e emitir/redefinir credenciais, contrariando o alcance definido | Gestão de identidades restrita a admin/super_admin em tela, funções e banco; consulta da organização preservada |
| Alta | Admin podia criar outro admin; senha inicial pendente não era checada nas funções de gestão | Hierarquia única, organização obrigatória, perfil ativo e troca de senha concluída |
| Alta | Requisição aguardava indefinidamente corpo da resposta ou preparação da sessão; sinal externo desativava timeout | Prazo total, cancelamento combinado e erros recuperáveis, sem repetir gravações automaticamente |
| Alta | Resposta HTML/JSON inválida com HTTP 200 virava objeto vazio e podia parecer sucesso | Validação da resposta e do resultado da autenticação antes de abrir o ambiente |
| Alta | Rotas legadas da API não limitavam JSON como o servidor local | Leitura incremental com teto de 10 MiB e prazo de 15 s; análises mantêm 12 KB e operações 16 KB; HTTP 413/408 |
| Média | Leituras legadas pediam 9.999 registros em uma consulta sujeita ao limite do Supabase | Paginação de 500 registros, ordenação determinística e falha explícita em página incompleta |
| Média | Falha ao consultar sessão parecia logout normal | Tela de recuperação com nova tentativa, sem conceder acesso por falha de rede |
| Média | Falha de renderização/importação podia deixar tela vazia | Error boundary com recuperação; nenhum dado privado é incluído no erro exibido |
| Média | Carregamento de operações sem estrutura; requisições continuavam após troca de tela | Skeleton de linhas, cancelamento e preservação dos últimos dados ao atualizar; retry nos módulos principais |
| Média | Login com fotografia inadequada e sem confirmação de acesso | Marca oficial PAF, composição sem fotografia, campos vazios, confirmação após validação e senha limpa antes da entrada |
| Média | Nove chaves estrangeiras sem índice | Índices aplicados sem alterar registros |
| Baixa | Service worker guardava fotos desnecessárias e devolvia HTML quando um asset faltava offline | Cache v5, fotos fora do precache e fallback de página restrito a navegações |
| Baixa | Teste Android fixava versão antiga 1.10.4 | Verifica preservação da versão/versionCode configurados, sem mascarar identidade do pacote |

## Visual e acessibilidade

- Quatro logins com a mesma composição e controles, mantendo um único link de produtor no acesso administrativo.
- Marca oficial em bitmap, sem recriar ou remover seu fundo; fotografia removida do painel web.
- Entradas/confirmacão de 180 ms e opção de movimento reduzido respeitada, inclusive sem espera artificial no login.
- Formulário anterior fica oculto durante a confirmação para evitar sobreposição de textos.
- Inputs com fonte mínima de 16 px, foco visível e ações principais de 44/56 px.
- Verificação de login em 320, 390, 768, 1024, 1366 e 1920 px, incluindo telas baixas de notebook.
- Navegação lateral, onze áreas do dashboard, tabelas, formulários e modais verificados em desktop/tablet/mobile.
- Indicadores e controles de analista/técnico em Análise de áreas preservados e novamente testados.

## Evidências executadas

| Verificação | Resultado |
| --- | --- |
| `npm run check` no painel | 53 testes de unidade/contrato/Edge, typecheck e build aprovados |
| `npx playwright test` em SQLite isolado | 64 aprovados, sem skips na rodada final |
| Rechecagem final de login/sucesso/layout | 13 aprovados |
| `npm run test:pwa` | 3 aprovados: técnico, produtor e expiração offline |
| `npm test` no aplicativo | 73 aprovados em 21 arquivos |
| `npx tsc --noEmit` no aplicativo | Aprovado |
| `npm run build:web` no aplicativo | Aprovado |
| Auditoria do login do app | Cinco viewports, teclado, revelação de senha e envio alcançável aprovados |
| `npm run audit:ui` no app | Layout, primeiro acesso, fronteiras administrativas e gestão de produtores aprovados com respostas simuladas |
| Deno check das funções de criação/reset | Aprovado |
| `npm audit` no painel | Zero vulnerabilidades reportadas |
| Consulta REST anônima a solicitações, analistas, sessões, produtores e perfis | Negada, HTTP 401; nenhum registro retornado |
| Banco antes/depois da migração | 8 solicitações e 7 perfis, sem mudanças nesses totais |
| RPC administrativo anônimo | EXECUTE não concedido |

Uma rodada anterior apresentou ECONNRESET no logout de um teste local; a
rechecagem de 17 testes passou e a rodada completa seguinte passou 64/64.
Não foi suprimida a falha nem adicionada repetição automática de gravações.
Screenshots ficam em `verification/`; os do app em `paf-app/artifacts/`.
Os testes de escrita usaram SQLite temporário ou respostas simuladas,
não cadastros reais do Supabase.

## Banco e serviços

- Projeto compartilhado: `eeivxgbbslnojbbpzweb`.
- Migração aplicada e registrada: `20261004030501_access_admin_only_audit`, mantida no repositório do app.
- `paf_manage_access` e o trigger continuam com escopo de organização, bloqueio de autoedição e controle de concorrência.
- Funções `create-paf-user`, `reset-paf-user-password` e `paf-api` publicadas pelo CLI.
- Os nove avisos de índices ausentes desapareceram dos advisors.
- Mantidos 23 INFO de RLS sem policy em tabelas exclusivas de servidor: não foram abertas policies públicas para silenciar avisos.
- Mantido o WARN do RPC SECURITY DEFINER: o cliente precisa executá-lo, mas suas permissões internas foram restringidas e anon continua bloqueado.
- Os 96 INFO de índices não usados não justificam apagá-los em uma base com pouco tráfego.
- As correções de autorização são de servidor e valem para o APK já instalado; não foi gerado outro APK nesta entrega.

## Pendências reais

1. **Dependências do Expo:** `npm audit` reporta 16 entradas altas derivadas de duas falhas, em `braces@3.0.3` e `node-forge@1.4.0`. As fontes oficiais não indicam versão corrigida. Estão na cadeia de ferramentas Metro/CLI/certificados; não declarar resolvido ou risco zero. Não expor Metro na internet, aceitar certificados/padrões não confiáveis ou usar `audit fix --force`, que sugere downgrade incompatível para Expo 44. Reavaliar quando houver patch compatível.
2. **Proteção contra senhas vazadas:** permanece desativada; a documentação do Supabase a limita a Pro ou superior. Nenhum plano pago foi contratado.
3. **Homologação física:** validar Android real, câmera, GPS, reinício offline, reconexão e concorrência de 7-8 técnicos com equipe de campo. Browser/fixtures não substituem esses testes.
4. **Operação institucional:** definir assinatura oficial do APK, política de retenção e criptografia dos dados locais, contato/responsável de privacidade, rotina de backup/restauração e acompanhamento de incidentes. Não presumir decisões da empresa.
5. **Escala:** leituras legadas não truncam mais a base, mas ainda montam listas completas para compatibilidade. Antes de crescimento significativo, migrar os módulos restantes para filtros/paginação e agregação no servidor; executar teste de carga em homologação.

## Referências primárias

- [Advisory braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm).
- [Advisory node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv).
- [Segurança de senhas no Supabase](https://supabase.com/docs/guides/auth/password-security).

Endereço de entrega: https://vilanova-paf.vercel.app.
A conferência temporária de publicação está agendada para 09:00, com silêncio
se estiver estável e pausa automática após a conferência bem-sucedida.
