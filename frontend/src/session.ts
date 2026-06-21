const KEY = 'devknowledge-session-id';

export function getSessionId(): string {
  const current = sessionStorage.getItem(KEY);
  if (current) return current;
  const created = crypto.randomUUID();
  sessionStorage.setItem(KEY, created);
  return created;
}

