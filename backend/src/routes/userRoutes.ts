import { Router, type Router as RouterType } from 'express';
import * as userStore from '../services/userStore.js';
import * as cache from '../services/lruCache.js';
import * as coalescer from '../services/requestCoalescer.js';
import { enqueue } from '../services/requestQueue.js';
import type { User } from '../types/index.js';

export const userRouter: RouterType = Router();

// GET /users/:id
userRouter.get('/:id', async (req, res) => {
  const idParam = req.params.id;
  const id = Number(idParam);

  if (!Number.isInteger(id) || id < 1) {
    res.status(400).json({ error: 'Invalid user ID: must be a positive integer' });
    return;
  }

  const cacheKey = `user:${id}`;

  // Check cache first
  const cached = cache.get<User>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    // Use coalescer to prevent duplicate fetches, queue handles the actual fetch
    const user = await coalescer.coalesce(id, () => enqueue(id).then((u) => u as User | null));

    if (!user) {
      res.status(404).json({ error: `User with ID ${id} not found` });
      return;
    }

    cache.set(cacheKey, user);
    res.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    if (message.includes('not found')) {
      res.status(404).json({ error: message });
    } else {
      res.status(500).json({ error: message });
    }
  }
});

// POST /users
userRouter.post('/', (req, res) => {
  const { name, email } = req.body as { name?: string; email?: string };

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ error: 'Missing required field: name' });
    return;
  }

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    res.status(400).json({ error: 'Missing required field: email' });
    return;
  }

  if (!email.includes('@')) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  const user = userStore.addUser(name, email);
  cache.set(`user:${user.id}`, user);
  res.status(201).json(user);
});
