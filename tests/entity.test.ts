import request from 'supertest';
import app from '../src/app';
import * as storage from '../src/storage/entity';

beforeEach(() => {
  storage.reset();
});

describe('Movie API Integration Tests', () => {
  const validMovie = { 
    title: 'Inception',
    year: 2010,
    genre: 'thriller' as 'thriller', 
    description: 'Dream within a dream',
    rating: 8.8
  };
test('error handler - 500 for non-zod errors', async () => {
  const original = storage.findAll;
  (storage as any).findAll = () => { throw new Error('Unexpected error'); };
  
  const res = await request(app).get('/api/movies');
  expect(res.status).toBe(500);
  
  (storage as any).findAll = original; // відновлюємо
});
  test('POST /api/movies - success (201)', async () => {
    const res = await request(app).post('/api/movies').send(validMovie);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe(validMovie.title);
  });

  test('POST /api/movies - validation error (400)', async () => {
    const invalidMovie = { ...validMovie, title: '' };
    const res = await request(app).post('/api/movies').send(invalidMovie);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Validation failed');
  });

  test('POST /api/movies - duplicate (409)', async () => {
    await request(app).post('/api/movies').send(validMovie);
    const res = await request(app).post('/api/movies').send(validMovie);
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error', 'Movie already exists');
  });

  test('GET /api/movies - empty list (200)', async () => {
    const res = await request(app).get('/api/movies');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('GET /api/movies - list with items (200)', async () => {
    storage.create(validMovie);
    const res = await request(app).get('/api/movies');
    expect(res.body.length).toBe(1);
  });

  test('GET /api/movies/:id - success (200)', async () => {
    const created = storage.create(validMovie)!;
    const res = await request(app).get(`/api/movies/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.id);
  });

  test('GET /api/movies/:id - not found (404)', async () => {
    const res = await request(app).get('/api/movies/non-existent-id');
    expect(res.status).toBe(404);
  });

  test('PATCH /api/movies/:id - success (200)', async () => {
    const created = storage.create(validMovie)!;

    await new Promise(resolve => setTimeout(resolve, 10));

    const res = await request(app)
      .patch(`/api/movies/${created.id}`)
      .send({ title: 'New Title' });
    
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('New Title');
    expect(res.body.updatedAt).not.toBe(res.body.createdAt);
  });

  test('PATCH /api/movies/:id - invalid data (400)', async () => {
    const created = storage.create(validMovie)!;
    const res = await request(app)
      .patch(`/api/movies/${created.id}`)
      .send({ year: 1800 }); 
    expect(res.status).toBe(400);
  });

  test('PATCH /api/movies/:id - not found (404)', async () => {
    const res = await request(app).patch('/api/movies/non-existent-id').send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  test('DELETE /api/movies/:id - success (204)', async () => {
    const created = storage.create(validMovie)!;
    const res = await request(app).delete(`/api/movies/${created.id}`);
    expect(res.status).toBe(204);
    expect(storage.findById(created.id)).toBeUndefined();
  });

  test('DELETE /api/movies/:id - not found (404)', async () => {
    const res = await request(app).delete('/api/movies/non-existent-id');
    expect(res.status).toBe(404);
  });

  test('GET /api/movies - filter by genre', async () => {
    storage.create({ ...validMovie, genre: 'action', title: 'Action Movie' });
    storage.create({ ...validMovie, genre: 'comedy', title: 'Comedy Movie' });
    const res = await request(app).get('/api/movies?genre=action');
    expect(res.body.length).toBe(1);
    expect(res.body[0].genre).toBe('action');
  });

  test('GET /api/movies - search by title (partial)', async () => {
    storage.create({ ...validMovie, title: 'Star Wars' });
    const res = await request(app).get('/api/movies?title=Star');
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Star Wars');
  });

  test('GET /api/movies - filter by year range', async () => {
    storage.create({ ...validMovie, title: 'Old Movie', year: 1990 });
    storage.create({ ...validMovie, title: 'New Movie', year: 2020 });
    const res = await request(app).get('/api/movies?minYear=2000');
    expect(res.body.length).toBe(1);
    expect(res.body[0].year).toBe(2020);
  });

  test('GET /api/movies - filter by maxYear', async () => {
    storage.create({ ...validMovie, title: 'Old Movie', year: 1990 });
    storage.create({ ...validMovie, title: 'New Movie', year: 2020 });
    const res = await request(app).get('/api/movies?maxYear=2000');
    expect(res.body.length).toBe(1);
    expect(res.body[0].year).toBe(1990);
  });

  test('GET /api/movies - filter by minRating', async () => {
    storage.create({ ...validMovie, title: 'Good Movie', rating: 9.0 });
    storage.create({ ...validMovie, title: 'Bad Movie', rating: 3.0 });
    const res = await request(app).get('/api/movies?minRating=8');
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Good Movie');
  });

  test('GET /api/movies/top-rated - success (200)', async () => {
    storage.create({ ...validMovie, title: 'Masterpiece', rating: 9.5 });
    storage.create({ ...validMovie, title: 'Average', rating: 5.0 });
    const res = await request(app).get('/api/movies/top-rated');
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Masterpiece');
  });
});