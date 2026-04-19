export interface TradeView {
  id: string;
  sellerId: string;
  seller: { displayName: string };
  offer: { name: string; quantity: number; code?: string; imageUrl?: string | null };
  want: { name: string; quantity: number; code?: string; imageUrl?: string | null };
  stock: number;
  createdAt: Date;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
}
