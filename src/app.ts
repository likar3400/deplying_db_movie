import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ZodError } from 'zod';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const movieRoutes = require('./routes/entity_route.js').default;

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/movies', movieRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: err.errors });
    return;
  }
  res.status(500).json({ error: 'Internal server error' });
});

export default app;