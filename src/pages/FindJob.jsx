import React, { useState, useEffect } from 'react';
import JobCard from '../components/JobCard';
import { getJobs, getLocations, getLevels, getSkills } from '../services/api';

const FindJob = () => {
  const [jobs, setJobs] = useState([]);
  const [locations, setLocations] = useState([]);
  const [levels, setLevels] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 50
  });

  const [skillSearch, setSkillSearch] = useState('');

  const [filters, setFilters] = useState({
    search: '',
    location: '',
    level: '',
    skills: [],
    page: 1
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [locs, levs, sks] = await Promise.all([
          getLocations(),
          getLevels(),
          getSkills()
        ]);
        setLocations(locs);
        setLevels(levs);
        setSkills(sks);
      } catch (err) {
        console.error('Error fetching metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

useEffect(() => {
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: 50,
        search: filters.search,
        location: filters.location,
        level: filters.level,
        skills: filters.skills.join(',')
      };

      const data = await getJobs(params);
      console.log("API DATA:", data);

      // ✅ Handle nhiều kiểu response khác nhau
      const jobsData =
        data?.jobs ||
        data?.data?.jobs ||
        [];

      const paginationData =
        data?.pagination ||
        data?.data?.pagination ||
        {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          limit: 50
        };

      setJobs(jobsData);
      setPagination(paginationData);

    } catch (err) {
      console.error('Error fetching jobs:', err);

      // ✅ fallback khi lỗi
      setJobs([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
        limit: 50
      });

    } finally {
      setLoading(false);
    }
  };

  fetchJobs();
}, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
  };

  const handleSkillToggle = (skillName) => {
    setFilters(prev => {
      const newSkills = prev.skills.includes(skillName)
        ? prev.skills.filter(s => s !== skillName)
        : [...prev.skills, skillName];
      return { ...prev, skills: newSkills, page: 1 };
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  return (
    <main className="pt-16 min-h-screen flex">
      {/* SideNavBar (Filter Context) */}
      <aside className="bg-zinc-50 flex flex-col h-[calc(100vh-64px)] w-80 fixed left-0 overflow-y-auto border-r-0">
        <div className="p-8 space-y-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-4">
              Tìm kiếm thông tin
            </span>
            <div className="relative">
              <input
                className="w-full bg-surface-container-lowest border-none focus:ring-2 focus:ring-primary h-12 px-4 text-sm font-body placeholder:text-zinc-400 outline-none"
                placeholder="Từ khóa, Chức danh..."
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
              <span className="material-symbols-outlined absolute right-3 top-3 text-zinc-400">
                search
              </span>
            </div>
          </div>
          {/* Skill Multi-Select with Search */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-4">
              Kỹ năng cốt lõi
            </span>
            
            {/* Selected Tags */}
            {filters.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 border-b border-outline-variant/20 pb-4">
                {filters.skills.map((skillName) => (
                  <span
                    key={skillName}
                    onClick={() => handleSkillToggle(skillName)}
                    className="flex items-center gap-1 bg-primary text-white px-2 py-1 text-[11px] font-bold cursor-pointer rounded-sm hover:opacity-80 transition-opacity"
                  >
                    {skillName} <span className="material-symbols-outlined text-[10px] font-bold">close</span>
                  </span>
                ))}
                <span
                  onClick={() => setFilters(prev => ({ ...prev, skills: [], page: 1 }))}
                  className="flex items-center px-2 py-1 text-[11px] font-bold cursor-pointer hover:underline text-zinc-500"
                >
                  Xóa tất cả
                </span>
              </div>
            )}

            {/* Search Input */}
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Tìm kiếm kỹ năng..."
                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary h-10 px-3 pr-8 text-sm font-body outline-none transition-all"
                value={skillSearch}
                onChange={(e) => setSkillSearch(e.target.value)}
              />
              <span className="material-symbols-outlined absolute right-2 top-2.5 text-zinc-400 text-lg">
                search
              </span>
            </div>

            {/* Available Skills List */}
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-zinc-200">
              {skills
                .filter(skill => skill.name.toLowerCase().includes(skillSearch.toLowerCase()) && !filters.skills.includes(skill.name))
                .map((skill) => (
                <span
                  key={skill.id}
                  onClick={() => handleSkillToggle(skill.name)}
                  className="px-3 py-1 text-xs font-medium cursor-pointer transition-colors bg-white border border-outline-variant hover:border-primary hover:text-primary"
                >
                  {skill.name}
                </span>
              ))}
              {skills.filter(skill => skill.name.toLowerCase().includes(skillSearch.toLowerCase()) && !filters.skills.includes(skill.name)).length === 0 && (
                <span className="text-xs text-zinc-400 italic">Không tìm thấy kỹ năng phù hợp.</span>
              )}
            </div>
          </div>
          {/* Location Dropdown */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-4">
              Địa điểm
            </span>
            <select 
              className="w-full bg-surface-container-lowest border-none focus:ring-2 focus:ring-primary h-12 px-4 text-sm font-body outline-none"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
            >
              <option value="">Tất cả địa điểm</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.city}>{loc.city}</option>
              ))}
            </select>
          </div>
          {/* Experience Levels */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block mb-4">
              Kinh nghiệm (Cấp bậc)
            </span>
            <div className="space-y-3">
              {levels.map((level) => (
                <label key={level.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    checked={filters.level === level.name}
                    className="w-4 h-4 border-zinc-300 text-primary focus:ring-primary"
                    type="radio"
                    name="level"
                    onChange={() => handleFilterChange('level', level.name)}
                  />
                  <span
                    className={`text-sm font-medium ${
                      filters.level === level.name ? 'text-zinc-900' : 'text-zinc-600 group-hover:text-zinc-900'
                    }`}
                  >
                    {level.name}
                  </span>
                </label>
              ))}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  checked={filters.level === ''}
                  className="w-4 h-4 border-zinc-300 text-primary focus:ring-primary"
                  type="radio"
                  name="level"
                  onChange={() => handleFilterChange('level', '')}
                />
                <span className={`text-sm font-medium ${filters.level === '' ? 'text-zinc-900' : 'text-zinc-600 group-hover:text-zinc-900'}`}>
                  Tất cả
                </span>
              </label>
            </div>
          </div>
          <button 
            onClick={() => setFilters(prev => ({ ...prev, page: 1 }))}
            className="w-full bg-primary text-white py-4 font-headline font-bold tracking-tight hover:bg-primary-container hover:text-on-primary-container transition-all cursor-pointer"
          >
            Cập nhật tìm kiếm
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <section className="ml-80 w-full p-8 lg:p-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-headline font-extrabold tracking-tighter text-zinc-900 mb-2 leading-tight">
              Cơ hội việc làm Market Opportunities
            </h1>
            <p className="font-body text-zinc-500 text-sm">
              Phân tích kỹ năng IT thời gian thực hiển thị{' '}
              <span className="text-primary font-bold">{pagination.totalItems.toLocaleString()} thông tin tuyển dụng</span> phù hợp với
              tiêu chí của bạn.
            </p>
          </div>
        </div>
        
        {/* Job Grid */}
        <div className="grid grid-cols-1 gap-1">
          {loading ? (
            <div className="py-20 text-center text-zinc-500 font-medium">Đang tải dữ liệu...</div>
          ) : jobs.length > 0 ? (
            jobs.map((job, index) => (
              <JobCard key={job.id} job={job} isLowest={index % 2 === 0} />
            ))
          ) : (
            <div className="py-20 text-center text-zinc-500 font-medium">Không tìm thấy việc làm phù hợp.</div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-16 flex justify-between items-center py-8 border-t border-zinc-100">
            <button 
              disabled={pagination.currentPage === 1}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              className={`flex items-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest cursor-pointer ${
                pagination.currentPage === 1 ? 'text-zinc-200 cursor-not-allowed' : 'text-zinc-400 hover:text-zinc-900'
              }`}
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span> Trước
            </button>
            <div className="flex gap-4">
              {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                const pageNum = i + 1;
                return (
                  <span
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`text-sm font-black cursor-pointer ${
                      pagination.currentPage === pageNum ? 'text-primary' : 'text-zinc-300 hover:text-zinc-900'
                    }`}
                  >
                    {pageNum.toString().padStart(2, '0')}
                  </span>
                );
              })}
              {pagination.totalPages > 5 && <span className="text-zinc-300 font-black text-sm">...</span>}
              {pagination.totalPages > 5 && (
                <span
                  onClick={() => handlePageChange(pagination.totalPages)}
                  className={`text-sm font-black cursor-pointer ${
                    pagination.currentPage === pagination.totalPages ? 'text-primary' : 'text-zinc-300 hover:text-zinc-900'
                  }`}
                >
                  {pagination.totalPages.toString().padStart(2, '0')}
                </span>
              )}
            </div>
            <button 
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              className={`flex items-center gap-2 transition-colors font-bold text-xs uppercase tracking-widest cursor-pointer ${
                pagination.currentPage === pagination.totalPages ? 'text-zinc-200 cursor-not-allowed' : 'text-zinc-900 hover:text-primary'
              }`}
            >
              Sau <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

export default FindJob;
