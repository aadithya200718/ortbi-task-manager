export interface TokenStorage {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}

export async function restoreSession<T>(storage: TokenStorage, loadUser: () => Promise<T>) {
  const token = await storage.get();
  if (!token) return { token: null, user: null };
  return { token, user: await loadUser() };
}
