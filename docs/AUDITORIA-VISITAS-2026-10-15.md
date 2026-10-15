# Revisao do primeiro teste de visita

## PDF recebido

O documento original tinha quatro paginas, fotos muito pequenas, repeticao de
identificacao, campos condicionais sem aplicacao e uma terceira assinatura de
emissao mesmo quando tecnico e acompanhante ja tinham assinado.

Novo modelo: respostas curtas em duas colunas, evidencia fotografica ampliada
sem recorte, identificacao em branco, assinaturas lado a lado e retirada da
assinatura de emissao duplicada. Os originais nao sao editados. PDF sintetico
renderizado e inspecionado; o tamanho final varia com as respostas e fotos.

## Interface e integridade

- Uma entrada Visitas: realizadas e agendamento. /admin/coletas e mantido como
  alias, sem apagar o cadastro separado da agenda.
- Indicadores de recebimento e atividade usam as fichas enviadas pelo app,
  excluindo rascunhos e exclusoes. A agenda continua medindo programacoes.
- Fotos em tela cheia com zoom, croqui interativo da propriedade e coordenadas
  com link Google Maps. Ausencia de shape nao produz area inventada.
- Exclusao logica exclusiva de administracao, confirmacao e motivo obrigatorio,
  versao esperada, auditoria e bloqueio de ressurreicao por clientes offline.
- App recebe tombstones e assinaturas, preserva originais locais e renova URLs.
- Modalidade e exibida conforme a base, inclusive Produtivo e carteiras mistas.

## Limites

Os testes automatizados usam cadastros sinteticos. A verificacao SQL utilizou
uma fixture revertida por rollback. Nenhuma coleta real foi apagada.
O mapa do dashboard e um croqui georreferenciado, nao uma imagem de satelite.
Fotos recebidas de outros dispositivos ainda precisam de conexao para baixar;
as fotos capturadas no proprio celular conservam o arquivo local.
A confirmacao em S24 fisico continua dependendo de teste da equipe.

Resultado: 38 testes visuais do dashboard, 133 testes unitarios do app,
tipagem e builds aprovados. Formulario exercitado em quatro viewports.
APK 1.10.13, versionCode 27, ARM64 e ARMv7, assinatura igual a 1.10.12 e
alinhamento ZIP de 16 KB verificados. Sem dispositivo conectado ao ADB.
Web: npm audit sem vulnerabilidades. App: 16 alertas altos na cadeia
Expo/Metro, registrados na nota da versao, sem forcar downgrade do SDK.
