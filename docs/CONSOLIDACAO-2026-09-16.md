# Consolidacao PAF

Esta atualizacao substitui o estado transitorio descrito em FIELD-INTEGRATION.md.

## Banco e identidade

- Banco unico ativo: Supabase PAF `eeivxgbbslnojbbpzweb`.
- API do dashboard: Edge Function `paf-api` neste mesmo projeto.
- Contas de equipe: Supabase Auth + `paf_perfis`, as mesmas do VNA Comunidade.
- Administradores e super administradores ativos, da organizacao vinculada ao painel, podem autenticar com e-mail. Perfis bloqueados ou com troca inicial pendente nao entram na API administrativa.
- O login administrativo anterior permanece disponivel, preservando a credencial existente. Contas do portal de produtores continuam com seus codigos e escopos operacionais.
- `/admin/acessos` agrega portal de produtores e equipe; `/campo/acessos` abre a gestao da equipe diretamente.
- Cadastro, edicao, bloqueio, reativacao e redefinicao de senha. Senhas temporarias apenas em memoria; nenhuma senha gravada nos logs de auditoria.
- Protecao de hierarquia no banco, transacao com concorrencia otimista e preservacao de autoria. O bloqueio remove o acesso remoto; um aparelho desconectado nao recebe revogacao instantanea.

## Dados preservados

Exportacao autenticada do sistema anterior: 364 produtores; zero tecnicos operacionais, contas de produtores, relatorios, visitas, tarefas, documentos e abastecimentos. Backup privado em `data/backups/legacy-export-*.json`, ignorado pelo Git.

Os 364 registros mantiveram IDs, tokens e campos. Os 204 produtores existentes do aplicativo, propriedades, comunidades, perfis e formularios foram preservados. Existem 108 correspondencias por CPF, sete repeticoes de CPF no legado e quatro CPFs com tamanho inconsistente. Nao foram mescladas identidades automaticamente: tabelas de cadastro do app e de processo administrativo permanecem distintas no mesmo banco, ate reconciliacao dos conflitos com a equipe. Isso evita perda de historico ou associacao incorreta de familias.

O banco anterior nao foi apagado. O frontend nao depende mais dele. A consulta diaria `/api/health` agora opera no banco PAF; disponibilidade no plano Free nao e garantida por essa rotina.

## Dependencias e validacao

Os 11 alertas npm do aplicativo vinham de uuid em xcode. Override limitado a xcode/uuid 11.1.1, mantendo Expo 57/RN 0.86; teste de geracao dos identificadores Xcode, Vitest, TypeScript e Expo Doctor. Auditoria npm: zero nos dois projetos.

Testes de interface incluem criacao/edicao/bloqueio/redefinicao com respostas controladas. Teste SQL real de bloqueio, auditoria, protecao do proprio acesso e escopo revogado, integralmente revertido por ROLLBACK. Nao substitui homologacao fisica de GPS, camera e offline no aparelho.

## Reversao

O backup e a base antiga permanecem intactos. Nao apontar o frontend de volta ao banco antigo depois de receber novos registros sem reconciliar os deltas. Restaurar uma versao anterior apenas do frontend tambem exige verificar compatibilidade de autenticacao.
