import { Router } from 'express';
import type { Location } from '@shared/types/index.js';

const router = Router();

const defaultLocations: Location[] = [
  {
    id: 1,
    name: 'library',
    displayName: '図書館',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: 'building1_1f',
    displayName: '1号館1F',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: 'building1_2f',
    displayName: '1号館2F',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    name: 'other',
    displayName: 'その他自習室',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

router.get('/', async (req, res) => {
  try {
    const activeLocations = defaultLocations.filter(location => location.isActive);
    res.json(activeLocations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;