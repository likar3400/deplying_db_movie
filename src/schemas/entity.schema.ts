import { z } from 'zod';
export const createSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  year: z.number().int().min(1888),
  genre: z.enum([
    'action', 'comedy', 'drama', 'horror', 'sci-fi', 'thriller', 'documentary'
  ]),
  rating: z.number().min(0).max(10).optional(),
});
export const updateSchema = createSchema.partial();
export type CreateInput = z.infer<typeof createSchema>;
export type UpdateInput = z.infer<typeof updateSchema>;
export type Movie = {
  id: string;
  title: string;
  description?: string;
  year: number;
  genre: 'action' | 'comedy' | 'drama' | 'horror' | 'sci-fi' | 'thriller' | 'documentary';
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
};