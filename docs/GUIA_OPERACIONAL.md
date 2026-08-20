# Guia operacional do PAF System

Este guia descreve o uso diário do sistema da Vila Nova Agroindustrial. Ele não contém senhas, chaves ou códigos de acesso.

## Endereços

- Produção: `https://vilanova-paf.vercel.app`
- Administração: `https://vilanova-paf.vercel.app/admin`
- Equipe técnica e organizações: `https://vilanova-paf.vercel.app/tecnico`
- Produtor individual: `https://vilanova-paf.vercel.app/produtor`
- Ambiente local: `http://localhost:5173/admin` (ou a porta definida no `.env`)

## Perfis e responsabilidades

### Administrador PAF

- Mantém produtores, técnicos e acessos.
- Analisa relatórios recebidos e registra o retorno técnico.
- Acompanha visitas, pendências, documentos e indicadores.
- Cadastra veículos, motoristas e lançamentos de abastecimento.
- Bloqueia ou exclui acessos que não devem mais entrar no sistema.

### Técnico ou organização

- Entra pelo Portal da Equipe Técnica.
- Visualiza somente os produtores vinculados ao seu acesso.
- Confirma propriedade e comunidade, registra GPS, fotos e atualiza visitas técnicas.
- Uma organização, como uma cooperativa, pode receber vários produtores no mesmo acesso.

### Produtor

- Entra pelo Portal do Produtor.
- Possui um acesso individual vinculado a um único cadastro.
- Envia relatórios de produção e acompanha relatórios e visitas já registrados.

## Implantação inicial

1. Entre como administrador e altere a senha temporária em **Alterar senha**.
2. Abra **Cadastros** e revise produtores, propriedade principal e comunidade.
3. Cadastre os técnicos responsáveis.
4. Abra **Acessos** e crie primeiro os acessos da equipe técnica e das organizações.
5. Vincule a cada técnico ou organização apenas os produtores sob sua responsabilidade.
6. Crie os acessos individuais dos produtores conforme o início da operação.
7. Envie login, código e endereço do portal por um canal privado.
8. Cadastre veículos e motoristas antes do primeiro lançamento de abastecimento.

## Como criar um acesso

1. Acesse **Acessos** e selecione **Novo acesso**.
2. Escolha o tipo correto: produtor, técnico ou organização.
3. Informe nome e login.
4. Se o código ficar vazio, o sistema gera um código forte automaticamente.
5. Selecione o produtor individual ou os produtores da equipe.
6. Revise a permissão exibida para aquele tipo de portal.
7. Salve e copie a credencial exibida naquele momento.

O código completo não volta a aparecer. Quando necessário, use **Redefinir código**. Para suspender uma pessoa sem apagar o histórico, desmarque **Acesso ativo**. Use **Excluir acesso** somente quando a conta não deve permanecer cadastrada.

## Fluxo diário recomendado

1. Consulte o **Painel** e observe pendências, visitas e produtores sem retorno.
2. Abra **Relatórios** e filtre os registros pendentes de análise.
3. Registre a análise e o retorno técnico.
4. Quando houver necessidade de campo, crie uma pendência e encaminhe a visita à equipe responsável.
5. O técnico confirma a propriedade, registra a visita, GPS e evidências e atualiza o andamento até a conclusão.
6. Quando houver perda de conexão, continue registrando visitas ou o relatório. O aparelho mantém a sessão por até 72 horas e sincroniza cada item pendente automaticamente quando a conexão voltar.
7. Use **Documentos** para anexar comprovantes e evidências ao produtor correto.
8. Finalize ou cancele pendências que não exigem mais ação.

## Abastecimento

1. Cadastre os motoristas.
2. Cadastre os veículos e vincule o motorista responsável quando aplicável.
3. Use **Novo lançamento** para registrar um abastecimento manual.
4. Use **Importar planilha** apenas para arquivos `.xlsx` ou `.xlsm` no formato operacional.
5. Revise os indicadores de litros, quilometragem e consumo antes de usar os dados em decisões.

O ambiente de produção começa sem lançamentos, veículos ou motoristas. Isso evita misturar dados de demonstração com a operação real.

## Regras de qualidade dos dados

- Pesquise CPF ou nome antes de cadastrar um produtor para evitar duplicidade.
- Não compartilhe uma conta individual entre produtores.
- Não vincule todos os produtores a uma organização por conveniência.
- Registre datas, responsáveis e observações de forma objetiva.
- Mantenha relatório, visita, pendência e documento vinculados ao mesmo produtor.
- Prefira bloquear acesso a apagar histórico operacional.

## Segurança

- Nunca envie a senha administrativa junto com o link do sistema em canal público.
- Troque a senha administrativa após a primeira entrada e sempre que houver suspeita de exposição.
- Redefina o código quando um produtor ou técnico perder a credencial.
- Revise periodicamente a lista de acessos bloqueados e ativos.
- Não coloque `SUPABASE_SERVICE_ROLE_KEY`, tokens ou senhas em arquivos do Git.
- Use somente o domínio oficial da Vercel para a operação de produção.

## Publicação e qualidade

O branch `main` publica automaticamente o frontend na Vercel. Antes de qualquer envio, execute:

```powershell
npm run check
npm run audit
npm run test:e2e
npm run test:pwa
```

O GitHub Actions valida a aplicação, as jornadas administrativas e de campo, a abertura offline do PWA, recria um Supabase limpo, reaplica todas as migrations e executa os testes transacionais do banco.

## Continuidade no plano gratuito

- A Vercel chama `/api/health` diariamente às `09:17 UTC` (`06:17` em Brasília).
- A rota executa uma consulta real e somente leitura em `paf_producers`, suficiente para registrar atividade sem criar dados artificiais.
- O agendamento começa a funcionar somente depois que o novo Supabase PAF estiver vinculado e o deploy estiver saudável.
- A equipe deve conferir semanalmente o retorno de `/api/health` e os avisos enviados pelo Supabase ao proprietário do projeto.
- Essa rotina reduz o risco de suspensão por baixa atividade, mas o plano Free continua sem garantia de disponibilidade. Somente o plano Pro elimina oficialmente a pausa automática por inatividade.

## Checklist de entrada em produção

- [ ] Senha administrativa temporária alterada.
- [ ] Técnicos cadastrados e revisados.
- [ ] Organizações cadastradas com escopo correto.
- [ ] Primeiro grupo de produtores recebeu acesso individual.
- [ ] Veículos e motoristas reais cadastrados.
- [ ] Responsável por analisar relatórios definido.
- [ ] Responsável por pendências e documentos definido.
- [ ] Equipe orientada a bloquear acessos desligados.
- [ ] Primeiro relatório e primeira visita validados de ponta a ponta.
- [ ] Rotina de revisão semanal dos indicadores combinada.
