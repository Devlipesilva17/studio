export type Client = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string; // ISO 8601 date string
  avatarUrl: string;
};

export type Pool = {
  id: string;
  clientId: string;
  name: string;
  size: number; // in gallons
  type: 'chlorine' | 'saltwater' | 'bromine';
  lastTreatment?: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  cost: number;
  stock: number;
};

export type Visit = {
  id: string;
  poolId: string;
  clientName: string;
  scheduledDate: string; // ISO 8601 date string
  completedDate?: string; // ISO 8601 date string
  status: 'pending' | 'completed' | 'skipped';
  productsUsed: { productId: string; quantity: number }[];
  notes?: string;
  time: string; // e.g., "09:00"
};

export type Payment = {
  id: string;
  clientName: string;
  clientId: string;
  amount: number;
  date: string; // ISO 8601 date string
  status: 'paid' | 'pending';
};
