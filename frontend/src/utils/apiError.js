export function getApiErrorMessage(err, fallback) {
  const msg = err?.response?.data?.error?.message;
  if (typeof msg === 'string' && msg.trim().length > 0) {
    return msg;
  }
  return fallback;
}
