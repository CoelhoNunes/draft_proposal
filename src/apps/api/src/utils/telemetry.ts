const counters = new Map<string, number>();

export function incrementCounter(name: string) {
  const current = counters.get(name) ?? 0;
  counters.set(name, current + 1);
}

export function getCounters() {
  return Object.fromEntries(counters);
}

export function resetCounters() {
  counters.clear();
}
