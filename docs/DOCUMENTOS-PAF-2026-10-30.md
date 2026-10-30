# Documentos PAF

No app, abrir Formularios e coletas e iniciar Notificacao ao produtor ou Liberacao de parcela e ATER. O historico possui a aba Documentos, com filtros e emissao do PDF.

No dashboard, abrir Visitas realizadas / Coletas de campo e selecionar Emitir documento. Dentro de uma visita, Emitir documento desta visita permite aproveitar os dados e selecionar suas fotos. O filtro Situacao permite recuperar Rascunhos. Abrir o documento e selecionar Baixar relatorio PDF para visualizar e Salvar PDF / imprimir.

## Modelos

- Notificacao: motivo, data da ocorrencia, providencias, prazo opcional, ciencia, tecnico e fotos opcionais. A marca e os dados pessoais do exemplo nao sao reutilizados. O prazo de 90 dias e o texto de sancoes do exemplo nao sao automaticos.
- Liberacao e ATER: laudo, parcela, operacao, datas, linha de recursos, credito ja liberado, itens do orcamento, total solicitado, avaliacao, parecer, retorno, assinatura tecnica e ao menos duas fotos legendadas. A secao do agente financeiro fica em branco para o banco.
- Identificacao e valores devem ser conferidos por quem emite. Dados de cadastro ausentes ficam para preenchimento, sem valores financeiros de exemplo.
- As fotos usam o arquivo inteiro, em duas colunas na impressao A4, com legenda e metadados disponiveis. Anexos importados nao recebem GPS inventado. A copia de uma foto de visita nao altera seu original.

## Dados e sincronizacao

Usa mobile_formularios, mobile_respostas, mobile_anexos e o bucket privado paf-anexos, sob as mesmas restricoes de organizacao, perfil e carteira. Nao foi criada uma segunda base de documentos.

As respostas e a tabela de itens via JSON sao sincronizadas pelo contrato de respostas existente; cada item possui descricao, valor e data. As legendas ficam nos metadados da foto. A assinatura referencia o conteudo conferido; alterar o documento exige refazer a assinatura. Totais sao calculados em centavos.

O banco verifica campos obrigatorios, vinculo produtor/propriedade, orcamento, fotos e assinaturas ao finalizar. Os testes SQL usam dados temporarios em transacao e encerram com rollback. Nenhum cadastro real foi usado como documento de exemplo.

## Verificacao e manutencao

- App: npm test, npx tsc --noEmit, node scripts/build-field-harness.mjs, node scripts/document-form-ui-audit.mjs.
- Dashboard: npm run test:field, npm run test:ui -- documents.spec.js field-evidence.spec.js, npm run build.
- Modelo compartilhado: node scripts/sync-visit-report.mjs e --check. Gerar o catalogo SQL com scripts/build-document-catalog.mjs no app.
- Falta validacao dos recursos nativos no Android fisico e confirmacao operacional do modelo pela equipe antes de enviar documentos reais a terceiros.
