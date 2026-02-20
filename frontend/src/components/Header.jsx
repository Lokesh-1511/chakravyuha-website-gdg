import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import navItems from '../data/navItems.json';
import { Menu, X } from 'lucide-react';

const Header = ({ onNavigate }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (sectionId) => {
    if (onNavigate) {
      onNavigate(sectionId);
    }
    setMobileOpen(false);
  };

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${scrolled ? 'py-3 bg-black/80 backdrop-blur-xl border-b border-white/10' : 'py-4 bg-transparent'}
      `}
      data-testid="header"
    >
      <div className="container-custom flex items-center justify-between">
        {/* Logo */}
        <motion.button
          onClick={() => handleNavClick('home')}
          className="flex items-center"
          whileHover={{ scale: 1.02 }}
          data-testid="logo-btn"
        >
          <img
            src="/chakravyuha-logo.png"
            alt="Chakravyuha 26"
            className="h-10 md:h-12"
          />
        </motion.button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center">
          <div className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-gradient-to-r from-purple-700/80 to-purple-600/80 backdrop-blur-sm border border-purple-500/30">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.sectionId)}
                className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all duration-200"
                data-testid={`nav-${item.id}`}
              >
                {item.title}
              </button>
            ))}
          </div>
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Toggle menu"
          data-testid="mobile-menu-btn"
        >
          {mobileOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-full left-4 right-4 mt-2 p-4 rounded-2xl bg-black/95 backdrop-blur-xl border border-white/10"
            data-testid="mobile-nav"
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNavClick(item.sectionId)}
                  className="w-full px-4 py-3 text-left text-white hover:bg-purple-500/20 rounded-xl transition-colors"
                  data-testid={`mobile-nav-${item.id}`}
                >
                  {item.title}
                </motion.button>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
