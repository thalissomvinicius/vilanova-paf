# Sistema PAF

Plataforma da Vila Nova Agroindustrial para administrar o Programa de Agricultura Familiar. O sistema conecta gestão, equipe técnica, organizações parceiras e produtores em fluxos de cadastro, relatório, visita de campo, evidência, pendência, documento e abastecimento.

## Status

- Ambiente local: funcional para o piloto.
- PWA: disponível para administração, técnico e produtor.
- Android: projeto Capacitor e APK de depuração gerados.
- Produção: o frontend está na Vercel, mas a API aguarda um projeto Supabase exclusivo do PAF. Não use os projetos `SafeEPI` ou `Antares-EPI`.

## Tecnologias

- React 19, Vite 7 e Lucide React.
- Node.js 24, Express 5 e Socket.IO.
- SQLite no desenvolvimento local.
- PostgreSQL, Storage e Edge Functions no Supabase.
- Capacitor 8 e Android SDK 36.
- Playwright, Node Test Runner e Deno para testes.

## Estrutura

```text
android/                    projeto Android gerado pelo Capacitor
docs/                       guia operacional e plano do piloto
public/                     PWA, ícones e assets institucionais
releases/                   APK local, ignorado pelo Git
scripts/                    bootstrap e rotinas auxiliares
server/                     API local e persistência SQLite
src/                        aplicação React e estilos
supabase/functions/paf-api/ Edge Function de produção
supabase/migrations/        schema versionado do PostgreSQL
tests/                      testes de banco e E2E
```

## Instalação

Requisitos web: Node.js 24 ou superior.

```powershell
git clone https://github.com/thalissomvinicius/vilanova-paf.git
cd vilanova-paf
npm install
Copy-Item .env.example .env
```

Edite `.env` e defina uma senha administrativa forte. O arquivo é ignorado pelo Git. Sem `PAF_ADMIN_PASSWORD`, uma instalação nova gera uma senha temporária única e a mostra uma única vez no terminal.

```powershell
npm run dev
```

Abra `http://localhost:5173/admin`. Se `PORT` estiver definido no `.env`, use essa porta.

## Variáveis

Consulte [.env.example](./.env.example). As principais variáveis locais são:

- `PAF_ADMIN_USER`: login administrativo local.
- `PAF_ADMIN_PASSWORD`: senha inicial de uma base SQLite nova.
- `PAF_DB_PATH`: arquivo SQLite local.
- `PORT`: porta do servidor local.

`SUPABASE_SERVICE_ROLE_KEY` nunca pode usar o prefixo `VITE_`, aparecer no frontend ou entrar no Git. Ela é usada somente na Edge Function e no bootstrap administrativo.

## Perfis

- **Administrador:** painel, produtores, propriedades principais, técnicos, acessos, relatórios, visitas, pendências, documentos e abastecimento.
- **Técnico:** produtores vinculados, propriedade e comunidade, visita, GPS, fotos, observações, histórico e sincronização.
- **Organização:** mesmo portal técnico, com escopo para vários produtores.
- **Produtor:** relatório próprio, histórico permitido e visitas relacionadas ao seu cadastro.

As permissões são verificadas na API. Alterar a URL não concede acesso a outro perfil.

## Fluxo de campo

1. O administrador cadastra produtor, propriedade principal, comunidade e técnico.
2. O administrador cria acessos e define os vínculos de produtores.
3. O técnico entra em `/tecnico`, confirma produtor e propriedade e registra a visita.
4. GPS e até três fotos comprimidas podem ser anexados.
5. Sem internet, múltiplos relatórios e visitas permanecem no aparelho com estado visível; o último perfil autenticado pode ser reaberto offline por até 72 horas.
6. Quando a conexão volta, a fila reenvia cada item automaticamente com identificador idempotente.
7. O administrador acompanha visita, relatório, pendências e evidências no painel.

## Testes e qualidade

```powershell
npm test
npm run typecheck:edge
npm run test:e2e
npm run test:pwa
npm run build
npm run audit
```

Para incluir o login administrativo no E2E sem gravar senha:

```powershell
$env:PAF_E2E_ADMIN_PASSWORD="sua-senha-local"
npm run test:e2e
Remove-Item Env:PAF_E2E_ADMIN_PASSWORD
```

O comando `npm run check` executa testes do núcleo, da configuração de deploy, typecheck da Edge Function e build web. A suíte E2E também simula perda total de conexão, fechamento da tela, retorno da internet e retries para comprovar que múltiplos relatórios e visitas não somem nem duplicam. Ela valida ainda isolamento de perfis, revogação de sessão e ausência de erros de console ou API `5xx` nas áreas principais. `npm run test:pwa` valida o build de produção e confirma que o aplicativo de campo reabre sem internet depois do primeiro uso.

O deploy agenda uma consulta diária em `/api/health` para registrar atividade real no Supabase Free. O teste `test:deployment` protege essa configuração contra remoções acidentais. A rotina reduz o risco de pausa, mas somente um plano pago oferece garantia oficial contra suspensão por inatividade.

## Banco Supabase

Use um projeto exclusivo para o PAF. Aplique as migrations em ordem e não faça alterações de schema manualmente no painel:

```powershell
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
npx supabase functions deploy paf-api --no-verify-jwt
```

A função usa sessão HttpOnly própria, PBKDF2, limitação de tentativas, escopo por produtor, trilha de auditoria e bucket privado `paf-documents`. O gateway JWT fica desativado somente porque a autenticação é validada dentro da própria API.

Crie o primeiro administrador uma única vez:

```powershell
$env:SUPABASE_URL="https://SEU_PROJECT_REF.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="valor-somente-no-terminal"
$env:PAF_BOOTSTRAP_ADMIN_LOGIN="ADMIN"
$env:PAF_BOOTSTRAP_ADMIN_PASSWORD="senha-forte"
npm run bootstrap:admin
```

Remova as variáveis sensíveis do terminal depois do bootstrap.

## Deploy web

O `vercel.json` publica a SPA e encaminha `/api/*` para `paf-api`. Ao trocar o projeto Supabase, atualize o hostname do rewrite antes do deploy.

```powershell
npm run check
npm run audit
vercel --prod
```

Valide `/api/health`, `/admin`, `/tecnico`, `/produtor`, login, refresh, logout e uma gravação real após publicar.

## Android e APK

Requisitos: JDK 21 e Android SDK com plataforma 36. Configure `JAVA_HOME` e `ANDROID_HOME`.

```powershell
$env:JAVA_HOME="C:\caminho\para\jdk-21"
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
npm run android:apk
```

Saída padrão: `android/app/build/outputs/apk/debug/app-debug.apk`.

O APK do piloto abre `https://vilanova-paf.vercel.app`, portanto não depende do servidor local. Ele só deve ser distribuído depois que `/api/health` responder com sucesso no domínio publicado. Para loja ou distribuição definitiva, gere uma assinatura de release própria; nunca versione keystores.

## Importações

```powershell
npm run import
npm run import:fuel
```

Revise os dados antes e depois. Não importe planilhas de teste em produção.

## Solução de problemas

- **Login local não funciona:** confirme `PAF_ADMIN_USER`, a senha usada quando a base foi criada e o caminho em `PAF_DB_PATH`.
- **API publicada retorna 502:** confira o hostname Supabase no `vercel.json` e se a função `paf-api` foi publicada.
- **APK não compila:** use JDK 21, defina `ANDROID_HOME` e instale `platforms;android-36`.
- **GPS não funciona:** conceda localização ao navegador/app e teste em HTTPS ou no aplicativo Android.
- **Registro pendente:** mantenha o app aberto após recuperar a internet; o indicador muda de pendente para sincronizando e sincronizado.
- **Código de acesso perdido:** use a redefinição em **Acessos**. O código completo não é armazenado em texto puro.

## Segurança

- Nunca versionar `.env`, service role, senhas, códigos temporários ou keystores.
- Bloquear acessos desligados em vez de compartilhar contas.
- Manter RLS e grants restritos mesmo com toda escrita passando pela Edge Function.
- Revisar `git diff`, `npm audit` e os advisors do Supabase antes de cada produção.
