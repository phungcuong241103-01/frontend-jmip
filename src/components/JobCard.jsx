import React from 'react';

const JobCard = ({ job, isLowest, selectedSkills = [] }) => {
  // Map backend data to display names
  const company = job.company_name || job.company || 'Unknown Company';
  const location = job.city || job.location || 'Vietnam';
  const skills = job.skills || job.tags || [];
  const salary = (job.salary_min !== null && job.salary_min !== undefined)
    ? `$${Number(job.salary_min).toLocaleString()}${job.salary_max ? ' - $' + Number(job.salary_max).toLocaleString() : ''}`
    : (job.salary || 'Thỏa thuận');

  return (
    <div
      onClick={() => job.url && window.open(job.url, '_blank')}
      className={`${
        isLowest ? 'bg-surface-container-lowest' : 'bg-surface-container-low'
      } p-4 md:p-8 flex flex-col md:flex-row gap-4 md:gap-8 items-start hover:bg-white transition-all group relative border-l-4 border-transparent hover:border-primary cursor-pointer`}
    >
      {/* Company icon - hidden on mobile */}
      <div className="hidden md:flex w-16 h-16 bg-zinc-50 items-center justify-center border border-zinc-100 shrink-0">
        <span className="material-symbols-outlined text-zinc-300 text-3xl">
          domain
        </span>
      </div>
      <div className="flex-grow min-w-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 mb-2">
          <div className="min-w-0">
            <h3 className="font-headline font-bold text-base md:text-xl text-zinc-900 group-hover:text-primary transition-colors truncate">
              {job.title}
            </h3>
            <p className="font-body text-xs md:text-sm font-semibold text-zinc-600">
              {company} • {location}
            </p>
          </div>
          {/* Salary inline on mobile */}
          <div className="shrink-0 sm:text-right mt-1 sm:mt-0">
            <div className="text-lg md:text-2xl font-headline font-black text-zinc-900 tracking-tighter">
              {salary}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 md:gap-2 mt-2 md:mt-4">
          {skills.slice(0, 6).map((skill, index) => {
            const isHighlighted = selectedSkills.includes(skill);
            return (
              <span
                key={index}
                className={`px-2 md:px-3 py-0.5 md:py-1 text-[9px] md:text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isHighlighted 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-zinc-50 text-zinc-600'
                }`}
              >
                {skill}
              </span>
            );
          })}
          {skills.length > 6 && (
            <span className="px-2 py-0.5 text-[9px] font-bold text-zinc-400">
              +{skills.length - 6}
            </span>
          )}
          {job.level_name && (
            <span className="px-2 md:px-3 py-0.5 md:py-1 bg-orange-50 text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-orange-700">
              {job.level_name}
            </span>
          )}
        </div>
        {/* Source and date row */}
        <div className="flex items-center gap-3 mt-2 md:mt-3">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest transition-colors"
              title={job.url}
            >
              <span className="material-symbols-outlined text-xs">link</span>
              {(() => {
                try { return new URL(job.url).hostname.replace('www.', ''); }
                catch { return 'Nguồn'; }
              })()}
            </a>
          )}
          {job.posted_at && (
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {new Date(job.posted_at).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;
