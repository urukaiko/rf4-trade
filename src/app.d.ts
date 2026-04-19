import type { Session } from '$lib/server/auth';

declare global {
  namespace App {
    interface Locals {
      session: Session['session'] | null;
      user: Session['user'] | null;
      playerMissing: boolean;
      locale: 'ru' | 'en';
    }
  }
}

export {};
