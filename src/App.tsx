import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Menu, 
  X, 
  ChevronRight, 
  Instagram, 
  Facebook, 
  Twitter, 
  Plus, 
  Trash2, 
  LogOut, 
  ArrowLeft,
  Package,
  Settings,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
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
import { Product, Order, OrderItem, Category, Page, UserProfile, JournalEntry } from './types';
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

const Navbar = ({ currentPage, setPage, cartCount, user, isAdmin }: { 
  currentPage: Page, 
  setPage: (p: Page) => void, 
  cartCount: number,
  user: User | null,
  isAdmin: boolean
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let interval: any;
    if (isHovered && product.imageUrls.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % product.imageUrls.length);
      }, 1000);
    } else {
      setCurrentImageIndex(0);
    }
    return () => clearInterval(interval);
  }, [isHovered, product.imageUrls]);

  return (
    <div 
      className="group cursor-pointer"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[3/4] overflow-hidden mb-6">
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
      <p className="text-kael-gold font-medium">₹{product.price.toLocaleString()}</p>
    </div>
  );
};

// --- Pages ---

const Home = ({ 
  setPage, 
  setSelectedProduct,
  products,
  journalEntries
}: { 
  setPage: (p: Page) => void, 
  setSelectedProduct: (p: Product) => void,
  products: Product[],
  journalEntries: JournalEntry[]
}) => {
  const featuredProducts = products
    .filter(p => p.category === 'Modest' || p.category === 'Limited Editions')
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
              <div key={article.id} className="group cursor-pointer" onClick={() => setPage('journal')}>
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

const About = () => {
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
          src="https://images.unsplash.com/photo-1528154291023-a6525fabe5b4?auto=format&fit=crop&q=80&w=2000" 
          alt="Handloom Weaving" 
          className="w-full h-full object-cover brightness-75"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white px-6">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="micro-label text-white/80"
          >
            Our Story
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-5xl md:text-7xl font-bold tracking-tight"
          >
            About KAEL
          </motion.h1>
        </div>
      </section>

      {/* Content Section 1 */}
      <section className="py-32 px-6 md:px-24 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="micro-label">The Beginning</span>
              <h2 className="serif-display mb-8">A Quiet Desire</h2>
              <p className="text-lg text-kael-purple leading-loose italic">
                "KAEL was born from a quiet desire — to create clothing that feels meaningful in a world of excess."
              </p>
            </div>
            <div className="aspect-[4/5] overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1606103920295-9a091573f160?auto=format&fit=crop&q=80&w=1000" 
                alt="Textile Detail" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content Section 2 - Full Width Text */}
      <section className="py-32 px-6 md:px-24 bg-kael-paper">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xl md:text-2xl text-kael-ink leading-relaxed font-light mb-12">
            In a time where fashion often moves too fast and feels increasingly uniform, KAEL chooses a different path. One that values time, intention, and the beauty of things made by hand.
          </p>
          <div className="w-24 h-[1px] bg-kael-gold mx-auto mb-12" />
          <p className="text-lg text-kael-purple leading-loose">
            At the heart of KAEL lies handloom — fabrics woven with patience, carrying a natural texture and depth that no machine can replicate. These textiles become the foundation of each piece, brought to life through delicate hand embroidery, added slowly and thoughtfully, never to overwhelm, but to enhance.
          </p>
        </div>
      </section>

      {/* Content Section 3 - Image & Text */}
      <section className="py-32 px-6 md:px-24 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div className="order-2 md:order-1 aspect-[3/4] overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&q=80&w=1000" 
                alt="Artisan at work" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="order-1 md:order-2">
              <span className="micro-label">The Integrity</span>
              <h2 className="text-3xl font-bold mb-8 tracking-tight">Limited by Nature</h2>
              <p className="text-sm text-kael-purple leading-loose mb-8">
                Every garment is created in limited numbers, not just for exclusivity, but to preserve the integrity of the process. Behind each piece are skilled hands, quiet dedication, and stories woven into every thread.
              </p>
              <p className="text-sm text-kael-purple leading-loose">
                KAEL is deeply rooted in craftsmanship, yet shaped for the present. It reimagines traditional techniques through a modern lens — creating silhouettes that are refined, effortless, and timeless.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-40 px-6 md:px-24 bg-kael-ink text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold mb-12 tracking-tighter leading-tight">
            "Clothing that feels meaningful in a world of excess."
          </h2>
          <span className="micro-label text-white/60">The KAEL Manifesto</span>
        </div>
      </section>
    </motion.div>
  );
};

const ProductDetail = ({ product, setPage, addToCart }: { product: Product, setPage: (p: Page) => void, addToCart: (p: Product) => void }) => {
  const [selectedImage, setSelectedImage] = useState(product.imageUrls[0]);

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
          <span className="micro-label">{product.category}</span>
          <h1 className="text-4xl font-bold mb-6 tracking-tight">{product.name}</h1>
          <p className="text-lg font-bold text-kael-gold mb-8">₹{product.price.toLocaleString()}</p>
          
          <div className="space-y-8 mb-12">
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-3">Craftsmanship Story</h4>
              <p className="text-sm text-kael-purple leading-relaxed">{product.description}</p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-3">Material Details</h4>
              <p className="text-sm text-kael-purple leading-relaxed">{product.materialDetails || "Hand-spun mulberry silk with pure zari borders."}</p>
            </div>
          </div>

          <button 
            onClick={() => addToCart(product)}
            className="btn-luxury w-full bg-kael-ink text-white hover:bg-kael-gold"
          >
            Add to Cart
          </button>
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
                <p className="text-xs text-kael-gold mt-1">₹{item.price.toLocaleString()}</p>
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
                <p className="text-sm font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
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
                <span>₹{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-kael-purple">Shipping</span>
                <span>Complimentary</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-kael-gold/20 pt-4">
                <span>Total</span>
                <span>₹{total.toLocaleString()}</span>
              </div>
              <button className="btn-luxury w-full bg-kael-ink text-white hover:bg-kael-gold mt-8">
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
  setSelectedProduct 
}: { 
  products: Product[], 
  categories: Category[], 
  setPage: (p: Page) => void, 
  setSelectedProduct: (p: Product) => void 
}) => {
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
      description: "Ultra-fine hand-spun modest wear.",
      craftStory: "Hand-spun on traditional wooden looms.",
      materialDetails: "100% Fine Wool",
      careInstructions: "Professional dry clean only.",
      createdAt: new Date().toISOString()
    }
  ];

  const displayProducts = hasData ? products : samples;
  const displayCategories = categories.length > 0 ? categories : [
    { id: 'c1', name: 'Mens Wear', description: '' },
    { id: 'c2', name: 'Womens Wear', description: '' },
    { id: 'c3', name: 'Modest', description: '' }
  ];

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

        {displayCategories.map(category => {
          const categoryProducts = displayProducts.filter(p => p.category === category.name);
          if (categoryProducts.length === 0) return null;

          return (
            <div key={category.id} className="mb-20">
              <div className="flex items-baseline gap-4 mb-8 border-b border-kael-ink/10 pb-4">
                <h2 className="text-3xl font-bold">{category.name}</h2>
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
    </motion.div>
  );
};

const AdminDashboard = ({ 
  setPage, 
  setIsSimpleAdminLoggedIn,
  products,
  orders,
  journalEntries,
  categories
}: { 
  setPage: (p: Page) => void, 
  setIsSimpleAdminLoggedIn: (b: boolean) => void,
  products: Product[],
  orders: Order[],
  journalEntries: JournalEntry[],
  categories: Category[]
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'journal' | 'categories'>('products');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingJournal, setIsAddingJournal] = useState(false);
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    imageUrls: ['', '', '', '', ''],
    category: '',
    description: '',
    craftStory: '',
    materialDetails: '',
    careInstructions: ''
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

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id!), {
          ...newProduct
        });
        setEditingProduct(null);
      } else {
        await addDoc(collection(db, 'products'), {
          ...newProduct,
          createdAt: new Date().toISOString()
        });
      }
      setIsAddingProduct(false);
      setNewProduct({ name: '', price: 0, imageUrls: ['', '', '', '', ''], category: '', description: '', craftStory: '', materialDetails: '', careInstructions: '' });
    } catch (err) {
      handleFirestoreError(err, editingProduct ? OperationType.UPDATE : OperationType.CREATE, 'products');
    }
  };

  const handleAddJournal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJournal) {
        await updateDoc(doc(db, 'journal', editingJournal.id!), {
          ...newJournal
        });
        setEditingJournal(null);
      } else {
        await addDoc(collection(db, 'journal'), {
          ...newJournal,
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
        await updateDoc(doc(db, 'categories', editingCategory.id!), {
          ...newCategory
        });
        setEditingCategory(null);
      } else {
        await addDoc(collection(db, 'categories'), {
          ...newCategory,
          createdAt: new Date().toISOString()
        });
      }
      setIsAddingCategory(false);
      setNewCategory({ name: '', description: '' });
    } catch (err) {
      handleFirestoreError(err, editingCategory ? OperationType.UPDATE : OperationType.CREATE, 'categories');
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

  const handleUpdateOrderStatus = async (id: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const seedInitialData = async () => {
    const sampleCategories = [
      { name: "Mens Wear", description: "Premium hand-woven menswear", createdAt: new Date().toISOString() },
      { name: "Womens Wear", description: "Elegant handloom womenswear", createdAt: new Date().toISOString() },
      { name: "Modest", description: "Exclusive modest wear pieces", createdAt: new Date().toISOString() }
    ];

    for (const cat of sampleCategories) {
      await addDoc(collection(db, 'categories'), cat);
    }

    const sampleProducts = [
      {
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
        description: "Hand-woven cotton tunic with subtle embroidery.",
        craftStory: "Woven by master weavers in Varanasi using techniques passed down for seven generations.",
        materialDetails: "100% Pure Cotton",
        careInstructions: "Dry clean only. Store in muslin.",
        createdAt: new Date().toISOString()
      },
      {
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
        description: "Elegant silk gown with hand-carved block prints.",
        craftStory: "The blocks are hand-carved from seasoned teak wood and printed by artisans in Rajasthan.",
        materialDetails: "Organic Silk",
        careInstructions: "Hand wash separately in cold water.",
        createdAt: new Date().toISOString()
      },
      {
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
        description: "Ultra-fine hand-spun modest wear.",
        craftStory: "Hand-spun on traditional wooden looms in the high Himalayas.",
        materialDetails: "100% Fine Wool",
        careInstructions: "Professional dry clean only.",
        createdAt: new Date().toISOString()
      }
    ];

    for (const p of sampleProducts) {
      try {
        await addDoc(collection(db, 'products'), p);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'products_seed');
      }
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
              onClick={seedInitialData}
              className="px-6 py-2 text-xs uppercase tracking-widest bg-kael-paper text-kael-gold border border-kael-gold/20 hover:bg-kael-gold/10"
            >
              Seed Data
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
                      <span className="text-[10px] uppercase text-kael-gold font-bold">{product.category}</span>
                      <h3 className="font-bold text-sm mt-1">{product.name}</h3>
                      <p className="font-bold text-sm mt-2">₹{product.price.toLocaleString()}</p>
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
                    <td className="px-6 py-4 font-bold">₹{order.totalAmount.toLocaleString()}</td>
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
        ) : (
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
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Price (₹)</label>
                    <input 
                      type="number" required
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct({...newProduct, price: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Category</label>
                    <select 
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold bg-white"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
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
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Detailed Craft Story</label>
                  <textarea 
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold h-24"
                    value={newProduct.craftStory}
                    onChange={(e) => setNewProduct({...newProduct, craftStory: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Material Details</label>
                    <input 
                      type="text"
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newProduct.materialDetails}
                      onChange={(e) => setNewProduct({...newProduct, materialDetails: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Care Instructions</label>
                    <input 
                      type="text"
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newProduct.careInstructions}
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
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Description</label>
                  <textarea 
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold h-24"
                    value={newCategory.description}
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
                      value={newJournal.title}
                      onChange={(e) => setNewJournal({...newJournal, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Display Date (e.g. March 2026)</label>
                    <input 
                      type="text" required
                      className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                      value={newJournal.date}
                      onChange={(e) => setNewJournal({...newJournal, date: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Image URL</label>
                  <input 
                    type="url" required
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                    value={newJournal.imageUrl}
                    onChange={(e) => setNewJournal({...newJournal, imageUrl: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Excerpt (Short Preview)</label>
                  <textarea 
                    required
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold h-24"
                    value={newJournal.excerpt}
                    onChange={(e) => setNewJournal({...newJournal, excerpt: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Full Content (Markdown supported)</label>
                  <textarea 
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold h-48"
                    value={newJournal.content}
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
    </div>
  );
};

const Journal = ({ setPage, journalEntries }: { setPage: (p: Page) => void, journalEntries: JournalEntry[] }) => {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="pt-48 pb-32 px-6 md:px-12 bg-kael-paper min-h-screen"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <span className="micro-label">Editorial</span>
          <h1 className="serif-display">The KAEL Journal</h1>
          <p className="mt-6 text-kael-purple max-w-xl mx-auto italic">
            Exploring the intersection of heritage, craftsmanship, and modern luxury.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-16">
          {journalEntries.length > 0 ? journalEntries.map((entry) => (
            <div key={entry.id} className="group cursor-pointer">
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

// --- Main App ---

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSimpleAdminLoggedIn, setIsSimpleAdminLoggedIn] = useState(false);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
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

    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'orders'));

    return () => { unsubProducts(); unsubCategories(); unsubJournal(); unsubOrders(); };
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
      setIsAdmin(u?.email === 'betsiflash@gmail.com');
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

  const effectiveIsAdmin = isAdmin || isSimpleAdminLoggedIn;

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
        imageUrls: product.imageUrls 
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
      case 'home': return <Home setPage={setPage} setSelectedProduct={setSelectedProduct} products={products} journalEntries={journalEntries} />;
      case 'about': return <About />;
      case 'product': return selectedProduct ? <ProductDetail product={selectedProduct} setPage={setPage} addToCart={addToCart} /> : <Home setPage={setPage} setSelectedProduct={setSelectedProduct} products={products} journalEntries={journalEntries} />;
      case 'cart': return <Cart cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} setPage={setPage} />;
      case 'journal': return <Journal setPage={setPage} journalEntries={journalEntries} />;
      case 'login': return <LoginPage onLogin={() => setPage(effectiveIsAdmin ? 'admin' : 'home')} user={user} setIsSimpleAdminLoggedIn={setIsSimpleAdminLoggedIn} />;
      case 'admin': return effectiveIsAdmin ? <AdminDashboard setPage={setPage} setIsSimpleAdminLoggedIn={setIsSimpleAdminLoggedIn} products={products} orders={orders} journalEntries={journalEntries} categories={categories} /> : <LoginPage onLogin={() => setPage('admin')} user={user} setIsSimpleAdminLoggedIn={setIsSimpleAdminLoggedIn} />;
      case 'collections': return <Collections products={products} categories={categories} setPage={setPage} setSelectedProduct={setSelectedProduct} />;
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
