# VNA Comunidade Piloto 1.10.1

Compilacao local de 16/09/2026. Nao publicada na internet.

## Arquivo

- Caminho: `releases/VNA-Comunidade-Piloto-v1.10.1.apk`.
- Tamanho: 40,68 MiB.
- SHA-256: `D0DAACD98CE97FCF33EFE76E6949AA2D09BC18FA289C362ABA1CF63891AEA050`.
- Pacote: `com.vilanova.vnacomunidade.piloto`.
- Versao Android: 1.10.1 / codigo 15.
- ABIs: arm64-v8a e armeabi-v7a; Android 7 ou posterior.
- Expo 57.0.23 / React Native 0.86.3.
- Assinatura de teste validada por apksigner, nao uma assinatura de producao.

O pacote separado permite instalar o piloto sem substituir o aplicativo original.
Nao desinstalar o original com registros pendentes. O piloto nao importa sua fila
local e usa o banco real do PAF, nao uma base de treinamento.

## Validacoes

- Compilacao Gradle de release aprovada.
- AAPT confirmou pacote, nome, versao e arquiteturas.
- Bundle do APK confirmou o destino `eeivxgbbslnojbbpzweb.supabase.co`.
- Auth real respondeu HTTP 200, com projeto ACTIVE_HEALTHY.
- Backend remoto do dashboard respondeu consulta de saude real.
- Expo Doctor: 21/21 itens, na configuracao padrao.
- Aplicativo: 55 testes Vitest e verificacao TypeScript aprovados.
- Dashboard: 20 testes de dominio/API/configuracao e 27 jornadas Playwright
  aprovados; os oito testes de experiencia foram repetidos apos o ultimo ajuste
  visual e de rotulos. Build web aprovado.
- Auditoria npm do dashboard sem alertas; aplicativo com 11 alertas moderados
  remanescentes na cadeia xcode/uuid, sem alertas altos ou criticos.
- Servidor local corrigido contra falha EBUSY ao monitorar APK no OneDrive;
  saude confirmada com um arquivo de release mantido sob bloqueio exclusivo.

## Primeiro Teste

1. Validar o e-mail do colaborador e o primeiro login online no piloto.
2. Concluir a troca obrigatoria de senha quando solicitada.
3. Conferir os produtores vinculados ao tecnico; nao usar um gestor para provar
   que um tecnico tem o escopo correto.
4. Registrar coleta com coordenadas e foto; fechar e reabrir o aplicativo.
5. Testar captura offline e envio apos reconexao, inclusive falha parcial de foto.
6. Acessar `/campo` no dashboard com uma conta autorizada e localizar a coleta.
7. Um gestor revisa; o tecnico recebe a decisao e eventual pedido de ajuste.
8. Conferir autoria, evidencias, reenvio e ausencia de duplicidades.

Esses passos em aparelho real nao foram homologados nesta entrega. O login do
dashboard operacional antigo continua separado do Auth VNA Comunidade. O plano
de convergencia e os limites da integracao estao em `FIELD-INTEGRATION.md`.
