import { Request, Response, NextFunction } from 'express';
import { AuthPort } from '../../../application/ports/AuthPort.js';
import { AuthContext } from '../../../domain/auth/AuthContext.js';

export interface AuthenticatedRequest extends Request {
  authContext?: AuthContext;
}

export function authMiddleware(authPort: AuthPort) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Extrai credenciais
      const apiKey = req.headers['x-api-key'] as string;
      const authHeader = req.headers.authorization;

      let tenantId: string | undefined;
      let userId: string | undefined;

      // Autentica com API Key
      if (apiKey) {
        const apiKeyInfo = await authPort.validateApiKey(apiKey);
        if (!apiKeyInfo) {
          return res.status(401).json({ error: 'Invalid API key' });
        }

        tenantId = apiKeyInfo.tenantId;
        userId = apiKeyInfo.userId;
      }
      // Autentica com JWT
      else if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = await authPort.validateToken(token);

        if (!payload) {
          return res.status(401).json({ error: 'Invalid or expired token' });
        }

        tenantId = payload.tenantId;
        userId = payload.userId;
      }
      // Sem autenticação
      else {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Constrói AuthContext
      const authContext = await authPort.buildAuthContext(tenantId, userId);
      req.authContext = authContext;

      next();
    } catch (error: any) {
      console.error('Auth middleware error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function optionalAuthMiddleware(authPort: AuthPort) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const apiKey = req.headers['x-api-key'] as string;
      const authHeader = req.headers.authorization;

      if (!apiKey && !authHeader) {
        return next();
      }

      let tenantId: string | undefined;
      let userId: string | undefined;

      if (apiKey) {
        const apiKeyInfo = await authPort.validateApiKey(apiKey);
        if (apiKeyInfo) {
          tenantId = apiKeyInfo.tenantId;
          userId = apiKeyInfo.userId;
        }
      } else if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = await authPort.validateToken(token);

        if (payload) {
          tenantId = payload.tenantId;
          userId = payload.userId;
        }
      }

      if (tenantId) {
        const authContext = await authPort.buildAuthContext(tenantId, userId);
        req.authContext = authContext;
      }

      next();
    } catch (error: any) {
      console.error('Optional auth middleware error:', error);
      next();
    }
  };
}
