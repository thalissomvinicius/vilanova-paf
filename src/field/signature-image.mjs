const prefix = 'data:image/png;base64,';
const maxBytes = 1800000;

// Decode canvas output locally; fetching a data URL is blocked by our CSP.
export function signatureImageBlob(image) {
  const encoded = typeof image === 'string' && image.startsWith(prefix) ? image.slice(prefix.length) : '';
  if (!encoded || encoded.length > Math.ceil(maxBytes / 3) * 4 || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error('Confira o formato e tamanho da assinatura.');
  let decoded;
  try { decoded = atob(encoded); } catch { throw new Error('Confira o formato e tamanho da assinatura.'); }
  if (decoded.length > maxBytes) throw new Error('Confira o formato e tamanho da assinatura.');
  return new Blob([Uint8Array.from(decoded, character => character.charCodeAt(0))], { type: 'image/png' });
}
