export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  status: string;
}

export interface Branch {
  id: string;
  restaurantId: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  restaurantId: string;
  categoryId: string;
  name: string;
  sku: string;
  price: number;
  description?: string;
  minimumStock: number;
  status: string;
  category?: Category;
}

export interface DiningTable {
  id: string;
  branchId: string;
  number: number;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
}

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  restaurantId: string;
  branchId: string;
  tableId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED';
  subtotal: number;
  total: number;
  notes?: string;
  createdAt: string;
  table?: DiningTable;
  items: OrderItem[];
}

export interface InventoryItem {
  id: string;
  branchId: string;
  productId: string;
  quantity: number;
  minimumStock: number;
  product: Product;
  movements?: any[];
}

export interface DashboardMetrics {
  sales: number;
  orders: number;
  completedOrders: number;
  cancelledOrders: number;
  averageOrderValue: number;
  activeTables: number;
  lowStockProducts: number;
  totalProducts: number;
  timeline: Array<{ date: string; revenue: number }>;
}
