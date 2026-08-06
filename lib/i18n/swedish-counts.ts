/** Swedish singular/plural count labels for public editorial surfaces. */

function safeCount(count: number): number {
  return Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
}

export function formatArticleCountLabel(count: number): string {
  const n = safeCount(count);
  return n === 1 ? "1 artikel" : `${n} artiklar`;
}

export function formatCommentCountLabel(count: number): string {
  const n = safeCount(count);
  return n === 1 ? "1 kommentar" : `${n} kommentarer`;
}

export function formatReplyCountLabel(count: number): string {
  const n = safeCount(count);
  return n === 1 ? "1 svar" : `${n} svar`;
}
