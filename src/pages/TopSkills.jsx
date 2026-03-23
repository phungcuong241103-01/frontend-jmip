import React, { useState, useEffect } from 'react';
import { getStats } from '../services/api';

const TopSkills = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);

    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const itemsPerPage = isMobile ? 10 : 20;
  const popularSkills = stats?.popularSkills || [];
  const totalPages = Math.ceil(popularSkills.length / itemsPerPage);
  const currentSkills = popularSkills.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const skillCategories = ['Tất cả', 'Backend', 'Frontend', 'Mobile', 'DevOps', 'Data Science'];

  return (
    <div className="flex pt-16">
      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8">
        <header className="mb-12">
          <div className="max-w-2xl">
            <h4 className="text-xs font-bold text-primary tracking-[0.2em] uppercase mb-2">Thống kê nhu cầu 2026</h4>
            <h1 className="text-4xl font-headline font-extrabold tracking-tighter leading-tight text-on-surface">
              Phổ biến Kỹ năng CNTT
            </h1>
            <p className="mt-4 text-on-surface-variant leading-relaxed max-w-lg font-body">
              Danh sách các kỹ năng được săn đón nhất dựa trên dữ liệu tuyển dụng thực tế tại Việt Nam.
            </p>
          </div>
        </header>

        <section className="max-w-4xl bg-white border border-surface-container shadow-sm">
          <div className="p-6 flex flex-wrap gap-3 border-b border-surface-container bg-surface-container-low">
            {skillCategories.map((cat, i) => (
              <button
                key={cat}
                className={`px-6 py-2 font-bold text-xs tracking-widest uppercase transition-colors cursor-pointer ${
                  i === 0
                    ? 'bg-primary text-on-primary'
                    : 'border border-primary text-primary hover:bg-primary/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between p-6 border-b border-surface-container">
            <h2 className="text-xl font-headline font-bold tracking-tight">Xếp hạng theo Nhu cầu</h2>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">
                Cập nhật: {new Date().toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>

          <div className="divide-y divide-surface-container">
            {loading ? (
              <div className="p-10 text-center text-zinc-500">Đang tải xếp hạng kỹ năng...</div>
            ) : currentSkills.map((skill, index) => {
              const globalRank = (currentPage - 1) * itemsPerPage + index + 1;
              return (
              <div key={skill.name} className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 group hover:bg-surface-container-low transition-colors cursor-pointer">
                <div className="w-12 shrink-0">
                  <span className="text-xl font-black text-zinc-300">#{globalRank}</span>
                </div>
                <div className="w-32 flex-shrink-0">
                  <span className="text-base font-bold text-on-surface">{skill.name}</span>
                </div>
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex-1 h-3 bg-surface-container-low overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-1000"
                      style={{ width: `${skill.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-bold text-primary w-12 text-right">
                    {skill.percentage}%
                  </span>
                </div>
                <div className="text-xs font-bold text-zinc-400 w-20 text-right">
                  {skill.count} Jobs
                </div>
              </div>
            )})}
          </div>

          {!loading && totalPages > 1 && (
            <div className="p-6 border-t border-surface-container flex justify-between items-center bg-surface-container-lowest">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-6 py-2 border border-outline-variant disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-widest hover:bg-surface-container transition-colors rounded-sm"
              >
                Trang trước
              </button>
              <span className="text-xs font-black text-zinc-600 tracking-widest uppercase">
                Trang {currentPage} / {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-6 py-2 border border-outline-variant disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold uppercase tracking-widest hover:bg-surface-container transition-colors rounded-sm"
              >
                Trang sau
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default TopSkills;
