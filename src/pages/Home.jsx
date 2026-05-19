import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStats } from '../hooks/useQueries';
import jobImg from '../assets/job.jpg';
import job2Img from '../assets/job2.jpg';

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
  const { data: dbStats = { totalJobs: 0, activeCompanies: 0, popularSkills: [] } } = useStats();
  const [heroSearch, setHeroSearch] = useState('');

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
      <section className="relative overflow-hidden min-h-[520px] md:min-h-[600px] flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={jobImg}
            alt="Đội ngũ IT đang làm việc cùng nhau"
            className="w-full h-full object-cover"
          />
          {/* Dark gradient overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
          {/* Accent color tint */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-orange-900/10"></div>
        </div>

        {/* Content on top */}
        <div className="relative z-10 max-w-4xl w-full mx-auto px-6 md:px-12 py-20 md:py-28 text-center">
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-5 px-3 py-1 border border-amber-300/30 rounded-full backdrop-blur-sm bg-white/5">
            Job Market Intelligence Platform
          </span>
          <h1 className="font-headline font-extrabold text-4xl md:text-5xl lg:text-7xl tracking-tighter text-white mb-6 leading-[1.08] drop-shadow-lg">
            Phân tích <br />
            <span className="text-amber-300">thị trường IT chính xác.</span>
          </h1>
          <p className="text-base md:text-lg text-zinc-200 max-w-2xl mx-auto mb-10 leading-relaxed drop-shadow">
            JMIP thu thập và phân tích dữ liệu tuyển dụng IT từ các nguồn hàng đầu như ITViec, TopCV, Vietnamworks.
            Giúp bạn nắm bắt xu hướng thị trường, tìm việc phù hợp và phát triển sự nghiệp.
          </p>
          <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-[0_24px_48px_rgba(0,0,0,0.25)] p-2 flex flex-col md:flex-row gap-2 border border-white/20 max-w-2xl mx-auto rounded-lg">
            <div className="flex-1 flex items-center px-4 bg-zinc-50 dark:bg-zinc-800 rounded-md">
              <span className="material-symbols-outlined text-zinc-400 mr-3">search</span>
              <input
                className="w-full bg-transparent border-none py-4 focus:ring-0 text-lg outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
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
              className="bg-primary hover:bg-primary-container text-on-primary font-bold px-10 py-4 transition-all cursor-pointer rounded-md"
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
      <section id="stats-section" className="bg-zinc-900 dark:bg-zinc-950 py-12 px-8">
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
      <section className="relative overflow-hidden py-20 md:py-28">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={job2Img}
            alt="Không gian làm việc IT"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/75"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-indigo-900/10"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-8">
          <div className="text-center mb-16">
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-amber-300 mb-3 px-3 py-1 border border-amber-300/30 rounded-full backdrop-blur-sm bg-white/5">
              Tính năng nổi bật
            </span>
            <h2 className="text-3xl md:text-4xl font-headline font-extrabold tracking-tight text-white drop-shadow-lg">
              Tất cả những gì bạn cần
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-white/10 backdrop-blur-md p-8 border border-white/15 group hover:bg-white/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden rounded-xl"
                onClick={() => {
                  if (i === 0) navigate('/analysis');
                  if (i === 1) navigate('/find-job');
                  if (i === 2) navigate('/consulting');
                }}
              >
                <div className="w-14 h-14 bg-amber-300/20 rounded-lg flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-amber-300 text-2xl">{f.icon}</span>
                </div>
                <h3 className="text-xl font-headline font-bold mb-3 tracking-tight text-white">{f.title}</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">{f.desc}</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-amber-300 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16 px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-headline font-extrabold text-white dark:text-zinc-900 tracking-tight mb-4">
            Sẵn sàng khám phá thị trường IT?
          </h2>
          <p className="text-white/80 dark:text-zinc-900/70 text-lg mb-8">
            Bắt đầu phân tích ngay hôm nay và đón đầu xu hướng công nghệ.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/analysis')}
              className="bg-white dark:bg-zinc-900 text-primary font-bold px-10 py-4 hover:shadow-lg transition-all cursor-pointer"
            >
              Xem Dashboard Phân tích
            </button>
            <button
              onClick={() => navigate('/find-job')}
              className="border-2 border-white dark:border-zinc-900 text-white dark:text-zinc-900 font-bold px-10 py-4 hover:bg-white/10 dark:hover:bg-zinc-900/10 transition-all cursor-pointer"
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