

export type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  neighborhood: string;
  createdAt?: string; // ISO 8601 date string
  avatarUrl?: string;
  notes?: string;
  startDate?: string;
  poolIds?: string[];
};

export type Pool = {
  id: string;
  clientId: string;
  name: string;
  type: 'quadrilateral' | 'circular' | 'oval';
  length?: number;
  width?: number; // doubles as diameter for circular
  averageDepth?: number;
  volume?: number;
  ph?: number;
  chlorine?: number;
  alkalinity?: number;
  calciumHardness?: number;
  material?: 'fiber' | 'masonry' | 'vinyl';
  hasStains?: boolean;
  hasScale?: boolean;
  waterQuality?: 'green' | 'cloudy' | 'crystal-clear';
  filterType?: 'sand' | 'cartridge' | 'polyester';
  lastFilterChange?: string; // ISO 8601 date string
  filterPressure?: number;
  filterCapacity?: number;
  updatedAt?: any; // Firestore ServerTimestamp
  // Deprecated fields, kept for compatibility, but should be calculated.
  size: number; 
  lastTreatment?: string;
};

export type Visit = {
  id: string;
  userId: string; // Added for collectionGroup queries
  poolId: string;
  clientId: string;
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

export type Product = {
  id: string;
  name: string;
  description?: string;
  cost: number;
  stock: number;
};

export type User = {
    id: string;
    email: string;
    companyName?: string;
    companyLogo?: string;
    language?: string;
    theme?: string;
    notificationPrefs?: {
        pendingClients?: boolean;
        visitReminders?: boolean;
    };
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleTokenExpiry?: number;
};

