# Auditoria visual PAF VNA

## Escopo

Login administrativo, produtor, tecnico e campo; os 11 modulos do dashboard;
cadastros e modais; formulario publico, protocolo e consulta de andamento.
Verificacao em navegador Chrome, com larguras de 320 a 1920 pixels. Celulares
foram emulados; esta verificacao nao substitui o teste em aparelho fisico.

## Correcoes

- Publicar o redesign local que ainda nao estava no endereco oficial.
- Consolidar o tema em design.css e separar o CSS antigo em uma camada inferior.
- Remover bordas e pseudo-elementos da marca na barra lateral.
- Padronizar icones, botoes sem quebra de texto, grupos que podem mudar de linha
  e controles com alvos de toque maiores no celular.
- Conservar a fotografia completa no login, sem cortar pessoas ou logos.
- Usar menu lateral no desktop, drawer no tablet e atalhos inferiores no celular.
- Limitar a altura dos modais, permitir rolagem interna, fechamento com Escape
  e devolucao do foco ao botao que abriu a janela.
- Evitar que o botao de ativar/desativar comprima os nomes no cadastro de analistas.
- Alinhar os indicadores e transformar as solicitacoes em registros empilhados
  no celular, com o botao de edicao visivel sem deslocamento horizontal.
- Manter movimento reduzido, fontes locais, foco visivel e campos de login vazios.
- Renovar a versao do cache da aplicacao para descartar a interface anterior.

## Analise de areas

Resumo de todos os cadastros ativos, arquivados ou ambos, independentemente
da pagina e da busca: total, aguardando, concluidos, inconsistentes, possivel
financiamento e reprovados. Concluidos = reprovados + possivel financiamento;
dados inconsistentes permanecem separados para correcao.

Analistas sao selecionados entre perfis ativos da organizacao e nomes adicionais
configurados pela administracao. Desativar um nome nao altera pareceres anteriores.
O nome salvo continua disponivel na consulta publica por CPF e protocolo.

O botao Definir tecnico salva o responsavel interno, preserva os outros dados
de acompanhamento e usa controle de versao para evitar sobrescrever outra edicao.
Os tecnicos vem dos acessos ativos do app; a configuracao abre o gerenciamento
existente para cadastrar ou bloquear acessos. Nomes adicionais de analistas
nao geram contas de login.

## Verificacao

- Testes de unidade, contratos, permissoes e concorrencia; build e verificacao Deno.
- Testes visuais e de fluxo com dados ficticios, incluindo fila offline e GPS/foto.
- Testes administrativos com banco SQLite temporario, separado da producao.
- Testes PWA para reabertura offline e sessao expirada.
- npm audit sem vulnerabilidades reportadas.
- Migracao aditiva no Supabase com RLS e acesso direto restrito ao service_role.
  Contagens de producao antes/depois: 8 solicitacoes, 0 pareceres, 7 perfis.
  Nenhum cadastro real foi criado, editado ou excluido pela auditoria.

As capturas estao em verification/ (ignorada no Git). O projeto Android
separado nao foi recompilado nesta entrega, voltada ao dashboard e portais web.
