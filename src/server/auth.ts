import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getAdminPasswordHash, updateAdminPasswordHash } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'blackline_secret_key_prod_8492049182390184';
const TOKEN_EXPIRY = '8h';

// Rate Limiter for Login Attempts
interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(ip: string): { allowed: boolean; waitMinutes?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record) return { allowed: true };

  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingMs = record.lockedUntil - now;
    const waitMinutes = Math.ceil(remainingMs / 60000);
    return { allowed: false, waitMinutes };
  }

  // Reset if window has expired
  if (now - record.firstAttemptAt > LOCKOUT_MS) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }

  return { allowed: true };
}

export function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, firstAttemptAt: now };

  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_MS;
  }
  loginAttempts.set(ip, record);
}

export function resetAttempts(ip: string) {
  loginAttempts.delete(ip);
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const currentHash = await getAdminPasswordHash();
  return bcrypt.compare(password, currentHash);
}

export async function setAdminPassword(newPassword: string): Promise<boolean> {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(newPassword, salt);
  return updateAdminPasswordHash(hash);
}

export function generateAdminToken(): string {
  return jwt.sign({ role: 'admin', user: 'admin' }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });
}

export interface AuthenticatedRequest extends Request {
  adminUser?: any;
}

export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Требуется авторизация администратора',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded && decoded.role === 'admin') {
      req.adminUser = decoded;
      return next();
    }
    return res.status(403).json({ error: 'Forbidden: Недостаточно прав' });
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'SessionExpired: Время сессии истекло, войдите повторно' });
    }
    return res.status(401).json({ error: 'InvalidToken: Недействительный токен авторизации' });
  }
}
