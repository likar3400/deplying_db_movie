import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validate.js';
import { createSchema, updateSchema } from '../schemas/entity.schema.js';
import * as storage from '../storage/entity.js';

const router = Router();
router.get('/top-rated', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await storage.findAll();
    const topRated = result.data.filter((m: any) => m.rating !== undefined && m.rating >= 8);
    res.json(topRated);
  } catch (err) {
    next(err);
  }
});
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { genre, title, minYear, maxYear, minRating, sort, page, limit } = req.query;
    const result = await storage.findAll({
      genre: typeof genre === 'string' ? genre : undefined,
      title: typeof title === 'string' ? title : undefined,
      minYear: minYear !== undefined ? Number(minYear) : undefined,
      maxYear: maxYear !== undefined ? Number(maxYear) : undefined,
      minRating: minRating !== undefined ? Number(minRating) : undefined,
      sort: typeof sort === 'string' ? sort : undefined,
      page: page !== undefined ? Number(page) : undefined,
      limit: limit !== undefined ? Number(limit) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const movie = await storage.findById(req.params.id);
    if (!movie) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }
    res.json(movie);
  } catch (err) {
    next(err);
  }
});

router.post('/', validate(createSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const movie = await storage.create(req.body);
    res.status(201).json(movie);
  } catch (err: any) {
    if (err.code === 11000) {
      res.status(409).json({ error: 'Movie already exists' });
      return;
    }
    next(err);
  }
});

router.patch('/:id', validate(updateSchema), async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const movie = await storage.update(req.params.id, req.body);
    if (!movie) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }
    res.json(movie);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  try {
    const deleted = await storage.remove(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Movie not found' });
      return;
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;