# PAF System

Sistema web local para gerenciar produtores do PAF, enviar acessos individuais e receber relatórios em tempo real.

## Rodar localmente

```powershell
cd "C:\Users\thali\OneDrive\Desktop\PAF - SYSTEM\paf-web"
npm install
npm run import
$env:PORT="5180"; npm run dev
```

Depois acesse:

- Painel administrativo: `http://localhost:5180/admin`
- Portal do produtor: `http://localhost:5180/produtor`

## Login administrativo

Padrão local:

- Login: `admin`
- Senha: `paf2027`

Antes de usar em produção ou rede externa, defina:

```powershell
$env:PAF_ADMIN_USER="seu-login"
$env:PAF_ADMIN_PASSWORD="sua-senha-forte"
$env:PORT="5180"
npm run dev
```

## Fluxo de uso

1. Importe a planilha com `npm run import`.
2. Entre no painel administrativo.
3. Abra a área `Logins`.
4. Copie a mensagem individual ou exporte todos os logins em CSV.
5. Envie o login e código para cada produtor.
6. O produtor acessa `/produtor`, preenche o relatório e envia.
7. O painel atualiza os indicadores e a área `Relatórios`.

## Base local atual

Enquanto a base definitiva não está vinculada, os dados ficam em:

```text
paf-web/data/paf.sqlite
```

É possível apontar para outro arquivo SQLite com:

```powershell
$env:PAF_DB_PATH="C:\caminho\paf.sqlite"
```

## Estrutura preparada para trocar a base

Toda leitura e escrita passam por:

```text
paf-web/server/db.mjs
```

Quando chegar a hora de vincular PostgreSQL, Supabase, SQL Server ou outra base, a troca fica concentrada nesse módulo e nas variáveis de ambiente, mantendo as telas e rotas principais.

## Planilha importada

A importação usa a aba `Plan1`, com:

- Nome
- CPF
- Endereço
- Agência
- Tamanho da área em hectares
- Status do processo
- Ano de plantio
- Projetista

Cada produtor recebe um login no formato `PAF-0002` e um código de acesso.

## Comandos úteis

```powershell
npm run import
npm run build
npm audit --omit=dev
```
