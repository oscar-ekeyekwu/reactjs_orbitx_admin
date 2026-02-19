// User types
export type UserRole = 'customer' | 'driver' | 'admin';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  avatar: string | null;
  role: UserRole;
  googleId: string | null;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  name: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_at: string;
  user: User;
}

export interface LoginDto {
  email: string;
  password: string;
}

// Order types
export type OrderStatus = 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
export type PackageSize = 'small' | 'medium' | 'large';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface Order {
  id: string;
  customerId: string;
  driverId?: string;
  status: OrderStatus;
  pickupLocation: Location;
  deliveryLocation: Location;
  recipientName: string;
  recipientPhone: string;
  packageDescription: string;
  packageWeight?: number;
  packageSize?: PackageSize;
  deliveryNotes?: string;
  estimatedPrice: number;
  finalPrice?: number;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: User;
  driver?: User;
}

// Wallet types
export type TransactionType = 'credit' | 'debit';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'reversed';

export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  totalEarnings: number;
  totalWithdrawals: number;
  pendingBalance: number;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  orderId?: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  description?: string;
  createdAt: string;
}

// Settings types
export interface PriceSettings {
  id: string;
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
  surgeFactor: number;
  smallPackageMultiplier: number;
  mediumPackageMultiplier: number;
  largePackageMultiplier: number;
  updatedAt: string;
}

// FAQ types
export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Support types
export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportTicket {
  id: string;
  userId: string;
  user?: User;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  orderId?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Dashboard stats
export interface DashboardStats {
  totalUsers: number;
  totalCustomers: number;
  totalDrivers: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  todayOrders: number;
  todayRevenue: number;
}
