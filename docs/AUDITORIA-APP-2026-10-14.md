# PAF VNA: base atualizada e auditoria do aplicativo

Data: 14 de outubro de 2026. Dashboard e app compartilham o projeto Supabase
`eeivxgbbslnojbbpzweb`. Esta entrega substitui o cadastro ativo de produtores e
corrige o preenchimento de campo. Nao equivale a homologacao fisica Android,
teste de carga ou pentest independente.

## Importacao autorizada

Fonte: `PRODUTORES_PAF_PRONAF_PARCERIA_ATUALIZADO.xlsx`, aba **CONSOLIDADO**,
confirmada pelo usuario como resumo atualizado. Outras abas foram usadas apenas
para complementar identidade e documentos, nunca para sobrepor area ou tecnico.

| Conferencia | Resultado |
| --- | ---: |
| Linhas de area/plantio preservadas | 224 |
| Produtores ativos | 213 |
| Propriedades provisoriamente agrupadas por localidade | 214 |
| Area conhecida total | 3.012,5 ha |
| CPFs validos e sem conflito | 78 |
| Cadastros sem CPF utilizavel | 135 |
| Telefones utilizaveis informados | 11 |
| Cadastros sem telefone utilizavel | 202 |

Carteiras: Leonardo 58, Marcos 69, Setembrino 14 e Marcelo 73. A soma e 214
porque um produtor consta em duas carteiras na fonte; ambos os vinculos foram
preservados. Marcelo ficou identificado por nome, sem conta inventada. O trigger
vincula sua carteira quando houver um unico perfil tecnico ativo correspondente
na mesma organizacao. O dashboard permite filtrar sua carteira desde agora.

Cinco documentos com digito verificador invalido e tres cadastros envolvidos em
CPF conflitante foram mantidos sem preencher o CPF confirmado. Os valores de
origem estao restritos aos metadados para conferência administrativa. Uma linha
nao informa hectares. Linhas repetidas de plantio foram conservadas; a equipe
deve confirmar se representam etapas diferentes ou duplicacao na planilha.

Nomes de imoveis, CAR/CAF e agrupamentos de comunidades sao provisórios e
precisam de confirmacao. Os documentos complementares nao comprovam que duas
localidades sejam imoveis juridicamente independentes. Nenhuma aprovacao de
financiamento foi inferida: todos entram em INTERNALIZAR.

## Preservacao e recuperacao

- Base anterior arquivada, fora das listagens ativas, em vez de apagar historico
  ligado a solicitacoes de analise.
- Snapshot privado das seis tabelas relacionadas antes da troca; importacao
  atomica, com checksum, bloqueio de concorrencia e verificacao de totais.
- Lote: `482c8b04-2d6b-4551-a4bf-825595f02207`.
- Backup adicional local em `data/backups/20261014-producer-replacement/`.
- Snapshots privados sem permissao publica; planilha, payload, backup e dados
  pessoais nao entram no Git nem nos assets do site.
- Onze solicitacoes de analise e sete perfis preservados. Nenhuma visita real
  existia e nenhuma visita foi fabricada a partir de linhas de assistencia sem
  as evidencias exigidas pelo formulario.

Uma recuperacao deve ser conduzida por administrador do banco: pausar gravacoes,
preservar dados recebidos depois deste lote, comparar snapshots e restaurar em
transacao validada. Nao executar uma restauracao cega de toda a base nem apagar
solicitacoes ou contas para desfazer a importacao.

## Falhas corrigidas

| Impacto | Problema | Correcao |
| --- | --- | --- |
| Alto | Formulario extenso, seletores com listas enormes e rodape dificil de alcancar | Visita tecnica em oito etapas; socioambiental em dezessete, busca e paginacao de seletores, tela inteira no celular e rodape persistente |
| Alto | Trocar produtor apagava respostas ou deixava dados de outra propriedade | Atualizacao limitada aos campos de identidade, preservando respostas de atendimento |
| Alto | Fechar ou avancar podia perder o preenchimento | Rascunho automatico em ID estavel, persistencia aguardada, reabertura e erro de armazenamento recuperavel |
| Alto | Gravações concorrentes podiam sobrescrever o rascunho mais recente | Fila de persistencia por usuario e atualizacao imediata da referencia de dados |
| Alto | Autosave podia disputar a conclusao em aparelho lento; foto tardia podia voltar apos fechar | Timer cancelado ao salvar e descarte da captura encerrada, com teste de conclusao em gravacao atrasada |
| Alto | Resposta podia chegar para revisao antes das fotos | Registro remoto inicialmente rascunho; RPC publica somente apos conferir campos, propriedade, GPS e objetos de fotos armazenados |
| Alto | Troca da carteira podia ocultar rascunho pendente | Historico e registros proprios preservados, sem conceder acesso a carteira alheia |
| Medio | GPS ou internet demoravam indefinidamente | Prazo de GPS de 25 s, requisicoes de 30 s e upload de 120 s; cancelamento, mensagem e preservacao local |
| Medio | Datas, numeros e escolhas invalidas pareciam preenchidos | Mascara e teclado numerico, validacao por etapa, datas coerentes e conferência final |
| Medio | Fotos removidas voltavam na consulta | Marcacao de evidencias substituidas e exclusao delas da visualizacao, sem apagar historico de armazenamento |
| Medio | Cadastro arquivado ainda aparecia no painel legado | Filtros ativos em listagem, vinculos e busca por ID/token |
| Medio | Carteira sem login desaparecia dos filtros | Coluna Tecnico e carteira importada selecionavel no servidor e na tela |

## Evidencias de verificacao

- App: 83 testes em 22 arquivos; TypeScript e exportacao web aprovados.
- `npm run audit:field`: formulario real em React Native Web, 213 produtores
  ficticios, viewports 320, 390, 820 e 1440 px; 21 screenshots, sem erros de
  pagina nem transbordamento horizontal. Busca, avancos, erros, troca de
  produtor, persistencia/reabertura, GPS com falha, fotos e conclusao testados.
- `npm run audit:ui`: painel do app, primeiro acesso, fronteiras administrativas,
  edicao de produtor e filtros aprovados com respostas simuladas.
- Login do app: cinco viewports, teclado, senha e envio alcancavel aprovados.
- Dashboard: suite completa de 64 casos E2E em SQLite isolado; dois novos casos
  de carteira Marcelo em desktop/mobile aprovados. Testes de unidade/contrato,
  Edge, typecheck e build aprovados.
- Banco: teste transacional com rollback de envio sem GPS/foto, envio completo,
  versao concorrente e bloqueio anonimo. Fixtures nao ficaram na base real.
- Autoatribuicao de Marcelo e totais de importacao testados em transacao com
  rollback antes da operacao definitiva.
- APK 1.10.6, versionCode 20, ARM32/ARM64: manifesto, assinatura, nome PAF VNA e
  pacote conferidos. Mesma assinatura e identificador da homologacao 1.10.5.

## Distribuicao

Dashboard: https://vilanova-paf.vercel.app.

APK direto, sem login GitHub:
https://eeivxgbbslnojbbpzweb.supabase.co/storage/v1/object/public/paf-releases/1.10.6/PAF-VNA-1.10.6-homologacao.apk?download=PAF-VNA-1.10.6-homologacao.apk.

Release adicional no GitHub privado:
https://github.com/thalissomvinicius/vna-comunidade-paf-dashboard/releases/tag/paf-vna-1.10.6-homologacao.

SHA-256 do APK:
`ae17c179c52442697b5359095ed6cb19cd12246a6c6d50e8abdf224db17b470b`.
Instalar sobre a homologacao 1.10.5, sem desinstalar ou limpar armazenamento.
Entrar com o acesso existente e sincronizar online para receber a nova carteira.
Rascunhos antigos que apontem para produtor arquivado precisam ter seu vinculo
conferido; nao sao reenviados para um produtor escolhido automaticamente.

O bucket publico `paf-releases` contem somente o instalador, nao os dados da
equipe. Escrita administrativa apenas; bucket privado `paf-anexos` e suas
policies nao foram alterados. Limite de 50 MB por arquivo e MIME de APK.
Download publico verificado integralmente com tamanho e SHA-256 iguais ao
arquivo assinado local. Downloads consomem a franquia de trafego existente;
nenhum plano pago foi contratado.

Conferencia publicada: commits `8a39e78f693ebef0b76158da303ee8a02e1a08d1`
(dashboard) e `8721ead3cc3543f6284d3631eed46fdf3dcea3f9` (app), ambos READY
na Vercel. API HTTP 200; diretorio sem sessao HTTP 401. Dois testes do filtro de
Marcelo repetidos no site publicado, em 390/1440 px, com API simulada e sem
escritas reais. Suite visual administrativa do app repetida no dominio publicado,
sem erros e com limites de acesso preservados. Bundle publicado contem o novo
wizard/RPC e nao contem as fixtures de teste. APK corresponde ao commit do app
acima; commits posteriores de documentacao nao alteram esse binario.

## Pendencias para liberacao em campo

1. Criar o acesso real de Marcelo com nome completo e e-mail conferidos.
2. Completar CPF, telefone e dados dos imoveis no cadastro administrativo;
   confirmar o produtor com dupla carteira e a area desconhecida.
3. Testar em Android fisico: teclado, camera, permissoes, GPS sem sinal, modo
   aviao, encerramento/reabertura, reconexao e atualizacao sobre o APK anterior.
   A simulacao de browser nao substitui essa etapa.
4. Definir assinatura oficial de distribuicao, responsavel de privacidade,
   retencao e politica de protecao dos dados offline. APK atual e homologacao.
5. Reavaliar 16 avisos altos da cadeia Expo/Metro/CLI, derivados de `braces` e
   `node-forge`, sem patch compativel publicado nesta verificacao. Nao expor
   Metro na internet nem aplicar downgrade Expo sugerido por audit fix force.
6. Executar teste de carga e processo de revisao com os 7-8 tecnicos antes da
   operacao definitiva. Protecao contra senhas vazadas do Supabase permanece
   limitada pelo plano contratado; nenhum servico pago foi habilitado.

O dashboard voltou a zero vulnerabilidades reportadas apos atualizar
`@capacitor/android`, `proxy-addr` e `source-map-js`. No app foram corrigidos
`shell-quote` e `source-map-js`; nao foi declarado risco zero.

Fontes primarias: [Capacitor](https://github.com/advisories/GHSA-rvm3-566m-v7fv),
[proxy-addr](https://github.com/advisories/GHSA-jqcg-44mw-7w3h),
[source-map-js](https://github.com/advisories/GHSA-68fv-2mgg-jv7q),
[braces](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
[node-forge](https://github.com/advisories/GHSA-86w9-cpqp-85rv).
