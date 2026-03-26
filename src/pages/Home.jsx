import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats } from '../services/api';

// Component CountUp - Số chạy animation
const CountUp = ({ end, duration = 2000, suffix = '+' }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef(null);

  useEffect(() => {
    const startCounting = () => {
      startTimeRef.current = Date.now();
      countRef.current = 0;
      requestAnimationFrame(animate);
    };

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: easeOutQuad - nhìn tự nhiên và mượt
      const eased = 1 - Math.pow(1 - progress, 2);

      countRef.current = Math.floor(end * eased);
      setCount(countRef.current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(Math.floor(end)); // Đảm bảo kết thúc đúng số
      }
    };

    // Chỉ bắt đầu chạy số khi section xuất hiện trong viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startCounting();
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    const section = document.getElementById('stats-section');
    if (section) observer.observe(section);

    return () => observer.disconnect();
  }, [end, duration]);

  return (
    <span className="text-4xl md:text-5xl font-headline font-extrabold text-white tracking-tighter">
      {count.toLocaleString('vi-VN')}
      {suffix}
    </span>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [dbStats, setDbStats] = useState({ 
    totalJobs: 0, 
    activeCompanies: 0, 
    popularSkills: [] 
  });
  const [heroSearch, setHeroSearch] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setDbStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
  }, []);

  const features = [
    {
      icon: 'analytics',
      title: 'Phân tích Thị trường',
      desc: 'Xem chi tiết xu hướng tuyển dụng, mức lương, kỹ năng hot nhất theo thời gian thực.'
    },
    {
      icon: 'work',
      title: 'Khám phá Việc làm',
      desc: 'Tìm kiếm hàng ngàn cơ hội việc làm IT với bộ lọc thông minh theo kỹ năng, địa điểm, cấp bậc.'
    },
    {
      icon: 'smart_toy',
      title: 'AI Tư vấn Nghề nghiệp',
      desc: 'Chatbot AI hỗ trợ phân tích kỹ năng và gợi ý lộ trình phát triển sự nghiệp phù hợp.'
    },
  ];

  return (
    <main className="pt-16">
      {/* Hero Section */}
      <section className="bg-white pt-24 pb-20 px-8 flex flex-col items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 to-transparent pointer-events-none"></div>
        <div className="max-w-4xl w-full text-center relative z-10">
          <span className="text-[11px] font-bold uppercase tracking-widest text-primary mb-4 block">
            Job Market Intelligence Platform
          </span>
          <h1 className="font-headline font-extrabold text-5xl md:text-7xl tracking-tighter text-on-surface mb-6">
            Phân tích <br />
            <span className="text-primary">thị trường IT chính xác.</span>
          </h1>
          <p className="text-lg text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
            JMIP thu thập và phân tích dữ liệu tuyển dụng IT từ các nguồn hàng đầu,
            giúp bạn nắm bắt xu hướng thị trường, tìm việc phù hợp và phát triển sự nghiệp.
          </p>
          <div className="bg-surface-container-lowest shadow-[0_24px_48px_rgba(26,28,29,0.06)] p-2 flex flex-col md:flex-row gap-2 border border-outline-variant/10 max-w-2xl mx-auto">
            <div className="flex-1 flex items-center px-4 bg-surface-container-low">
              <span className="material-symbols-outlined text-on-surface-variant mr-3">search</span>
              <input
                className="w-full bg-transparent border-none py-4 focus:ring-0 text-lg outline-none"
                placeholder="Vị trí, từ khóa..."
                type="text"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' && heroSearch.trim()) 
                    navigate(`/find-job?search=${encodeURIComponent(heroSearch.trim())}`); 
                }}
              />
            </div>
            <button
              className="bg-primary hover:bg-primary-container text-on-primary font-bold px-12 py-4 transition-all cursor-pointer"
              onClick={() => { 
                if (heroSearch.trim()) 
                  navigate(`/find-job?search=${encodeURIComponent(heroSearch.trim())}`); 
                else 
                  navigate('/find-job'); 
              }}
            >
              Tìm việc ngay
            </button>
          </div>
        </div>
      </section>

      {/* Stats Row - Số chạy animation */}
      <section id="stats-section" className="bg-zinc-900 py-12 px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <CountUp 
              end={Number(dbStats.totalJobs) || 0} 
              duration={3000} 
            />
            <p className="text-zinc-400 text-sm font-medium mt-2">Tin tuyển dụng được phân tích</p>
          </div>
          <div>
            <CountUp 
              end={Number(dbStats.activeCompanies) || 0} 
              duration={3000} 
            />
            <p className="text-zinc-400 text-sm font-medium mt-2">Công ty đang tuyển dụng</p>
          </div>
          <div>
            <CountUp 
              end={Number(dbStats.totalSkills) || dbStats.popularSkills?.length || 0} 
              duration={3000} 
            />
            <p className="text-zinc-400 text-sm font-medium mt-2">Kỹ năng được theo dõi</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-8 py-20 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary mb-3 block">
              Tính năng nổi bật
            </span>
            <h2 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-on-surface">
              Tất cả những gì bạn cần
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-surface-container-lowest p-8 border border-outline-variant/10 group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
                onClick={() => {
                  if (i === 0) navigate('/analysis');
                  if (i === 1) navigate('/find-job');
                }}
              >
                <div className="w-14 h-14 bg-primary/10 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-primary text-2xl">{f.icon}</span>
                </div>
                <h3 className="text-xl font-headline font-bold mb-3 tracking-tight">{f.title}</h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">{f.desc}</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-white tracking-tight mb-4">
            Sẵn sàng khám phá thị trường IT?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Bắt đầu phân tích ngay hôm nay và đón đầu xu hướng công nghệ.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/analysis')}
              className="bg-white text-primary font-bold px-10 py-4 hover:shadow-lg transition-all cursor-pointer"
            >
              Xem Dashboard Phân tích
            </button>
            <button
              onClick={() => navigate('/find-job')}
              className="border-2 border-white text-white font-bold px-10 py-4 hover:bg-white/10 transition-all cursor-pointer"
            >
              Tìm việc làm
            </button>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;