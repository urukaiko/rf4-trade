// Shared DTO types — inferred from Drizzle schema to prevent drift.
import type { InferSelectModel } from 'drizzle-orm';
import type { user } from '$lib/server/db/schema/users';
import type { player } from '$lib/server/db/schema/players';

export type UserDTO = InferSelectModel<typeof user>;
export type PlayerDTO = InferSelectModel<typeof player>;
