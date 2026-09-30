# PAF VNA: auditoria de produto, interface e conclusão da primeira versão

Data: 29/09/2026. Escopo: pesquisa de referências públicas, revisão dos dois projetos locais, testes automatizados e verificações públicas de disponibilidade. Nenhum código do produto ou dado de produção foi alterado nesta auditoria.

## 1. Decisão executiva

O PAF já tem uma base funcional considerável. O principal trabalho restante não é acrescentar mais abas: é transformar módulos separados em uma operação contínua, com dados confiáveis e uma interface orientada ao trabalho de cada pessoa.

Prioridade confirmada pelo responsável: **cadastro, análise de áreas e acompanhamento técnico**. Público inicial: **7 a 8 técnicos, além de administração, supervisão e gerência**. A quantidade de produtores ainda não foi informada; não foi presumida a partir dos dados fictícios dos testes.

Recomendo uma primeira versão oficial de gestão do programa de agricultura familiar, não um ERP industrial completo. Manter os módulos existentes, mas concentrar a conclusão na jornada:

**Solicitação pública > triagem > análise documentada > vínculo com produtor e propriedade > responsável técnico > visita > plano de ação > acompanhamento da supervisão.**

O parecer de área possível de financiamento não deve ser apresentado como aprovação bancária. A consulta no sistema do banco continua externa enquanto não houver integração formal autorizada.

## 2. Principais achados, por impacto

### P1: o banco é compartilhado, mas o cadastro operacional ainda não é único

O dashboard principal usa `paf_producers`, `paf_reports`, `paf_technical_visits` e `paf_operational_tasks`. O aplicativo usa `paf_produtores`, `paf_propriedades`, `paf_assistencias`, `paf_agenda` e `paf_tarefas`. O módulo web de coletas já acessa parte da estrutura nativa, o que é uma integração real, porém parcial.

Consequência: estar no mesmo Supabase não garante que cadastrar, corrigir ou acompanhar um produtor em uma interface atualize o mesmo registro operacional na outra. Agenda, tarefas e atendimentos também precisam de uma correspondência explícita.

Evidências: [repositório web](<C:/Users/thali/OneDrive/Desktop/PAF - SYSTEM/paf-web/supabase/functions/paf-api/repository.ts:107>), [sincronização do app](<C:/Users/thali/Downloads/APK/vna-comunidade/src/data/cloudSync.ts:493>), [atividades do app](<C:/Users/thali/Downloads/APK/vna-comunidade/src/data/featureSync.ts:261>). A documentação de consolidação de setembro já registra a opção de preservar as estruturas para evitar junções incorretas.

Proposta: escolher um identificador canônico por produtor e propriedade, criar mapeamento explícito dos registros legados e manter compatibilidade durante a transição. Não unir ou excluir pessoas automaticamente apenas por coincidência de CPF. Preservar vínculos, protocolos, fotos e histórico; resolver ambiguidades com revisão humana.

### P1: falta fechar a passagem da análise para o atendimento

O módulo público coleta os dados e o dashboard publica parecer, responsável e histórico. Não encontrei uma ação completa para vincular a solicitação a um produtor/propriedade, distribuir o atendimento a um técnico e acompanhar prazo e próxima ação no mesmo processo.

Já é possível editar resultado, comentário e nome do analista, além de excluir a solicitação com confirmação. Isso não equivale a corrigir os dados cadastrais enviados pelo solicitante: o formulário administrativo atual os exibe, mas não oferece sua edição completa.

Evidência: [análise e edição do parecer](<C:/Users/thali/OneDrive/Desktop/PAF - SYSTEM/paf-web/src/land/LandApplications.jsx:155>).

Proposta: processo com responsável, prazo, checklist documental, comentário público separado de anotação interna, correção auditada e ação de vincular ao cadastro existente ou cadastrar após conferência. Preservar o protocolo público. Dados inconsistentes devem indicar o que corrigir e oferecer um caminho seguro para a correção, não apenas uma mensagem de reprovação.

### P1: indicadores ainda não representam toda a operação

O dashboard mistura estágios diferentes no indicador “Aprovados / plantados”. A sequência visual “Base / Relatórios / Análise / Visitas / Produção” combina contagens de naturezas distintas e não deve ser interpretada como um funil real de conversão. Os dados do formulário de áreas e das coletas nativas não compõem de maneira integrada o panorama principal.

Evidência: [ExecutiveDashboard](<C:/Users/thali/OneDrive/Desktop/PAF - SYSTEM/paf-web/src/main.jsx:2221>), especialmente o cálculo de `productiveRate` e os cartões seguintes.

Proposta: separar solicitantes, produtores, propriedades, análises e visitas. Cada indicador precisa de definição, período, origem e acesso à lista correspondente. Ausência de envio não significa automaticamente pendência: é necessário definir quem deveria enviar e em qual prazo.

### P1: confirmar a versão do APK e profissionalizar sua distribuição

O código nativo informa PAF VNA 1.10.3, versão Android 17. Existem nove arquivos com alterações locais anteriores a esta auditoria. Na pasta de releases do dashboard foram encontrados APKs anteriores, incluindo 1.10.2; não foi comprovado qual binário está instalado nos celulares.

O Gradle local usa a configuração de assinatura de depuração também no tipo `release`. Isso precisa de uma estratégia de assinatura e atualização para a distribuição oficial. Não significa que todo APK já distribuído foi necessariamente compilado dessa configuração atual.

Evidências: [versão e assinatura](<C:/Users/thali/Downloads/APK/vna-comunidade/android/app/build.gradle:95>), `git status` do aplicativo e inventário local de releases.

Proposta: publicar um único canal oficial de instalação, com versão, data, notas, hash e assinatura controlada. Planejar a compatibilidade com o APK instalado antes de trocar a assinatura; não orientar desinstalação enquanto houver dados pendentes no aparelho.

### P1: datas de atividades podem ser interpretadas incorretamente

A agenda aceita texto como “22 JUL” e tarefas aceitam “Hoje, amanhã ou uma data”. O parser infere o ano e, quando não reconhece uma data, parte do dia atual em vez de devolver erro. Uma digitação incorreta pode virar uma atividade no dia errado.

Evidências: [parser de datas](<C:/Users/thali/Downloads/APK/vna-comunidade/src/data/featureSync.ts:29>), [entrada de agenda](<C:/Users/thali/Downloads/APK/vna-comunidade/src/screens/OperationsScreens.tsx:386>).

Proposta: armazenar data estruturada e oferecer seleção simples de dia/mês/ano, com atalhos para hoje e amanhã. Validar calendário e horário sem correções silenciosas. Não retornar ao seletor difícil que já gerou reclamações no formulário público.

### P1: faltam comprovações de segurança e operação para o uso oficial

Há controles de acesso, escopo por técnico e proteção de evidências implementados. Ainda faltam, nesta auditoria, comprovação atual das permissões no banco de produção, restauração de backup, teste entre organizações e homologação com o APK real. Os conectores administrativos de Supabase e Vercel não estavam disponíveis nesta execução.

O aplicativo mantém dados de trabalho em JSON no AsyncStorage; não há criptografia de aplicação nesse armazenamento. As credenciais offline possuem tratamento separado, portanto não se deve confundir esse achado com senha em texto puro. A janela offline do app é de 30 dias; a sessão em cache dos portais web usa 72 horas. A empresa precisa aprovar uma política de acesso offline e perda de dispositivo.

Evidências: [armazenamento local](<C:/Users/thali/Downloads/APK/vna-comunidade/src/data/repository.ts:106>), [validade offline nativa](<C:/Users/thali/Downloads/APK/vna-comunidade/src/auth/offlineAccessCore.ts:6>), [validade web](<C:/Users/thali/OneDrive/Desktop/PAF - SYSTEM/paf-web/src/main.jsx:8275>).

### P2: paginação e agregações precisam suportar o crescimento

Há consultas web com uma única faixa `0..9999` e consultas do app que carregam tabelas sem percorrer páginas. Isso não comprova perda atual de registros, mas permite resultados parciais ao atingir o limite configurado na API. Solicitar uma faixa grande não substitui paginação. O módulo web de coletas já contém padrões melhores que podem ser reutilizados.

Evidências: [listagens web](<C:/Users/thali/OneDrive/Desktop/PAF - SYSTEM/paf-web/supabase/functions/paf-api/repository.ts:1075>), [download do app](<C:/Users/thali/Downloads/APK/vna-comunidade/src/data/cloudSync.ts:492>). A documentação do Supabase descreve limite padrão de retorno e uso de paginação; o limite efetivo deste projeto não foi consultado. [Referência oficial](https://supabase.com/docs/reference/javascript/v1/select).

Proposta: filtros e paginação no servidor, totais calculados no banco e sincronização incremental. Testar mais de 1.000 registros e mais de uma página antes de considerar a listagem completa. Para 7 a 8 técnicos, fotografias, histórico e sincronização merecem mais atenção do que uma arquitetura distribuída complexa.

## 3. Referências pesquisadas e o que aproveitar

Pesquisa em páginas oficiais. As funcionalidades abaixo são descrições dos responsáveis pelos produtos, não resultado de acesso às suas áreas privadas. Não houve teste comercial nem comparação de preços.

| Referência | Prática relevante | Aplicação recomendada no PAF |
| --- | --- | --- |
| [Senar ATeG](https://www.cnabrasil.org.br/assistencia-tecnica-e-gerencial) | Diagnóstico, planejamento, execução orientada, capacitação e avaliação periódica | Transformar visitas em acompanhamento com plano de ação, metas e evolução. É referência de metodologia, não cópia de interface de um software. |
| [Aegro](https://aegro.com.br/solucoes/gestao-rural/) | Registro de atividades no campo, fotos/GPS, uso offline e vínculo com a gestão | Aproveitar a continuidade entre o registro em campo e a decisão no escritório. Não trazer toda a complexidade financeira para a primeira versão. |
| [Agricolus AgriTrack](https://www.agricolus.com/en/solutions/agritrack/) | Gestão de várias propriedades, documentos, tarefas e comunicação para associações, cooperativas e processadores | É a referência organizacional mais próxima: uma equipe acompanhando uma carteira de produtores, com visão consolidada e detalhe individual. |
| [Emater MOBI](https://goias.gov.br/emater/emater-mobi-2/) | Aproximação produtor/técnico, envio de evidências e agendamento de visitas | Consulta simples de andamento, técnico responsável e próximo atendimento. A página descritiva é de 2021; serve como referência funcional histórica, não comprovação da versão atual do app. |
| [Agridence AgriTrace](https://agridence.com/blog/closing-first-mile-gap-agritrace) | Cadastro de pequenos produtores, mapeamento GPS, eventos de coleta e operação com baixa conectividade | Evoluir a identificação da área e a origem dos registros. Polígonos e cadeia de entregas são uma evolução posterior; não equivalem a certificação automática. |
| [Programa de agricultura familiar da Agropalma](https://www.agropalma.com.br/agropalma-impulsiona-agricultura-familiar/) | Regularização, assistência e formação continuada em uma cadeia de palma | Referência do negócio, não sistema concorrente. Reforça a necessidade de dossiê territorial e acompanhamento continuado, além do primeiro cadastro. |

Síntese: aproveitar o acompanhamento da ATeG, a organização multipropriedade do AgriTrack e a continuidade offline do Aegro. Manter a identidade e a linguagem próprias do PAF VNA.

## 4. Inventário do que já existe

“Implementado” significa identificado no código e, quando indicado, coberto pelos testes executados. Não significa homologação de todos os fluxos em produção.

| Área | Situação observada | Trabalho restante relevante |
| --- | --- | --- |
| Formulário público de áreas | Implementado: etapas, CPF, telefone obrigatório, nascimento simplificado, municípios do Pará, assentamento/INCRA, mãe e nome do assentamento, autorização | Correção segura após envio, acessibilidade com usuários reais, conexão com o cadastro operacional |
| Protocolo e acompanhamento | Implementado: protocolo curto, consulta com CPF, parecer, analista e histórico | Recuperação de protocolo com verificação de identidade; comunicação da próxima ação |
| Análise administrativa | Implementado: filtros, parecer editável, histórico e exclusão confirmada | Responsável pela carteira, prazo, checklist, anotação interna e edição cadastral auditada |
| Produtores e propriedades | Implementados nas duas estruturas; app tem CAF/CAR e coordenadas | Identidade única, ficha consolidada, validação documental e territorial. Não recriar campos CAF/CAR que já existem |
| Técnicos e acessos | Gestão de acessos e atribuição de produtores já existem | Consolidar regras de administração, supervisão, gerência e organização parceira nos dois produtos |
| Visitas e relatórios | Implementados, com evidências e recursos offline | Unificar agenda, visita, recomendações e próxima ação; revisão da supervisão |
| Coletas do aplicativo no dashboard | Implementadas: busca, filtros, paginação, revisão e fotos privadas | Vincular resultados ao mesmo produtor/propriedade e aos indicadores principais |
| Agenda, tarefas e atendimentos do app | Implementados com sincronização própria | Gestão correspondente no dashboard, sem duplicar tarefas e visitas legadas |
| Documentos | Módulo existente | Checklist por processo, versão, validade, situação de conferência e acesso apropriado |
| Abastecimento | Veículos, motoristas, lançamentos, importação e indicadores existentes | Manter como apoio; aprofundar só após a jornada principal. Evitar incluir dados de demonstração na base real |
| Exportação | CSV no dashboard; PDF/CSV no app | Relatório gerencial filtrado e dossiê de acompanhamento com data, responsável e origem |
| Comunicação e eventos | Mural/eventos no app já possuem implementação | Gestão no painel e notificações operacionais com política de consentimento e custos definidos |
| Identidade visual | Tokens, logos, componentes, animações e responsividade existentes | Unificar padrões e hierarquia; não tratar o design atual como inexistente |

## 5. Diagnóstico visual

A interface não precisa de mais efeitos em todos os lugares. Precisa de uma hierarquia mais forte, menos repetição e melhor relação entre informação e ação. Há melhorias recentes de contraste e ergonomia que devem ser preservadas.

Nas capturas locais com dados simulados, o dashboard repete “Visão geral” e “Panorama da operação”, distribui muitas estatísticas semelhantes em blocos sucessivos e posiciona “O que precisa de ação” depois de vários gráficos. No celular de 390 px, a captura completa alcançou cerca de 3.845 px de altura: a composição desktop foi majoritariamente empilhada.

Essas capturas não representam os números atuais da empresa. Contadores animados podem aparecer em transição; isso não foi interpretado como divergência de dados.

Evidências visuais: [desktop](<C:/Users/thali/OneDrive/Desktop/PAF - SYSTEM/paf-web/verification/new-dashboard-desktop.png>) e [celular](<C:/Users/thali/OneDrive/Desktop/PAF - SYSTEM/paf-web/verification/new-dashboard-mobile.png>).

Principais problemas de design:

- A primeira tela não responde rapidamente “o que minha equipe precisa fazer hoje?”.
- Gráficos vazios e indicadores repetidos ocupam espaço sem ajudar a decidir.
- A linguagem de “relatórios”, “coletas”, “visitas” e “análises” ainda exige conhecer a estrutura interna para navegar.
- Fluxos longos de análise ficam concentrados em modal; o espaço para conferir dados, documentos e histórico é limitado.
- Paletas e dimensões do app e da web são próximas, mas não derivam de um mesmo conjunto de decisões.
- Há cinco folhas de estilo globais importadas pelo arquivo principal, além de estilos de módulos. Novas camadas de CSS podem causar regressões de espaçamento e responsividade.

Evidências técnicas: [imports de estilos](<C:/Users/thali/OneDrive/Desktop/PAF - SYSTEM/paf-web/src/main.jsx:53>) e [tema do app](<C:/Users/thali/Downloads/APK/vna-comunidade/src/theme.ts:1>). O `main.jsx` concentra aproximadamente 8,8 mil linhas; extrair módulos progressivamente é mais seguro do que reescrever o sistema inteiro.

## 6. Redesign proposto

### Dashboard de supervisão e gerência

Primeira faixa: título único, período, organização/equipe e município. As mesmas condições devem valer para cartões, gráficos, listas e exportações.

Primeira tela útil: quatro indicadores distintos, como solicitações aguardando análise, casos acima do prazo, visitas pendentes e produtores com atendimento no período. Cada indicador abre a lista filtrada correspondente.

Logo abaixo: fila de trabalho com solicitante/produtor, etapa, responsável, prazo, última atualização e próxima ação. Para supervisão, mostrar distribuição dos atendimentos entre os 7 a 8 técnicos, sem transformar volume de visitas em ranking de qualidade.

Gráficos: entrada e conclusão de análises por período; visitas previstas versus realizadas; motivos de pendência; cobertura por comunidade. Diferenciar quantidade de pessoas, quantidade de atendimentos e hectares. Um funil só deve usar o mesmo conjunto de solicitações em todas as etapas.

Mapa: pontos verificados de propriedades e atendimentos, com filtros e alternativa em tabela. Polígonos podem vir depois. Coordenadas não comprovam regularidade fundiária nem aptidão agronômica.

No celular: priorizar fila pessoal, agenda e ação principal. Gráficos detalhados ficam em uma visão secundária, não todos empilhados na abertura.

### Análises de áreas

Lista com busca por nome/CPF/protocolo e filtros por etapa, responsável, município, data e prazo. Para o trabalho completo, usar página de detalhe com abas Dados, Documentos, Parecer e Histórico. Manter modal para ações curtas, não para toda a vida do processo.

Ações: assumir/distribuir análise, solicitar correção, registrar parecer, vincular produtor/propriedade e agendar atendimento. Separar observação interna de comentário visível ao solicitante. A exclusão de testes já existe; para registros reais, definir arquivamento e trilha de exclusão conforme política de retenção.

### Ficha do produtor

Uma ficha, um identificador, com propriedades, responsável, comunidades, documentos, solicitações, visitas e pendências. Mostrar última visita, próxima ação e situação de sincronização quando relevante. Permitir mais de uma propriedade por produtor sem duplicar a pessoa.

### Aplicativo do técnico

Abertura com agenda do dia, produtores atribuídos e envios pendentes. A visita segue etapas curtas: identificação, localização, observações, evidências, recomendações e conferência. Rascunho automático, indicação clara de salvo no aparelho/enviado/erro e retomada após fechar o aplicativo.

Manter fotos, GPS, uso offline e formulários existentes. Trocar datas livres por entradas estruturadas. Validar campos com teclado apropriado, mensagens próximas ao erro e botões alcançáveis com uma mão. Não exigir internet apenas para reabrir um trabalho já autorizado e salvo.

### Área do produtor

Linguagem direta: situação atual, o que precisa fazer, quem acompanha e quando houve atualização. Evitar nomes internos de tabelas e processos. Não transformar cadastro público em um questionário técnico extenso antes da triagem. Ampliar dados e documentos somente conforme a etapa e a necessidade.

### Navegação

Proposta de agrupamento: Gestão (Painel e Análises), Campo (Produtores/propriedades, Agenda/visitas e Coletas), Operação (Pendências, Documentos e Frota), Administração (Equipe, Acessos e Configurações). “Cadastros” não deve duplicar a mesma lista em diversos lugares: ações de criar/editar pertencem ao respectivo módulo, com atalhos quando úteis.

## 7. Sistema visual mínimo

| Elemento | Diretriz |
| --- | --- |
| Cores | Usar o tema existente do app como referência comum: verde institucional, laranja de marca, branco e fundo neutro. Centralizar os tokens; não espalhar novos hexadecimais pelo CSS |
| Contraste | Laranja de marca como destaque; variante escura existente para botão com texto branco quando necessário. Medir contraste de cada combinação, inclusive estados desabilitados e erro |
| Tipografia | Preservar a fonte local existente da web; hierarquia consistente de 24 px para título de página, 18 px para seção e 14/16 px para leitura e campos. Sem tamanho dependente da largura da janela |
| Espaçamento | Escala 4/8/12/16/24/32; densidade maior em tabelas, respiro maior em formulários |
| Superfícies | Seções sem caixas decorativas; cartões apenas para itens repetidos e ferramentas realmente enquadradas. Bordas discretas; web com raio de até 8 px |
| Ações | Uma ação principal por contexto, secundárias neutras, destrutivas isoladas e confirmadas. Ícones Lucide com nome acessível |
| Estados | Pendente, em análise, inconsistente, concluído e recusado com texto/ícone, nunca dependentes só da cor |
| Movimento | Transições curtas de 150 a 250 ms, feedback de gravação e abertura de painéis. Respeitar redução de movimento; evitar repetir contagens a cada atualização |
| Responsividade | Testar 320, 390, 768, 1024 e 1440 px, zoom a 200%, teclado aberto e rótulos longos. Alvos de toque de 44 a 48 px como referência |

Componentes reutilizáveis prioritários: `PageHeader`, `FilterBar`, `DataTable`, `StatusBadge`, `FormField`, `StepForm`, `DetailTabs`, `ConfirmDialog`, `Timeline`, `EmptyState`, `ErrorState`, `SyncStatus` e `MetricCard`. Aproveitar os componentes locais que já resolvem essas funções, em vez de criar uma segunda biblioteca paralela.

## 8. Perfis para a operação informada

Proposta a homologar, não descrição de permissões já garantidas:

| Perfil | Responsabilidade | Limite importante |
| --- | --- | --- |
| Técnico | Produtores atribuídos, agenda, visitas, coletas e recomendações | Sem administrar usuários nem consultar carteira de outra organização |
| Administração | Conferência de cadastro e documentos, distribuição operacional conforme permissão | Não receber automaticamente poderes de exclusão irrestrita ou gestão de credenciais |
| Supervisor | Revisar atendimentos, distribuir carteira, acompanhar prazos e qualidade | Não confundir supervisão técnica com administração global do banco |
| Gerência | Indicadores consolidados e relatórios autorizados | Acesso a dados pessoais somente quando necessário para sua função |
| Administrador do sistema | Acessos, configuração e auditoria | Conta individual; ações sensíveis registradas; MFA a avaliar para acesso privilegiado |
| Organização parceira | Sua própria carteira e equipe, como a operação da cooperativa | Isolamento no servidor e no banco, não apenas ocultação de botões |

O app hoje simplifica diferentes papéis do banco em três papéis de interface; coordenador é mapeado para administrador. Revisar essa decisão antes de distribuir acessos de supervisão e gerência. [Mapeamento atual](<C:/Users/thali/Downloads/APK/vna-comunidade/src/auth/session.ts:35>).

## 9. Publicação, infraestrutura e privacidade

**Web:** a árvore do dashboard estava limpa no início. O commit local `b517048` coincide com o `main` remoto consultado. A rota pública `/admin` respondeu 200; o arquivo CSS servido coincide com o nome do build local. Isso não substitui consultar o SHA e os logs do deploy na Vercel.

**Banco:** em 29/09, aproximadamente 20h10 de Brasília, `/api/health` respondeu 200 com `database: supabase`. A implementação verifica uma consulta de produtores; não comprova todos os módulos, Storage, Auth, políticas RLS ou entrega de e-mail.

**App:** mudanças locais, commit, APK gerado e APK instalado precisam ser associados em um registro de release. Não foi gerado nem publicado APK nesta auditoria.

**Migrations:** app e dashboard mantêm históricos separados. A migration de vínculo do dashboard referencia `paf_organizacoes`, cuja criação está no projeto do aplicativo. Consolidar a ordem e testar banco vazio e atualização de banco existente. Não foi executado reset do banco de produção. Os testes SQL de análise ainda exercitam a assinatura antiga de cinco argumentos do parecer, não toda a versão atual com nome do analista e exclusão.

**Disponibilidade:** existe rotina de health check. Projetos Free do Supabase podem ser pausados por baixa atividade em sete dias; um ping não deve ser vendido como garantia de disponibilidade. Definir monitoramento independente, alerta de falha, responsável e procedimento de recuperação. Avaliar orçamento de plano pago quando a operação depender diariamente do sistema. Nenhuma mudança de plano foi feita. [Política oficial do Supabase](https://supabase.com/docs/guides/platform/free-project-pausing).

**Backup:** comprovar cópia e restauração de banco e arquivos privados, com acesso restrito, frequência e retenção definidos. Backup de exportação antiga não substitui recuperação do sistema atual. Não foi verificada a política vigente da conta.

**Privacidade:** o formulário já registra autorização e sua versão. Falta formalizar canal de atendimento do titular, responsáveis, retenção, correção e resposta a incidentes. Conferir dados pelo dashboard não substitui esse atendimento. Validar com o responsável jurídico/de privacidade da empresa; esta auditoria não certifica conformidade LGPD. A ANPD orienta sobre canal de contato e trata inclusive da obrigação para pequenos agentes dispensados de encarregado, sem presumir que a Vila Nova se enquadre nessa exceção. [ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022).

## 10. Verificações realizadas

| Verificação | Resultado | Limite da evidência |
| --- | --- | --- |
| Dashboard: `npm run check` | Aprovado: 29 testes de domínio/API/configuração, checagem Deno e build Vite | Não é homologação de todas as operações no Supabase real |
| Interface: seis arquivos selecionados de Playwright | 30 testes aprovados | APIs simuladas em vários cenários; não equivale a testar permissões reais |
| PWA: `npm run test:pwa` | 2 aprovados e 1 falhou | O cenário do produtor procura “Acesso do produtor”, mas a tela atual usa “Bem-vindo, produtor”; falha antes de exercitar a etapa offline |
| App: `npm test` | 56 testes aprovados em 16 arquivos | Testes de código, não instalação e uso no Android em campo |
| App: `npx tsc --noEmit` | Aprovado | Tipagem não comprova integração |
| `npm audit --json` nos dois projetos | Nenhuma vulnerabilidade reportada | Não substitui auditoria de permissões, lógica e armazenamento |
| Produção: rota e health check públicos | HTTP 200 | Verificação pontual, não SLA nem auditoria completa do banco |

O teste offline do produtor precisa ser atualizado e executado novamente. Não foi concluído que o produto está quebrado offline apenas por essa falha de seletor. Também não é correto declarar todos os testes verdes.

Não executados nesta etapa: auditoria administrativa do Supabase, teste SQL em banco reconstruído, restauração de backup, teste de carga real, teste com todos os papéis em produção, instalação/atualização do APK em celular físico e homologação com técnicos.

## 11. Ordem recomendada de desenvolvimento

Cada etapa precisa de demonstração e critério de aceite. Não usar a marcação antiga de “100% do piloto” como conclusão do sistema inteiro.

| Etapa | Entrega | Critério para avançar |
| --- | --- | --- |
| 0. Base de entrega | Inventário de versões, revisão das alterações locais do app, testes desatualizados, migrations reproduzíveis, backup/retorno | Saber exatamente qual código, schema e APK estão em cada ambiente; testes essenciais executáveis |
| 1. Jornada integrada | Identidade única, vínculos legado/app, análise ligada ao produtor/propriedade, responsável e próxima ação | Solicitação chega, é analisada e gera/vincula atendimento sem redigitação nem duplicação |
| 2. Redesign do núcleo | Layout comum, filtros, nova visão inicial, fila de análises e ficha do produtor | Usuário encontra pendência, abre processo e realiza ação principal sem percorrer gráficos irrelevantes |
| 3. Campo e supervisão | Agenda unificada, datas estruturadas, visita, recomendações, revisão e estados de sincronização | Técnico registra offline, fecha/reabre, envia e supervisor confere o mesmo atendimento |
| 4. Preparação operacional | Permissões, isolamento, proteção local, monitoramento, privacidade, relatórios e canal de release | Homologação entre papéis, recuperação comprovada e APK atualizável sem perder fila |
| 5. Homologação assistida | Começar com dois técnicos e supervisão; ampliar para os 7 a 8 técnicos após os aceites | Nenhuma perda/duplicação nos cenários combinados; divergências registradas e resolvidas antes de ampliar |

O desenho das telas pode começar durante a etapa 1, mas os gráficos definitivos devem usar as entidades e regras consolidadas. Evitar lançar primeiro um dashboard bonito que continue somando bases diferentes.

Primeiro pacote recomendado: **fila de análises + ficha única do produtor + atribuição técnica + primeira visita refletida no dashboard**, com o novo padrão visual aplicado a essas telas. Esse pacote entrega valor visível e resolve o principal problema estrutural ao mesmo tempo.

## 12. Critérios de pronto para a primeira versão oficial

- Um cadastro enviado pelo formulário pode ser encontrado por protocolo, analisado e vinculado ao acompanhamento sem duplicar o produtor.
- Correções preservam autor, data, valores relevantes anteriores e motivo; comentário interno não aparece na consulta pública.
- Os papéis de técnico, administração, supervisor, gerência e organização parceira passam por testes de autorização no servidor/banco.
- Técnico vê sua carteira; supervisor/coordenador acompanha todos os produtores da organização, conforme decisão de 30/09/2026; um parceiro não acessa dados de outro.
- Data inválida é rejeitada; atividade não muda silenciosamente de dia ou ano.
- Visita com fotos/GPS funciona em modo avião após preparação; sobrevive ao fechamento; reenvio não cria duplicata; erro mantém a fila recuperável.
- Testar conflito de edição, sessão expirada, aparelho sem espaço, GPS negado, internet intermitente e atualização do aplicativo com envio pendente.
- Totais do dashboard conciliam com listas filtradas e exportações, inclusive com mais de uma página de dados.
- Formulários funcionam em 320/390 px, com zoom e teclado; foco e mensagens de erro são utilizáveis por teclado e leitor de tela.
- Versão publicada, migrations e APK são identificáveis; existe procedimento de retorno compatível com dados já gravados.
- Banco e arquivos possuem backup com restauração testada; falha de disponibilidade gera alerta para alguém definido.
- Dois técnicos e um supervisor executam um roteiro completo com casos autorizados; depois a equipe inteira recebe orientação curta.

## 13. Depois da primeira versão

Mapeamento poligonal e camadas territoriais; acompanhamento agronômico por ciclo; entregas de cachos de frutos frescos e rastreabilidade de lotes; insumos, contratos e integração com sistemas industriais/financeiros; notificações externas com política e custos definidos.

Esses itens podem ser importantes para o programa no futuro, mas não devem bloquear o escopo confirmado agora. Não recomendo reconstruir folha de pagamento, fiscal, refino ou ERP industrial dentro do PAF nesta fase.

Arquitetura recomendada: manter React, React Native/Expo e Supabase, organizar o backend e o frontend por módulos e centralizar contratos de dados e regras compartilhadas. Não há evidência nesta escala que justifique microserviços ou troca completa de framework.

## 14. Pontos ainda a decidir

Quantidade aproximada de produtores e visitas mensais; frequência esperada de acompanhamento; responsáveis por cada etapa e prazos; documentos exigidos pelo processo bancário; necessidade e duração do acesso offline; canal oficial de suporte/privacidade; orçamento de infraestrutura e distribuição Android.

Essas decisões refinam capacidade, permissões e prioridades. Não impedem começar pela unificação do cadastro, jornada de análise e redesign das telas centrais.
