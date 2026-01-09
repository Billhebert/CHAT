import { Router } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { CreateChat } from '../../../application/usecases/CreateChat.js';
import { AddMember } from '../../../application/usecases/AddMember.js';
import { SendMessage } from '../../../application/usecases/SendMessage.js';

export function createChatRoutes(
  createChat: CreateChat,
  addMember: AddMember,
  sendMessage: SendMessage
): Router {
  const router = Router();

  /**
   * POST /chats
   * Cria um novo chat
   */
  router.post('/', async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.authContext) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { title, systemPrompt, settings } = req.body;

      if (!title) {
        return res.status(400).json({ error: 'title is required' });
      }

      const result = await createChat.execute(req.authContext, {
        title,
        systemPrompt,
        settings,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /chats/:chatId/members
   * Adiciona um membro ao chat
   */
  router.post('/:chatId/members', async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.authContext) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { chatId } = req.params;
      const { userId, role, permissions } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      const result = await addMember.execute(req.authContext, {
        chatId,
        userId,
        role,
        permissions,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /chats/:chatId/messages
   * Envia uma mensagem
   */
  router.post('/:chatId/messages', async (req: AuthenticatedRequest, res, next) => {
    try {
      if (!req.authContext) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { chatId } = req.params;
      const { content, visibility, visibleTo, parentId, useRag, model } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'content is required' });
      }

      const result = await sendMessage.execute(req.authContext, {
        chatId,
        content,
        visibility,
        visibleTo,
        parentId,
        useRag,
        model,
      });

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
