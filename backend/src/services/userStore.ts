import type { User } from '../types/index.js';

const SIMULATED_DELAY_MS = 200;

const mockUsers: Map<number, User> = new Map([
  [1, { id: 1, name: 'John Doe', email: 'john@example.com' }],
  [2, { id: 2, name: 'Jane Smith', email: 'jane@example.com' }],
  [3, { id: 3, name: 'Alice Johnson', email: 'alice@example.com' }],
]);

let nextId = 4;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getUser(id: number): Promise<User | null> {
  await delay(SIMULATED_DELAY_MS);
  return mockUsers.get(id) ?? null;
}

export function addUser(name: string, email: string): User {
  const user: User = { id: nextId++, name: name.trim(), email: email.trim() };
  mockUsers.set(user.id, user);
  return user;
}
