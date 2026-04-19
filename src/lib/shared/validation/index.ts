// Shared validation schemas (Valibot)
// These are safe to import on both client and server.
import { email, minLength, object, pipe, string, type InferInput } from 'valibot';

export const LoginSchema = object({
  email: pipe(string('Email is required.'), email('Invalid email address.')),
  password: pipe(string('Password is required.'), minLength(8, 'Minimum 8 characters.')),
});

export type LoginInput = InferInput<typeof LoginSchema>;
