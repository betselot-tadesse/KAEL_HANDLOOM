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
  Pin,
  Link as LinkIcon,
  Home as HomeIcon,
  User as UserIcon,
  AlertCircle
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
  signInWithEmailAndPassword,
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
            <h2 className="text-2xl font-bold mb-4">KAEL Error</h2>
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
import { Product, Order, OrderItem, Category, Page, UserProfile, Collection, Testimonial, UserActivity, PageContent } from './types';
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
            <li>KAEL<br />Heritage Lane, Varanasi</li>
            <li>kael21.ae@gmail.com</li>
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

const Testimonials = ({ testimonials }: { testimonials: Testimonial[] }) => {
  const defaultTestimonials: Testimonial[] = [
    {
      customerName: "Avinash Kr",
      content: "The craftsmanship of the handloom silk is unlike anything I've ever worn. It feels like wearing a piece of history and the attention to detail is breathtaking.",
      location: "Co-Founder at xyz",
      avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200",
      rating: 5,
      createdAt: new Date().toISOString()
    },
    {
      customerName: "Bharat Kunal",
      content: "KAEL's attention to detail in their embroidery is breathtaking. Each piece is truly a work of art. I highly recommend their collections for anyone seeking quality.",
      location: "Manager at xyz",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200",
      rating: 5,
      createdAt: new Date().toISOString()
    },
    {
      customerName: "Prabhakar D",
      content: "I appreciate the slow fashion approach. Knowing that my tunic was woven over 45 days makes it so much more meaningful. The quality is simply unparalleled.",
      location: "Founder / CEO at xyz",
      avatarUrl: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&q=80&w=200",
      rating: 5,
      createdAt: new Date().toISOString()
    }
  ];

  const displayTestimonials = testimonials.length > 0 ? testimonials.slice(0, 3) : defaultTestimonials;

  return (
    <section className="py-32 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-kael-gold uppercase tracking-tighter mb-4">Testimonials</h2>
          <div className="w-24 h-1 bg-kael-gold mx-auto mb-8"></div>
          <p className="text-kael-purple text-sm max-w-2xl mx-auto">
            What our valued customers say about their experience with KAEL's handcrafted luxury.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12">
          {displayTestimonials.map((testimonial, idx) => (
            <div key={testimonial.id || idx} className="relative bg-gray-50 p-10 pt-16 shadow-sm hover:shadow-md transition-shadow duration-300">
              {/* Avatar */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full border-4 border-white overflow-hidden shadow-lg bg-white">
                <img 
                  src={testimonial.avatarUrl || `https://ui-avatars.com/api/?name=${testimonial.customerName}&background=random`} 
                  alt={testimonial.customerName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {/* Quote Mark Start */}
              <div className="text-kael-gold text-4xl font-serif absolute top-12 left-6 opacity-30">“</div>
              
              <div className="text-center">
                <p className="text-kael-purple text-sm leading-relaxed mb-8 italic">
                  {testimonial.content}
                </p>
                
                {/* Quote Mark End */}
                <div className="text-kael-gold text-4xl font-serif inline-block opacity-30 -mt-4">”</div>
                
                <div className="mt-6">
                  <h4 className="text-kael-gold font-bold text-lg">{testimonial.customerName}</h4>
                  <p className="text-kael-ink text-[10px] uppercase tracking-widest mt-1">{testimonial.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Home = ({ 
  setPage, 
  setSelectedProduct,
  products,
  testimonials,
  userActivity,
  trackView
}: { 
  setPage: (p: Page) => void, 
  setSelectedProduct: (p: Product) => void,
  products: Product[],
  testimonials: Testimonial[],
  userActivity: UserActivity | null,
  trackView: (type: 'product' | 'collection', id: string, category?: string) => void
}) => {
  const featuredProducts = products
    .filter(p => p.isFeatured)
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 4);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {/* Hero Section */}
      <section className="relative h-screen w-full overflow-hidden flex items-end md:items-center justify-center pt-20 md:pt-24 pb-20 md:pb-0">
        <div className="absolute inset-x-0 bottom-0 top-20 md:top-24 z-0 pointer-events-none overflow-hidden">
          <img 
            src="https://i.ibb.co/mVLr0dyc/image-banner-main.jpg" 
            alt="KAEL Hero Banner" 
            className="w-full h-full object-cover object-center md:object-top brightness-[0.7] md:brightness-[0.6]"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 md:hidden" />
        </div>
        
        <div className="relative z-10 text-center text-white px-6">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="micro-label text-white/90 md:text-white/80"
          >
            A Handloom Luxury
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-5xl md:text-8xl font-bold mb-4 md:mb-6 tracking-tighter"
          >
            KAEL
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-base md:text-xl font-light mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed px-4"
          >
            Crafted through tradition. Designed for timeless elegance.
          </motion.p>
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            onClick={() => setPage('collections')}
            className="btn-luxury border-white text-white hover:bg-white hover:text-kael-ink px-10 md:px-12"
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

      {/* Collection Spotlight */}
      <section className="py-32 px-6 md:px-24 bg-kael-ink text-white overflow-hidden relative min-h-[80vh] flex items-center">
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <img 
            src="https://i.ibb.co/PvwYSKmz/beyond-the-sea-collection.jpg" 
            alt="Sea background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
            >
              <span className="micro-label text-kael-gold">Collection 01</span>
              <h2 className="text-6xl md:text-9xl font-bold text-white mt-4 mb-8 leading-none tracking-tighter uppercase">Beyond the <br /> Sea</h2>
              <p className="text-lg md:text-xl text-white/95 leading-loose mb-10 italic font-light max-w-2xl">
                “Beyond the Sea” reflects a meeting point—where the quiet stillness of the shore merges with the hidden richness beneath the water. Shells, corals, and shifting currents come together as a single language, translated through thoughtful embroidery and balanced forms.
              </p>
              <button 
                onClick={() => setPage('collections')}
                className="btn-luxury border-white text-white hover:bg-white hover:text-kael-ink px-12"
              >
                Discover the Collection
              </button>
            </motion.div>
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

      {/* Testimonials */}
      <Testimonials testimonials={testimonials} />

      {/* The Craft */}
      <section className="relative h-[90vh] w-full overflow-hidden">
        <img 
          src="https://i.ibb.co/wHCV6n2/craft-4.jpg" 
          alt="Heritage Craft Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center p-6">
          <div className="bg-[#F2F2F2] p-12 md:p-24 max-w-4xl text-center shadow-2xl">
            <span className="micro-label text-kael-gold mb-6">The Process</span>
            <h2 className="text-4xl md:text-6xl font-bold mb-10 tracking-tight text-kael-ink">Heritage in Every Thread</h2>
            <p className="text-base text-kael-purple leading-relaxed mb-12 max-w-2xl mx-auto">
              Each KAEL textile takes weeks of meticulous labor. From hand-spinning the silk to the complex rhythmic dance of the loom, we honor the silence and focus required to create true luxury.
            </p>
            <button 
              onClick={() => setPage('craft')} 
              className="px-12 py-4 border border-kael-ink text-kael-ink uppercase tracking-[0.3em] text-sm hover:bg-kael-ink hover:text-white transition-all duration-500"
            >
              Discover the Craft
            </button>
          </div>
        </div>
      </section>

    </motion.div>
  );
};

const About = ({ pageContents }: { pageContents: PageContent[] }) => {
  const content = pageContents.find(p => p.pageId === 'about');

  const defaultContent: PageContent = {
    pageId: 'about',
    title: 'About KAEL',
    subtitle: 'A Vision by Anusree',
    heroImageUrl: 'https://i.ibb.co/RGKTFDyt/image-a.jpg',
    content: 'KAEL was born from a quiet desire — to create clothing that feels meaningful in a world of excess.',
    updatedAt: new Date().toISOString(),
    sections: [
      {
        title: 'Our Path',
        content: 'In a time where fashion often moves too fast and feels increasingly uniform, KAEL chooses a different path. One that values time, intention, and the beauty of things made by hand.',
        imageUrl: 'https://i.ibb.co/rfG2Fgn3/craft-1.jpg',
        imagePosition: 'right'
      },
      {
        title: 'The Heart of Handloom',
        content: 'At the heart of KAEL lies handloom — fabrics woven with patience, carrying a natural texture and depth that no machine can replicate. These textiles become the foundation of each piece, brought to life through delicate hand embroidery, added slowly and thoughtfully, never to overwhelm, but to enhance.',
        imageUrl: 'https://i.ibb.co/mrQKf3FQ/craft-2.jpg',
        imagePosition: 'left'
      },
      {
        title: 'Integrity in Process',
        content: 'Every garment is created in limited numbers, not just for exclusivity, but to preserve the integrity of the process. Behind each piece are skilled hands, quiet dedication, and stories woven into every thread.',
        imageUrl: 'https://i.ibb.co/Y7HDnKHD/craft-3.jpg',
        imagePosition: 'right'
      },
      {
        title: 'Modern Craftsmanship',
        content: 'KAEL is deeply rooted in craftsmanship, yet shaped for the present. It reimagines traditional techniques through a modern lens — creating silhouettes that are refined, effortless, and timeless.',
        imageUrl: 'https://i.ibb.co/QWmbmSd/portrait-1.jpg',
        imagePosition: 'left'
      },
      {
        title: 'The Feeling',
        content: 'More than clothing, KAEL is a feeling. A sense of calm in what you wear. A confidence that doesn’t need to be loud. A connection to something real, in a world that often feels fleeting. For those who seek meaning in what they choose to wear, KAEL becomes more than a garment — it becomes a part of their story.',
        imageUrl: '',
        imagePosition: 'left'
      }
    ]
  };

  const activeContent = content || defaultContent;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="bg-kael-paper min-h-screen"
    >
      {/* 1. Immersive Hero Section */}
      <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 3, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <img 
            src={activeContent.heroImageUrl || "https://images.unsplash.com/photo-1528154291023-a6525fabe5b4?auto=format&fit=crop&q=80&w=2000"} 
            alt={activeContent.title} 
            className="w-full h-full object-cover brightness-[0.5]"
            referrerPolicy="no-referrer"
          />
        </motion.div>
        <div className="relative z-10 flex flex-col items-center justify-center text-white px-6 text-center">
          <motion.span 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-[10px] uppercase tracking-[0.6em] font-bold text-kael-gold mb-8"
          >
            {activeContent.subtitle}
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-6xl md:text-9xl font-bold tracking-tighter serif-display leading-none"
          >
            Meaningful<br/>Elegance
          </motion.h1>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.2, duration: 1.5 }}
            className="w-32 h-px bg-kael-gold mt-12 origin-center"
          />
        </div>
      </section>

      {/* 2. Opening Statement */}
      <section className="py-32 px-6 md:px-24 bg-white border-b border-kael-gold/5">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
          >
            <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-kael-gold/60 mb-12 block">The Genesis</span>
            <h2 className="serif-display text-xl md:text-3xl leading-relaxed text-kael-ink italic font-light tracking-tight">
              "{activeContent.content}"
            </h2>
            <div className="w-px h-24 bg-kael-gold/20 mx-auto mt-16" />
          </motion.div>
        </div>
      </section>

      {/* 3. Editorial Staggered Sections */}
      <section className="pb-48 px-6 md:px-24 bg-white">
        <div className="max-w-7xl mx-auto space-y-64">
          {(activeContent.sections || []).filter(s => s.title !== 'The Feeling').map((section, idx) => (
            <div key={idx} className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
              {/* Image Column */}
              <motion.div 
                initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.2 }}
                className={cn(
                  "lg:col-span-7 aspect-[16/11] overflow-hidden shadow-2xl relative group",
                  idx % 2 === 0 ? "lg:order-1" : "lg:order-2 lg:col-start-6"
                )}
              >
                {section.imageUrl && (
                  <img 
                    src={section.imageUrl} 
                    alt={section.title} 
                    className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                )}
                <div className="absolute inset-0 bg-kael-ink/5 group-hover:bg-transparent transition-colors duration-700" />
              </motion.div>

              {/* Text Column */}
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 1 }}
                className={cn(
                  "lg:col-span-4 flex flex-col",
                  idx % 2 === 0 ? "lg:order-2 lg:col-start-9" : "lg:order-1 lg:col-start-1"
                )}
              >
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-kael-gold mb-6">
                  {String(idx + 1).padStart(2, '0')} / {section.title}
                </span>
                <h3 className="serif-display text-4xl mb-8 leading-tight">{section.title}</h3>
                <div className="prose prose-kael text-lg leading-relaxed text-kael-purple italic font-light">
                  <ReactMarkdown>{section.content}</ReactMarkdown>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Immersive Full-bleed Section */}
      {activeContent.sections?.find(s => s.title === 'The Feeling') && (
        <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-kael-ink py-24">
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1505118380757-91f5f45d8de6?auto=format&fit=crop&q=80&w=2000" 
              alt="Atmospheric background" 
              className="w-full h-full object-cover opacity-10 scale-110 blur-[4px]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto text-center text-white px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1.5 }}
            >
              <span className="text-[9px] uppercase tracking-[0.8em] font-bold text-kael-gold mb-12 block opacity-80">The Essence</span>
              <h2 className="serif-display text-lg md:text-2xl leading-[2] mb-12 italic font-light tracking-wide text-white/90">
                {activeContent.sections.find(s => s.title === 'The Feeling')?.content}
              </h2>
              <div className="w-8 h-px bg-kael-gold/40 mx-auto" />
            </motion.div>
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
      title: "Limited by Nature",
      content: "Our craft begins with the hands of master weavers, whose lineage of textile artistry spans generations. Each movement is a rhythmic dance of precision and patience, guided by the natural constraints of the handloom.",
      imageUrl: "https://i.ibb.co/spg9g3vJ/image-limited-by-nature.jpg",
      imagePosition: 'left' as const
    },
    {
      title: "The Weaver's Desire",
      content: "We use traditional wooden handlooms, mechanical marvels that require no electricity, only the skilled coordination of the weaver's hands and feet to bring a vision of desire to life.",
      imageUrl: "https://i.ibb.co/hxQFBbzv/image-desire.jpg",
      imagePosition: 'right' as const
    },
    {
      title: "Artisanal Mastery",
      content: "Our threads are sourced from sustainable silk and organic cotton, dyed with natural pigments to create a palette that reflects the vibrant soul of the sea and the mastery of the artisan.",
      imageUrl: "https://i.ibb.co/fdQ4TWry/image-b.jpg",
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
          <h1 className="serif-display mt-4 mb-8">{content?.title || 'Contact KAEL'}</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
          <div>
            <div className="prose prose-kael mb-12">
              <ReactMarkdown>
                {content?.content || `
### Inquiries
For bespoke requests, collection inquiries, or to visit us, please reach out via WhatsApp or Email.
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
                  <p><strong>Email:</strong> kael21.ae@gmail.com</p>
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

const ProductDetail = ({ product, setPage, addToCart, trackView }: { product: Product, setPage: (p: Page) => void, addToCart: (p: Product) => void, trackView: (type: 'product' | 'collection', id: string, category?: string) => void }) => {
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
            <div className="py-4 border-y border-kael-gold/10 flex items-center justify-center space-x-3">
              <div className="w-1 h-1 rounded-full bg-kael-gold"></div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-kael-ink">Shipping free in UAE</span>
              <div className="w-1 h-1 rounded-full bg-kael-gold"></div>
            </div>

            <div className="pt-8 border-t border-kael-gold/10">
              <h4 className="text-[10px] uppercase tracking-widest font-bold mb-4 text-kael-purple text-center">Share this Creation</h4>
              <div className="flex justify-center space-x-8">
                <button 
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(`Discover ${product.name} at KAEL`);
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
                  }}
                  className="text-kael-ink hover:text-kael-gold transition-colors"
                  title="Share on Facebook"
                >
                  <Facebook size={18} />
                </button>
                <button 
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const text = encodeURIComponent(`Discover ${product.name} at KAEL`);
                    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}`, '_blank');
                  }}
                  className="text-kael-ink hover:text-kael-gold transition-colors"
                  title="Share on Twitter"
                >
                  <Twitter size={18} />
                </button>
                <button 
                  onClick={() => {
                    const url = encodeURIComponent(window.location.href);
                    const media = encodeURIComponent(product.imageUrls[0]);
                    const description = encodeURIComponent(`Discover ${product.name} at KAEL`);
                    window.open(`https://www.pinterest.com/pin/create/button/?url=${url}&media=${media}&description=${description}`, '_blank');
                  }}
                  className="text-kael-ink hover:text-kael-gold transition-colors"
                  title="Share on Pinterest"
                >
                  <Pin size={18} />
                </button>
                <button 
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url);
                    // We could add a toast here, but for now simple feedback
                  }}
                  className="text-kael-ink hover:text-kael-gold transition-colors"
                  title="Copy Link"
                >
                  <LinkIcon size={18} />
                </button>
              </div>
            </div>
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
    const message = `Hello KAEL, I would like to place an order for:\n\n${cart.map(item => `- ${item.name} (SKU: ${item.sku || 'N/A'}) (x${item.quantity}) - AED ${(item.price * item.quantity).toLocaleString()}`).join('\n')}\n\nTotal: AED ${total.toLocaleString()}\n\nPlease let me know the next steps. Thank you!`;
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
                <span className="text-kael-gold font-bold">Free in UAE</span>
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

const LoginPage = ({ onLogin, user, setIsSimpleAdminLoggedIn }: { onLogin: (dest?: Page) => void, user: User | null, setIsSimpleAdminLoggedIn: (b: boolean) => void }) => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const handleSimpleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    let email = username;
    let finalPassword = password;

    // Shortcut for the admin
    if (username.toLowerCase() === 'kael' && password === '1061') {
      email = 'kael21.ae@gmail.com';
      finalPassword = 'Kael@10611313';
    } else if (!username.includes('@')) {
      email = `${username.toLowerCase()}@gmail.com`;
    }
    
    console.log('Attempting login for:', email);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, finalPassword);
      console.log('Login successful:', userCredential.user.email);
      onLogin('admin');
    } catch (err: any) {
      console.error('Login error details:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid credentials. Please ensure the user exists in Firebase and Email/Password auth is enabled.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled in your Firebase Console.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection or Firebase configuration.');
      } else {
        setError(`Login failed: ${err.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    
    try {
      // Trigger popup IMMEDIATELY to avoid browser blocking
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/popup-blocked') {
        setError('Login popup was blocked. Please allow popups in your browser settings and try again.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain (kael-handloom.vercel.app) is not authorized in Firebase. Please see the instructions I provided to fix this.');
      } else {
        setError(`Login failed: ${err.message}`);
      }
    }
  };

  if (user) {
    const isAdminUser = user.email?.toLowerCase() === 'betsiflash@gmail.com' || 
                        user.email?.toLowerCase() === 'kael21.ae@gmail.com';

    return (
      <div className="min-h-screen flex items-center justify-center bg-kael-paper px-6">
        <div className="bg-white p-12 shadow-2xl max-w-md w-full text-center">
          <Logo />
          <h2 className="text-2xl font-bold mt-8 mb-4">Welcome Back</h2>
          <p className="text-sm text-kael-purple mb-4">You are currently signed in as {user.email}.</p>
          
          {!isAdminUser && (
            <div className="bg-red-50 border border-red-200 p-4 mb-8 rounded text-red-700 text-xs">
              This account does not have administrator privileges. Please sign in with an authorized admin account.
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={() => onLogin()}
              className="btn-luxury w-full bg-kael-ink text-white hover:bg-kael-gold"
            >
              Go to {isAdminUser ? 'Dashboard' : 'Store'}
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
        <h2 className="text-2xl font-bold mt-8 mb-4">KAEL Access</h2>
        
        {error && <p className="text-red-500 text-xs mb-6">{error}</p>}

        {!showAdminLogin ? (
          <div className="space-y-6">
            <p className="text-sm text-kael-purple mb-10">Sign in to your account to manage your orders or access the KAEL dashboard.</p>
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="btn-luxury w-full flex items-center justify-center space-x-3 disabled:opacity-50"
            >
              <UserIcon size={18} />
              <span>{loading ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>
            <div className="pt-6 border-t border-kael-gold/10">
              <button 
                onClick={() => setShowAdminLogin(true)}
                disabled={loading}
                className="text-[10px] uppercase tracking-widest text-kael-gold hover:text-kael-ink transition-colors disabled:opacity-50"
              >
                Admin Login with Credentials
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSimpleLogin} className="space-y-6 text-left">
            <p className="text-sm text-kael-purple mb-6 text-center">Enter your administrative credentials.</p>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Email or Username</label>
              <input 
                type="text" required
                placeholder="e.g. Kael"
                className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Password</label>
              <input 
                type="password" required
                className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="btn-luxury w-full bg-kael-ink text-white hover:bg-kael-gold disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Login as Admin'}
            </button>
            <button 
              type="button"
              onClick={() => setShowAdminLogin(false)}
              disabled={loading}
              className="w-full text-[10px] uppercase tracking-widest text-kael-purple hover:text-kael-ink transition-colors disabled:opacity-50"
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
  collections,
  setPage, 
  setSelectedProduct,
  searchQuery,
  pageContents
}: { 
  products: Product[], 
  categories: Category[], 
  collections: Collection[],
  setPage: (p: Page) => void, 
  setSelectedProduct: (p: Product) => void,
  searchQuery: string,
  pageContents: PageContent[]
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCollection, setSelectedCollection] = useState<string>('All');

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

  const allProducts = hasData ? products : samples;

  const displayProducts = allProducts.filter(p => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      p.name.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      (p.collection || '').toLowerCase().includes(query)
    );
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesCollection = selectedCollection === 'All' || p.collection === selectedCollection;
    
    return matchesSearch && matchesCategory && matchesCollection;
  });

  const displayCategories = categories.length > 0 ? categories : [
    { id: 'c1', name: 'Mens Wear', description: '' },
    { id: 'c2', name: 'Womens Wear', description: '' },
    { id: 'c3', name: 'Modest', description: '' }
  ];

  const availableCollections = collections.length > 0 
    ? collections.map(c => c.name) 
    : Array.from(new Set(allProducts.map(p => p.collection || "Beyond The Sea")));

  const collectionsToDisplay = selectedCollection === 'All' ? availableCollections : [selectedCollection];

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

        {/* Filters */}
        <div className="mb-16 flex flex-col md:flex-row items-center justify-center gap-8 border-y border-kael-gold/10 py-8">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-[10px] uppercase tracking-widest font-bold mb-3 text-kael-gold">Filter by Category</span>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => setSelectedCategory('All')}
                className={cn(
                  "px-4 py-1 text-[10px] uppercase tracking-widest transition-all border",
                  selectedCategory === 'All' ? "bg-kael-ink text-white border-kael-ink" : "bg-white text-kael-purple border-kael-gold/20 hover:border-kael-gold"
                )}
              >
                All
              </button>
              {displayCategories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={cn(
                    "px-4 py-1 text-[10px] uppercase tracking-widest transition-all border",
                    selectedCategory === cat.name ? "bg-kael-ink text-white border-kael-ink" : "bg-white text-kael-purple border-kael-gold/20 hover:border-kael-gold"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-12 bg-kael-gold/10 hidden md:block"></div>

          <div className="flex flex-col items-center md:items-start">
            <span className="text-[10px] uppercase tracking-widest font-bold mb-3 text-kael-gold">Filter by Collection</span>
            <div className="flex flex-wrap justify-center gap-4">
              <button 
                onClick={() => setSelectedCollection('All')}
                className={cn(
                  "px-4 py-1 text-[10px] uppercase tracking-widest transition-all border",
                  selectedCollection === 'All' ? "bg-kael-ink text-white border-kael-ink" : "bg-white text-kael-purple border-kael-gold/20 hover:border-kael-gold"
                )}
              >
                All
              </button>
              {availableCollections.map(coll => (
                <button 
                  key={coll}
                  onClick={() => setSelectedCollection(coll)}
                  className={cn(
                    "px-4 py-1 text-[10px] uppercase tracking-widest transition-all border",
                    selectedCollection === coll ? "bg-kael-ink text-white border-kael-ink" : "bg-white text-kael-purple border-kael-gold/20 hover:border-kael-gold"
                  )}
                >
                  {coll}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-32">
          {collectionsToDisplay.map((collectionName) => {
            const collectionProducts = displayProducts.filter(p => p.collection === collectionName || (!p.collection && collectionName === "Beyond The Sea"));
            
            if (collectionProducts.length === 0 && selectedCategory === 'All' && selectedCollection === 'All') {
              return (
                <div key={collectionName} className="relative">
                  <div className="mb-12 text-center">
                    <h2 className="text-4xl md:text-5xl font-bold serif-display tracking-tight text-kael-ink">{collectionName}</h2>
                    <div className="w-24 h-px bg-kael-gold mx-auto mt-4"></div>
                  </div>
                  <div className="py-20 border border-dashed border-kael-gold/30 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm">
                    <span className="micro-label mb-4">Coming Soon</span>
                    <p className="text-kael-purple italic">A new artisanal journey is being curated.</p>
                  </div>
                </div>
              );
            }

            if (collectionProducts.length === 0) return null;

            return (
              <div key={collectionName} className="relative">
                <div className="mb-12 text-center">
                  <h2 className="text-4xl md:text-5xl font-bold serif-display tracking-tight text-kael-ink">{collectionName}</h2>
                  <div className="w-24 h-px bg-kael-gold mx-auto mt-4"></div>
                </div>

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
              </div>
            );
          })}

          {displayProducts.length === 0 && (
            <div className="text-center py-32">
              <p className="text-kael-purple italic">No pieces found matching your selection.</p>
              <button 
                onClick={() => { setSelectedCategory('All'); setSelectedCollection('All'); }}
                className="mt-8 text-xs uppercase tracking-widest border-b border-kael-ink pb-1 hover:text-kael-gold hover:border-kael-gold transition-all"
              >
                Clear All Filters
              </button>
            </div>
          )}
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
  collections,
  testimonials,
  categories,
  pageContents
}: { 
  setPage: (p: Page) => void, 
  setIsSimpleAdminLoggedIn: (b: boolean) => void,
  products: Product[],
  orders: Order[],
  collections: Collection[],
  testimonials: Testimonial[],
  categories: Category[],
  pageContents: PageContent[]
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'collections' | 'testimonials' | 'categories' | 'pages'>('products');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [isAddingTestimonial, setIsAddingTestimonial] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [editingPage, setEditingPage] = useState<PageContent | null>(null);
  
  const isFirebaseAuthorized = !!auth.currentUser;

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

  const [newCollection, setNewCollection] = useState<Partial<Collection>>({
    name: '',
    description: '',
    imageUrl: '',
    isFeatured: false
  });

  const [newTestimonial, setNewTestimonial] = useState<Partial<Testimonial>>({
    customerName: '',
    content: '',
    location: '',
    rating: 5
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

  const handleAddCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCollection) {
        const { id, ...collectionData } = newCollection;
        await updateDoc(doc(db, 'collections', editingCollection.id!), {
          ...collectionData
        });
        setEditingCollection(null);
      } else {
        const { id, ...collectionData } = newCollection;
        await addDoc(collection(db, 'collections'), {
          ...collectionData,
          createdAt: new Date().toISOString()
        });
      }
      setIsAddingCollection(false);
      setNewCollection({ name: '', description: '', imageUrl: '', isFeatured: false });
    } catch (err) {
      handleFirestoreError(err, editingCollection ? OperationType.UPDATE : OperationType.CREATE, 'collections');
    }
  };

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTestimonial) {
        const { id, ...testimonialData } = newTestimonial;
        await updateDoc(doc(db, 'testimonials', editingTestimonial.id!), {
          ...testimonialData
        });
        setEditingTestimonial(null);
      } else {
        const { id, ...testimonialData } = newTestimonial;
        await addDoc(collection(db, 'testimonials'), {
          ...testimonialData,
          createdAt: new Date().toISOString()
        });
      }
      setIsAddingTestimonial(false);
      setNewTestimonial({ customerName: '', content: '', location: '', rating: 5 });
    } catch (err) {
      handleFirestoreError(err, editingTestimonial ? OperationType.UPDATE : OperationType.CREATE, 'testimonials');
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

  const handleDeleteCollection = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'collections', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `collections/${id}`);
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'testimonials', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `testimonials/${id}`);
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

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setNewCollection(collection);
    setIsAddingCollection(true);
  };

  const handleEditTestimonial = (testimonial: Testimonial) => {
    setEditingTestimonial(testimonial);
    setNewTestimonial(testimonial);
    setIsAddingTestimonial(true);
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
            <h1 className="text-3xl font-bold">KAEL Dashboard</h1>
            <p className="text-sm text-kael-purple mt-2 italic">Manage your products, collections, and orders.</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {!isFirebaseAuthorized && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-3 max-w-xs">
                <div className="text-amber-600"><AlertCircle size={20} /></div>
                <p className="text-[10px] text-amber-800 leading-tight">
                  <strong>Limited Access:</strong> You are logged in with credentials. To save changes to the database, please <button onClick={() => setPage('login')} className="underline font-bold">Sign in with Google</button>.
                </p>
              </div>
            )}
            <div className="flex space-x-2">
              <button 
                onClick={() => setActiveTab('products')}
                className={cn("px-4 py-2 text-[10px] uppercase tracking-widest transition-all", activeTab === 'products' ? "bg-kael-ink text-white" : "bg-white text-kael-ink border border-kael-gold/20")}
              >
                Products
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={cn("px-4 py-2 text-[10px] uppercase tracking-widest transition-all", activeTab === 'orders' ? "bg-kael-ink text-white" : "bg-white text-kael-ink border border-kael-gold/20")}
              >
                Orders
              </button>
              <button 
                onClick={() => setActiveTab('collections')}
                className={cn("px-4 py-2 text-[10px] uppercase tracking-widest transition-all", activeTab === 'collections' ? "bg-kael-ink text-white" : "bg-white text-kael-ink border border-kael-gold/20")}
              >
                Collections
              </button>
              <button 
                onClick={() => setActiveTab('testimonials')}
                className={cn("px-4 py-2 text-[10px] uppercase tracking-widest transition-all", activeTab === 'testimonials' ? "bg-kael-ink text-white" : "bg-white text-kael-ink border border-kael-gold/20")}
              >
                Testimonials
              </button>
              <button 
                onClick={() => setActiveTab('categories')}
                className={cn("px-4 py-2 text-[10px] uppercase tracking-widest transition-all", activeTab === 'categories' ? "bg-kael-ink text-white" : "bg-white text-kael-ink border border-kael-gold/20")}
              >
                Categories
              </button>
              <button 
                onClick={() => setActiveTab('pages')}
                className={cn("px-4 py-2 text-[10px] uppercase tracking-widest transition-all", activeTab === 'pages' ? "bg-kael-ink text-white" : "bg-white text-kael-ink border border-kael-gold/20")}
              >
                Pages
              </button>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => setPage('home')}
                className="px-4 py-2 text-[10px] uppercase tracking-widest bg-white text-kael-ink border border-kael-gold/20 hover:bg-kael-paper flex items-center"
              >
                <HomeIcon size={14} className="mr-2" />
                Store
              </button>
              <button onClick={() => { signOut(auth); setIsSimpleAdminLoggedIn(false); setPage('home'); }} className="px-4 py-2 text-[10px] uppercase tracking-widest bg-red-50 text-red-600 border border-red-100">
                Logout
              </button>
            </div>
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
        ) : activeTab === 'collections' ? (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Collection Management</h2>
              <button 
                onClick={() => {
                  setEditingCollection(null);
                  setNewCollection({ name: '', description: '', imageUrl: '', isFeatured: false });
                  setIsAddingCollection(true);
                }}
                className="btn-luxury bg-kael-gold text-white border-none flex items-center"
              >
                <Plus size={16} className="mr-2" /> New Collection
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {collections.map((coll) => (
                <div key={coll.id} className="bg-white p-6 shadow-sm border border-kael-gold/5 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-sm">{coll.name}</h3>
                    <p className="text-xs text-kael-purple mt-1">{coll.description || 'No description'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditCollection(coll)}
                      className="text-kael-purple hover:text-kael-gold transition-colors"
                    >
                      <Settings size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCollection(coll.id!)}
                      className="text-kael-purple hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : activeTab === 'testimonials' ? (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold">Testimonial Management</h2>
              <button 
                onClick={() => {
                  setEditingTestimonial(null);
                  setNewTestimonial({ customerName: '', content: '', location: '', rating: 5 });
                  setIsAddingTestimonial(true);
                }}
                className="btn-luxury bg-kael-gold text-white border-none flex items-center"
              >
                <Plus size={16} className="mr-2" /> New Testimonial
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {testimonials.map((test) => (
                <div key={test.id} className="bg-white p-6 shadow-sm border border-kael-gold/5 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-sm">{test.customerName}</h3>
                      <p className="text-[10px] text-kael-purple uppercase tracking-widest">{test.location}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditTestimonial(test)}
                        className="text-kael-purple hover:text-kael-gold transition-colors"
                      >
                        <Settings size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTestimonial(test.id!)}
                        className="text-kael-purple hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-kael-purple italic">"{test.content}"</p>
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
                      value={newProduct.collection || ''}
                      onChange={(e) => setNewProduct({...newProduct, collection: e.target.value})}
                    >
                      <option value="">Select Collection</option>
                      {collections.map(coll => (
                        <option key={coll.id} value={coll.name}>{coll.name}</option>
                      ))}
                      {collections.length === 0 && <option value="Beyond The Sea">Beyond The Sea</option>}
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

      {/* Collection Modal */}
      <AnimatePresence>
        {isAddingCollection && (
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
                <h2 className="text-xl font-bold">{editingCollection ? 'Edit Collection' : 'Add New Collection'}</h2>
                <button onClick={() => { setIsAddingCollection(false); setEditingCollection(null); setNewCollection({ name: '', description: '', imageUrl: '', isFeatured: false }); }}><X size={24} /></button>
              </div>

              <form onSubmit={handleAddCollection} className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Collection Name</label>
                  <input 
                    type="text" required
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                    value={newCollection.name || ''}
                    onChange={(e) => setNewCollection({...newCollection, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Description</label>
                  <textarea 
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold h-24"
                    value={newCollection.description || ''}
                    onChange={(e) => setNewCollection({...newCollection, description: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Image URL (Optional)</label>
                  <input 
                    type="url"
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                    value={newCollection.imageUrl || ''}
                    onChange={(e) => setNewCollection({...newCollection, imageUrl: e.target.value})}
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="mr-2"
                      checked={newCollection.isFeatured || false}
                      onChange={(e) => setNewCollection({...newCollection, isFeatured: e.target.checked})}
                    />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Featured Collection</span>
                  </label>
                </div>
                <button type="submit" className="btn-luxury w-full bg-kael-ink text-white hover:bg-kael-gold">
                  {editingCollection ? 'Update Collection' : 'Create Collection'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Testimonial Modal */}
      <AnimatePresence>
        {isAddingTestimonial && (
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
                <h2 className="text-xl font-bold">{editingTestimonial ? 'Edit Testimonial' : 'Add New Testimonial'}</h2>
                <button onClick={() => { setIsAddingTestimonial(false); setEditingTestimonial(null); setNewTestimonial({ customerName: '', content: '', location: '', rating: 5 }); }}><X size={24} /></button>
              </div>

              <form onSubmit={handleAddTestimonial} className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Customer Name</label>
                  <input 
                    type="text" required
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                    value={newTestimonial.customerName || ''}
                    onChange={(e) => setNewTestimonial({...newTestimonial, customerName: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Avatar URL (Optional)</label>
                  <input 
                    type="url"
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                    value={newTestimonial.avatarUrl || ''}
                    onChange={(e) => setNewTestimonial({...newTestimonial, avatarUrl: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Location (e.g. Dubai, UAE)</label>
                  <input 
                    type="text"
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold"
                    value={newTestimonial.location || ''}
                    onChange={(e) => setNewTestimonial({...newTestimonial, location: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Testimonial Content</label>
                  <textarea 
                    required
                    className="w-full border border-kael-gold/20 p-3 text-sm focus:outline-kael-gold h-32"
                    value={newTestimonial.content || ''}
                    onChange={(e) => setNewTestimonial({...newTestimonial, content: e.target.value})}
                  />
                </div>
                <button type="submit" className="btn-luxury w-full bg-kael-ink text-white hover:bg-kael-gold">
                  {editingTestimonial ? 'Update Testimonial' : 'Create Testimonial'}
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

const PersonalizedFeed = ({ 
  userActivity, 
  products, 
  setPage, 
  setSelectedProduct,
  trackView
}: { 
  userActivity: UserActivity | null, 
  products: Product[], 
  setPage: (p: Page) => void,
  setSelectedProduct: (p: Product) => void,
  trackView: (type: 'product' | 'collection', id: string, category?: string) => void
}) => {
  if (!userActivity || userActivity.viewedProductIds.length === 0) {
    return null;
  }

  // Recommendation logic
  const recommendedProducts = products
    .filter(p => !userActivity.viewedProductIds.includes(p.id!)) // Don't show what they already saw
    .filter(p => userActivity.preferredCategories.includes(p.category)) // Match their preferred categories
    .slice(0, 3);

  if (recommendedProducts.length === 0) return null;

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="mb-12">
          <span className="micro-label">Curated For You</span>
          <h2 className="serif-display mt-2">Personalized KAEL</h2>
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
  const [collections, setCollections] = useState<Collection[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [pageContents, setPageContents] = useState<PageContent[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'products'));

    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'categories'));

    const unsubCollections = onSnapshot(collection(db, 'collections'), (snapshot) => {
      setCollections(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collection)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'collections'));

    const unsubTestimonials = onSnapshot(collection(db, 'testimonials'), (snapshot) => {
      setTestimonials(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Testimonial)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'testimonials'));

    const unsubPageContent = onSnapshot(collection(db, 'page_content'), (snapshot) => {
      setPageContents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PageContent)));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'page_content'));

    return () => { unsubProducts(); unsubCategories(); unsubCollections(); unsubTestimonials(); unsubPageContent(); };
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
      console.log('Auth state changed:', u?.email);
      setUser(u);
      const email = u?.email?.toLowerCase();
      const isAdm = email === 'betsiflash@gmail.com' || email === 'kael21.ae@gmail.com';
      console.log('Is Admin:', isAdm);
      setIsAdmin(isAdm);
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
  const trackView = async (type: 'product' | 'collection', id: string, category?: string) => {
    const currentActivity: UserActivity = userActivity || {
      uid: user?.uid || 'guest',
      viewedProductIds: [],
      preferredCategories: [],
      updatedAt: new Date().toISOString()
    };

    const updatedActivity: UserActivity = {
      uid: currentActivity.uid,
      viewedProductIds: currentActivity.viewedProductIds,
      preferredCategories: currentActivity.preferredCategories,
      updatedAt: new Date().toISOString()
    };

    if (type === 'product') {
      if (!updatedActivity.viewedProductIds.includes(id)) {
        updatedActivity.viewedProductIds = [id, ...updatedActivity.viewedProductIds].slice(0, 20);
      }
      if (category && !updatedActivity.preferredCategories.includes(category)) {
        updatedActivity.preferredCategories = [category, ...updatedActivity.preferredCategories].slice(0, 5);
      }
    }

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
      case 'home': return <Home setPage={setPage} setSelectedProduct={setSelectedProduct} products={products} testimonials={testimonials} userActivity={userActivity} trackView={trackView} />;
      case 'about': return <About pageContents={pageContents} />;
      case 'craft': return <Craft pageContents={pageContents} />;
      case 'contact': return <Contact pageContents={pageContents} />;
      case 'product': return selectedProduct ? <ProductDetail product={selectedProduct} setPage={setPage} addToCart={addToCart} trackView={trackView} /> : <Home setPage={setPage} setSelectedProduct={setSelectedProduct} products={products} testimonials={testimonials} userActivity={userActivity} trackView={trackView} />;
      case 'cart': return <Cart cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} setPage={setPage} />;
      case 'login': return <LoginPage onLogin={(dest) => setPage(dest || (effectiveIsAdmin ? 'admin' : 'home'))} user={user} setIsSimpleAdminLoggedIn={setIsSimpleAdminLoggedIn} />;
      case 'admin': return effectiveIsAdmin ? <AdminDashboard setPage={setPage} setIsSimpleAdminLoggedIn={setIsSimpleAdminLoggedIn} products={products} orders={orders} collections={collections} testimonials={testimonials} categories={categories} pageContents={pageContents} /> : <LoginPage onLogin={(dest) => setPage(dest || 'admin')} user={user} setIsSimpleAdminLoggedIn={setIsSimpleAdminLoggedIn} />;
      case 'collections': return <Collections products={products} categories={categories} collections={collections} setPage={setPage} setSelectedProduct={setSelectedProduct} searchQuery={searchQuery} pageContents={pageContents} />;
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
