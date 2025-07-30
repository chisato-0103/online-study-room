import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import type { CreateFeedbackDTO } from '@shared/types/index.js';

const router = Router();

const feedbackSchema = z.object({
  category: z.enum(['location', 'bug', 'feature', 'other']),
  content: z.string().min(1).max(1000)
});

const feedbackLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 1,
  message: { error: 'フィードバックは1日1回まで送信可能です。' },
  keyGenerator: (req) => {
    return req.ip || 'unknown';
  }
});

const feedbacks: any[] = [];

router.post('/', feedbackLimiter, async (req, res) => {
  try {
    const validatedData = feedbackSchema.parse(req.body) as CreateFeedbackDTO;
    
    const feedback = {
      id: feedbacks.length + 1,
      ...validatedData,
      userIp: req.ip,
      createdAt: new Date().toISOString()
    };

    feedbacks.push(feedback);

    console.log(`New feedback received: ${feedback.category} - ${feedback.content.substring(0, 50)}...`);

    res.status(201).json({ 
      message: 'フィードバックをありがとうございます！ご意見を参考にサービス改善に努めます。',
      feedbackId: feedback.id
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Error creating feedback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;