import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const navLinks = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Khám phá Jobs', href: '/find-job' },
  { name: 'Dashboard phân tích', href: '/analysis' },
  { name: 'Góc tư vấn', href: '/consulting' }
];

const Header = () => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  // Đóng menu khi click vào link
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-surface-container dark:border-zinc-800 fixed top-0 left-0 right-0 z-50 h-16 transition-colors">
      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        
        {/* Logo */}
        <Link 
          to="/" 
          className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase font-headline"
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
                    ? 'text-orange-700 dark:text-amber-400 border-orange-700 dark:border-amber-400' 
                    : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="relative w-14 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 transition-colors duration-300 focus:outline-none group cursor-pointer"
            aria-label="Chuyển đổi chế độ sáng/tối"
            title={isDark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-white dark:bg-zinc-900 shadow-md flex items-center justify-center transition-all duration-300 ${
                isDark ? 'left-7' : 'left-0.5'
              }`}
            >
              <span className="material-symbols-outlined text-sm transition-transform duration-300">
                {isDark ? 'dark_mode' : 'light_mode'}
              </span>
            </span>
          </button>
        </nav>

        {/* Mobile: Theme toggle + Hamburger */}
        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
            aria-label="Chuyển đổi chế độ sáng/tối"
          >
            <span className="material-symbols-outlined text-xl">
              {isDark ? 'dark_mode' : 'light_mode'}
            </span>
          </button>

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-3xl">
              {isMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={closeMenu} />
      )}

      {/* Mobile Menu */}
      <div
        className={`md:hidden fixed top-16 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-surface-container dark:border-zinc-800 shadow-lg transition-all duration-300 z-50 ${
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
                    ? 'bg-orange-50 dark:bg-amber-900/30 text-orange-700 dark:text-amber-400' 
                    : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
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