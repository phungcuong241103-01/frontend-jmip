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
      } p-8 flex flex-col md:flex-row gap-8 items-start hover:bg-white transition-all group relative border-l-4 border-transparent hover:border-primary cursor-pointer`}
    >
      <div className="w-16 h-16 bg-zinc-50 flex items-center justify-center border border-zinc-100 shrink-0">
        <span className="material-symbols-outlined text-zinc-300 text-3xl">
          domain
        </span>
      </div>
      <div className="flex-grow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-headline font-bold text-xl text-zinc-900 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <p className="font-body text-sm font-semibold text-zinc-600">
              {company} • {location}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {skills.map((skill, index) => {
            const isHighlighted = selectedSkills.includes(skill);
            return (
              <span
                key={index}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  isHighlighted 
                    ? 'bg-primary text-white shadow-sm' 
                    : 'bg-zinc-50 text-zinc-600'
                }`}
              >
                {skill}
              </span>
            );
          })}
          {job.level_name && (
            <span className="px-3 py-1 bg-orange-50 text-[10px] font-bold uppercase tracking-wider text-orange-700">
              {job.level_name}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-2xl font-headline font-black text-zinc-900 tracking-tighter mb-1">
          {salary}
        </div>
        {job.url && (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 uppercase tracking-widest transition-colors mb-1"
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
          <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {new Date(job.posted_at).toLocaleDateString('vi-VN')}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobCard;
