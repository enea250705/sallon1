import { PropsWithChildren, useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { FooterNav } from "@/components/layout/footer-nav";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useAuth } from "@/hooks/use-auth";
import { MobileNav } from "@/components/ui/mobile-nav";

export function Layout({ children }: PropsWithChildren) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  
  // Hook per rilevare se l'utente ha fatto scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Close mobile menu on location change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  // Animazione per il contenitore principale
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      className="min-h-screen flex flex-col md:flex-row bg-gray-50"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <Sidebar mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} />
      
      <div className={cn(
        "flex-1 overflow-x-hidden transition-all duration-300",
        mobileMenuOpen && "hidden md:block"
      )}>
        <div className={cn(
          "sticky top-0 z-30 transition-all duration-300 bg-white h-16 flex items-center px-4",
          scrolled && "shadow-md"
        )}>
          <MobileNav isMobileMenuOpen={mobileMenuOpen} toggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <h2 className="font-condensed text-xl ml-2 md:ml-0">
            {location === "/" || location === "/dashboard" 
              ? "Dashboard" 
              : location === "/users" 
              ? "Gestione Utenti"
              : location === "/schedule"
              ? "Pianificazione Turni"
              : location === "/requests"
              ? "Approvazioni"
              : location === "/documents"
              ? "Documenti"
              : location === "/my-schedule"
              ? "I Miei Turni"
              : location === "/time-off"
              ? "Ferie e Permessi"
              : location === "/my-documents"
              ? "I Miei Documenti"
              : "Da Vittorino"}
          </h2>
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.25, 0.1, 0.25, 1.0], 
              staggerChildren: 0.1 
            }}
            className="p-4 md:p-6 pb-20"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5, 
                ease: "easeOut",
                delay: 0.1
              }}
            >
              {children}
            </motion.div>
            
            {/* Footer Navigation - Duplicate di navigazione a piè di pagina */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5, 
                ease: "easeOut",
                delay: 0.3
              }}
            >
              <FooterNav />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
