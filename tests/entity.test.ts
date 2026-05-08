import request from 'supertest';
import app from '../src/app.js';
import * as storage from '../src/storage/entity.js';
import { setupTestDB, teardownTestDB } from './setup.js';

beforeAll(async () => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  await setupTestDB();
}, 30000);

afterAll(async () => {
  jest.restoreAllMocks();
  await teardownTestDB();
}, 30000);

beforeEach(async () => {
  await storage.reset();
});

describe('Movie API Integration Tests', () => {
  const validMovie = {
    title: 'Inception',
    year: 2010,
    genre: 'thriller' as 'thriller',
    description: 'Dream within a dream',
    rating: 8.8,
  };

  test('error handler - 500 for non-zod errors', async () => {
    const original = storage.findAll;
    (storage as any).findAll = async () => { throw new Error('Unexpected error'); };
    const res = await request(app).get('/api/movies');
    expect(res.status).toBe(500);
    (storage as any).findAll = original;
  });

  test('error handler - 400 for Mongoose CastError', async () => {
    const original = storage.findById;
    (storage as any).findById = async () => {
      const error = new Error('Cast Error');
      error.name = 'CastError';
      throw error;
    };
    const res = await request(app).get('/api/movies/invalid-id');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid ID format');
    (storage as any).findById = original;
  });

  test('POST /api/movies - success (201)', async () => {
    const res = await request(app).post('/api/movies').send(validMovie);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(validMovie.title);
  });

  test('GET /api/movies - list with items (200)', async () => {
    await storage.create(validMovie);
    const res = await request(app).get('/api/movies');
    expect(res.body.data.length).toBe(1);
  });

  test('GET /api/movies/:id - success (200)', async () => {
    const created = (await storage.create(validMovie))!;
    const res = await request(app).get(`/api/movies/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.id);
  });

  test('PATCH /api/movies/:id - success (200)', async () => {
    const created = (await storage.create(validMovie))!;
    const res = await request(app)
      .patch(`/api/movies/${created.id}`)
      .send({ title: 'New Title' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New Title');
  });

  test('DELETE /api/movies/:id - success (204)', async () => {
    const created = (await storage.create(validMovie))!;
    const res = await request(app).delete(`/api/movies/${created.id}`);
    expect(res.status).toBe(204);
  });

  test('GET /api/movies - filter by genre', async () => {
    await storage.create({ ...validMovie, genre: 'action' as 'action', title: 'Action Movie' });
    await storage.create({ ...validMovie, genre: 'comedy' as 'comedy', title: 'Comedy Movie' });
    const res = await request(app).get('/api/movies?genre=action');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].genre).toBe('action');
  });

  test('GET /api/movies/top-rated - success (200)', async () => {
    await storage.create({ ...validMovie, title: 'Masterpiece', rating: 9.5 });
    await storage.create({ ...validMovie, title: 'Average', rating: 5.0 });
    const res = await request(app).get('/api/movies/top-rated');
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Masterpiece');
  });

  test('storage.update - should return null if id not found', async () => {
    const result = await storage.update('507f1f77bcf86cd799439011', { title: 'New' });
    expect(result).toBeNull();
  });

  test('error handler - 400 for ZodError', async () => {
    const res = await request(app)
      .post('/api/movies')
      .send({ title: 123, year: 'bad' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(res.body).toHaveProperty('details');
  });

  test('error handler - 409 for duplicate key', async () => {
    const original = storage.findAll;
    (storage as any).findAll = async () => {
      const err: any = new Error('Duplicate');
      err.code = 11000;
      throw err;
    };
    const res = await request(app).get('/api/movies');
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Movie already exists');
    (storage as any).findAll = original;
  });

  test('GET /api/movies/top-rated - 500 on error', async () => {
    const original = storage.findAll;
    (storage as any).findAll = async () => { throw new Error('DB error'); };
    const res = await request(app).get('/api/movies/top-rated');
    expect(res.status).toBe(500);
    (storage as any).findAll = original;
  });

  test('GET /api/movies/:id - 404 not found', async () => {
    const res = await request(app).get('/api/movies/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Movie not found');
  });

  test('POST /api/movies - 409 duplicate', async () => {
    const original = storage.create;
    (storage as any).create = async () => {
      const err: any = new Error('Duplicate');
      err.code = 11000;
      throw err;
    };
    const res = await request(app).post('/api/movies').send(validMovie);
    expect(res.status).toBe(409);
    (storage as any).create = original;
  });

  test('PATCH /api/movies/:id - 404 not found', async () => {
    const res = await request(app)
      .patch('/api/movies/507f1f77bcf86cd799439011')
      .send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  test('PATCH /api/movies/:id - 500 on error', async () => {
    const original = storage.update;
    (storage as any).update = async () => { throw new Error('DB error'); };
    const created = await storage.create(validMovie);
    const res = await request(app)
      .patch(`/api/movies/${(created as any).id}`)
      .send({ title: 'X' });
    expect(res.status).toBe(500);
    (storage as any).update = original;
  });

  test('DELETE /api/movies/:id - 404 not found', async () => {
    const res = await request(app).delete('/api/movies/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
  });

  test('DELETE /api/movies/:id - 500 on error', async () => {
    const original = storage.remove;
    (storage as any).remove = async () => { throw new Error('DB error'); };
    const created = await storage.create(validMovie);
    const res = await request(app).delete(`/api/movies/${(created as any).id}`);
    expect(res.status).toBe(500);
    (storage as any).remove = original;
  });

  test('GET /api/movies - filter by minYear and maxYear', async () => {
    await storage.create({ ...validMovie, title: 'Old', year: 1990 });
    await storage.create({ ...validMovie, title: 'New', year: 2020 });
    const res = await request(app).get('/api/movies?minYear=2000&maxYear=2023');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('New');
  });

  test('GET /api/movies - filter by minYear only', async () => {
    await storage.create({ ...validMovie, title: 'Old', year: 1990 });
    await storage.create({ ...validMovie, title: 'New', year: 2020 });
    const res = await request(app).get('/api/movies?minYear=2000');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('New');
  });

  test('GET /api/movies - filter by maxYear only', async () => {
    await storage.create({ ...validMovie, title: 'Old', year: 1990 });
    await storage.create({ ...validMovie, title: 'New', year: 2020 });
    const res = await request(app).get('/api/movies?maxYear=2000');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Old');
  });

  test('GET /api/movies - filter by minRating', async () => {
    await storage.create({ ...validMovie, title: 'Great', rating: 9.0 });
    await storage.create({ ...validMovie, title: 'Bad', rating: 3.0 });
    const res = await request(app).get('/api/movies?minRating=8');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Great');
  });

  test('GET /api/movies - filter by title', async () => {
    await storage.create({ ...validMovie, title: 'Matrix' });
    await storage.create({ ...validMovie, title: 'Inception' });
    const res = await request(app).get('/api/movies?title=matrix');
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Matrix');
  });

  test('GET /api/movies - 500 on error', async () => {
    const original = storage.findAll;
    (storage as any).findAll = async () => { throw new Error('DB error'); };
    const res = await request(app).get('/api/movies');
    expect(res.status).toBe(500);
    (storage as any).findAll = original;
  });

  test('GET /api/movies/:id - 500 on error', async () => {
    const original = storage.findById;
    (storage as any).findById = async () => { throw new Error('DB error'); };
    const res = await request(app).get('/api/movies/507f1f77bcf86cd799439011');
    expect(res.status).toBe(500);
    (storage as any).findById = original;
  });

  test('POST /api/movies - 500 on generic error', async () => {
    const original = storage.create;
    (storage as any).create = async () => { throw new Error('DB error'); };
    const res = await request(app).post('/api/movies').send(validMovie);
    expect(res.status).toBe(500);
    (storage as any).create = original;
  });
});