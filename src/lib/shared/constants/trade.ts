// Trade-related constants
// Centralized to avoid magic strings throughout the codebase

export const TradeStatus = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  BOOKED: 'booked',
} as const;

export type TradeStatus = (typeof TradeStatus)[keyof typeof TradeStatus];

export const TradeItemSide = {
  OFFER: 'offer',
  WANT: 'want',
} as const;

export type TradeItemSide = (typeof TradeItemSide)[keyof typeof TradeItemSide];
