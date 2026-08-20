# Homologação de produção - 20 de agosto de 2026

## Ambiente

- Site: `https://vilanova-paf.vercel.app`
- Supabase: projeto `paf-vna` (`auisvfbloziehspzpnvg`)
- Edge Function: `paf-api` versão 5
- Cron preventivo: consulta diária em `/api/health`

## Validações executadas

- Login, sessão, refresh e logout do administrador.
- Abertura das nove áreas administrativas sem erro de console, API `5xx` ou overflow em desktop.
- Criação temporária de produtor, técnico e acessos vinculados.
- Login de produtor e bloqueio de rota administrativa.
- Envio repetido do mesmo relatório com persistência única.
- Login técnico e bloqueio de rota do produtor.
- Envio repetido da mesma visita com persistência única.
- Registro de GPS e foto no bucket privado `paf-documents`.
- Consulta do relatório, visita e evidência pelo administrador.
- Remoção do arquivo pelo Storage e limpeza dos dados temporários.

## Estado após a limpeza

- 364 produtores importados preservados.
- 1 administrador ativo.
- 0 produtores marcados como teste.
- 0 técnicos e acessos de campo temporários.
- 0 sessões, relatórios, visitas, pendências, documentos, arquivos ou abastecimentos de teste.

## Evidências técnicas

- Migrations e testes PostgreSQL aprovados no GitHub Actions.
- Build, testes de núcleo, E2E, PWA e auditoria de dependências aprovados.
- APK final do piloto assinado com SHA-256 `5093C9D88536E4FC4F26D5EB184AD3516D1F9FF4E0E545EDF9DA26519B9EB33E`.
- APK instalado no Android 15/API 35 e validado nos perfis administrador, produtor e técnico.
- GPS nativo do Capacitor validado com latitude `-2.4206733`, longitude `-48.15222` e precisão de 5 metros.

## Próxima etapa operacional

O sistema está tecnicamente liberado. A instalação no aparelho definitivo, a alternância entre 4G e modo avião e o aceite dos usuários serão registrados durante o primeiro piloto de campo.
