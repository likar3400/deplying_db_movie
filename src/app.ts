import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import mongoose from 'mongoose'; 
import { ZodError } from 'zod';
//import movieRoutes from './routes/entity_route.js';
import * as movieRoutes from './routes/entity_route.js';

const app = express();

// 1. Healthcheck ендпоінт (додаємо перед іншими middleware)
app.get('/health', (req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState;
  
  if (dbStatus === 1) {
    res.status(200).json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      readyState: dbStatus 
    });
  }
});

// 2. Стандартні middleware
app.use(cors());
app.use(express.json());

// 3. Маршрути API
app.use('/api/movies', (movieRoutes as any).default || movieRoutes);

// 4. Обробка помилок
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({ 
      error: 'Validation failed', 
      details: err.errors 
    });
    return;
  }
  
  if (err.name === 'CastError') {
    res.status(400).json({ error: 'Invalid ID format' });
    return;
  }
  if (err.code === 11000) {
    res.status(409).json({ error: 'Movie already exists' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

export default app;