// Authentication-related constants

export const AuthMode = {
  LOGIN: 'login',
  REGISTER: 'register',
} as const;

export type AuthModeType = (typeof AuthMode)[keyof typeof AuthMode];
