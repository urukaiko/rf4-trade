// Item validation schemas (Valibot)
// Mirrors the Drizzle schema shape — used for API input validation.
import { minLength, object, optional, pipe, string, url } from 'valibot';

export const ItemInsertSchema = object({
  name: pipe(string('Name is required.'), minLength(1, 'Name cannot be empty.')),
  category: pipe(string('Category is required.'), minLength(1, 'Category cannot be empty.')),
  description: optional(string()),
  imageUrl: optional(pipe(string(), url('Must be a valid URL.'))),
});
