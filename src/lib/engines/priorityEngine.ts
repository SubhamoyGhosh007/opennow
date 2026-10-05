export function calculatePriority(impact: number, urgency: number): number {
  const matrix: Record<string, number> = {
    "1:1": 1, "1:2": 2, "1:3": 3,
    "2:1": 2, "2:2": 3, "2:3": 4,
    "3:1": 3, "3:2": 4, "3:3": 5,
  };
  return matrix[`${impact}:${urgency}`] ?? 4;
}
