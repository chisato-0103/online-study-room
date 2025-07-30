import { Router } from 'express';
import { z } from 'zod';
import type { CreateSessionDTO, UpdateSessionDTO } from '@shared/types/index.js';

const router = Router();

const createSessionSchema = z.object({
  nickname: z.string().min(1).max(50),
  location: z.string().max(100).optional(),
  subject: z.string().max(100).optional(),
  scheduledEndTime: z.string(),
  showDuration: z.boolean().optional().default(true)
});

const updateSessionSchema = z.object({
  location: z.string().max(100).optional(),
  subject: z.string().max(100).optional(),
  scheduledEndTime: z.string().optional(),
  showDuration: z.boolean().optional()
});

const sessions = new Map<number, any>();
let sessionIdCounter = 1;

router.post('/', async (req, res) => {
  try {
    const validatedData = createSessionSchema.parse(req.body) as CreateSessionDTO;
    
    if (validatedData.nickname.toLowerCase().includes('本名') || 
        validatedData.nickname.match(/[一-龯]/g)?.length > 10) {
      return res.status(400).json({ 
        error: '本名の使用は禁止されています。ニックネームを使用してください。' 
      });
    }

    const scheduledEnd = new Date(validatedData.scheduledEndTime);
    const now = new Date();
    const maxStudyTime = 12 * 60 * 60 * 1000;
    
    if (scheduledEnd.getTime() - now.getTime() > maxStudyTime) {
      return res.status(400).json({ 
        error: '学習時間は最大12時間までです。' 
      });
    }

    const session = {
      id: sessionIdCounter++,
      ...validatedData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    sessions.set(session.id, session);

    setTimeout(() => {
      const existingSession = sessions.get(session.id);
      if (existingSession && existingSession.isActive) {
        console.log(`Auto-ending session ${session.id} for ${session.nickname}`);
        sessions.delete(session.id);
      }
    }, scheduledEnd.getTime() - now.getTime());

    res.status(201).json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/active', async (req, res) => {
  try {
    const activeSessions = Array.from(sessions.values()).filter(session => session.isActive);
    res.json(activeSessions);
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const validatedData = updateSessionSchema.parse(req.body) as UpdateSessionDTO;
    
    const session = sessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const updatedSession = {
      ...session,
      ...validatedData,
      updatedAt: new Date().toISOString()
    };

    sessions.set(sessionId, updatedSession);
    res.json(updatedSession);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error updating session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    const session = sessions.get(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    session.isActive = false;
    session.actualEndTime = new Date().toISOString();
    sessions.set(sessionId, session);

    setTimeout(() => {
      sessions.delete(sessionId);
    }, 24 * 60 * 60 * 1000);

    res.json({ message: 'Session ended successfully', session });
  } catch (error) {
    console.error('Error ending session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;