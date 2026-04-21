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
  collection?: string;
  craftStory: string;
  materialDetails: string;
  careInstructions: string;
  sku?: string;
  tagline?: string;
  fitType?: string;
  packageContent?: string;
  sizes?: string[];
  isFeatured?: boolean;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrls: string[];
  sku?: string;
  size?: string;
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

export interface Collection {
  id?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isFeatured?: boolean;
  createdAt?: string;
}

export interface Testimonial {
  id?: string;
  customerName: string;
  content: string;
  location?: string;
  avatarUrl?: string;
  rating?: number;
  createdAt: string;
}

export interface UserActivity {
  uid: string;
  viewedProductIds: string[];
  preferredCategories: string[];
  updatedAt: string;
}

export interface PageContent {
  id?: string;
  pageId: string; // 'about', 'craft', 'contact', 'collections'
  title: string;
  subtitle?: string;
  heroImageUrl?: string;
  content?: string;
  sections?: {
    title: string;
    content: string;
    imageUrl?: string;
    imagePosition?: 'left' | 'right';
  }[];
  updatedAt: string;
}

export interface HeroSlide {
  id?: string;
  imageUrl: string;
  order?: number;
  createdAt: string;
}

export interface CollectionSlide {
  id?: string;
  collectionName: string;
  title: string;
  description: string;
  imageUrl: string;
  order: number;
  createdAt: string;
}

export type Page = 'home' | 'collections' | 'craft' | 'about' | 'contact' | 'cart' | 'product' | 'admin' | 'login';
