# PAF: andamento da integracao

## Implementado

- Identidade vinculada entre produtores do dashboard e do aplicativo, com conferência explícita dos nomes conflitantes.
- Ficha do produtor com propriedades, visitas, pendências, documentos e solicitações de análise.
- Análise em página própria: cadastro, parecer público, responsável, prazo, próxima ação, checklist e notas internas.
- Edição com controle de versão, exclusão confirmada e arquivamento sem eliminar a consulta por protocolo.
- Dashboard operacional com filtros, indicadores, fila, agenda e distribuição de trabalho.
- Visitas e pendências do dashboard gravadas nas tabelas nativas consumidas pelo aplicativo.
- Formulários em duas etapas e modais com rolagem interna; ajuste do cabeçalho e dos campos no celular.
- App: datas completas com ano; erros de data não viram silenciosamente a data de hoje.
- App: concluir uma tarefa preserva autor, atribuição, descrição e horário exato do prazo.
- App: atividades, tarefas, publicações e eventos são baixados em páginas, sem o truncamento padrão em mil registros.
- App: cadastros, coletas, GPS, fotos e perfis também usam paginação e escopo explícito por organização.
- Coordenação/supervisão acompanha toda a organização, sem administrar logins, excluir análises ou alterar identidades.
- Novos cadastros administrativos têm chave de reenvio idempotente; alterações mantêm controle de concorrência.
- Indicadores usam o dia local de Belém e excluem análises concluídas da fila ativa.
- Cache ilegível do app bloqueia a abertura e a gravação automática; não é substituído por dados vazios.
- Correção do breakpoint do menu em notebooks: conteúdo deixa de ocupar uma coluna estreita entre 1000 e 1100 px.

## Estado de publicacao

As migrations `20260929230000_unified_operations` e `20260929231000_operations_api` foram aplicadas em transação no projeto `eeivxgbbslnojbbpzweb`. A API dessa etapa foi implantada, preservando a configuração anterior de autenticação.

Existe uma cópia privada de 16 tabelas em `data/backups/`, ignorada pelo Git. Ela não inclui todo o Auth e os arquivos do Storage e não substitui um backup completo com restauração comprovada.

O acesso administrativo foi restabelecido. As migrations de atividade, confiabilidade, consistência de edição e permissões (`20260930003000`, `20260930004500`, `20260930010000`, `20260930011000`) foram ensaiadas com rollback e aplicadas no mesmo projeto. A API atualizada foi implantada em 30/09/2026. Frontends seguem para publicação via GitHub/Vercel; confirmar a publicação pelos arquivos efetivamente servidos, não somente pelo push.

O APK PAF VNA 1.10.4, código 18, foi compilado e sua assinatura verificada. Usa assinatura de testes e conserva o pacote `.piloto` para compatibilidade com as versões de homologação anteriores. Não substitui a instalação original assinada com outra chave. Não desinstalar versões com registros pendentes.

App: commit `6752776de482086277ef77d7fa5bc5f21a13a1d4`, deploy Vercel confirmado. O bundle de produção contém a proteção do cache e aponta para o banco PAF, sem referência ao banco antigo. Hashes de builds local e Vercel diferem; a identificação foi confirmada pelo status do commit e pelas alterações servidas.

APK: https://github.com/thalissomvinicius/vna-comunidade-paf-dashboard/releases/download/paf-vna-1.10.4-homologacao/PAF-VNA-1.10.4-homologacao.apk . SHA-256: `10f4dea49f0d9ef47e74b3db3ec64010920ce2c5781ecf0529024a004e4d2908`.

Contagens verificadas: 445 produtores nativos ativos, 427 cadastros legados e 412 vínculos; duas solicitações não arquivadas. Identidades divergentes continuam preservadas para conferência. O script `scripts/paf-database.mjs` realiza backup de dados e aplicação transacional; não executá-lo contra outro projeto sem revisar o identificador.

## Verificacao local

- Dashboard: 38 testes de domínio, autenticação, banco local, configuração e operações aprovados; checagem Deno e build Vite aprovados.
- Interface: 53 testes aprovados, com cadastro público, consulta, parecer, exclusão, acessos, filas offline, dashboard e criação/edição de visitas e tarefas. Suite completa executada com base isolada e sem testes ignorados.
- PWA: três cenários de abertura offline e expiração de sessão aprovados.
- App: 66 testes aprovados; TypeScript, exportação web e compilação Android verificados.
- Migrations históricas consolidadas: criação e reset completos do banco local aprovados; 35 testes SQL passaram.
- Auditoria de dependências: nenhuma vulnerabilidade reportada nos dois projetos.

Os testes de navegador combinam APIs simuladas e servidor/banco locais. Eles não certificam o uso em celular físico nem a operação ponta a ponta com usuários reais do Supabase. A conferência remota confirmou health 200, rotas privadas sem autenticação retornando 401, contagens preservadas e zero grants anônimos nas tabelas operacionais.

## Pendencias para a primeira versao oficial

1. Concluir a publicação integrada e verificar as operações no banco real.
2. Homologar permissões reais de administração, coordenação, técnicos e parceiros. Alcance do coordenador já definido: organização inteira.
3. Testar restauração completa de banco, Auth e arquivos; criação de schema do zero já verificada.
4. Resolver identidades conflitantes com conferência dos responsáveis; não vincular automaticamente pessoas com nomes diferentes.
5. Criptografar o cache operacional e disponibilizar recuperação assistida de fila corrompida; proteção contra sobrescrita já implementada.
6. Homologar reenvios administrativos sob falhas reais de rede; idempotência transacional já implementada e testada.
7. Reconciliar totais filtrados com exportações da base única; fila e fuso já corrigidos.
8. Completar timeline de mudanças internas e centralizar documentos/anexos no histórico unificado.
9. Validar chave oficial, atualização sem perda de fila, fotos, GPS, modo avião e reinício em aparelho físico. APK identificável de homologação já gerado.
10. Homologar com dois técnicos e supervisão antes de ampliar para toda a equipe.
11. Definir responsáveis, retenção e canal de atendimento de privacidade; o formulário de autorização não encerra essas obrigações.

Mapas poligonais, notificações externas e integrações financeiras/industriais ficam depois do núcleo confirmado. Não atribuir percentual de conclusão sem critérios de aceite e evidências por etapa.
