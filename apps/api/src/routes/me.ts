import { Router } from 'express';
import type { AuthRequest } from '../lib/auth.js';

export const meRouter = Router();

meRouter.get('/', (req: AuthRequest, res) => {
  res.json({ user: req.user });
});
