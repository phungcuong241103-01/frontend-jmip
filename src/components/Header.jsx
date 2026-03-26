import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Khám phá Jobs', href: '/find-job' },
  { name: 'Dashboard phân tích', href: '/analysis' },
  { name: 'Góc tư vấn', href: '/consulting' }
];

const Header = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Đóng menu khi click vào link
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="bg-white border-b border-surface-container fixed top-0 left-0 right-0 z-50 h-16">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        
        {/* Logo */}
        <Link 
          to="/" 
          className="text-2xl font-black text-zinc-900 tracking-tighter uppercase font-headline"
        >
          JMIP
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                className={`pb-1 text-sm font-medium transition-colors border-b-2 ${
                  isActive 
                    ? 'text-orange-700 border-orange-700' 
                    : 'text-zinc-500 border-transparent hover:text-zinc-900 hover:border-zinc-300'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-zinc-700 focus:outline-none"
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-3xl">
            {isMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={closeMenu} />
      )}

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed top-16 left-0 right-0 bg-white border-t border-surface-container shadow-lg transition-all duration-300 z-50 ${
          isMenuOpen 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        <nav className="flex flex-col py-6 px-6">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                onClick={closeMenu}
                className={`py-4 px-4 text-base font-medium rounded-xl transition-all ${
                  isActive 
                    ? 'bg-orange-50 text-orange-700' 
                    : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};

export default Header;