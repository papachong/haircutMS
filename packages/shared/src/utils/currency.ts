export function yuanToFen(yuan: number): number {
  return Math.round(yuan * 100);
}

export function fenToYuan(fen: number): number {
  return fen / 100;
}

export function formatPrice(fen: number): string {
  return `¥${(fen / 100).toFixed(2)}`;
}

export function formatCurrency(fen: number): string {
  return `¥${(fen / 100).toFixed(2)}`;
}
