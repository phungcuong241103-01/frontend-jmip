import React, { useState, useEffect } from 'react';
import { getFilters, chatWithAI, getAnalyticsRoles } from '../services/api';

const Consulting = () => {
  const [filters, setFilters] = useState({ roles: [], levels: [], skills: [] });
  const [roleSkillsMap, setRoleSkillsMap] = useState({});
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [skillSearch, setSkillSearch] = useState('');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [filtersData, analyticsRes] = await Promise.allSettled([
          getFilters(),
          getAnalyticsRoles()
        ]);
        const data = filtersData.status === 'fulfilled' ? filtersData.value : { roles: [], levels: [], skills: [] };
        setFilters(data);
        if (data.roles?.length > 0) setSelectedRole(data.roles[0].name);
        if (data.levels?.length > 0) setSelectedLevel(data.levels[0].name);

        // Build role -> skills mapping
        if (analyticsRes.status === 'fulfilled') {
          const rolesData = analyticsRes.value?.data || [];
          const map = {};
          rolesData.forEach(r => { map[r.role] = r.skills || []; });
          setRoleSkillsMap(map);
        }
      } catch (err) {
        console.error('Failed to fetch filters:', err);
      }
    };
    fetchMetadata();
  }, []);

  const toggleSkill = (skillName) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  const handleGetAdvice = async () => {
    setLoading(true);
    setAdvice(null);
    try {
      const skillsText = selectedSkills.length > 0 ? selectedSkills.join(', ') : 'chưa có';
      const roleText = selectedRole || 'bất kỳ vị trí IT nào';
      const prompt = `Hiện tại tôi đang quan tâm đến ${roleText}, với những kỹ năng là ${skillsText}. Tôi nên học thêm những gì và dự đoán mức lương nếu tôi theo con đường đó, tính theo VNĐ.`;
      const data = await chatWithAI(prompt);
      if (data && data.reply) {
        setAdvice({ message: data.reply });
      } else {
        setAdvice({ message: 'Xin lỗi, không có phản hồi từ máy chủ.' });
      }
    } catch (err) {
      console.error('Advice failed:', err);
      setAdvice({ message: 'Lỗi kết nối tới AI. Vui lòng thử lại.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="pt-16 min-h-screen bg-surface pb-20">
      <div className="p-8 lg:px-12 max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-on-surface mb-4 uppercase font-headline">
            Tư vấn Nghề nghiệp & Lương
          </h1>
          <p className="text-on-surface-variant font-body max-w-2xl mx-auto leading-relaxed">
            Kết nối trực tiếp với Database để đưa ra dự báo mức lương và lộ trình học tập tối ưu.
          </p>
        </div>

        <div className="space-y-8">
          {/* Main Form Section */}
          <section className="bg-white p-8 lg:p-10 shadow-[0_24px_48px_rgba(26,28,29,0.06)] border border-outline-variant/10">
            <div className="space-y-10">
              {/* Row 1: Role */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary">
                  <span className="material-symbols-outlined text-sm">person_search</span>
                  Vị trí công việc (Role)
                </label>
                <select 
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setSelectedSkills([]);
                    setSkillSearch('');
                  }}
                  className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary focus:ring-0 px-6 py-5 text-base font-medium outline-none cursor-pointer transition-all"
                >
                  {filters.roles.map((r) => (
                    <option key={r.id} value={r.name}>{r.name}</option>
                  ))}
                </select>
              </div>

              {/* Row 2: Experience */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary">
                  <span className="material-symbols-outlined text-sm">history_edu</span>
                  Cấp bậc (Level)
                </label>
                <select 
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full bg-surface-container-low border-b-2 border-transparent focus:border-primary focus:ring-0 px-6 py-5 text-base font-medium outline-none cursor-pointer transition-all"
                >
                  {filters.levels.map((l) => (
                    <option key={l.id} value={l.name}>{l.name}</option>
                  ))}
                </select>
              </div>

              {/* Row 3: Skills (Multi-select Chips) */}
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-primary">
                  <span className="material-symbols-outlined text-sm">construction</span>
                  Kỹ năng hiện có (Skills)
                </label>
                <div className="bg-surface-container-low p-6 border border-outline-variant/5">
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Tìm kiếm kỹ năng..."
                      className="w-full bg-white border border-outline-variant/30 focus:border-primary focus:ring-1 focus:ring-primary h-10 px-3 pr-8 text-sm font-body outline-none transition-all"
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                    />
                    <span className="material-symbols-outlined absolute right-2 top-2.5 text-zinc-400 text-lg">search</span>
                  </div>
                  <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200">
                    {filters.skills
                      .filter(s => s.name.toLowerCase().includes(skillSearch.toLowerCase()))
                      .sort((a, b) => {
                        // Sort role-related skills to the top
                        if (selectedRole && roleSkillsMap[selectedRole]?.length) {
                          const aInRole = roleSkillsMap[selectedRole].includes(a.name);
                          const bInRole = roleSkillsMap[selectedRole].includes(b.name);
                          if (aInRole && !bInRole) return -1;
                          if (!aInRole && bInRole) return 1;
                        }
                        return 0;
                      })
                      .map((s) => {
                      const isSelected = selectedSkills.includes(s.name);
                      const isRoleSkill = selectedRole && roleSkillsMap[selectedRole]?.includes(s.name);
                      return (
                        <button
                          key={s.id}
                          onClick={() => toggleSkill(s.name)}
                          className={`px-3 py-1.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-sm'
                              : isRoleSkill
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-400'
                                : 'bg-white text-zinc-500 border-transparent hover:border-zinc-300'
                          }`}
                        >
                          {isRoleSkill && <span className="mr-1">★</span>}
                          {s.name}
                        </button>
                      );
                    })}
                    {filters.skills.filter(s => s.name.toLowerCase().includes(skillSearch.toLowerCase())).length === 0 && (
                      <span className="text-xs text-zinc-400 italic">Không tìm thấy kỹ năng phù hợp.</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleGetAdvice}
                  disabled={loading}
                  className="bg-zinc-900 text-white px-12 py-5 font-bold text-sm uppercase tracking-widest hover:bg-primary transition-all cursor-pointer shadow-xl disabled:bg-zinc-400"
                >
                  {loading ? 'Đang phân tích...' : 'Nhận tư vấn đa chiều từ AI'}
                </button>
              </div>
            </div>

            {advice && (
              <div className="mt-16 pt-12 border-t border-outline-variant/20 space-y-8">
                {/* Chatbot Advice Result */}
                {advice && (
                  <div className="bg-primary/5 p-8 border-l-4 border-primary animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-white">smart_toy</span>
                      </div>
                      <div className="space-y-4">
                        <p className="font-body text-on-surface leading-relaxed font-medium whitespace-pre-wrap">
                          {advice.message}
                        </p>
                        {advice.suggestions && advice.suggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {advice.suggestions.map((s) => (
                              <span key={s} className="bg-white px-4 py-2 text-sm font-black text-primary border border-primary/20 shadow-sm">
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Market Pulse Info */}
          <div className="bg-surface-container-highest p-6 flex items-center gap-4 border border-outline-variant/10">
            <span className="material-symbols-outlined text-primary">verified</span>
            <p className="text-xs font-medium text-on-surface-variant font-body">
              Dữ liệu được cập nhật từ mạng lưới JMIP Grid dựa trên các tin tuyển dụng thực tế và mức lương niêm yết công khai.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Consulting;
