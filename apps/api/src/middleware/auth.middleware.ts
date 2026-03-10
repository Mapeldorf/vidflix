import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: number;
  username: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const secret = process.env['JWT_SECRET'];
  if (!secret) {
    res.status(500).json({ error: 'Configuración del servidor incorrecta' });
    return;
  }

  const token = req.cookies?.['vidflix_token'];
  if (!token) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
}
