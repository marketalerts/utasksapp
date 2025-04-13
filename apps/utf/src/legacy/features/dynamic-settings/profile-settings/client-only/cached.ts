export function safeRead<T>(key: string, defaultValue: T) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return defaultValue;
  }
}