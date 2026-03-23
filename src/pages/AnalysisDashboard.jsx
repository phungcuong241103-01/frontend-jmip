import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats, getJobs } from '../services/api';

const AnalysisDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentJobs, setRecentJobs] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, jobsData] = await Promise.all([
          getStats(),
          getJobs({ limit: 4 })
        ]);
        setStats(statsData);
        setRecentJobs(jobsData.jobs);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !stats) {
    return <div className="pt-20 text-center font-bold">Đang tải dữ liệu phân tích...</div>;
  }

  const analysisStats = [
    { label: 'Tổng số việc làm', value: stats.totalJobs.toLocaleString(), trend: stats.growthRate, icon: 'work' },
    { label: 'Kỹ năng phổ biến nhất', value: stats.popularSkills[0]?.name || 'N/A', trend: 'Tăng trưởng', icon: 'psychology' },
    { label: 'Công ty đang tuyển', value: stats.activeCompanies, trend: 'Ổn định', icon: 'apartment' },
    { label: 'Lương trung bình cao nhất', value: `$${Math.round(stats.salaryStats[0]?.avg_min || 0).toLocaleString()}`, trend: '+5%', icon: 'payments' },
  ];

  return (
    <div className="flex pt-16 min-h-screen">
      <main className="flex-1 p-8 bg-surface">
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-primary mb-2 block">
              Bức tranh CNTT Toàn cầu
            </span>
            <h1 className="text-4xl lg:text-5xl font-headline font-extrabold tracking-tight text-on-surface">
              Bảng điều khiển Phân tích
            </h1>
          </div>
        </div>

        {/* Row 1: Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {analysisStats.map((stat, i) => (
            <div
              key={i}
              className="bg-surface-container-lowest p-6 flex flex-col justify-between h-32 group relative transition-all hover:shadow-lg"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {stat.label}
                </span>
                <span className="material-symbols-outlined text-primary text-xl">{stat.icon}</span>
              </div>
              <div>
                <span className="text-3xl font-headline font-extrabold tracking-tighter">
                  {stat.value}
                </span>
                <div className="text-[10px] text-tertiary font-bold mt-1">{stat.trend}</div>
              </div>
              <div className="absolute bottom-0 left-0 w-1 h-0 group-hover:h-full bg-primary transition-all duration-300"></div>
            </div>
          ))}
        </div>

        {/* Section 2: Top 5 Hot Skills */}
        <section className="bg-white border border-outline-variant/20 p-8 mb-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-headline font-extrabold tracking-tight">
              Top Kỹ năng Phổ biến
            </h2>
            <p className="text-sm text-on-surface-variant">
              Xếp hạng dựa trên số lượng tin tuyển dụng hiện có
            </p>
          </div>
          <div className="space-y-6">
            {stats.popularSkills?.slice(0, 5)?.map((skill, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold font-headline uppercase tracking-tight">
                    {i + 1}. {skill.name}
                  </span>
                  <span className="text-xs font-bold text-primary">{skill.count} Jobs</span>
                </div>
                <div className="h-8 bg-surface-container-low w-full">
                  <div
                    className="h-full bg-primary transition-all duration-1000"
                    style={{ width: `${skill.percentage}%`, opacity: 1 - i * 0.1 }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <button 
              onClick={() => navigate('/top-skills')}
              className="w-full py-4 border-2 border-primary text-primary hover:bg-primary hover:text-on-primary transition-all duration-200 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              Xem tất cả kỹ năng
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
          </div>
        </section>

        {/* Section 3: Location Analysis */}
        <section className="bg-white border border-outline-variant/20 p-8 mb-8 shadow-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-headline font-extrabold tracking-tight">
              Phân tích theo Địa điểm
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Top khu vực tuyển dụng
              </h3>
              <div className="space-y-3">
                {stats.locationStats?.map((loc) => {
                  const percentage = Math.round((loc.count / stats.totalJobs) * 100);
                  return (
                    <div key={loc.name} className="flex items-center gap-3">
                      <div className="w-24 text-[10px] font-bold uppercase">{loc.name}</div>
                      <div className="flex-1 h-2 bg-surface-container-low">
                        <div className="h-full bg-primary" style={{ width: `${percentage}%` }}></div>
                      </div>
                      <div className="text-[10px] font-bold">{percentage}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                Mức lương trung bình theo Role (Top 5)
              </h3>
              <div className="space-y-3">
                {stats.salaryStats?.map((item) => (
                  <div key={item.role} className="flex justify-between items-center border-b border-zinc-50 pb-2">
                    <span className="text-xs font-bold">{item.role}</span>
                    <span className="text-xs font-bold text-primary">${Math.round(item.avg_min).toLocaleString()} - ${Math.round(item.avg_max).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Recent Jobs */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-headline font-extrabold tracking-tight text-on-surface">
              Việc làm mới nhất
            </h2>
            <button
              onClick={() => navigate('/find-job')}
              className="text-xs font-bold text-primary uppercase tracking-widest border-b border-primary pb-1 hover:opacity-80"
            >
              Xem thêm tại Job Search
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentJobs?.map((job, i) => (
              <div
                key={i}
                onClick={() => navigate('/find-job')}
                className="bg-surface-container-lowest p-6 border border-outline-variant/10 flex flex-col gap-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg leading-tight">{job.title}</h4>
                    <p className="text-sm text-on-surface-variant font-medium">
                      {job.company_name} • {job.city}
                    </p>
                  </div>
                  <span className="bg-secondary-container text-on-secondary-container text-[10px] px-2 py-1 font-bold">
                    MỚI
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {job.skills?.slice(0, 3)?.map((tag) => (
                    <span
                      key={tag}
                      className="bg-surface-container-low px-2 py-1 text-[10px] font-bold uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-sm font-bold">
                    {(job.salary_min !== null && job.salary_min !== undefined)
                      ? `$${Number(job.salary_min).toLocaleString()}${job.salary_max ? ' - $' + Number(job.salary_max).toLocaleString() : ''}`
                      : 'Thỏa thuận'}
                  </span>
                  <button className="text-xs font-bold uppercase tracking-widest text-primary cursor-pointer hover:underline">
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AnalysisDashboard;
