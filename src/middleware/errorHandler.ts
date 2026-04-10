import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // 1. Помилка Zod
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation Failed', details: err.issues });
  }

  // 2. Неправильний формат ID (CastError)
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  // 3. Помилка валідації Mongoose
  if (err instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ error: err.message });
  }

  // 4. Помилка дубліката (наприклад, однаковий заголовок, якщо він unique)
  if (err.code === 11000) {
    return res.status(409).json({ error: 'Duplicate key error' });
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}