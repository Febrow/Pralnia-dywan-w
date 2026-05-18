import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  // Pierwsza placówka, do której user ma membership (najczęściej jedyna)
  primaryBranchId: string | null;
  primaryBranchType: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}
export function signToken(payload: { id: string; role: string }) {
  return jwt.sign(payload, SECRET, { expiresIn: '12h' });
}

export async function loadUser(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { memberships: { include: { branch: true }, take: 1 } },
  });
  if (!user || !user.isActive) return null;
  const membership = user.memberships[0];
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    primaryBranchId: membership?.branchId ?? null,
    primaryBranchType: membership?.branch?.type ?? null,
  };
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Wymagane logowanie' });
  }
  const token = auth.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET) as { id: string };
    const user = await loadUser(decoded.id);
    if (!user) return res.status(401).json({ error: 'Konto wyłączone' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Niepoprawny token' });
  }
}

export function requireRoles(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Wymagane logowanie' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }
    next();
  };
}
