# Redesign dos acessos PAF VNA

## Entrega

- Administração, produtor, técnico e equipe de campo usam a mesma composição e componentes de acesso.
- Painel claro sem card flutuante, faixa institucional verde, fotografia inteira, tipografia consistente, campos de 56 px e foco visível.
- Usuário e senha começam vazios, exceto o login de produtor explicitamente enviado pelo link existente.
- Mostrar/ocultar senha, bloqueio durante envio, erros junto ao formulário e links de acesso preservados.
- Animação de entrada de 200 ms e interações de 160 ms, com respeito à preferência de movimento reduzido.
- Em celulares baixos, a fotografia decorativa é ocultada para priorizar o formulário. Rolagem continua disponível quando necessária para teclado, zoom ou mensagens extensas.
- Login do app acompanha a identidade visual, inclui área segura, rolagem para controles alcançáveis e botão de avanço do teclado para a senha.
- Nenhuma mudança em banco, credenciais, permissões ou regras de acesso nesta entrega.

## Verificação

- 19 testes de interface do dashboard aprovados, incluindo acessos, erros, teclado, escopo e uso de telas internas.
- 38 testes de domínio, autenticação e configuração do dashboard aprovados.
- Três testes PWA de abertura offline e sessão expirada aprovados.
- 66 testes do app aprovados e TypeScript sem erros.
- Auditoria do login do app aprovada em 320, 390, 768, 1024 e 1440 px, sem overflow horizontal.
- Builds Vite, Expo web e Android aprovados; dependências sem vulnerabilidades reportadas.

## APK

PAF VNA 1.10.5, código 19, ARM32/ARM64. Commit do app: `22ecf7dc49ff13f85de4f3459e33d85402ad4e17`.

SHA-256: `15b225ae0901ba1a76733d07ab57c8cbbbc2df2652fd2b25ae6242760751ed77`.

Assinatura de homologação verificada, com a mesma chave de testes da edição 1.10.4. O pacote de homologação foi preservado. A chave oficial da instalação original continua pendente; não desinstalar uma versão com dados não sincronizados.

Download: https://github.com/thalissomvinicius/vna-comunidade-paf-dashboard/releases/download/paf-vna-1.10.5-homologacao/PAF-VNA-1.10.5-homologacao.apk

Os ensaios de interface do app foram feitos na versão web. Teclado nativo, leitor de tela e atualização devem ser homologados em aparelho físico; não há certificação de teste em celular nesta entrega.
