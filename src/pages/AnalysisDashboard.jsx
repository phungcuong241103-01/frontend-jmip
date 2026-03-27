import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats, getJobs, getAnalyticsSalaryByRole, getAnalyticsLevels, getAnalyticsTrend, getAnalyticsRoles } from '../services/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

const RankingTable = ({ title, subtitle, items, renderItem, emptyMsg = 'Không có dữ liệu.' }) => (
  <section className="bg-white border border-outline-variant/20 p-8 mb-8 shadow-sm">
    <div className="mb-8">
      <h2 className="text-2xl font-headline font-extrabold tracking-tight">{title}</h2>
      {subtitle && <p className="text-sm text-on-surface-variant">{subtitle}</p>}
    </div>
    {items.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
        {items.map((item, i) => renderItem(item, i))}
      </div>
    ) : (
      <div className="text-center p-12 text-zinc-400 italic">
        <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">search_off</span>
        {emptyMsg}
      </div>
    )}
  </section>
);

const RankingRow = ({ rank, label, value, subLabel, maxValue, accentTop3 = true }) => {
  const percentage = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0;
  const isTop3 = accentTop3 && rank <= 3;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 group hover:bg-surface-container-lowest transition-colors p-3 px-4 border border-transparent border-b-zinc-100 hover:border-b-primary hover:shadow-sm cursor-pointer relative overflow-hidden">
      <div className="w-10 shrink-0 flex justify-center items-center">
        <span className={`text-xl font-black ${isTop3 ? 'text-primary' : 'text-zinc-300'}`}>#{rank}</span>
      </div>
      <div className="w-32 shrink-0">
        <span className="text-sm font-bold text-on-surface truncate block">{label}</span>
      </div>
      <div className="flex-1 flex items-center gap-4">
        <div className="flex-1 h-1.5 bg-surface-container-highest overflow-hidden rounded-full">
          <div
            className={`h-full transition-all duration-1000 rounded-full ${isTop3 ? 'bg-orange-500' : 'bg-primary'}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <span className="text-xs font-black text-zinc-700 w-auto text-right whitespace-nowrap">
          {subLabel}
        </span>
      </div>
    </div>
  );
};

const AnalysisDashboard = () => {
  const navigate = useNavigate();

  // Data states
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [salaryByRole, setSalaryByRole] = useState([]);
  const [levelStats, setLevelStats] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [roleStats, setRoleStats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination for Top Skills
  const [skillSearch, setSkillSearch] = useState('');
  const [skillPage, setSkillPage] = useState(1);

  // Search & Pagination for Locations
  const [locationSearch, setLocationSearch] = useState('');
  const [locationPage, setLocationPage] = useState(1);

  const itemsPerPage = 10; // Có thể điều chỉnh theo ý muốn

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, jobsData, salaryData, levelsData, trendRes, rolesRes] = await Promise.all([
          getStats(),
          getJobs({ limit: 4 }),
          getAnalyticsSalaryByRole().catch(() => ({ data: [] })),
          getAnalyticsLevels().catch(() => ({ data: [] })),
          getAnalyticsTrend().catch(() => ({ data: [] })),
          getAnalyticsRoles().catch(() => ({ data: [] }))
        ]);

        setStats(statsData);
        setRecentJobs(jobsData.jobs || []);
        setSalaryByRole(salaryData?.data || salaryData || []);
        setLevelStats(levelsData?.data || levelsData || []);
        setTrendData((trendRes?.data || trendRes || []).map(d => ({
          date: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          count: d.count
        })));
        setRoleStats(rolesRes?.data || rolesRes || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !stats) {
    return <div className="pt-20 text-center text-gray-600 font-bold">Đang tải dữ liệu...</div>
  }

  // === Xử lý Top Skills với Search + Pagination ===
  const filteredSkills = stats.popularSkills
    ?.filter(skill => skill.name.toLowerCase().includes(skillSearch.toLowerCase())) || [];

  const totalSkillPages = Math.ceil(filteredSkills.length / itemsPerPage);
  const currentSkills = filteredSkills.slice(
    (skillPage - 1) * itemsPerPage,
    skillPage * itemsPerPage
  );

  const maxSkillCount = filteredSkills.length > 0 ? filteredSkills[0].count : 1;

  // === Xử lý Locations với Search + Pagination ===
  const filteredLocations = (stats.locationStats || [])
    .filter(loc => loc.name.toLowerCase().includes(locationSearch.toLowerCase()));

  const totalLocationPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const currentLocations = filteredLocations.slice(
    (locationPage - 1) * itemsPerPage,
    locationPage * itemsPerPage
  );

  const maxLocCount = filteredLocations.length > 0 ? parseInt(filteredLocations[0].count) : 1;

  // Các phần còn lại giữ nguyên
  const salaryItems = Array.isArray(salaryByRole) ? salaryByRole : [];
  const maxSalary = salaryItems.length > 0 ? salaryItems[0].avg_max : 1;

  const levelItems = Array.isArray(levelStats) ? levelStats : [];
  const maxLevelCount = levelItems.length > 0 ? levelItems[0].job_count : 1;

  // Helper: format VND
  const formatVND = (v) => {
    if (!v) return '0';
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} triệu`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v.toLocaleString();
  };

  const topSalaryRole = salaryItems.length > 0 ? salaryItems[0] : null;

  const analysisStats = [
    { label: 'Tổng số việc làm', value: stats.totalJobs.toLocaleString(), trend: stats.growthRate, icon: 'work' },
    { label: 'Kỹ năng phổ biến nhất', value: stats.popularSkills[0]?.name || 'N/A', trend: 'Tăng trưởng', icon: 'psychology' },
    { label: 'Công ty đang tuyển', value: stats.activeCompanies, trend: 'Ổn định', icon: 'apartment' },
    { label: 'Lương TB cao nhất', value: topSalaryRole ? formatVND(topSalaryRole.avg_max) : 'N/A', trend: topSalaryRole ? topSalaryRole.role : '', icon: 'payments' },
  ];

  return (
    <div className="flex pt-16 min-h-screen">
      <main className="flex-1 p-8 bg-surface">
        {/* Header */}
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

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {analysisStats.map((stat, i) => (
            <div key={i} className="bg-surface-container-lowest p-6 flex flex-col justify-between h-32 group relative transition-all hover:shadow-lg">
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

        {/* ==================== TOP KỸ NĂNG ==================== */}
        <div className="bg-white border border-outline-variant/20 p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-headline font-extrabold tracking-tight">Top Kỹ năng Phổ biến</h2>
              <p className="text-sm text-on-surface-variant">Xếp hạng dựa trên số lượng tin tuyển dụng hiện có</p>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Tìm kiếm kỹ năng..."
                value={skillSearch}
                onChange={(e) => {
                  setSkillSearch(e.target.value);
                  setSkillPage(1); // Reset về trang 1 khi search
                }}
                className="w-full bg-surface-container-lowest border-b-2 border-zinc-200 focus:border-primary h-12 px-4 pr-10 text-sm font-bold outline-none transition-all placeholder:font-normal"
              />
              <span className="material-symbols-outlined absolute right-3 top-3 text-zinc-400 text-xl pointer-events-none">
                search
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            {currentSkills.map((skill, idx) => {
              const globalRank = stats.popularSkills.findIndex(s => s.name === skill.name) + 1;
              return (
                <RankingRow
                  key={skill.name}
                  rank={globalRank}
                  label={skill.name}
                  value={parseInt(skill.count)}
                  maxValue={maxSkillCount}
                  subLabel={
                    <>{skill.count} <span className="text-[9px] font-normal text-zinc-400">jobs</span></>
                  }
                />
              );
            })}
          </div>

          {/* Pagination */}
          {totalSkillPages > 1 && (
            <div className="flex justify-center items-center mt-10 gap-6">
              <button
                onClick={() => setSkillPage(p => Math.max(1, p - 1))}
                disabled={skillPage === 1}
                className="p-2 border border-outline-variant disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container transition-colors rounded-sm"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <span className="text-xs font-black text-zinc-600 tracking-widest uppercase">
                Trang {skillPage} / {totalSkillPages}
              </span>
              <button
                onClick={() => setSkillPage(p => Math.min(totalSkillPages, p + 1))}
                disabled={skillPage === totalSkillPages}
                className="p-2 border border-outline-variant disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container transition-colors rounded-sm"
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

        {/* ==================== PHÂN TÍCH THEO ĐỊA ĐIỂM ==================== */}
        <div className="bg-white border border-outline-variant/20 p-8 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-headline font-extrabold tracking-tight">Phân tích theo Địa điểm</h2>
              <p className="text-sm text-on-surface-variant">Top khu vực tuyển dụng theo số lượng tin đăng</p>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Tìm kiếm địa điểm..."
                value={locationSearch}
                onChange={(e) => {
                  setLocationSearch(e.target.value);
                  setLocationPage(1);
                }}
                className="w-full bg-surface-container-lowest border-b-2 border-zinc-200 focus:border-primary h-12 px-4 pr-10 text-sm font-bold outline-none transition-all placeholder:font-normal"
              />
              <span className="material-symbols-outlined absolute right-3 top-3 text-zinc-400 text-xl pointer-events-none">
                search
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
            {currentLocations.map((loc, idx) => {
              const globalRank = (stats.locationStats || []).findIndex(l => l.name === loc.name) + 1;
              const percentage = Math.round((parseInt(loc.count) / stats.totalJobs) * 100);

              return (
                <RankingRow
                  key={loc.name}
                  rank={globalRank}
                  label={loc.name}
                  value={parseInt(loc.count)}
                  maxValue={maxLocCount}
                  subLabel={
                    <>{loc.count} <span className="text-[9px] font-normal text-zinc-400">jobs ({percentage}%)</span></>
                  }
                />
              );
            })}
          </div>

          {/* Pagination */}
          {totalLocationPages > 1 && (
            <div className="flex justify-center items-center mt-10 gap-6">
              <button
                onClick={() => setLocationPage(p => Math.max(1, p - 1))}
                disabled={locationPage === 1}
                className="p-2 border border-outline-variant disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container transition-colors rounded-sm"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <span className="text-xs font-black text-zinc-600 tracking-widest uppercase">
                Trang {locationPage} / {totalLocationPages}
              </span>
              <button
                onClick={() => setLocationPage(p => Math.min(totalLocationPages, p + 1))}
                disabled={locationPage === totalLocationPages}
                className="p-2 border border-outline-variant disabled:opacity-30 disabled:cursor-not-allowed hover:bg-surface-container transition-colors rounded-sm"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          )}

          {filteredLocations.length === 0 && (
            <div className="text-center p-12 text-zinc-400 italic">
              <span className="material-symbols-outlined text-4xl mb-2 block opacity-50">search_off</span>
              Không tìm thấy địa điểm phù hợp.
            </div>
          )}
        </div>

        {/* Các phần còn lại giữ nguyên (Lương, Kinh nghiệm, Recent Jobs) */}
        {/* ... (RankingTable cho Salary, Level, và Recent Jobs) ... */}
        {/* Bạn có thể copy phần cũ từ code gốc của bạn vào đây */}

        {/* ==================== NHU CẦU VIỆC LÀM THEO VAI TRÒ ==================== */}
        {roleStats.length > 0 && (
          <div className="bg-white border border-outline-variant/20 p-8 mb-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-headline font-extrabold tracking-tight">Nhu cầu việc làm theo Vai trò</h2>
              <p className="text-sm text-on-surface-variant">Số lượng tin tuyển dụng theo từng vai trò công nghệ</p>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={roleStats} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="role"
                  tick={{ fontSize: 11, fontWeight: 600 }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [value + ' jobs', 'Số lượng']}
                  contentStyle={{ border: 'none', borderRadius: 0, fontSize: 12, fontWeight: 600 }}
                />
                <Bar dataKey="job_count" fill="#6366f1" radius={[2, 2, 0, 0]} label={{ position: 'top', fontSize: 10, fontWeight: 700 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ==================== PHÂN TÍCH LƯƠNG THEO VAI TRÒ ==================== */}
        {roleStats.filter(r => r.avg_min).length > 0 && (
          <div className="bg-white border border-outline-variant/20 p-8 mb-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-headline font-extrabold tracking-tight">Phân tích Lương theo Vai trò</h2>
              <p className="text-sm text-on-surface-variant">Mức lương trung bình (min–max) theo từng vai trò, tính từ tin có số liệu cụ thể</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
              {roleStats
                .filter(r => r.avg_min && r.avg_max)
                .map((item, i) => (
                  <RankingRow
                    key={item.role}
                    rank={i + 1}
                    label={item.role}
                    value={item.avg_max}
                    maxValue={Math.max(...roleStats.filter(r => r.avg_max).map(r => r.avg_max))}
                    subLabel={<>{formatVND(item.avg_min)} – {formatVND(item.avg_max)} <span className="text-[9px] font-normal text-zinc-400">({item.job_count} jobs)</span></>}
                  />
                ))}
            </div>
          </div>
        )}

        {/* Section 4: Mức lương trung bình theo Cấp bậc */}
        <RankingTable
          title="Mức lương trung bình theo Cấp bậc"
          subtitle="Bỏ qua tin thỏa thuận (salary = null), tính trung bình từ các tin có số liệu cụ thể"
          items={salaryItems}
          renderItem={(item, i) => (
            <RankingRow
              key={item.role}
              rank={i + 1}
              label={item.role}
              value={item.avg_max}
              maxValue={maxSalary}
              subLabel={<>{formatVND(item.avg_min)} - {formatVND(item.avg_max)} <span className="text-[9px] font-normal text-zinc-400">({item.job_count} jobs)</span></>}
            />
          )}
          emptyMsg="Không có dữ liệu lương."
        />

        {/* Section 5: Phân tích Kinh nghiệm */}
        <RankingTable
          title="Phân tích Kinh nghiệm"
          subtitle="Số lượng vị trí tuyển dụng theo từng cấp bậc kinh nghiệm"
          items={levelItems}
          renderItem={(item, i) => (
            <RankingRow
              key={item.level}
              rank={i + 1}
              label={item.level}
              value={item.job_count}
              maxValue={maxLevelCount}
              subLabel={<>{item.job_count} <span className="text-[9px] font-normal text-zinc-400">vị trí</span></>}
            />
          )}
          emptyMsg="Không có dữ liệu kinh nghiệm."
        />

        {/* Section 6: Recent Jobs */}
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
                onClick={() => job.url ? window.open(job.url, '_blank') : navigate('/find-job')}
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
                    <span key={tag} className="bg-surface-container-low px-2 py-1 text-[10px] font-bold uppercase">{tag}</span>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-sm font-bold">
                    {(job.salary_min !== null && job.salary_min !== undefined)
                      ? `${formatVND(job.salary_min)}${job.salary_max ? ' - ' + formatVND(job.salary_max) : ''}`
                      : 'Thỏa thuận'}
                  </span>
                  <div className="flex items-center gap-3">
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-zinc-500 hover:text-primary uppercase tracking-widest transition-colors"
                        title={job.url}
                      >
                        <span className="material-symbols-outlined text-xs">link</span>
                        {(() => {
                          try { return new URL(job.url).hostname.replace('www.', ''); }
                          catch { return 'Nguồn'; }
                        })()}
                      </a>
                    )}
                    <span className="text-xs font-bold uppercase tracking-widest text-primary">Xem chi tiết</span>
                  </div>
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