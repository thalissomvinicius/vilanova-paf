# Vila Nova PAF System

Sistema de gestão do Programa de Agricultura Familiar da Vila Nova Agroindustrial. Reúne produtores, equipe técnica, relatórios de campo, visitas, pendências, documentos e abastecimento em uma operação com perfis e rastreabilidade.

## Produção

- Frontend: React + Vite publicado na Vercel.
- API: Supabase Edge Function `paf-api`.
- Banco: PostgreSQL do Supabase, com tabelas `paf_*` isoladas.
- Arquivos: bucket privado `paf-documents`.
- Segurança: sessão HttpOnly, PBKDF2, limitação de login, RLS, acesso somente pela API e trilha de auditoria.

Rotas públicas de entrada:

- `/admin`: equipe administrativa.
- `/tecnico`: técnicos e organizações responsáveis por vários produtores.
- `/produtor`: produtor individual.

O endereço `/` direciona para a tela de login, sem página institucional intermediária.

## Módulos

- Dashboard executivo com indicadores, evolução e alertas.
- Cadastro e busca de produtores e técnicos.
- Gestão de acessos: criar, editar, bloquear, excluir e redefinir código.
- Relatórios enviados pelo produtor e triagem administrativa.
- Visitas cadastradas e acompanhadas pela equipe técnica.
- Pendências operacionais com prioridade, responsável e vencimento.
- Documentos privados vinculados ao produtor.
- Abastecimento com motoristas, veículos, lançamentos, filtros e gráficos.

## Desenvolvimento local

```powershell
cd "C:\Users\thali\OneDrive\Desktop\PAF - SYSTEM\paf-web"
npm install
Copy-Item .env.example .env
npm run dev
```

Acesse `http://localhost:5180/admin`. O backend local usa SQLite em `data/paf.sqlite`; a senha definida em `PAF_ADMIN_PASSWORD` é gravada com hash na primeira inicialização e pode ser alterada pelo painel.

Importações locais opcionais:

```powershell
npm run import
npm run import:fuel
```

## Banco e Edge Function

O schema oficial está em `supabase/migrations/`. Não use SQL avulso de schema.

```powershell
npx supabase db push
npx supabase functions deploy paf-api --no-verify-jwt
```

`verify_jwt` fica desabilitado no gateway porque a função implementa autenticação própria por sessão. Todas as operações privadas validam perfil e escopo dentro da API.

### Primeiro administrador

Em um banco novo, aplique as migrations e execute o bootstrap uma única vez com as variáveis somente no terminal local:

```powershell
$env:SUPABASE_URL="https://seu-projeto.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="sua-service-role"
$env:PAF_BOOTSTRAP_ADMIN_LOGIN="ADMIN"
$env:PAF_BOOTSTRAP_ADMIN_PASSWORD="uma-senha-forte"
npm run bootstrap:admin
```

Remova essas variáveis do terminal após o uso. O script grava apenas o hash PBKDF2 e pode ser usado de forma explícita para recuperar ou rotacionar o administrador inicial.

O Edge Function aceita requisições com `Origin` apenas do domínio oficial. Domínios adicionais devem ser configurados no secret `PAF_ALLOWED_ORIGINS`, separados por vírgula; previews não recebem acesso implícito ao banco de produção.

## Qualidade

```powershell
npm run check
npm run audit
```

`npm run check` executa os testes do núcleo, a verificação de tipos do Edge Function e o build de produção.

## Deploy

O `vercel.json` encaminha `/api/*` para o Edge Function e mantém fallback SPA para as rotas do React. O push em `main` dispara a publicação do projeto vinculado na Vercel.

Nunca adicione senhas, service role ou códigos de produtores ao Git. Credenciais devem ser criadas e rotacionadas dentro do sistema.
