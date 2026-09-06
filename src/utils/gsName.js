export function normalizeGsName(name) {
  if (!name) return '';
  return String(name).replace(/\s*\(\s*\d+\s*[A-Za-z]?\s*\)\s*$/, '').trim();
}
