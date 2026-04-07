import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Menu, 
  X, 
  ChevronRight, 
  ChevronLeft,
  Search,
  Instagram, 
  Facebook, 
  Twitter, 
  Plus, 
  Trash2, 
  LogOut, 
  ArrowLeft,
  Package,
  Settings,
  MessageCircle,
  Home as HomeIcon,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc,
  updateDoc, 
  deleteDoc,
  Timestamp,
  getDoc,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { db, auth } from './firebase';

// --- Error Handling ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorInfo: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.errorInfo);
        if (parsed.error && parsed.error.includes("permission-denied")) {
          displayMessage = "Access Denied: You do not have permission to view this data. Please ensure you are logged in with an authorized admin account.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-kael-paper p-6 text-center">
          <div className="max-w-md">
            <h2 className="text-2xl font-bold mb-4">Atelier Error</h2>
            <p className="text-kael-purple mb-8">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-luxury bg-kael-ink text-white"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
import { Product, Order, OrderItem, Category, Page, UserProfile, JournalEntry, UserActivity, PageContent } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Logo = () => (
  <div className="flex items-center space-x-3 cursor-pointer">
    <img 
      src="https://i.ibb.co/wNGfq3yY/636e4daa-03dc-4e4c-b8f7-8710769286e0.jpg" 
      alt="KAEL Logo" 
      className="h-10 w-auto object-contain mix-blend-multiply"
      referrerPolicy="no-referrer"
    />
    <span className="font-bold text-xl tracking-[0.2em] text-kael-ink">KAEL</span>
  </div>
);

const Navbar = ({ currentPage, setPage, cartCount, user, isAdmin, searchQuery, setSearchQuery }: { 
  currentPage: Page, 
  setPage: (p: Page) => void, 
  cartCount: number,
  user: User | null,
  isAdmin: boolean,
  searchQuery: string,
  setSearchQuery: (q: string) => void
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: { label: string, page: Page }[] = [
    { label: 'Home', page: 'home' },
    { label: 'Collections', page: 'collections' },
    { label: 'Craft', page: 'craft' },
    { label: 'About', page: 'about' },
    { label: 'Journal', page: 'journal' },
    { label: 'Contact', page: 'contact' },
  ];

  return (
    <nav className={cn(
      "fixed top-0 w-full z-50 transition-all duration-500 px-6 md:px-12 flex items-center justify-between bg-white border-b border-kael-gold/10",
      isScrolled ? "py-4 shadow-md" : "py-6 shadow-sm"
    )}>
      <div onClick={() => setPage('home')}>
        <Logo />
      </div>

      <div className="hidden md:flex items-center space-x-10">
        {navItems.map((item) => (
          <button
            key={item.page}
            onClick={() => setPage(item.page)}
            className={cn(
              "text-[11px] uppercase tracking-[0.2em] hover:text-kael-gold transition-colors",
              currentPage === item.page ? "text-kael-gold font-semibold" : "text-kael-ink"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative flex items-center">
          <AnimatePresence>
            {isSearchOpen && (
              <motion.input
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (currentPage !== 'collections') setPage('collections');
                }}
                className="bg-kael-paper border-b border-kael-gold/30 text-xs px-2 py-1 focus:outline-none focus:border-kael-gold mr-2"
              />
            )}
          </AnimatePresence>
          <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="text-kael-ink hover:text-kael-gold transition-colors"
          >
            <Search size={20} />
          </button>
        </div>
        
        {isAdmin && (
          <button onClick={() => setPage('admin')} className="text-kael-ink hover:text-kael-gold transition-colors">
            <Settings size={20} />
          </button>
        )}
        <button onClick={() => setPage('cart')} className="relative text-kael-ink hover:text-kael-gold transition-colors">
          <ShoppingBag size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-kael-gold text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {cartCount}
            </span>
          )}
        </button>
        <button 
          className="md:hidden text-kael-ink"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 w-full bg-kael-paper shadow-xl p-8 flex flex-col space-y-6 md:hidden"
          >
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => {
                  setPage(item.page);
                  setIsMobileMenuOpen(false);
                }}
                className="text-sm uppercase tracking-[0.2em] text-left"
              >
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = ({ setPage }: { setPage: (p: Page) => void }) => {
  return (
    <footer className="bg-white pt-24 pb-12 px-6 md:px-24 border-t border-kael-gold/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1 md:col-span-2">
          <Logo />
          <p className="mt-6 text-sm text-kael-purple max-w-sm leading-relaxed">
            KAEL is a celebration of heritage weaving, where every thread tells a story of craftsmanship and timeless elegance.
          </p>
          <div className="flex space-x-6 mt-8">
            <Instagram size={18} className="text-kael-ink hover:text-kael-gold cursor-pointer" />
            <Facebook size={18} className="text-kael-ink hover:text-kael-gold cursor-pointer" />
            <Twitter size={18} className="text-kael-ink hover:text-kael-gold cursor-pointer" />
          </div>
        </div>
        
        <div>
          <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Navigation</h4>
          <ul className="space-y-4 text-xs text-kael-purple uppercase tracking-wider">
            <li className="hover:text-kael-gold cursor-pointer" onClick={() => setPage('about')}>About</li>
            <li className="hover:text-kael-gold cursor-pointer" onClick={() => setPage('collections')}>Collections</li>
            <li className="hover:text-kael-gold cursor-pointer" onClick={() => setPage('craft')}>Craft</li>
            <li className="hover:text-kael-gold cursor-pointer" onClick={() => setPage('contact')}>Contact</li>
            <li className="hover:text-kael-gold cursor-pointer" onClick={() => setPage('login')}>Login</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Contact</h4>
          <ul className="space-y-4 text-xs text-kael-purple leading-relaxed">
            <li>Atelier KAEL<br />Heritage Lane, Varanasi</li>
            <li>concierge@kael.luxury</li>
            <li>+91 98765 43210</li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto pt-8 border-t border-kael-gold/10 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-widest text-kael-gold">
        <p>© 2026 KAEL Luxury Textiles. All rights reserved.</p>
        <div className="flex space-x-8 mt-4 md:mt-0">
          <span className="cursor-pointer hover:text-kael-ink" onClick={() => setPage('login')}>Login</span>
          <span className="cursor-pointer hover:text-kael-ink">Privacy Policy</span>
          <span className="cursor-pointer hover:text-kael-ink">Terms of Service</span>
        </div>
      </div>
    </footer>
  );
};

// --- Components ---

const ProductCard = ({ product, hasData, onClick }: { product: Product, hasData: boolean, onClick: () => void }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % product.imageUrls.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + product.imageUrls.length) % product.imageUrls.length);
  };

  return (
    <motion.div 
      className="group cursor-pointer transition-all duration-500"
      whileHover={{ y: -10 }}
      onClick={onClick}
      onMouseLeave={() => setCurrentImageIndex(0)}
    >
      <div className="relative aspect-[3/4] overflow-hidden mb-6 shadow-sm group-hover:shadow-xl transition-shadow duration-500">
        <img 
          src={product.imageUrls[currentImageIndex]} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        {!hasData && (
          <div className="absolute top-4 left-4 bg-kael-gold text-white text-[8px] uppercase tracking-widest px-2 py-1 z-10">
            Sample Preview
          </div>
        )}
        <div className="absolute inset-0 bg-kael-ink/0 group-hover:bg-kael-ink/10 transition-colors duration-500" />
        
        {/* Manual Navigation Arrows */}
        {product.imageUrls.length > 1 && (
          <>
            <button 
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-kael-ink opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 hover:bg-white"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-kael-ink opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 hover:bg-white"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Angle Indicator */}
        {product.imageUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1">
            {product.imageUrls.map((_, idx) => (
              <div 
                key={idx}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  currentImageIndex === idx ? "bg-white w-3" : "bg-white/40"
                )}
              />
            ))}
          </div>
        )}
      </div>
      <h3 className="text-xl font-bold mb-2 group-hover:text-kael-gold transition-colors">{product.name}</h3>
      <p className="text-kael-gold font-medium">AED {product.price.toLocaleString()}</p>
    </motion.div>
  );
};

// --- Pages ---

const Home = ({ 
  setPage, 
  setSelectedProduct,
  products,
  journalEntries,
  userActivity,
  trackView
}: { 
  setPage: (p: Page) => void, 
  setSelectedProduct: (p: Product) => void,
  products: Product[],
  journalEntries: JournalEntry[],
  userActivity: UserActivity | null,
  trackView: (type: 'product' | 'journal', id: string, category?: string) => void
}) => {
  const featuredProducts = products
    .filter(p => p.isFeatured)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 4);
  
  const latestJournalEntries = [...journalEntries]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <iframe
            src="https://www.youtube.com/embed/jXyhZz5Gxuo?autoplay=1&mute=1&loop=1&playlist=jXyhZz5Gxuo&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1"
            className="absolute top-1/2 left-1/2 min-w-full min-h-full w-[177.77vh] h-[56.25vw] -translate-x-1/2 -translate-y-1/2 brightness-[0.5] pointer-events-none"
            allow="autoplay; encrypted-media"
            frameBorder="0"
          />
        </div>
        
        <div className="relative z-10 text-center text-white px-6">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="micro-label text-white/80"
          >
            A Handloom Luxury
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-6xl md:text-8xl font-bold mb-6 tracking-tighter"
          >
            KAEL
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-lg md:text-xl font-light mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Crafted through tradition. Designed for timeless elegance.
          </motion.p>
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            onClick={() => setPage('collections')}
            className="btn-luxury border-white text-white hover:bg-white hover:text-kael-ink"
          >
            Explore Collection
          </motion.button>
        </div>
      </section>

      {/* Brand Philosophy */}
      <section className="py-32 px-6 md:px-24 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <span className="micro-label">Our Philosophy</span>
          <h2 className="serif-display mb-10">The Art of Slow Weaving</h2>
          <p className="text-lg text-kael-purple leading-loose italic">
            "At KAEL, we believe that luxury is not just what you wear, but the story behind it. Our textiles are woven by master artisans who have preserved heritage techniques for generations. We embrace the imperfections of the handloom, for they are the signatures of human touch."
          </p>
        </div>
      </section>

      {/* Personalized Feed */}
      <PersonalizedFeed 
        userActivity={userActivity} 
        products={products} 
        journalEntries={journalEntries} 
        setPage={setPage} 
        setSelectedProduct={setSelectedProduct} 
        trackView={trackView}
      />

      {/* Collection Spotlight */}
      <section className="py-32 px-6 md:px-24 bg-kael-ink text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <img 
            src="https://images.unsplash.com/photo-1505118380757-91f5f45d8de6?auto=format&fit=crop&q=80&w=2000" 
            alt="Sea background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <span className="micro-label text-kael-gold">Collection 01</span>
              <h2 className="serif-display text-white mt-4 mb-8">Beyond the Sea</h2>
              <p className="text-lg text-white/80 leading-loose mb-10 italic">
                “Beyond the Sea” reflects a meeting point—where the quiet stillness of the shore merges with the hidden richness beneath the water. Shells, corals, and shifting currents come together as a single language, translated through thoughtful embroidery and balanced forms.
              </p>
              <button 
                onClick={() => setPage('collections')}
                className="btn-luxury border-white text-white hover:bg-white hover:text-kael-ink"
              >
                Discover the Collection
              </button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2 }}
              className="relative aspect-[4/5] bg-white/5 backdrop-blur-sm p-4 border border-white/10"
            >
              <img 
                src="https://images.unsplash.com/photo-1518674660708-0e2c0473e68e?auto=format&fit=crop&q=80&w=1000" 
                alt="Beyond the Sea Collection" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-10 -right-10 bg-kael-gold p-8 hidden md:block">
                <p className="text-xs uppercase tracking-widest font-bold text-kael-ink leading-relaxed">
                  Structured yet fluid.<br />Subtle yet expressive.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-32 px-6 md:px-12 bg-kael-paper">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-16">
            <div>
              <span className="micro-label">Curated</span>
              <h2 className="text-3xl font-bold">Featured Pieces</h2>
            </div>
            <button onClick={() => setPage('collections')} className="text-xs uppercase tracking-widest border-b border-kael-ink pb-1 hover:text-kael-gold hover:border-kael-gold transition-all">
              View All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.length > 0 ? featuredProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                hasData={true}
                onClick={() => {
                  setSelectedProduct(product);
                  setPage('product');
                }}
              />
            )) : (
              <div className="col-span-full text-center py-20 text-kael-purple italic">
                Our latest collection is being curated...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* The Craft */}
      <section className="relative h-[80vh] w-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1528154291023-a6525fabe5b4?auto=format&fit=crop&q=80&w=2000" 
          alt="Weaving Process" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-kael-dark/20 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm p-12 md:p-20 max-w-2xl text-center shadow-2xl">
            <span className="micro-label">The Process</span>
            <h2 className="text-3xl font-bold mb-6">Heritage in Every Thread</h2>
            <p className="text-sm text-kael-purple leading-relaxed mb-10">
              Each KAEL textile takes weeks of meticulous labor. From hand-spinning the silk to the complex rhythmic dance of the loom, we honor the silence and focus required to create true luxury.
            </p>
            <button onClick={() => setPage('craft')} className="btn-luxury">Discover the Craft</button>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="py-32 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="micro-label">Explore</span>
            <h2 className="serif-display">Our Collections</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { name: 'Mens Wear', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800' },
              { name: 'Womens Wear', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800' },
              { name: 'Modest', img: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800' }
            ].map((col) => (
              <div 
                key={col.name} 
                className="relative aspect-[4/5] overflow-hidden group cursor-pointer"
                onClick={() => setPage('collections')}
              >
                <img src={col.img} alt={col.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500 flex flex-col items-center justify-center text-white">
                  <h3 className="text-2xl font-bold uppercase tracking-widest">{col.name}</h3>
                  <span className="mt-4 text-[10px] uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-opacity duration-500">View Collection</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journal */}
      <section className="py-32 px-6 md:px-12 bg-kael-paper">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="micro-label">Editorial</span>
            <h2 className="serif-display">The KAEL Journal</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {journalEntries.length > 0 ? journalEntries.map((article) => (
              <div 
                key={article.id} 
                className="group cursor-pointer" 
                onClick={() => {
                  trackView('journal', article.id!);
                  setPage('journal');
                }}
              >
                <div className="aspect-video overflow-hidden mb-6">
                  <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-kael-gold">{article.date}</span>
                <h3 className="text-lg font-bold mt-3 group-hover:text-kael-gold transition-colors">{article.title}</h3>
                <p className="mt-4 text-sm text-kael-purple leading-relaxed line-clamp-2">
                  {article.excerpt}
                </p>
              </div>
            )) : (
              <div className="col-span-full text-center py-20 text-kael-purple italic">
                Our journal is being written...
              </div>
            )}
          </div>
        </div>
      </section>
    </motion.div>
  );
};

const About = ({ pageContents }: { pageContents: PageContent[] }) => {
  const content = pageContents.find(p => p.pageId === 'about');

  if (!content) {
    return (
      <div className="pt-48 pb-32 px-6 text-center">
        <h1 className="serif-display mb-8">About KAEL</h1>
        <p className="text-kael-purple max-w-xl mx-auto">This section is currently being curated.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-kael-paper"
    >
      {/* Hero Section */}
      <section className="relative h-[70vh] w-full overflow-hidden flex items-center justify-center">
        <img 
          src={content.heroImageUrl || "https://images.unsplash.com/photo-1528154291023-a6525fabe5b4?auto=format&fit=crop&q=80&w=2000"} 
          alt={content.title} 
          className="w-full h-full object-cover brightness-75"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="micro-label text-white/80"
          >
            {content.subtitle || 'Our Story'}
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-5xl md:text-7xl font-bold tracking-tight"
          >
            {content.title}
          </motion.h1>
        </div>
      </section>

      {/* Dynamic Sections */}
      {(content.sections || []).map((section, idx) => {
        // Section 1 & 3: Grid layouts (idx 0 and 2)
        if (idx === 0 || idx === 2) {
          return (
            <section key={idx} className="py-32 px-6 md:px-24 bg-white">
              <div className="max-w-5xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                  <div className={section.imagePosition === 'left' ? 'order-2' : 'order-1'}>
                    <span className="micro-label">{section.title}</span>
                    <div className="prose prose-kael mt-8">
                      <ReactMarkdown>{section.content}</ReactMarkdown>
                    </div>
                  </div>
                  <div className={cn("aspect-[4/5] overflow-hidden", section.imagePosition === 'left' ? 'order-1' : 'order-2')}>
                    {section.imageUrl && (
                      <img 
                        src={section.imageUrl} 
                        alt={section.title} 
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
              </div>
            </section>
          );
        }

        // Section 2: Full width text (idx 1)
        if (idx === 1) {
          return (
            <section key={idx} className="py-32 px-6 md:px-24 bg-kael-paper">
              <div className="max-w-3xl mx-auto text-center">
                <div className="prose prose-kael max-w-none text-xl md:text-2xl text-kael-ink leading-relaxed font-light">
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
                <div className="w-24 h-[1px] bg-kael-gold mx-auto mt-12" />
              </div>
            </section>
          );
        }

        // Section 4: Quote (idx 3)
        if (idx === 3) {
          return (
            <section key={idx} className="py-40 px-6 md:px-24 bg-kael-ink text-white text-center">
              <div className="max-w-3xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold mb-12 tracking-tighter leading-tight">
                  "{section.content}"
                </h2>
                <span className="micro-label text-white/60">{section.title}</span>
              </div>
            </section>
          );
        }

        // Fallback for extra sections
        return (
          <section key={idx} className="py-20 px-6 md:px-24 bg-white">
            <div className="max-w-4xl mx-auto prose prose-kael">
              <h2 className="serif-display mb-8">{section.title}</h2>
              <ReactMarkdown>{section.content}</ReactMarkdown>
            </div>
          </section>
        );
      })}

      {/* If no sections, show the main content field */}
      {(!content.sections || content.sections.length === 0) && content.content && (
        <section className="py-32 px-6 md:px-24 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-kael max-w-none">
              <ReactMarkdown>{content.content}</ReactMarkdown>
            </div>
          </div>
        </section>
      )}
    </motion.div>
  );
};

const Craft = ({ pageContents }: { pageContents: PageContent[] }) => {
  const content = pageContents.find(p => p.pageId === 'craft');

  const defaultSections = [
    {
      title: "The Master Weavers",
      content: "Our craft begins with the hands of master weavers, whose lineage of textile artistry spans generations. Each movement is a rhythmic dance of precision and patience.",
      imageUrl: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=1000",
      imagePosition: 'left' as const
    },
    {
      title: "The Handloom Machines",
      content: "We use traditional wooden handlooms, mechanical marvels that require no electricity, only the skilled coordination of the weaver's hands and feet.",
      imageUrl: "https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&q=80&w=1000",
      imagePosition: 'right' as const
    },
    {
      title: "The Finest Threads",
      content: "Our threads are sourced from sustainable silk and organic cotton, dyed with natural pigments to create a palette that reflects the vibrant soul of the sea.",
      imageUrl: "https://images.unsplash.com/photo-1528476513691-07e6f563d97f?auto=format&fit=crop&q=80&w=1000",
      imagePosition: 'left' as const
    }
  ];

  const sections = content?.sections && content.sections.length > 0 ? content.sections : defaultSections;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="pt-48 pb-32 px-6 md:px-12 bg-kael-paper min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <span className="micro-label">{content?.subtitle || 'The Art of Making'}</span>
          <h1 className="serif-display mt-4 mb-8">{content?.title || 'Our Craft'}</h1>
          {content?.content ? (
            <div className="prose prose-kael max-w-2xl mx-auto italic">
              <ReactMarkdown>{content.content}</ReactMarkdown>
            </div>
          ) : (
            <p className="prose prose-kael max-w-2xl mx-auto italic">
              A journey through the meticulous process of handloom artistry, where every thread tells a story of heritage and luxury.
            </p>
          )}
        </div>

        <div className="space-y-32">
          {sections.map((section, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
              <div className={idx % 2 === 1 ? 'md:order-2' : ''}>
                <span className="micro-label">{section.title}</span>
                <div className="prose prose-kael mt-8">
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              </div>
              <div className={cn("aspect-[4/5] overflow-hidden bg-white", idx % 2 === 1 ? 'md:order-1' : '')}>
                {section.imageUrl && (
                  <img src={section.imageUrl} alt={section.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const Contact = ({ pageContents }: { pageContents: PageContent[] }) => {
  const content = pageContents.find(p => p.pageId === 'contact');

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="pt-48 pb-32 px-6 md:px-12 bg-kael-paper min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="micro-label">{content?.subtitle || 'Connect With Us'}</span>
          <h1 className="serif-display mt-4 mb-8">{content?.title || 'Contact the Atelier'}</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
          <div>
            <div className="prose prose-kael mb-12">
              <ReactMarkdown>
                {content?.content || `
### Inquiries
For bespoke requests, collection inquiries, or to visit our atelier, please reach out via WhatsApp or Email.
                `}
              </ReactMarkdown>
            </div>
            
            <div className="space-y-12">
              {(content?.sections || []).map((section, idx) => (
                <div key={idx} className="border-t border-kael-gold/10 pt-8">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-4">{section.title}</h3>
                  <div className="prose prose-kael text-sm">
                    <ReactMarkdown>{section.content}</ReactMarkdown>
                  </div>
                </div>
              ))}

              {!content?.sections?.length && (
                <div className="space-y-4 text-sm">
                  <p><strong>WhatsApp:</strong> +971 569728661</p>
                  <p><strong>Email:</strong> atelier@kael.com</p>
                  <p><strong>Location:</strong> Dubai, UAE</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-white p-10 shadow-sm border border-kael-gold/10 h-fit">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-8">Send a Message</h3>
            <form className="space-y-6">
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Name</label>
                <input type="text" className="w-full border-b border-kael-gold/20 py-2 focus:outline-none focus:border-kael-gold" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Email</label>
                <input type="email" className="w-full border-b border-kael-gold/20 py-2 focus:outline-none focus:border-kael-gold" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Message</label>
                <textarea className="w-full border-b border-kael-gold/20 py-2 focus:outline-none focus:border-kael-gold h-32"></textarea>
              </div>
              <button type="button" className="btn-luxury w-full">Send Inquiry</button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const ProductDetail = ({ product, setPage, addToCart, trackView }: { product: Product, setPage: (p: Page) => void, addToCart: (p: Product) => void, trackView: (type: 'product' | 'journal', id: string, category?: string) => void }) => {
  const [selectedImage, setSelectedImage] = useState(product.imageUrls[0]);

  useEffect(() => {
    trackView('product', product.id!, product.category);
  }, [product.id]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="pt-32 pb-20 px-6 md:px-12 max-w-7xl mx-auto"
    >
      <button onClick={() => setPage('collections')} className="flex items-center text-[10px] uppercase tracking-widest mb-12 hover:text-kael-gold transition-colors">
        <ArrowLeft size={14} className="mr-2" /> Back to Collection
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
        {/* Left: Gallery */}
        <div className="space-y-6">
          <div className="aspect-[3/4] bg-white overflow-hidden">
            <img src={selectedImage} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div className="grid grid-cols-5 gap-4">
            {product.imageUrls.map((url, idx) => (
              <div 
                key={idx} 
                className={cn(
                  "aspect-square bg-white overflow-hidden cursor-pointer border-2 transition-all",
                  selectedImage === url ? "border-kael-gold" : "border-transparent opacity-60 hover:opacity-100"
                )}
                onClick={() => setSelectedImage(url)}
              >
                <img src={url} alt={`${product.name} angle ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            ))}
          </div>
        </div>

        {/* Right: Info */}
        <div className="flex flex-col justify-center">
          <div className="flex justify-between items-start">
            <span className="micro-label">{product.category}</span>
            {product.sku && <span className="text-[10px] text-kael-gold tracking-widest uppercase font-bold">SKU: {product.sku}</span>}
          </div>
          <h1 className="text-4xl font-bold mt-2 mb-2 tracking-tight">{product.name}</h1>
          {product.tagline && <p className="text-sm italic text-kael-purple mb-4">"{product.tagline}"</p>}
          <p className="text-lg font-bold text-kael-gold mb-8">AED {product.price.toLocaleString()}</p>
          
          <div className="space-y-8 mb-12">
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-3">Craftsmanship Story</h4>
              <p className="text-sm text-kael-purple leading-relaxed">{product.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              {product.fitType && (
                <div>
                  <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Fit Type</h4>
                  <p className="text-sm text-kael-purple">{product.fitType}</p>
                </div>
              )}
              {product.packageContent && (
                <div>
                  <h4 className="text-xs uppercase tracking-widest font-bold mb-2">Package Content</h4>
                  <p className="text-sm text-kael-purple">{product.packageContent}</p>
                </div>
              )}
            </div>

            {product.sizes && product.sizes.length > 0 && (
              <div>
                <h4 className="text-xs uppercase tracking-widest font-bold mb-3">Available Sizes</h4>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map(size => (
                    <span key={size} className="px-4 py-2 border border-kael-gold/20 text-xs uppercase tracking-widest">{size}</span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-3">Material Details</h4>
              <p className="text-sm text-kael-purple leading-relaxed">{product.materialDetails || "Hand-spun mulberry silk with pure zari borders."}</p>
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <button 
              onClick={() => addToCart(product)}
              className="btn-luxury w-full bg-kael-ink text-white hover:bg-kael-gold"
            >
              Add to Cart
            </button>
            <button 
              onClick={() => {
                const phoneNumber = "971569728661";
                const message = `Hello KAEL Atelier, I am interested in purchasing the ${product.name} (SKU: ${product.sku || 'N/A'}).\n\nPrice: AED ${product.price.toLocaleString()}\n\nPlease let me know the next steps. Thank you!`;
                const encodedMessage = encodeURIComponent(message);
                window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
              }}
              className="btn-luxury w-full border border-kael-gold text-kael-ink hover:bg-kael-gold hover:text-white flex items-center justify-center"
            >
              <MessageCircle size={16} className="mr-2" /> Purchase via WhatsApp
            </button>
          </div>
        </div>
      </div>

      {/* Tabs / Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-24 border-t border-kael-gold/10">
        <div>
          <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Fabric Details</h4>
          <p className="text-xs text-kael-purple leading-loose">
            {product.materialDetails || "100% Pure Handloom Silk. Natural dyes used for the deep hues. Woven on a traditional pit loom over 45 days."}
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Care Instructions</h4>
          <p className="text-xs text-kael-purple leading-loose">
            {product.careInstructions || "Dry clean only. Store in a cool, dry place wrapped in soft muslin cloth. Avoid direct sunlight to preserve natural dyes."}
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-widest font-bold mb-6">Craft Story</h4>
          <p className="text-xs text-kael-purple leading-loose">
            {product.craftStory || "This piece represents the Jamdani weaving technique, where motifs are added by hand as the fabric is woven, creating a floating effect."}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

const Cart = ({ cart, updateQuantity, removeFromCart, setPage }: { 
  cart: OrderItem[], 
  updateQuantity: (id: string, q: number) => void, 
  removeFromCart: (id: string) => void,
  setPage: (p: Page) => void
}) => {
  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = () => {
    const phoneNumber = "971569728661"; // Updated WhatsApp number
    const message = `Hello KAEL Atelier, I would like to place an order for:\n\n${cart.map(item => `- ${item.name} (SKU: ${item.sku || 'N/A'}) (x${item.quantity}) - AED ${(item.price * item.quantity).toLocaleString()}`).join('\n')}\n\nTotal: AED ${total.toLocaleString()}\n\nPlease let me know the next steps. Thank you!`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="pt-32 pb-20 px-6 md:px-12 max-w-4xl mx-auto min-h-[70vh]"
    >
      <h1 className="text-3xl font-bold mb-12 text-center">Your Cart</h1>

      {cart.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-kael-purple mb-8">Your cart is currently empty.</p>
          <button onClick={() => setPage('collections')} className="btn-luxury">Continue Shopping</button>
        </div>
      ) : (
        <div className="space-y-12">
          {cart.map((item) => (
            <div key={item.productId} className="flex items-center space-x-6 border-b border-kael-gold/10 pb-8">
              <div className="w-24 h-32 bg-white overflow-hidden flex-shrink-0">
                <img src={item.imageUrls[0]} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-grow">
                <h3 className="text-sm font-bold uppercase tracking-wider">{item.name}</h3>
                <p className="text-xs text-kael-gold mt-1">AED {item.price.toLocaleString()}</p>
                <div className="flex items-center space-x-4 mt-4">
                  <button 
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-8 h-8 border border-kael-gold/20 flex items-center justify-center hover:bg-kael-gold/10"
                  >-</button>
                  <span className="text-sm">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-8 h-8 border border-kael-gold/20 flex items-center justify-center hover:bg-kael-gold/10"
                  >+</button>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">AED {(item.price * item.quantity).toLocaleString()}</p>
                <button 
                  onClick={() => removeFromCart(item.productId)}
                  className="text-kael-purple hover:text-red-500 mt-4 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          <div className="pt-8 flex flex-col items-end">
            <div className="w-full md:w-80 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-kael-purple">Subtotal</span>
                <span>AED {total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-kael-purple">Shipping</span>
                <span>Complimentary</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-kael-gold/20 pt-4">
                <span>Total</span>
                <span>AED {total.toLocaleString()}</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="btn-luxury w-full bg-kael-ink text-white hover:bg-kael-gold mt-8"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const LoginPage = ({ onLogin, user, setIsSimpleAdminLoggedIn }: { onLogin: () => void, user: User | null, setIsSimpleAdminLoggedIn: (b: boolean) => void }) => {
  const [error, setError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const handleSimpleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Kael' && password === '1061') {
      setIsSimpleAdminLoggedIn(true);
      onLogin();
    } else {
      setError('Invalid username or password.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-kael-paper px-6">
        <div className="bg-white p-12 shadow-2xl max-w-md w-full text-center">
          <Logo />
          <h2 className="text-2xl font-bold mt-8 mb-4">Welcome Back</h2>
          <p className="text-sm text-kael-purple mb-10">You are currently signed in as {user.email}.</p>
          <div className="space-y-4">
            <button 
              onClick={() => onLogin()}
              className="btn-luxury w-full bg-kael-ink text-white hover:bg-kael-gold"
            >
              Go to Dashboard
            </button>
            <button 
              onClick={() => signOut(auth)}
              className="text-xs uppercase tracking-widest text-red-500 hover:text-red-700 font-bold"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-kael-paper px-6">
      <div className="bg-white p-12 shadow-2xl max-w-md w-full text-center">
        <Logo />
        <h2 className="text-2xl font-bold mt-8 mb-4">Atelier Access</h2>
        
        {error && <p className="text-red-500 text-xs mb-6">{error}</p>}

        {!showAdminLogin ? (
          <div className="space-y-6">
            <p className="text-sm text-kael-purple mb-10">Sign in to your account to manage your orders or access the atelier dashboard.</p>
            <button 
              onClick={handleGoogleLogin}
              className="btn-luxury w-full flex items-center justify-center space-x-3"
            >
              <UserIcon size={18} />
              <span>Sign in with Google</span>
            </button>
            <div className="pt-6 border-t border-kael-gold/10">
              <button 
                onClick={() => setShowAdminLogin(true)}
                className="text-[10px] uppercase tracking-widest text-kael-gold hover:text-kael-ink transition-colors"
              >
                Admin Login with Credentials
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSimpleLogin} className="space-y-6 text-left">
            <p className="text-sm text-kael-purple mb-6 text-center">Enter your administrative credentials.</p>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Username</label>
              <input 
                type="text" required
                className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Password</label>
              <input 
                type="password" required
                className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-luxury w-full bg-kael-ink text-white hover:bg-kael-gold">
              Login as Admin
            </button>
            <button 
              type="button"
              onClick={() => setShowAdminLogin(false)}
              className="w-full text-[10px] uppercase tracking-widest text-kael-purple hover:text-kael-ink transition-colors"
            >
              Back to Google Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const Collections = ({ 
  products, 
  categories, 
  setPage, 
  setSelectedProduct,
  searchQuery,
  pageContents
}: { 
  products: Product[], 
  categories: Category[], 
  setPage: (p: Page) => void, 
  setSelectedProduct: (p: Product) => void,
  searchQuery: string,
  pageContents: PageContent[]
}) => {
  const content = pageContents.find(p => p.pageId === 'collections');
  const hasData = products.length > 0;
  
  // Static samples to show if database is empty
  const samples: Product[] = [
    {
      id: 'sample-1',
      name: "Classic Mens Tunic",
      price: 12000,
      imageUrls: [
        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800"
      ],
      category: "Mens Wear",
      collection: "Beyond The Sea",
      description: "Hand-woven cotton tunic with subtle embroidery.",
      craftStory: "Woven by master weavers in Varanasi.",
      materialDetails: "100% Pure Cotton",
      careInstructions: "Dry clean only.",
      createdAt: new Date().toISOString()
    },
    {
      id: 'sample-2',
      name: "Silk Evening Gown",
      price: 45000,
      imageUrls: [
        "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=800"
      ],
      category: "Womens Wear",
      collection: "Beyond The Sea",
      description: "Elegant silk gown with hand-carved block prints.",
      craftStory: "Hand-carved block prints from Rajasthan.",
      materialDetails: "Organic Silk",
      careInstructions: "Hand wash separately.",
      createdAt: new Date().toISOString()
    },
    {
      id: 'sample-3',
      name: "Modest Abaya",
      price: 18000,
      imageUrls: [
        "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1564419434663-c49967363849?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1564419320408-38e24e038739?auto=format&fit=crop&q=80&w=800",
        "https://images.unsplash.com/photo-1564419320391-096963f2537c?auto=format&fit=crop&q=80&w=800"
      ],
      category: "Modest",
      collection: "Beyond The Sea",
      description: "Ultra-fine hand-spun modest wear.",
      craftStory: "Hand-spun on traditional wooden looms.",
      materialDetails: "100% Fine Wool",
      careInstructions: "Professional dry clean only.",
      createdAt: new Date().toISOString()
    }
  ];

  const displayProducts = (hasData ? products : samples).filter(p => {
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      (p.collection || '').toLowerCase().includes(query)
    );
  });

  const displayCategories = categories.length > 0 ? categories : [
    { id: 'c1', name: 'Mens Wear', description: '' },
    { id: 'c2', name: 'Womens Wear', description: '' },
    { id: 'c3', name: 'Modest', description: '' }
  ];

  const collections = ["Beyond The Sea", "Future Collection I", "Future Collection II"];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="pt-32 pb-20 px-6 md:px-12 bg-kael-paper min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        <div className="mb-16 text-center">
          <span className="micro-label">Artisanal Curation</span>
          <h1 className="serif-display mt-2 mb-4">Our Collections</h1>
          <p className="text-kael-purple max-w-2xl mx-auto italic">
            {hasData 
              ? "Explore our meticulously hand-woven masterpieces, categorized by their unique craft and heritage."
              : "Previewing our signature collections. Use the Admin Dashboard to add your own masterpieces."
            }
          </p>
        </div>

        <div className="space-y-32">
          {collections.map((collectionName, collectionIdx) => {
            const collectionProducts = displayProducts.filter(p => p.collection === collectionName || (!p.collection && collectionName === "Beyond The Sea"));
            const isFuture = collectionProducts.length === 0 && collectionIdx > 0;

            return (
              <div key={collectionName} className="relative">
                <div className="mb-12 text-center">
                  <h2 className="text-4xl md:text-5xl font-bold serif-display tracking-tight text-kael-ink">{collectionName}</h2>
                  <div className="w-24 h-px bg-kael-gold mx-auto mt-4"></div>
                </div>

                {isFuture ? (
                  <div className="py-20 border border-dashed border-kael-gold/30 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
                    <span className="micro-label mb-4">Coming Soon</span>
                    <p className="text-kael-purple italic">A new artisanal journey is being curated.</p>
                  </div>
                ) : (
                  <div className="space-y-20">
                    {displayCategories.map(category => {
                      const categoryProducts = collectionProducts.filter(p => p.category === category.name);
                      if (categoryProducts.length === 0) return null;

                      return (
                        <div key={category.id}>
                          <div className="flex items-baseline gap-4 mb-8 border-b border-kael-ink/10 pb-4">
                            <h3 className="text-2xl font-bold">{category.name}</h3>
                            <span className="text-xs uppercase tracking-widest text-kael-purple">
                              {categoryProducts.length} {hasData ? 'Pieces' : 'Sample Pieces'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                            {categoryProducts.map(product => (
                              <ProductCard 
                                key={product.id} 
                                product={product} 
                                hasData={hasData}
                                onClick={() => {
                                  if (hasData) {
                                    setSelectedProduct(product);
                                    setPage('product');
                                  }
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

const AdminDashboard = ({ 
  setPage, 
  setIsSimpleAdminLoggedIn,
  products,
  orders,
  journalEntries,
  categories,
  pageContents
}: { 
  setPage: (p: Page) => void, 
  setIsSimpleAdminLoggedIn: (b: boolean) => void,
  products: Product[],
  orders: Order[],
  journalEntries: JournalEntry[],
  categories: Category[],
  pageContents: PageContent[]
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'journal' | 'categories' | 'pages'>('products');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingJournal, setIsAddingJournal] = useState(false);
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [editingPage, setEditingPage] = useState<PageContent | null>(null);
  
  // Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    imageUrls: ['', '', '', '', ''],
    category: '',
    collection: 'Beyond The Sea',
    description: '',
    craftStory: '',
    materialDetails: '',
    careInstructions: '',
    sku: '',
    tagline: '',
    fitType: '',
    packageContent: '',
    sizes: [],
    isFeatured: false
  });

  const [newJournal, setNewJournal] = useState<Partial<JournalEntry>>({
    title: '',
    date: '',
    imageUrl: '',
    excerpt: '',
    content: ''
  });

  const [newCategory, setNewCategory] = useState<Partial<Category>>({
    name: '',
    description: ''
  });

  const [newPage, setNewPage] = useState<Partial<PageContent>>({
    pageId: '',
    title: '',
    subtitle: '',
    heroImageUrl: '',
    content: '',
    sections: []
  });

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const { id, ...productData } = newProduct;
        await updateDoc(doc(db, 'products', editingProduct.id!), {
          ...productData
        });
        setEditingProduct(null);
      } else {
        const { id, ...productData } = newProduct;
        await addDoc(collection(db, 'products'), {
          ...productData,
          isFeatured: newProduct.isFeatured || false,
          createdAt: new Date().toISOString()
        });
      }
      setIsAddingProduct(false);
      setNewProduct({ 
        name: '', 
        price: 0, 
        imageUrls: ['', '', '', '', ''], 
        category: '', 
        collection: 'Beyond The Sea',
        description: '', 
        craftStory: '', 
        materialDetails: '', 
        careInstructions: '', 
        sku: '',
        tagline: '',
        fitType: '',
        packageContent: '',
        sizes: [],
        isFeatured: false 
      });
    } catch (err) {
      handleFirestoreError(err, editingProduct ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  const handleAddJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJournal) {
        const { id, ...journalData } = newJournal;
        await updateDoc(doc(db, 'journal', editingJournal.id!), {
          ...journalData
        });
        setEditingJournal(null);
      } else {
        const { id, ...journalData } = newJournal;
        await addDoc(collection(db, 'journal'), {
          ...journalData,
          createdAt: new Date().toISOString()
        });
      }
      setIsAddingJournal(false);
      setNewJournal({ title: '', date: '', imageUrl: '', excerpt: '', content: '' });
    } catch (err) {
      handleFirestoreError(err, editingJournal ? OperationType.UPDATE : OperationType.CREATE, 'journal');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        const { id, ...categoryData } = newCategory;
        await updateDoc(doc(db, 'categories', editingCategory.id!), {
          ...categoryData
        });
        setEditingCategory(null);
      } else {
        const { id, ...categoryData } = newCategory;
        await addDoc(collection(db, 'categories'), {
          ...categoryData,
          createdAt: new Date().toISOString()
        });
      }
      setIsAddingCategory(false);
      setNewCategory({ name: '', description: '' });
    } catch (err) {
      handleFirestoreError(err, editingCategory ? OperationType.UPDATE : OperationType.CREATE, 'categories');
    }
  };

  const handleAddPage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPage) {
        const { id, ...pageData } = newPage;
        await updateDoc(doc(db, 'page_content', editingPage.id!), {
          ...pageData,
          updatedAt: new Date().toISOString()
        });
        setEditingPage(null);
      } else {
        const { id, ...pageData } = newPage;
        await addDoc(collection(db, 'page_content'), {
          ...pageData,
          updatedAt: new Date().toISOString()
        });
      }
      setIsAddingPage(false);
      setNewPage({ pageId: '', title: '', subtitle: '', heroImageUrl: '', content: '', sections: [] });
    } catch (err) {
      handleFirestoreError(err, editingPage ? OperationType.UPDATE : OperationType.CREATE, 'page_content');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `products/${id}`);
    }
  };

  const handleDeleteJournal = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'journal', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `journal/${id}`);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `categories/${id}`);
    }
  };

  const handleDeletePage = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'page_content', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `page_content/${id}`);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setNewProduct(product);
    setIsAddingProduct(true);
  };

  const handleEditJournal = (entry: JournalEntry) => {
    setEditingJournal(entry);
    setNewJournal(entry);
    setIsAddingJournal(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setNewCategory(category);
    setIsAddingCategory(true);
  };

  const handleEditPage = (page: PageContent) => {
    setEditingPage(page);
    setNewPage(page);
    setIsAddingPage(true);
  };

  const handleUpdateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-kael-paper pt-32 pb-20 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-bold">Atelier Dashboard</h1>
            <p className="text-sm text-kael-purple mt-2">Manage your products, collections, and orders.</p>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => setActiveTab('products')}
              className={cn("px-6 py-2 text-xs uppercase tracking-widest transition-all", activeTab === 'products' ? "bg-kael-ink text-white" : "bg-white text-kael-ink border border-kael-gold/20")}
            >
              Products
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={cn("px-6 py-2 text-xs uppercase tracking-widest transition-all", activeTab === 'orders' ? "bg-kael-ink text-white" : "bg-white text-kael-ink border border-kael-gold/20")}
            >
              Orders
            </button>
            <button 
              onClick={() => setActiveTab('journal')}
              className={cn("px-6 py-2 text-xs uppercase tracking-widest transition-all", activeTab === 'journal' ? "bg-kael-ink text-white" : "bg-white text-kael-ink border border-kael-gold/20")}
            >
              Journal
            </button>
            <button 
              onClick={() => setActiveTab('categories')}
              className={cn("px-6 py-2 text-xs uppercase tracking-widest transition-all", activeTab === 'categories' ? "bg-kael-ink text-white" : "bg-white text-kael-ink border border-kael-gold/20")}
            >
              Categories
            </button>
            <button 
              onClick={() => setActiveTab('pages')}
              className={cn("px-6 py-2 text-xs uppercase tracking-widest transition-all", activeTab === 'pages' ? "bg-kael-ink text-white" : "bg-white text-kael-ink border border-kael-gold/20")}
            >
              Pages
            </button>
            <button 
              onClick={() => setPage('home')}
              className="px-6 py-2 text-xs uppercase tracking-widest bg-white text-kael-ink border border-kael-gold/20 hover:bg-kael-paper flex items-center"
            >
              <HomeIcon size={14} className="mr-2" />
              Back to Store
            </button>
            <button onClick={() => { signOut(auth); setIsSimpleAdminLoggedIn(false); }} className="px-6 py-2 text-xs uppercase tracking-widest bg-red-50 text-red-600 border border-red-100">
              Logout
            </button>
          </div>
        </div>

        {activeTab === 'products' ? (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Product Catalog</h2>
              <button 
                onClick={() => setIsAddingProduct(true)}
                className="btn-luxury bg-kael-gold text-white border-none flex items-center"
              >
                <Plus size={16} className="mr-2" /> Add Product
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product) => (
                <div key={product.id} className="bg-white p-6 shadow-sm border border-kael-gold/5 group">
                  <div className="aspect-square bg-kael-paper mb-4 overflow-hidden">
                    <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase text-kael-gold font-bold">{product.category}</span>
                        {product.isFeatured && (
                          <span className="bg-kael-gold/10 text-kael-gold text-[8px] px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">Featured</span>
                        )}
                      </div>
                      <h3 className="font-bold text-sm mt-1">{product.name}</h3>
                      <p className="font-bold text-sm mt-2">AED {product.price.toLocaleString()}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditProduct(product)}
                        className="text-kael-purple hover:text-kael-gold transition-colors"
                      >
                        <Settings size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteProduct(product.id!)}
                        className="text-kael-purple hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'categories' ? (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Product Categories</h2>
              <button 
                onClick={() => setIsAddingCategory(true)}
                className="btn-luxury bg-kael-gold text-white border-none flex items-center"
              >
                <Plus size={16} className="mr-2" /> Add Category
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categories.map((category) => (
                <div key={category.id} className="bg-white p-6 shadow-sm border border-kael-gold/5 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm">{category.name}</h3>
                    <p className="text-xs text-kael-purple mt-1">{category.description || 'No description'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditCategory(category)}
                      className="text-kael-purple hover:text-kael-gold transition-colors"
                    >
                      <Settings size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(category.id!)}
                      className="text-kael-purple hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'orders' ? (
          <div className="bg-white shadow-sm border border-kael-gold/5 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-kael-paper border-b border-kael-gold/10">
                <tr>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest">Order ID</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest">Amount</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-kael-gold/5">
                {orders.map((order) => (
                  <tr key={order.id} className="text-sm">
                    <td className="px-6 py-4 font-mono text-[10px]">#{order.id?.slice(-6)}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold">{order.customerName}</div>
                      <div className="text-xs text-kael-purple">{order.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 font-bold">AED {order.totalAmount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] uppercase font-bold",
                        order.status === 'pending' ? "bg-yellow-50 text-yellow-600" :
                        order.status === 'processing' ? "bg-blue-50 text-blue-600" :
                        order.status === 'shipped' ? "bg-purple-50 text-purple-600" :
                        "bg-green-50 text-green-600"
                      )}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={order.status}
                        onChange={(e) => handleUpdateOrderStatus(order.id!, e.target.value as Order['status'])}
                        className="text-xs border border-kael-gold/20 p-1 bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'journal' ? (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Journal Management</h2>
              <button 
                onClick={() => {
                  setEditingJournal(null);
                  setNewJournal({ title: '', date: '', imageUrl: '', excerpt: '', content: '' });
                  setIsAddingJournal(true);
                }}
                className="btn-luxury bg-kael-gold text-white border-none flex items-center"
              >
                <Plus size={16} className="mr-2" /> New Entry
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {journalEntries.map((entry) => (
                <div key={entry.id} className="bg-white p-6 shadow-sm border border-kael-gold/5 flex space-x-6">
                  <div className="w-24 h-24 bg-kael-paper flex-shrink-0 overflow-hidden">
                    <img src={entry.imageUrl} alt={entry.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <span className="text-[10px] uppercase text-kael-gold font-bold">{entry.date}</span>
                    <h3 className="font-bold text-sm mt-1">{entry.title}</h3>
                    <p className="text-xs text-kael-purple mt-2 line-clamp-2">{entry.excerpt}</p>
                    <div className="flex space-x-4 mt-4">
                      <button 
                        onClick={() => handleEditJournal(entry)}
                        className="text-[10px] uppercase tracking-widest font-bold hover:text-kael-gold"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteJournal(entry.id!)}
                        className="text-[10px] uppercase tracking-widest font-bold text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Page Content Management</h2>
              <button 
                onClick={() => {
                  setEditingPage(null);
                  setNewPage({ pageId: '', title: '', subtitle: '', heroImageUrl: '', content: '', sections: [] });
                  setIsAddingPage(true);
                }}
                className="btn-luxury bg-kael-gold text-white border-none flex items-center"
              >
                <Plus size={16} className="mr-2" /> New Page
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pageContents.map((page) => (
                <div key={page.id} className="bg-white p-6 shadow-sm border border-kael-gold/5 flex space-x-6">
                  <div className="w-24 h-24 bg-kael-paper flex-shrink-0 overflow-hidden">
                    <img src={page.heroImageUrl || 'https://via.placeholder.com/150'} alt={page.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <span className="text-[10px] uppercase text-kael-gold font-bold">{page.pageId}</span>
                    <h3 className="font-bold text-sm mt-1">{page.title}</h3>
                    <p className="text-xs text-kael-purple mt-2 line-clamp-2">{page.subtitle}</p>
                    <div className="flex space-x-4 mt-4">
                      <button 
                        onClick={() => handleEditPage(page)}
                        className="text-[10px] uppercase tracking-widest font-bold hover:text-kael-gold"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeletePage(page.id!)}
                        className="text-[10px] uppercase tracking-widest font-bold text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddingProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-kael-ink/50 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">{editingProduct ? 'Edit Creation' : 'Add New Creation'}</h2>
                <button onClick={() => { setIsAddingProduct(false); setEditingProduct(null); }}><X size={24} /></button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Product Name</label>
                    <input 
                      type="text" required
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newProduct.name || ''}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Price (AED)</label>
                    <input 
                      type="number" required
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newProduct.price || 0}
                      onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">SKU</label>
                    <input 
                      type="text"
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newProduct.sku || ''}
                      onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Tagline</label>
                    <input 
                      type="text"
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newProduct.tagline || ''}
                      onChange={(e) => setNewProduct({...newProduct, tagline: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Fit Type</label>
                    <input 
                      type="text"
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newProduct.fitType || ''}
                      onChange={(e) => setNewProduct({...newProduct, fitType: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Package Content</label>
                    <input 
                      type="text"
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newProduct.packageContent || ''}
                      onChange={(e) => setNewProduct({...newProduct, packageContent: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Sizes (Comma separated)</label>
                  <input 
                    type="text"
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                    placeholder="e.g. 54, 56, 58 or M, L, XL"
                    value={newProduct.sizes?.join(', ') || ''}
                    onChange={(e) => setNewProduct({...newProduct, sizes: e.target.value.split(',').map(s => s.trim()).filter(s => s !== '')})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Category</label>
                    <select 
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold bg-white"
                      value={newProduct.category || ''}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Collection</label>
                    <select 
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold bg-white"
                      value={newProduct.collection || 'Beyond The Sea'}
                      onChange={(e) => setNewProduct({...newProduct, collection: e.target.value})}
                    >
                      <option value="Beyond The Sea">Beyond The Sea</option>
                      <option value="Future Collection I">Future Collection I</option>
                      <option value="Future Collection II">Future Collection II</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center h-full pt-6">
                  <label className="flex items-center cursor-pointer group">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only"
                        checked={newProduct.isFeatured || false}
                        onChange={(e) => setNewProduct({...newProduct, isFeatured: e.target.checked})}
                      />
                      <div className={cn(
                        "w-10 h-5 bg-kael-paper rounded-full shadow-inner transition-colors",
                        newProduct.isFeatured ? "bg-kael-gold" : "bg-kael-paper"
                      )}></div>
                      <div className={cn(
                        "absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                        newProduct.isFeatured ? "translate-x-5" : "translate-x-0"
                      )}></div>
                    </div>
                    <span className="ml-3 text-[10px] uppercase tracking-widest font-bold">Featured Piece</span>
                  </label>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-4">Product Images (5 Angles)</label>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {[0, 1, 2, 3, 4].map((idx) => (
                      <div key={idx}>
                        <label className="text-[8px] uppercase tracking-widest font-bold block mb-1">Angle {idx + 1} {idx === 0 ? '(Front View)' : ''}</label>
                        <input 
                          type="url" required
                          className="w-full border border-kael-gold/20 p-2 text-[10px] focus:outline-kael-gold"
                          placeholder="Image URL"
                          value={newProduct.imageUrls?.[idx] || ''}
                          onChange={(e) => {
                            const newUrls = [...(newProduct.imageUrls || ['', '', '', '', ''])];
                            newUrls[idx] = e.target.value;
                            setNewProduct({...newProduct, imageUrls: newUrls});
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Craftsmanship Story (Short)</label>
                  <textarea 
                    required
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold h-24"
                    value={newProduct.description || ''}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Detailed Craft Story</label>
                  <textarea 
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold h-24"
                    value={newProduct.craftStory || ''}
                    onChange={(e) => setNewProduct({...newProduct, craftStory: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Material Details</label>
                    <input 
                      type="text"
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newProduct.materialDetails || ''}
                      onChange={(e) => setNewProduct({...newProduct, materialDetails: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Care Instructions</label>
                    <input 
                      type="text"
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newProduct.careInstructions || ''}
                      onChange={(e) => setNewProduct({...newProduct, careInstructions: e.target.value})}
                    />
                  </div>
                </div>

                <button type="submit" className="btn-luxury w-full bg-kael-ink text-white hover:bg-kael-gold">
                  {editingProduct ? 'Update Storefront' : 'Publish to Storefront'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Modal */}
      <AnimatePresence>
        {isAddingCategory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-kael-ink/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white max-w-md w-full p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                <button onClick={() => { setIsAddingCategory(false); setEditingCategory(null); setNewCategory({ name: '', description: '' }); }}><X size={24} /></button>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Category Name</label>
                  <input 
                    type="text" required
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                    value={newCategory.name || ''}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Description</label>
                  <textarea 
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold h-24"
                    value={newCategory.description || ''}
                    onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                  />
                </div>
                <button type="submit" className="btn-luxury w-full bg-kael-ink text-white hover:bg-kael-gold">
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Journal Modal */}
      <AnimatePresence>
        {isAddingJournal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-kael-ink/50 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold">{editingJournal ? 'Edit Journal Entry' : 'New Journal Entry'}</h2>
                <button onClick={() => { setIsAddingJournal(false); setEditingJournal(null); }}><X size={24} /></button>
              </div>

              <form onSubmit={handleAddJournal} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Title</label>
                    <input 
                      type="text" required
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newJournal.title || ''}
                      onChange={(e) => setNewJournal({...newJournal, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Display Date (e.g. March 2026)</label>
                    <input 
                      type="text" required
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newJournal.date || ''}
                      onChange={(e) => setNewJournal({...newJournal, date: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Image URL</label>
                  <input 
                    type="url" required
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                    value={newJournal.imageUrl || ''}
                    onChange={(e) => setNewJournal({...newJournal, imageUrl: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Excerpt (Short Preview)</label>
                  <textarea 
                    required
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold h-24"
                    value={newJournal.excerpt || ''}
                    onChange={(e) => setNewJournal({...newJournal, excerpt: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Full Content (Markdown supported)</label>
                  <textarea 
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold h-48"
                    value={newJournal.content || ''}
                    onChange={(e) => setNewJournal({...newJournal, content: e.target.value})}
                  />
                </div>

                <button type="submit" className="btn-luxury w-full bg-kael-ink text-white hover:bg-kael-gold">
                  {editingJournal ? 'Update Journal' : 'Publish to Journal'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Content Modal */}
      <AnimatePresence>
        {isAddingPage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-kael-ink/50 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white max-w-2xl w-full p-10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-xl font-bold">{editingPage ? 'Edit Page Content' : 'Add New Page Content'}</h2>
                <button onClick={() => { setIsAddingPage(false); setEditingPage(null); setNewPage({ pageId: '', title: '', subtitle: '', heroImageUrl: '', content: '', sections: [] }); }}><X size={24} /></button>
              </div>

              <form onSubmit={handleAddPage} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Page ID (e.g., about, craft, contact)</label>
                    <input 
                      type="text" required
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newPage.pageId || ''}
                      onChange={(e) => setNewPage({...newPage, pageId: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Page Title</label>
                    <input 
                      type="text" required
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newPage.title || ''}
                      onChange={(e) => setNewPage({...newPage, title: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Subtitle / Hero Text</label>
                  <input 
                    type="text"
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                    value={newPage.subtitle || ''}
                    onChange={(e) => setNewPage({...newPage, subtitle: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Hero Image URL</label>
                  <input 
                    type="text"
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                    value={newPage.heroImageUrl || ''}
                    onChange={(e) => setNewPage({...newPage, heroImageUrl: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Main Content (Markdown supported)</label>
                  <textarea 
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold h-32"
                    value={newPage.content || ''}
                    onChange={(e) => setNewPage({...newPage, content: e.target.value})}
                  />
                </div>

                <div className="space-y-6 pt-6 border-t border-kael-gold/10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold uppercase tracking-widest">Page Sections</h3>
                    <button 
                      type="button"
                      onClick={() => {
                        const sections = [...(newPage.sections || [])];
                        sections.push({ title: '', content: '', imageUrl: '', imagePosition: 'left' });
                        setNewPage({ ...newPage, sections });
                      }}
                      className="text-[10px] uppercase tracking-widest font-bold text-kael-gold hover:text-kael-ink"
                    >
                      + Add Section
                    </button>
                  </div>

                  <div className="space-y-10">
                    {(newPage.sections || []).map((section, idx) => (
                      <div key={idx} className="p-6 bg-kael-paper/50 border border-kael-gold/10 space-y-4 relative">
                        <button 
                          type="button"
                          onClick={() => {
                            const sections = [...(newPage.sections || [])];
                            sections.splice(idx, 1);
                            setNewPage({ ...newPage, sections });
                          }}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[8px] uppercase tracking-widest font-bold block mb-1">Section Title</label>
                            <input 
                              type="text"
                              className="w-full border border-kael-gold/20 p-2 text-xs focus:outline-kael-gold"
                              value={section.title}
                              onChange={(e) => {
                                const sections = [...(newPage.sections || [])];
                                sections[idx].title = e.target.value;
                                setNewPage({ ...newPage, sections });
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-[8px] uppercase tracking-widest font-bold block mb-1">Image Position</label>
                            <select 
                              className="w-full border border-kael-gold/20 p-2 text-xs focus:outline-kael-gold"
                              value={section.imagePosition || 'left'}
                              onChange={(e) => {
                                const sections = [...(newPage.sections || [])];
                                sections[idx].imagePosition = e.target.value as 'left' | 'right';
                                setNewPage({ ...newPage, sections });
                              }}
                            >
                              <option value="left">Left</option>
                              <option value="right">Right</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[8px] uppercase tracking-widest font-bold block mb-1">Image URL</label>
                          <input 
                            type="text"
                            className="w-full border border-kael-gold/20 p-2 text-xs focus:outline-kael-gold"
                            value={section.imageUrl || ''}
                            onChange={(e) => {
                              const sections = [...(newPage.sections || [])];
                              sections[idx].imageUrl = e.target.value;
                              setNewPage({ ...newPage, sections });
                            }}
                          />
                        </div>

                        <div>
                          <label className="text-[8px] uppercase tracking-widest font-bold block mb-1">Section Content (Markdown)</label>
                          <textarea 
                            className="w-full border border-kael-gold/20 p-2 text-xs focus:outline-kael-gold h-24"
                            value={section.content}
                            onChange={(e) => {
                              const sections = [...(newPage.sections || [])];
                              sections[idx].content = e.target.value;
                              setNewPage({ ...newPage, sections });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="btn-luxury w-full bg-kael-ink text-white hover:bg-kael-gold">
                  {editingPage ? 'Update Page Content' : 'Save Page Content'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Journal = ({ setPage, journalEntries, trackView, pageContents }: { setPage: (p: Page) => void, journalEntries: JournalEntry[], trackView: (type: 'product' | 'journal', id: string) => void, pageContents: PageContent[] }) => {
  const content = pageContents.find(p => p.pageId === 'journal');

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="pt-48 pb-32 px-6 md:px-12 bg-kael-paper min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <span className="micro-label">{content?.subtitle || 'Editorial'}</span>
          <h1 className="serif-display">{content?.title || 'The KAEL Journal'}</h1>
          <p className="mt-6 text-kael-purple max-w-xl mx-auto italic">
            {content?.content || 'Exploring the intersection of heritage, craftsmanship, and modern luxury.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          {journalEntries.length > 0 ? journalEntries.map((entry) => (
            <div 
              key={entry.id} 
              className="group cursor-pointer"
              onClick={() => {
                trackView('journal', entry.id!);
                setPage('journal');
              }}
            >
              <div className="aspect-[16/10] overflow-hidden mb-8 shadow-lg">
                <img 
                  src={entry.imageUrl} 
                  alt={entry.title} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-kael-gold font-bold">{entry.date}</span>
              <h2 className="text-2xl font-bold mt-4 mb-4 group-hover:text-kael-gold transition-colors">{entry.title}</h2>
              <p className="text-sm text-kael-purple leading-relaxed mb-6 line-clamp-3 italic">
                {entry.excerpt}
              </p>
              <div className="w-12 h-[1px] bg-kael-gold group-hover:w-24 transition-all duration-500" />
            </div>
          )) : (
            <div className="col-span-full text-center py-32 text-kael-purple italic">
              Our journal is currently being written by our curators.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const PersonalizedFeed = ({ 
  userActivity, 
  products, 
  journalEntries, 
  setPage, 
  setSelectedProduct,
  trackView
}: { 
  userActivity: UserActivity | null, 
  products: Product[], 
  journalEntries: JournalEntry[],
  setPage: (p: Page) => void,
  setSelectedProduct: (p: Product) => void,
  trackView: (type: 'product' | 'journal', id: string, category?: string) => void
}) => {
  if (!userActivity || (userActivity.viewedProductIds.length === 0 && userActivity.viewedJournalIds.length === 0)) {
    return null;
  }

  // Recommendation logic
  const recommendedProducts = products
    .filter(p => !userActivity.viewedProductIds.includes(p.id!)) // Don't show what they already saw
    .filter(p => userActivity.preferredCategories.includes(p.category)) // Match their preferred categories
    .slice(0, 3);

  const recommendedJournal = journalEntries
    .filter(j => !userActivity.viewedJournalIds.includes(j.id!))
    .slice(0, 3);

  if (recommendedProducts.length === 0 && recommendedJournal.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-12">
          <span className="micro-label">Curated For You</span>
          <h2 className="serif-display mt-2">Personalized Atelier</h2>
        </div>

        {recommendedProducts.length > 0 && (
          <div className="mb-16">
            <h3 className="text-sm uppercase tracking-widest font-bold mb-8 text-kael-gold">Recommended Masterpieces</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {recommendedProducts.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  hasData={true}
                  onClick={() => {
                    setSelectedProduct(product);
                    setPage('product');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {recommendedJournal.length > 0 && (
          <div>
            <h3 className="text-sm uppercase tracking-widest font-bold mb-8 text-kael-gold">From the Journal</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {recommendedJournal.map(entry => (
                <div 
                  key={entry.id} 
                  className="group cursor-pointer"
                  onClick={() => {
                    trackView('journal', entry.id!);
                    setPage('journal');
                  }}
                >
                  <div className="aspect-video overflow-hidden mb-6 shadow-sm group-hover:shadow-md transition-shadow">
                    <img src={entry.imageUrl} alt={entry.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <h4 className="text-lg font-bold group-hover:text-kael-gold transition-colors">{entry.title}</h4>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

// --- Main App ---

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSimpleAdminLoggedIn, setIsSimpleAdminLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [pageContents, setPageContents] = useState<PageContent[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'products'));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'categories'));

    const unsubJournal = onSnapshot(collection(db, 'journal'), (snapshot) => {
      setJournalEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'journal'));

    const unsubPageContent = onSnapshot(collection(db, 'page_content'), (snapshot) => {
      setPageContents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PageContent)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'page_content'));

    return () => { unsubProducts(); unsubCategories(); unsubJournal(); unsubPageContent(); };
  }, []);

  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. ");
        }
      }
    };
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(u?.email === 'betsiflash@gmail.com' || u?.email === 'Kael21.ae@gmail.com');
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const savedAdmin = localStorage.getItem('kael-admin-session');
    if (savedAdmin === 'true') setIsSimpleAdminLoggedIn(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('kael-admin-session', isSimpleAdminLoggedIn.toString());
  }, [isSimpleAdminLoggedIn]);

  // Load user activity
  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, 'user_activity', user.uid), (snapshot) => {
        if (snapshot.exists()) {
          setUserActivity(snapshot.data() as UserActivity);
        }
      }, (error) => handleFirestoreError(error, OperationType.GET, `user_activity/${user.uid}`));
      return () => unsub();
    } else {
      const saved = localStorage.getItem('kael-activity');
      if (saved) setUserActivity(JSON.parse(saved));
    }
  }, [user]);

  // Track view
  const trackView = async (type: 'product' | 'journal', id: string, category?: string) => {
    const currentActivity: UserActivity = userActivity || {
      uid: user?.uid || 'guest',
      viewedProductIds: [],
      viewedJournalIds: [],
      preferredCategories: [],
      updatedAt: new Date().toISOString()
    };

    const updatedActivity = { ...currentActivity };
    if (type === 'product') {
      if (!updatedActivity.viewedProductIds.includes(id)) {
        updatedActivity.viewedProductIds = [id, ...updatedActivity.viewedProductIds].slice(0, 20);
      }
      if (category && !updatedActivity.preferredCategories.includes(category)) {
        updatedActivity.preferredCategories = [category, ...updatedActivity.preferredCategories].slice(0, 5);
      }
    } else {
      if (!updatedActivity.viewedJournalIds.includes(id)) {
        updatedActivity.viewedJournalIds = [id, ...updatedActivity.viewedJournalIds].slice(0, 20);
      }
    }
    updatedActivity.updatedAt = new Date().toISOString();

    setUserActivity(updatedActivity);
    if (user) {
      try {
        await setDoc(doc(db, 'user_activity', user.uid), updatedActivity);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `user_activity/${user.uid}`);
      }
    } else {
      localStorage.setItem('kael-activity', JSON.stringify(updatedActivity));
    }
  };

  const effectiveIsAdmin = isAdmin || isSimpleAdminLoggedIn;

  useEffect(() => {
    if (effectiveIsAdmin) {
      const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
        setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      }, (error) => handleFirestoreError(error, OperationType.GET, 'orders'));
      return () => unsubOrders();
    }
  }, [effectiveIsAdmin]);

  useEffect(() => {
    const savedCart = localStorage.getItem('kael-cart');
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  useEffect(() => {
    localStorage.setItem('kael-cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { 
        productId: product.id!, 
        name: product.name, 
        price: product.price, 
        quantity: 1, 
        imageUrls: product.imageUrls,
        sku: product.sku
      }];
    });
    setPage('cart');
  };

  const updateQuantity = (id: string, q: number) => {
    if (q < 1) return;
    setCart(prev => prev.map(item => item.productId === id ? { ...item, quantity: q } : item));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.productId !== id));
  };

  // Simple routing
  const renderPage = () => {
    switch (page) {
      case 'home': return <Home setPage={setPage} setSelectedProduct={setSelectedProduct} products={products} journalEntries={journalEntries} userActivity={userActivity} trackView={trackView} />;
      case 'about': return <About pageContents={pageContents} />;
      case 'craft': return <Craft pageContents={pageContents} />;
      case 'contact': return <Contact pageContents={pageContents} />;
      case 'product': return selectedProduct ? <ProductDetail product={selectedProduct} setPage={setPage} addToCart={addToCart} trackView={trackView} /> : <Home setPage={setPage} setSelectedProduct={setSelectedProduct} products={products} journalEntries={journalEntries} userActivity={userActivity} trackView={trackView} />;
      case 'cart': return <Cart cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} setPage={setPage} />;
      case 'journal': return <Journal setPage={setPage} journalEntries={journalEntries} trackView={trackView} pageContents={pageContents} />;
      case 'login': return <LoginPage onLogin={() => setPage(effectiveIsAdmin ? 'admin' : 'home')} user={user} setIsSimpleAdminLoggedIn={setIsSimpleAdminLoggedIn} />;
      case 'admin': return effectiveIsAdmin ? <AdminDashboard setPage={setPage} setIsSimpleAdminLoggedIn={setIsSimpleAdminLoggedIn} products={products} orders={orders} journalEntries={journalEntries} categories={categories} pageContents={pageContents} /> : <LoginPage onLogin={() => setPage('admin')} user={user} setIsSimpleAdminLoggedIn={setIsSimpleAdminLoggedIn} />;
      case 'collections': return <Collections products={products} categories={categories} setPage={setPage} setSelectedProduct={setSelectedProduct} searchQuery={searchQuery} pageContents={pageContents} />;
      default: return (
        <div className="pt-48 pb-32 px-6 text-center">
          <span className="micro-label">{page}</span>
          <h1 className="serif-display mb-8 capitalize">{page}</h1>
          <p className="text-kael-purple max-w-xl mx-auto">This section is currently being curated to reflect the highest standards of handloom luxury.</p>
          <button onClick={() => setPage('home')} className="btn-luxury mt-12">Return Home</button>
        </div>
      );
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen selection:bg-kael-gold selection:text-white">
        {page !== 'admin' && (
          <Navbar 
            currentPage={page} 
            setPage={setPage} 
            cartCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
            user={user}
            isAdmin={effectiveIsAdmin}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}
        
        <main>
          <AnimatePresence mode="wait">
            {renderPage()}
          </AnimatePresence>
        </main>

        {page !== 'admin' && <Footer setPage={setPage} />}
      </div>
    </ErrorBoundary>
  );
}
