export interface Category {
  id?: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  category: string;
  craftStory: string;
  materialDetails: string;
  careInstructions: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrls: string[];
}

export interface Order {
  id?: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
}

export interface JournalEntry {
  id?: string;
  title: string;
  date: string;
  imageUrl: string;
  excerpt: string;
  content: string;
  createdAt: string;
}

export type Page = 'home' | 'collections' | 'craft' | 'about' | 'journal' | 'contact' | 'cart' | 'product' | 'admin' | 'login';
