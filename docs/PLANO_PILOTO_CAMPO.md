# Plano do primeiro piloto em campo

## Objetivo

Validar o fluxo completo com um grupo pequeno: a gestão cria os acessos e vínculos, o técnico registra visitas, o produtor envia relatórios e a equipe acompanha os dados no painel.

## Prontidão atual

**84% para o primeiro piloto em campo.**

| Etapa | Progresso | Situação |
| --- | ---: | --- |
| Núcleo e cadastros | 98% | Pronto |
| Dashboard e gestão | 95% | Pronto |
| Operação de campo | 93% | Pronto |
| Integração remota | 45% | Pendente de projeto Supabase PAF |
| Qualidade do piloto | 88% | Automatizado; falta teste em aparelho real |

## O que já está disponível

- Login separado para administração, técnico/organização e produtor.
- Cadastro e edição de produtores, técnicos, veículos e motoristas.
- Criação, bloqueio, edição, redefinição e exclusão de acessos.
- Vínculo de um técnico ou organização com vários produtores.
- Relatórios do produtor com histórico e retorno da equipe.
- Visitas cadastradas pelo técnico com propriedade, comunidade, GPS, fotos, histórico e status.
- Pendências, documentos e controle de abastecimento.
- Dashboard administrativo com indicadores e filtros.
- Rascunho local e fila de sincronização dos relatórios e visitas quando a internet falhar.
- Reenvio idempotente, sem duplicar registros depois da reconexão.
- Instalação como PWA e APK Android de piloto assinado para depuração.
- Testes automatizados do banco, Edge Function, rotas e responsividade.

## Bloqueadores antes do piloto

1. Criar um projeto Supabase exclusivo para o PAF. O hostname antigo (`auisvfbloziehspzpnvg`) não resolve e o conector só mostra projetos de outros sistemas.
2. Aplicar todas as migrations de `supabase/migrations/` e publicar a função `paf-api` nesse projeto.
3. Criar um administrador definitivo e trocar qualquer senha temporária.
4. Criar dados controlados para o piloto: 1 técnico, 3 a 5 produtores e seus acessos.
5. Executar o roteiro abaixo em um celular Android real usando 4G e modo avião.

## Roteiro de aceite

- Gestão entra em `/admin`, cadastra técnico e produtores e cria os acessos.
- Técnico entra em `/tecnico`, encontra apenas produtores vinculados e registra uma visita.
- Técnico começa uma visita sem internet, recarrega a tela e confirma que o rascunho permanece.
- Produtor entra em `/produtor`, envia um relatório e acompanha o registro no histórico.
- Produtor começa um relatório sem internet, recarrega a tela e confirma que o rascunho permanece.
- Gestão recebe visita e relatório, filtra os registros e atualiza seus status.
- Gestão bloqueia um acesso e confirma que ele não entra novamente.
- Nenhum perfil consegue visualizar produtores fora do seu vínculo.

## Próxima evolução depois do piloto

- Suporte a várias propriedades para o mesmo produtor; o piloto usa a propriedade principal.
- Exportação executiva em PDF/Excel e indicadores por período, técnico e região.
- Notificações de prazo, visita e devolução de relatório.
