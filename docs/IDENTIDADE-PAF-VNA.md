# PAF VNA - identidade e limpeza cadastral

## Limpeza autorizada

Em 16/09/2026, apos confirmacao expressa para remover todos os cadastros conflitantes,
foram excluidos 14 registros administrativos ligados a sete CPFs repetidos.
O backup privado esta em `data/backups/cpf-conflicts-2026-09-16.json` (ignorado pelo Git).
Os registros nao tinham relatorios, visitas, documentos, tarefas nem acessos vinculados.
Nao havia produtores do app com esses CPFs. Restaram 350 produtores administrativos,
zero grupos repetidos e os 204 cadastros do aplicativo foram preservados.
Quatro documentos de tamanho inconsistente nao eram duplicados e nao foram removidos.

## Identidade visual

Nome visivel: PAF VNA. Identificadores Android, slug Expo e projeto EAS preservados.
Sidebar #172318, fundo #F5F7F3, verde #4C9C22 e laranja #F04A00, conforme o tema do app.
Botoes com texto branco usam a variante escura #C93D00 para contraste.
Logo e simbolo fornecidos pelo usuario foram copiados integralmente, sem remocao de fundo.
Icone Android adaptativo usa margem de 20% no drawable, sem alterar o arquivo original.

O APK piloto usa pacote separado e o nome PAF VNA Piloto. A versao normal tem nome PAF VNA.
Uma instalacao ja existente so muda nome/icone ao instalar uma atualizacao compativel;
o APK piloto nao substitui o aplicativo original nem apaga seus dados.
