export function keyboardTabIndex(key: string, currentIndex: number, total: number): number | null {
  if (total < 1) return null;
  if (key === "Home") return 0;
  if (key === "End") return total - 1;
  if (key === "ArrowRight" || key === "ArrowDown") return (currentIndex + 1) % total;
  if (key === "ArrowLeft" || key === "ArrowUp") return (currentIndex - 1 + total) % total;
  return null;
}
