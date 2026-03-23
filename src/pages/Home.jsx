import React, { useState, useEffect } from 'react';
import { getStats } from '../services/api';

const Home = () => {
  const [dbStats, setDbStats] = useState({ totalJobs: 0, popularSkills: [] });
  const [skillSearch, setSkillSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Initial read
    window.addEventListener('resize', handleResize);
    
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setDbStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const itemsPerPage = isMobile ? 10 : 20;

  const filteredSkills = dbStats.popularSkills?.filter(skill => 
    skill.name.toLowerCase().includes(skillSearch.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredSkills.length / itemsPerPage);
  const currentSkills = filteredSkills.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <main className="pt-16">
      {/* Hero Section */}
      <section className="bg-white pt-24 pb-16 px-8 flex flex-col items-center">
        <div className="max-w-4xl w-full text-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary mb-4 block">
            Dữ liệu thực tế từ Database
          </span>
          <h1 className="font-headline font-extrabold text-5xl md:text-7xl tracking-tighter text-on-surface mb-8">
            Phân tích <br />
            <span className="text-primary">thị trường IT chính xác.</span>
          </h1>
          <div className="bg-surface-container-lowest shadow-[0_24px_48px_rgba(26,28,29,0.06)] p-2 flex flex-col md:flex-row gap-2 border border-outline-variant/10">
            <div className="flex-1 flex items-center px-4 bg-surface-container-low">
              <span className="material-symbols-outlined text-on-surface-variant mr-3">search</span>
              <input
                className="w-full bg-transparent border-none py-4 focus:ring-0 text-lg outline-none"
                placeholder="Vị trí, từ khóa..."
                type="text"
              />
            </div>
            <button className="bg-primary hover:bg-primary-container text-on-primary font-bold px-12 py-4 transition-all cursor-pointer">
              Tìm việc ngay
            </button>
          </div>
        </div>
      </section>

      {/* Stats and Top Skills Section */}
      <section className="px-8 py-12 bg-surface-container-low min-h-screen">
        <div className="max-w-6xl mx-auto block">
          
          {/* Top Row: Total Posts & Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-primary p-8 text-white flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-[11px] uppercase font-bold tracking-widest text-white/70">
                  Lượt Đăng Tuyển
                </span>
                <h3 className="font-headline font-bold text-5xl mt-2 mb-1 drop-shadow-md">
                  {Number(dbStats.totalJobs).toLocaleString()}
                </h3>
                <p className="text-sm font-medium text-white shadow-sm mt-1">Tổng số tin bài post hiện có</p>
              </div>
              <span className="material-symbols-outlined absolute -right-6 -bottom-6 text-9xl text-white/10 rotate-12 pointer-events-none">
                analytics
              </span>
            </div>

            <div className="md:col-span-2 bg-zinc-900 border-l-4 border-orange-500 p-8 text-white flex flex-col justify-center shadow-sm">
               <h3 className="font-headline font-bold text-2xl lg:text-3xl mb-3 tracking-tight">Thống kê Kỹ năng Hot 2026</h3>
               <p className="text-zinc-400 text-sm leading-relaxed max-w-lg">Cơ sở dữ liệu ứng dụng mạng lưới JMIP liên tục rà soát hàng ngàn công ty IT và bài đăng tuyển dụng để xác định chính xác kỹ năng nào đang được trả lương và có nhu cầu săn đón cao nhất.</p>
            </div>
          </div>

          {/* Top Skills UI Component */}
          <div className="bg-white p-6 md:p-10 shadow-lg border border-outline-variant/10">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
              <div>
                <h2 className="text-2xl font-headline font-extrabold tracking-tight text-on-surface">Bảng Xếp Hạng Nhu Cầu</h2>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1 block">Dữ liệu thời gian thực</span>
              </div>
              {/* Search Bar */}
              <div className="relative w-full md:w-80 shrink-0">
                <input
                  type="text"
                  placeholder="Tra cứu theo tên kỹ năng..."
                  value={skillSearch}
                  onChange={(e) => {
                    setSkillSearch(e.target.value);
                    setCurrentPage(1); // Reset page on search typing
                  }}
                  className="w-full bg-surface-container-lowest border-b-2 border-zinc-200 focus:border-primary h-12 px-4 pr-10 text-sm font-bold text-zinc-800 outline-none transition-all placeholder:font-normal"
                />
                <span className="material-symbols-outlined absolute right-2 top-3 text-zinc-400 text-xl pointer-events-none">
                  search
                </span>
              </div>
            </div>

            {/* Layout Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {currentSkills.map((skill) => {
                const rank = dbStats.popularSkills.findIndex(s => s.name === skill.name) + 1;
                const maxCount = dbStats.popularSkills.length > 0 ? dbStats.popularSkills[0].count : 1;
                const percentage = Math.round((skill.count / maxCount) * 100);

                return (
                  <div key={skill.name} className="flex flex-col sm:flex-row sm:items-center gap-4 group hover:bg-surface-container-lowest transition-colors p-3 px-4 border border-transparent border-b-zinc-100 hover:border-b-primary hover:shadow-sm cursor-pointer relative overflow-hidden">
                    <div className="w-10 shrink-0 flex justify-center items-center">
                      <span className={`text-xl font-black ${rank <= 3 ? 'text-primary' : 'text-zinc-300'}`}>#{rank}</span>
                    </div>
                    <div className="w-28 shrink-0">
                      <span className="text-sm font-bold text-on-surface truncate block">{skill.name}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-4">
                      <div className="flex-1 h-1.5 bg-surface-container-highest overflow-hidden rounded-full">
                        <div
                          className={`h-full transition-all duration-1000 rounded-full ${rank <= 3 ? 'bg-orange-500' : 'bg-primary'}`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-black text-zinc-700 w-12 text-right">
                        {skill.count} <span className="text-[9px] font-normal text-zinc-400">jobs</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-10 gap-6">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-outline-variant disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container transition-colors flex items-center justify-center rounded-sm"
                >
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                <span className="text-xs font-black text-zinc-600 tracking-widest uppercase">
                  Trang {currentPage} / {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-outline-variant disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container transition-colors flex items-center justify-center rounded-sm"
                >
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </div>
            )}
            
            {filteredSkills.length === 0 && (
              <div className="text-center p-12 text-zinc-400 italic">
                <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">search_off</span>
                Không tìm thấy kỹ năng phù hợp.
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
