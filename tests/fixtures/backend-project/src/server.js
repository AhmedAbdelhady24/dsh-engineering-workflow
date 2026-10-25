export function calculateMetrics(data) {
  if (!Array.isArray(data)) throw new TypeError("data must be an array");
  return { count: data.length, sum: data.reduce((a, b) => a + b, 0) };
}
