import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Khám phá Jobs', href: '/find-job' },
  { name: 'Dashboard phân tích', href: '/analysis' },
  { name: 'Góc tư vấn', href: '/consulting' }
];

const Header = () => {
  const location = useLocation();

  return (
    <header className="bg-white flex justify-between items-center w-full px-8 h-16 max-w-full mx-auto fixed top-0 z-50 border-b border-surface-container">
      <div className="flex items-center gap-8">
        <Link to="/" className="text-2xl font-black text-zinc-900 tracking-tighter uppercase font-headline">
          JMIP
        </Link>
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                className={`${
                  isActive
                    ? 'text-orange-700 border-b-2 border-orange-700'
                    : 'text-zinc-500 hover:text-zinc-900 transition-colors'
                } pb-1 font-body text-sm font-medium`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
      {/* Right side removed as requested */}
    </header>
  );
};

export default Header;
