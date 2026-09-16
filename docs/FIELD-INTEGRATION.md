# VNA Comunidade: integracao de campo

## Estado desta entrega

O dashboard possui uma area Coletas de campo em `/admin/coletas`, e um acesso independente da equipe em `/campo`. Ambos consultam o mesmo Supabase do APK VNA Comunidade, usando a identidade real do colaborador e as politicas RLS existentes.

O banco do aplicativo, `eeivxgbbslnojbbpzweb`, foi restaurado com autorizacao em 16/09/2026. Auth respondeu HTTP 200. Inventario exato: 204 produtores, 119 propriedades, 67 comunidades, 6 usuarios Auth, 11 versoes de formularios e nenhuma coleta/anexo recebidos. Esses numeros descrevem o momento da verificacao, nao uma constante da interface.

O banco operacional do dashboard principal continua separado (`auisvfbloziehspzpnvg`). A conta atual do plugin nao tem permissao administrativa nele. Nao houve migracao, fusao de produtores, redefinicao de senhas nem publicacao remota nesta entrega.

## Configuracao

Definir no ambiente de build Vite:

```dotenv
VITE_PAF_FIELD_URL=https://eeivxgbbslnojbbpzweb.supabase.co
VITE_PAF_FIELD_PUBLISHABLE_KEY=chave-publica-do-projeto
```

As variaveis locais estao em `.env.local`, ignorado pelo Git. Em um deploy, cadastrar as duas variaveis no ambiente de build e recompilar. Nunca usar service_role ou chave secret nessas variaveis. Se o projeto mudar, atualizar tambem os destinos explicitos de connect-src e img-src no CSP de `vercel.json`.

Os acessos sao distintos nesta fase:

- `/admin`: usuario e senha do dashboard operacional atual.
- `/campo`, ou Coletas de campo no dashboard: e-mail e senha do VNA Comunidade.
- `/produtor`: acesso individual do produtor pelo contrato atual do portal.

O login da equipe de campo inclui a troca obrigatoria da senha inicial. A sessao web fica em sessionStorage, com renovacao feita pelo SDK Supabase. Nao sao copiadas senhas entre sistemas.

## Fluxo implementado

1. Validacao do usuario Auth e de seu perfil PAF ativo, organizacao e papel.
2. Diretorios com paginacao explicita, preservando escopo RLS.
3. Coletas paginadas de 25 em 25, com busca por produtor, comunidade, propriedade, formulario ou tecnico; filtros de situacao, formulario/versao, tecnico e periodo.
4. Indicadores globais do escopo autorizado e atualizacao a cada 30 segundos enquanto a pagina estiver visivel.
5. Detalhamento das respostas versionadas, tecnico autor, data de recebimento, pontos GPS e anexos privados.
6. URLs de anexos assinadas por cinco minutos. Reabrir o detalhe renova as URLs.
7. Revisao por gestores, com nota obrigatoria para solicitar ajuste; comparacao de updated_at para evitar sobrescrever uma alteracao concorrente. O comando altera somente status, nota, revisor e data da revisao, nunca autor ou respostas.
8. Exportacao CSV da pagina atual, com protecao contra formulas em celulas. Nao equivale a exportacao de todo o banco.

Erros preservam a lista anterior e exibem acao de nova tentativa. Os dados de campo nao sao cacheados pelo service worker; as requisicoes Supabase estao fora de seu escopo de origem.

## Estrutura

- `src/field/client.js`: Auth, consultas com RLS, paginacao, evidencias e comandos de revisao.
- `src/field/model.mjs`: autorizacao de revisao, payload restrito, formatacao, CSV e validacao de coordenadas.
- `src/field/FieldWorkspace.jsx`: login, primeiro acesso, filtros, indicadores, tabela, detalhes e revisao.
- `src/components/AnimatedValue.jsx`: transicao numerica, com respeito a reduced-motion.
- `src/experience.css`: aparencia operacional, login e area de campo; sem alterar imagens originais.

O modulo de campo e carregado sob demanda, separado do bundle inicial do dashboard. Os componentes antigos permanecem no projeto para manter os contratos existentes; a decomposicao integral de `main.jsx` nao foi concluida nesta etapa.

## Ajustes do aplicativo

Codigo do aplicativo: `C:/Users/thali/Downloads/APK/vna-comunidade`.

- Autor da coleta separado de quem sincroniza/revisa; teste de regressao dedicado.
- Envio automatico da fila com debounce, trava de concorrencia e atraso progressivo apos falhas.
- Operacao automatica somente com perfil pronto, internet e aplicativo em primeiro plano. A fila tambem pode ser enviada manualmente.
- Recebimento periodico de revisoes, sem exigir uma nova sessao de login.
- Reconciliacao por snapshot para manter edicoes feitas durante um envio.
- Registros locais com erro nao sao substituidos por sua copia remota antiga.
- Caminho de foto nao e considerado confirmado quando upload ou cadastro do anexo falha; o reenvio permanece possivel.
- Falha de gravacao no aparelho exibe aviso, em vez de uma rejeicao de Promise silenciosa.
- Versoes alinhadas: app.json, package.json, lockfile e Gradle em 1.10.1 / codigo Android 15.
- Dependencias alinhadas aos patches do SDK 57: Expo 57.0.23, React Native 0.86.3 e bibliotecas nativas recomendadas. Expo Doctor aprovado em 21/21 itens. A versao anterior foi apontada pela ferramenta por uma regressao conhecida de Hermes; referencia: https://expo.dev/changelog/sdk-57#known-regressions . Isso nao demonstra que esse era o motivo de uma falha especifica no aparelho do usuario.

Essas alteracoes exigem instalacao da nova compilacao; reativar o banco, por si so, nao atualiza o APK instalado. A assinatura local nao corresponde ao APK 1.10.0, e a chave original nao foi localizada. Por isso, o piloto usa nome VNA Comunidade Piloto e pacote `com.vilanova.vnacomunidade.piloto`: instala ao lado do original, sem substituir sua sessao ou armazenamento. Os dados locais e as filas dos dois aplicativos sao separados. Nao desinstalar o original se houver registros nao enviados. O piloto utiliza o banco real do PAF: nao e um ambiente de dados ficticios.

O modo piloto e definido por `PAF_BUILD_VARIANT=pilot` em `app.config.js`. Sem essa variavel, o projeto conserva nome e pacote originais. Antes da distribuicao oficial, recuperar a chave original e configurar assinatura, copia segura e processo de release.

A compilacao entregue inclui `arm64-v8a` e `armeabi-v7a`, Android ARM de 64 e 32 bits. Nao foi criada uma variante x86 para emuladores. O arquivo de piloto fica na pasta `releases` do dashboard; nao esta publicado na internet nem enviado ao Git.

## Validacao

- Dashboard: testes de dominio de campo, API Edge, SQLite e configuracao de deploy.
- Playwright: login/layout em quatro tamanhos, fluxo de campo com respostas controladas, revisao sem alterar autor, reduced-motion e jornadas locais completas de operacao.
- Aplicativo: testes Vitest de autoria, reconciliacao e preservacao da fila; TypeScript.
- Consulta de saude real do Auth do aplicativo e do backend do dashboard.

Resultado final: 20 testes de dominio/API/configuracao e 27 testes Playwright aprovados no dashboard; 55 testes Vitest aprovados no aplicativo. Build web, verificacao TypeScript do aplicativo e verificacao Deno da API aprovados. A consulta local `/api/health` responde normalmente na porta 5174.

O servidor de desenvolvimento compartilha o WebSocket HMR com seu proprio servidor HTTP, permitindo portas simultaneas sem conflito. O watcher ignora APKs, releases, bancos locais, logs e resultados de verificacao. Isso corrige uma queda EBUSY observada ao copiar o APK para a pasta do OneDrive. Um teste manteve um APK temporario bloqueado com FileShare.None e confirmou saude antes, durante e apos o bloqueio. Nao foi necessario remover ou resetar a base local.

Os testes de campo no navegador usam respostas simuladas e nao criam registros ficticios no Supabase. Os testes operacionais locais completos usam uma base SQLite separada e senha gerada somente para a execucao. Nao substituem teste fisico em celular com GPS, camera e rede real.

### Dependencias E Seguranca

`npm audit` do dashboard: zero vulnerabilidades na ultima verificacao. No aplicativo, foram aplicadas atualizacoes compativeis de parsers, bundler e ferramentas e alinhados os patches oficiais do Expo. O resultado final ainda aponta 11 alertas moderados na cadeia de configuracao/compilacao, envolvendo `xcode`/`uuid`. Nao foram aplicadas as sugestoes de `audit fix --force`, que propunham trocar major ou retroceder versoes do framework. Os alertas nao foram ignorados: devem ser reavaliados no processo de release, considerando o caminho de uso real e as atualizacoes oficiais. Nao declarar a auditoria do aplicativo como zero vulnerabilidades.

## Trabalho restante para convergencia completa

1. Validar o e-mail e a conta usada pelo usuario no celular, sem pedir senha na conversa.
2. Homologar login online/offline, captura real, fechamento/reabertura, envio e devolucao em dois aparelhos/perfis.
3. Obter acesso administrativo ao Supabase do dashboard para comparar cadastros e duplicidades.
4. Definir banco canonico e identidade unica da equipe; versionar mapeamentos UUID/ID numerico e migracao com backup e reversao.
5. Unificar produtores, propriedades, atribuicoes, visitas e acessos sem dual-write nao coordenado.
6. Paginar/incrementar tambem as consultas antigas do aplicativo antes de ultrapassar o limite configurado da Data API.
7. Fortalecer recuperacao de armazenamento local corrompido e revogacao de acesso offline conforme politica operacional.
8. Configurar monitoramento de disponibilidade dos dois bancos; o cron atual monitora apenas o dashboard. Evitar registros ficticios em tabelas de negocio e nao prometer que uma rotina elimina toda possibilidade de pausa Free.
9. Publicar a nova versao web somente apos configurar as variaveis e aprovar o deploy; distribuir APK de piloto antes de producao.

Advisor de seguranca do banco restaurado: alerta de protecao contra senhas vazadas desativada, sem outros avisos na verificacao. Conferir disponibilidade no plano antes de alterar: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .
# Registro historico: a consolidacao publicada esta em CONSOLIDACAO-2026-09-16.md.
