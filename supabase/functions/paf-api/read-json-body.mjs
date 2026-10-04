export async function readJsonBody(request, { limit = 12000, timeoutMs = 15000 } = {}) {
  const fail = (message, status = 400) => Object.assign(new Error(message), { status });
  if (!request.headers.get('content-type')?.includes('application/json')) throw fail('Envie os dados em JSON.');
  if (Number(request.headers.get('content-length')) > limit) throw fail('Dados excedem o limite de envio.', 413);
  const reader = request.body?.getReader();
  if (!reader) throw fail('Dados invalidos.');
  let timer;
  const stop = () => { void reader.cancel().catch(() => {}); };
  try {
    return await Promise.race([
      new Promise((_, reject) => { timer = setTimeout(() => { stop(); reject(fail('O envio demorou mais que o esperado. Tente novamente.', 408)); }, timeoutMs); }),
      (async () => {
        const decoder = new TextDecoder();
        let content = '', size = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > limit) { stop(); throw fail('Dados excedem o limite de envio.', 413); }
          content += decoder.decode(value, { stream: true });
        }
        content += decoder.decode();
        let body;
        try { body = JSON.parse(content); } catch { throw fail('Dados enviados em formato invalido.'); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail('Dados invalidos.');
        return body;
      })()
    ]);
  } finally { clearTimeout(timer); }
}
