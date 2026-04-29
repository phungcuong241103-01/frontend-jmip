import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-zinc-100 dark:bg-zinc-900 w-full py-12 px-8 flex flex-col md:flex-row justify-between items-center gap-6 border-t border-outline-variant/10 dark:border-zinc-800 transition-colors">
      <div className="flex flex-col gap-2">
        <span className="font-headline font-black text-lg text-on-surface uppercase tracking-tighter">
          JMIP
        </span>
        <p className="font-body text-xs tracking-normal text-zinc-500 dark:text-zinc-400">
          © 2026 JMIP Intelligence Grid. Dữ liệu biên tập chính xác.
        </p>
      </div>
      <nav className="flex gap-8">
        <a
          className="text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-amber-400 font-body text-xs tracking-normal transition-colors"
          href="#"
        >
          Chính sách bảo mật
        </a>
        <a
          className="text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-amber-400 font-body text-xs tracking-normal transition-colors"
          href="#"
        >
          Điều khoản dịch vụ
        </a>
        <a
          className="text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-amber-400 font-body text-xs tracking-normal transition-colors"
          href="#"
        >
          Phương pháp dữ liệu
        </a>
        <a
          className="text-zinc-500 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-amber-400 font-body text-xs tracking-normal transition-colors"
          href="#"
        >
          Liên hệ phân tích
        </a>
      </nav>
    </footer>
  );
};

export default Footer;
