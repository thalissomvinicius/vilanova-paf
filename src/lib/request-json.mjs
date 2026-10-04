export async function requestJson(url, options = {}, prepareHeaders) {
  const { timeoutMs = 15000, signal: upstream, ...init } = options;
  const controller = new AbortController();
  let timer;
  let timedOut = false;
  let abort;
  const cancellation = new Promise((_, reject) => {
    abort = () => {
      controller.abort(upstream?.reason);
      reject(upstream?.reason ?? new DOMException('Request cancelled', 'AbortError'));
    };
    if (upstream?.aborted) abort();
    else upstream?.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      reject(new Error('A conexao demorou mais que o esperado. Tente novamente.'));
    }, timeoutMs);
  });
  try {
    // The deadline includes session lookup and the response body, not only headers.
    return await Promise.race([cancellation, (async () => {
      const headers = new Headers(init.headers);
      if (prepareHeaders) await prepareHeaders(headers);
      if (controller.signal.aborted) throw controller.signal.reason;
      const response = await fetch(url, { credentials: 'same-origin', ...init, headers, signal: controller.signal });
      if (response.status === 204 && response.ok) return {};
      let data;
      try { data = await response.json(); }
      catch {
        const error = new Error(response.ok ? 'Resposta inesperada do servidor. Atualize a pagina e tente novamente.' : 'Nao foi possivel concluir a solicitacao. Tente novamente.');
        error.status = response.status;
        throw error;
      }
      if (!response.ok) {
        const error = new Error(typeof data?.error === 'string' ? data.error : 'Nao foi possivel concluir a solicitacao. Tente novamente.');
        error.status = response.status;
        throw error;
      }
      if (!data || typeof data !== 'object') throw new Error('Resposta inesperada do servidor. Tente novamente.');
      return data;
    })()]);
  } catch (error) {
    if (timedOut) throw new Error('A conexao demorou mais que o esperado. Tente novamente.');
    if (error instanceof TypeError) throw new Error('Nao foi possivel conectar. Verifique sua internet e tente novamente.');
    throw error;
  } finally {
    clearTimeout(timer);
    upstream?.removeEventListener('abort', abort);
  }
}
