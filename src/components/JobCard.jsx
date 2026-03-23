import React from 'react';

const JobCard = ({ job, isLowest }) => {
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
          {skills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-zinc-50 text-[10px] font-bold uppercase tracking-wider text-zinc-600"
            >
              {skill}
            </span>
          ))}
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
