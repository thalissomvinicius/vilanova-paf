# Relatorio de visitas no dashboard

- Abrir uma visita, selecionar **Baixar relatorio PDF**, conferir a previa e usar **Salvar PDF / imprimir**. O navegador oferece o destino Salvar como PDF.
- Modelo HTML/CSS derivado do renderer do app, com as mesmas logos e fontes. Fotos e assinaturas incorporadas como dados, sem expor URLs temporarias no arquivo emitido.
- Dados restritos ao acesso atual do Supabase. Nenhuma chave de servico, upload publico de evidencia ou gravacao em cadastros.
- Evidencias indisponiveis bloqueiam a emissao e oferecem nova tentativa. URLs assinadas renovadas em cada emissao. Assinaturas substituidas nao entram quando existe lista vigente no registro.
- Municipio, modalidade, autor original, parecer salvo, GPS e justificativa de deslocamento sao preservados. Quem emite aparece separado do tecnico autor.
- Previa responsiva; impressao A4 mantem o modelo do app. Navegadores podem adicionar cabecalhos/rodapes proprios conforme preferencias de impressao.

## Manutencao

O renderer portatil `src/field/visit-report.generated.mjs` e versionado porque o deploy Vercel so possui este repositorio. Com os dois projetos lado a lado, executar:

```sh
node scripts/sync-visit-report.mjs
node scripts/sync-visit-report.mjs --check
npm run test:field
npm run test:ui -- field-evidence.spec.js
```

O comando de verificacao falha se o modelo divergir do aplicativo. A geracao nao depende de APIs nativas.

Testes com dados ficticios cobrem desktop/mobile, fotos, assinaturas vigentes, GPS, modalidade, dados escapados, erro de imagem, nova tentativa e abertura da impressao. Nao foram alteradas visitas reais.
