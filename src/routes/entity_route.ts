import { Router, Request, Response } from 'express';
import { validate } from '../middleware/validate.js';
import { createSchema, updateSchema } from '../schemas/entity.schema.js';
import * as storage from '../storage/entity.js';

const router = Router();

router.get('/top-rated', (_req: Request, res: Response) => {
  const topRated = storage.findAll().filter((m: any) => m.rating !== undefined && m.rating >= 8);
  res.json(topRated);
});

router.get('/', (req: Request, res: Response) => {
  const { genre, title, minYear, maxYear, minRating } = req.query;
  const movies = storage.findAll({
    genre: typeof genre === 'string' ? genre : undefined,
    title: typeof title === 'string' ? title : undefined,
    minYear: minYear !== undefined ? Number(minYear) : undefined,
    maxYear: maxYear !== undefined ? Number(maxYear) : undefined,
    minRating: minRating !== undefined ? Number(minRating) : undefined,
  });
  res.json(movies);
});
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  const movie = storage.findById(req.params.id);
  if (!movie) {
    res.status(404).json({ error: 'Movie not found' });
    return;
  }
  res.json(movie);
});

router.post('/', validate(createSchema), (req: Request, res: Response) => {
  const movie = storage.create(req.body);
  if (!movie) {
    res.status(409).json({ error: 'Movie already exists' });
    return;
  }
  res.status(201).json(movie);
});

router.patch('/:id', validate(updateSchema), (req: Request<{ id: string }>, res: Response) => {
  const movie = storage.update(req.params.id, req.body);
  if (!movie) {
    res.status(404).json({ error: 'Movie not found' });
    return;
  }
  res.json(movie);
});

router.delete('/:id', (req: Request<{ id: string }>, res: Response) => {
  const deleted = storage.remove(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Movie not found' });
    return;
  }
  res.status(204).send();
});

export default router;
