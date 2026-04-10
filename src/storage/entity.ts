import { randomUUID } from 'crypto';
import { Movie, CreateInput, UpdateInput } from '../schemas/entity.schema';

let movies = new Map<string, Movie>();

export const findAll = (filters?: { 
  genre?: string; 
  title?: string; 
  minYear?: number; 
  maxYear?: number;
  minRating?: number; 
}) => {
  let result = Array.from(movies.values());

  if (filters) {
    if (filters.genre) result = result.filter(m => m.genre === filters.genre);
    if (filters.title) result = result.filter(m => m.title.toLowerCase().includes(filters.title!.toLowerCase()));
    if (filters.minYear) result = result.filter(m => m.year >= filters.minYear!);
    if (filters.maxYear) result = result.filter(m => m.year <= filters.maxYear!);
    if (filters.minRating) result = result.filter(m => m.rating !== undefined && m.rating >= filters.minRating!);
  }

  return result;
};

export const findById = (id: string) => movies.get(id);

export const create = (input: CreateInput): Movie | null => {
  const exists = Array.from(movies.values()).find(m => m.title === input.title);
  if (exists) return null;

  const id = randomUUID();
  const now = new Date();
  const movie: Movie = { ...input, id, createdAt: now, updatedAt: now };
  movies.set(id, movie);
  return movie;
};

export const update = (id: string, input: UpdateInput): Movie | null => {
  const existing = movies.get(id);
  if (!existing) return null;

  const updated: Movie = { ...existing, ...input, updatedAt: new Date() };
  movies.set(id, updated);
  return updated;
};

export const remove = (id: string) => movies.delete(id);

export const reset = () => movies.clear();
