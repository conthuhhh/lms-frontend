/** Class CSS cho badge trình độ (chuỗi tự do hoặc beginner/intermediate/advanced cũ) */
export function levelBadgeClass(level) {
  const v = String(level || '').toLowerCase().trim();
  if (v === 'beginner' || v === 'intermediate' || v === 'advanced') {
    return `level level-${v}`;
  }
  return 'level level-custom';
}
