# Auditoria app e dashboard - 16/10/2026

## Entregas desta revisão

- App 1.10.15: PDF institucional, atualização manual global e separação entre visitas enviadas e quantidade de registros sincronizados.
- Dashboard: filtro exato por produtor e filtro por modalidade; carteiras mistas podem aparecer nas duas modalidades.
- CSV da página inclui todas as respostas públicas do formulário, modalidade, propriedade, parecer, revisor, datas, observações e deslocamento. Metadados internos de assinatura não são exportados. Células são protegidas contra fórmulas.
- Ficha do produtor distingue agendamentos de visitas realizadas. Link abre a consulta do app filtrada pelo produtor.

## Contratos conferidos no código

| Fluxo | Aplicativo | Dashboard | Fonte |
| --- | --- | --- | --- |
| Carteira por técnico | Leitura limitada ao perfil; mantém rascunhos locais | Cadastro, atribuição e consulta por organização | paf_produtores, paf_produtor_tecnicos |
| Propriedades e áreas | Croqui, posição e conferência de distância | Consulta do polígono e pontos recebidos | paf_propriedades |
| Visita realizada | Formulário e fila offline | Filtros, respostas, revisão, exportação | mobile_respostas |
| Fotos/GPS/assinaturas | Captura e persistência local; upload | Visualização e assinaturas separadas das fotos | mobile_anexos, mobile_gps |
| Parecer | Recebe aprovação ou pedido de ajuste na sincronização | Revisão com controle de versão, autor e data | status_validacao, nota_revisao |
| Exclusão administrativa | Remove visita na próxima sincronização; não recria tombstone | Restrita à administração, exige motivo e conserva auditoria | deleted_at, RPC de exclusão |
| Agenda | Recebe programação atribuída ao técnico | Programação e gestão | paf_agenda |
| Pendências | Recebe e conclui tarefas; preserva atribuição | Criação e acompanhamento | paf_tarefas |
| Assistência | Solicitações e avanço do atendimento | Disponível na fonte unificada/ficha operacional | paf_assistencias |
| Análise de área | Não é o formulário de visita | Cadastro público, avaliação e acompanhamento | paf_land_requests |

## Diferenças e pendências reais

1. Agenda e relatório de visita são registros diferentes. Ainda não há vínculo explícito que conclua automaticamente um agendamento ao enviar a visita. Não se deve inferir essa ligação apenas por nome ou data.
2. Publicações comunitárias e eventos do app usam paf_publicacoes/paf_eventos, mas o dashboard principal ainda precisa de uma área dedicada de gestão e indicadores para eles.
3. PDF individual aprimorado é gerado no aplicativo. O dashboard exporta a página filtrada em CSV; geração do mesmo PDF diretamente no dashboard e exportação de todas as páginas permanecem pendentes.
4. Contadores locais não são um histórico de execuções. Não foi inventado um histórico retroativo de sincronização.
5. Validação física de impressão, atualização de dados e instalação no Android 16 continua necessária. Testes de navegador com serviços simulados não a substituem.
6. Auditoria npm do app continua com 16 alertas altos transitivos da cadeia Expo/Metro; a correção automática propõe downgrade incompatível e não foi aplicada. Dashboard sem alertas na auditoria desta entrega.

## Segurança da conferência

Nenhum cadastro real criado, alterado ou excluído. Testes de interface usam dados sintéticos e interceptação de API. Não houve migração de banco nesta revisão; limites de organização e permissões existentes foram preservados.
