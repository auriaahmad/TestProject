import type { User, QueueItem } from '../types/index.js';
import { getUser } from './userStore.js';

const queue: QueueItem[] = [];
let isProcessing = false;

export function enqueue(userId: number): Promise<User> {
  return new Promise<User>((resolve, reject) => {
    queue.push({ userId, resolve, reject });
    if (!isProcessing) {
      processQueue();
    }
  });
}

async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  while (queue.length > 0) {
    const item = queue.shift()!;
    try {
      const user = await getUser(item.userId);
      if (user) {
        item.resolve(user);
      } else {
        item.reject(new Error(`User with ID ${item.userId} not found`));
      }
    } catch (err) {
      item.reject(err instanceof Error ? err : new Error(String(err)));
    }
  }

  isProcessing = false;
}
