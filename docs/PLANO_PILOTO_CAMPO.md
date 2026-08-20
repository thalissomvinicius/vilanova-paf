# Plano do primeiro piloto em campo

## Objetivo

Validar o fluxo completo com um grupo pequeno: a gestão cria os acessos e vínculos, o técnico registra visitas, o produtor envia relatórios e a equipe acompanha os dados no painel.

## Prontidão atual

**100% de prontidão técnica para iniciar o primeiro piloto em campo.**

| Etapa | Progresso | Situação |
| --- | ---: | --- |
| Núcleo e cadastros | 100% | Validado |
| Dashboard e gestão | 100% | Validado |
| Operação de campo | 100% | Validado |
| Integração remota | 100% | Supabase migrado, função publicada e jornada homologada em produção |
| Qualidade do piloto | 100% | APK instalado no Android, perfis, GPS, sessões e jornadas offline aprovados |

## O que já está disponível

- Login separado para administração, técnico/organização e produtor.
- Cadastro e edição de produtores, técnicos, veículos e motoristas.
- Criação, bloqueio, edição, redefinição e exclusão de acessos.
- Vínculo de um técnico ou organização com vários produtores.
- Relatórios do produtor com histórico e retorno da equipe.
- Visitas cadastradas pelo técnico com propriedade, comunidade, GPS, fotos, histórico e status.
- Pendências, documentos e controle de abastecimento.
- Dashboard administrativo com indicadores e filtros.
- Rascunho local e filas com múltiplas visitas ou relatórios pendentes quando a internet falhar.
- Reenvio idempotente, sem duplicar registros depois da reconexão.
- Isolamento testado entre administrador, técnico e produtor, inclusive por URL e API.
- Bloqueio de acesso revoga também a sessão que já estava aberta.
- Teste automatizado de perda de conexão, uso totalmente offline, fechamento da tela, reconexão e retry repetido.
- Instalação como PWA e APK Android de piloto assinado para depuração.
- Testes automatizados do banco, Edge Function, rotas e responsividade.

## Preparação operacional do piloto

1. Entrar com o administrador definitivo e trocar a senha temporária.
2. Criar dados controlados para o piloto: 1 técnico, 3 a 5 produtores e seus acessos.
3. Instalar o APK no celular escolhido e executar o roteiro abaixo como aceite da equipe de campo.

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
