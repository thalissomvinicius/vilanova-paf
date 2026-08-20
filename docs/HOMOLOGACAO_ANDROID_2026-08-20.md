# Homologação Android - 20 de agosto de 2026

## Artefato

- Pacote: `br.com.vilanova.paf`
- Versão: `1.0` (`versionCode` 1)
- Android testado: Android 15/API 35, arquitetura x86_64
- APK: `VilaNova-PAF-piloto-debug.apk`
- SHA-256: `5093C9D88536E4FC4F26D5EB184AD3516D1F9FF4E0E545EDF9DA26519B9EB33E`
- Backend: `https://vilanova-paf.vercel.app`

## Validações executadas no APK instalado

- Instalação pelo Android Debug Bridge concluída com sucesso.
- Inicialização da `br.com.vilanova.paf.MainActivity` sem encerramento inesperado.
- Carregamento da identidade visual, imagens, fontes e tela de login pela URL de produção.
- Login administrativo e abertura das nove áreas do painel.
- Login do produtor, envio repetido do mesmo relatório e persistência de um único registro.
- Atualização do histórico do produtor depois da sincronização.
- Bloqueio do acesso do produtor às rotas administrativas.
- Login técnico e carregamento apenas do produtor vinculado.
- Captura de GPS pelo plugin nativo Capacitor Geolocation.
- Envio repetido da mesma visita e persistência de um único registro concluído.
- Atualização dos indicadores técnicos depois da sincronização.
- Bloqueio do acesso técnico às rotas administrativas.
- Visualização do relatório e da visita pelo administrador.
- Ausência de exceções JavaScript, falhas HTTP `5xx` ou encerramento do aplicativo durante a jornada.

## GPS obtido no Android

- Latitude: `-2.4206733`
- Longitude: `-48.15222`
- Precisão informada: 5 metros
- Origem: plugin `@capacitor/geolocation`

## Integridade e limpeza

Os dados temporários foram identificados por IDs e nomes exclusivos antes da exclusão. Após a homologação, foram removidos o produtor, o técnico, os dois acessos, o relatório, a visita, as sessões e os respectivos eventos de auditoria criados exclusivamente pelo teste.

Estado confirmado depois da limpeza:

- 364 produtores preservados.
- 1 administrador ativo.
- 0 técnicos e acessos temporários.
- 0 sessões abertas.
- 0 relatórios, visitas, documentos ou objetos temporários no Storage.

## Resultado

O APK está homologado tecnicamente e liberado para instalação no aparelho escolhido para o primeiro piloto de campo. A assinatura de depuração é adequada para distribuição controlada; uma publicação em loja exigirá keystore e assinatura de release próprias.
