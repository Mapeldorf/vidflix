import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { db } from '../db/init';
import type { AuthPayload } from '../middleware/auth.middleware';

const router = Router();

const COOKIE_NAME = 'vidflix_token';

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    sameSite: 'strict' as const,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    path: '/',
  };
}

// Rate limiting: 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error:
      'Demasiados intentos de inicio de sesión. Inténtalo de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting: 3 register attempts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: {
    error:
      'Demasiados intentos de registro. Inténtalo de nuevo en una hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

function isStrongPassword(password: string): boolean {
  // Min 8 chars, uppercase, lowercase, digit, special char
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,72}$/.test(password);
}

function sanitize(str: string): string {
  return String(str).trim().slice(0, 255);
}

function issueToken(userId: number, username: string, res: Response): void {
  const secret = process.env['JWT_SECRET']!;
  const payload: AuthPayload = { userId, username };
  const token = jwt.sign(payload, secret, { expiresIn: '8h' });
  res.cookie(COOKIE_NAME, token, cookieOptions());
}

// ─── POST /api/auth/register ───────────────────────────────────────────────
router.post(
  '/register',
  registerLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body ?? {};

    if (!username || !password) {
      res.status(400).json({ error: 'Todos los campos son obligatorios' });
      return;
    }

    const cleanUsername = sanitize(username);

    if (cleanUsername.length < 3 || cleanUsername.length > 30) {
      res.status(400).json({
        error: 'El nombre de usuario debe tener entre 3 y 30 caracteres',
      });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      res.status(400).json({
        error:
          'El nombre de usuario solo puede contener letras, números y guiones bajos',
      });
      return;
    }
    if (!isStrongPassword(password)) {
      res.status(400).json({
        error:
          'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial',
      });
      return;
    }

    try {
      // Check uniqueness
      const existing = db
        .prepare('SELECT id FROM users WHERE username = ?')
        .get(cleanUsername);
      if (existing) {
        res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const result = db
        .prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)')
        .run(cleanUsername, passwordHash);

      const userId = result.lastInsertRowid as number;
      issueToken(userId, cleanUsername, res);
      res.status(201).json({ user: { id: userId, username: cleanUsername } });
    } catch (err: unknown) {
      console.error('[register] error:', err);
      const message = err instanceof Error ? err.message : 'Error al registrar';
      res.status(500).json({ error: message });
    }
  }
);

// ─── POST /api/auth/login ──────────────────────────────────────────────────
router.post(
  '/login',
  loginLimiter,
  async (req: Request, res: Response): Promise<void> => {
    const { login, password } = req.body ?? {};

    if (!login || !password) {
      res.status(400).json({ error: 'Usuario y contraseña son obligatorios' });
      return;
    }

    const cleanLogin = sanitize(login);

    const user = db
      .prepare(
        'SELECT id, username, password_hash, is_active FROM users WHERE lower(username) = lower(?)'
      )
      .get(cleanLogin) as
      | { id: number; username: string; password_hash: string; is_active: number }
      | undefined;

    // Always run bcrypt to prevent timing attacks even when user doesn't exist
    const DUMMY_HASH = '$2b$12$invalidhashfortimingprotectionXXXXXXXXXXXXXXXXXXXXX';
    const hashToCheck = user?.password_hash ?? DUMMY_HASH;
    const passwordValid = await bcrypt.compare(password, hashToCheck);

    if (!user || !passwordValid || user.is_active === 0) {
      res.status(401).json({ error: 'Credenciales incorrectas' });
      return;
    }

    db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);
    issueToken(user.id, user.username, res);
    res.json({ user: { id: user.id, username: user.username } });
  }
);

// ─── POST /api/auth/logout ─────────────────────────────────────────────────
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  res.json({ message: 'Sesión cerrada correctamente' });
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────
router.get('/me', (req: Request, res: Response): void => {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    res.status(500).json({ error: 'Configuración del servidor incorrecta' });
    return;
  }

  const token = req.cookies?.[COOKIE_NAME];
  if (!token) {
    res.status(401).json({ error: 'No autenticado' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    res.json({
      user: { id: payload.userId, username: payload.username },
    });
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
});

export { router as authRouter };
