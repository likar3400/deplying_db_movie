import { MovieModel } from '../models/movie.model.js';
import { CreateInput, UpdateInput } from '../schemas/entity.schema.js';

export const findAll = async (filters?: { 
  genre?: string; 
  title?: string; 
  minYear?: number; 
  maxYear?: number;
  minRating?: number;
  sort?: string;
  page?: number;
  limit?: number;
}) => {
  const query: any = {};

  if (filters) {
    if (filters.genre) query.genre = filters.genre;
    if (filters.title) query.title = { $regex: filters.title, $options: 'i' };
    if (filters.minYear || filters.maxYear) {
      query.year = {};
      if (filters.minYear) query.year.$gte = filters.minYear;
      if (filters.maxYear) query.year.$lte = filters.maxYear;
    }
    if (filters.minRating) query.rating = { $gte: filters.minRating };
  }

  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 10;
  const skip = (page - 1) * limit;

  const sortParam = filters?.sort ?? '-createdAt';
  const sortField = sortParam.startsWith('-') ? sortParam.slice(1) : sortParam;
  const sortOrder = sortParam.startsWith('-') ? -1 : 1;
  const sortObj: any = { [sortField]: sortOrder };

  const [data, total] = await Promise.all([
    (MovieModel as any).find(query).sort(sortObj).skip(skip).limit(limit),
    (MovieModel as any).countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}; // <--- Ось тут закриваємо findAll

export const findById = async (id: string) => {
  return await (MovieModel as any).findById(id);
};

export const create = async (input: CreateInput) => {
  return await (MovieModel as any).create(input);
};

export const update = async (id: string, input: UpdateInput) => {
  return await (MovieModel as any).findByIdAndUpdate(id, input, { new: true, runValidators: true });
};

export const remove = async (id: string) => {
  const result = await (MovieModel as any).findByIdAndDelete(id);
  return !!result;
};

export const reset = async () => {
  await (MovieModel as any).deleteMany({});
};