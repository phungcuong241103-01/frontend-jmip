import React, { useState, useEffect, useRef } from 'react';
import { useFilteredAnalytics, useAIInsights, useRoles, useLocations, useLevels, useSkills } from '../hooks/useQueries';
import LoadingOverlay from '../components/LoadingOverlay';

// ─── Detect mobile (≤ 640px) ─────────────────────────────────────────────────
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
};

// ─── ECharts lazy hook ───────────────────────────────────────────────────────
const useECharts = (ref, getOption, deps = []) => {
  useEffect(() => {
    if (!ref.current) return;
    let chart;
    let ro;

    const init = () => {
      if (typeof window.echarts === 'undefined') return;
      chart = window.echarts.getInstanceByDom(ref.current)
        || window.echarts.init(ref.current, null, { renderer: 'canvas' });
      const opt = typeof getOption === 'function' ? getOption() : getOption;
      if (opt) chart.setOption(opt, true);
      ro = new ResizeObserver(() => chart?.resize());
      ro.observe(ref.current);
    };

    if (typeof window.echarts !== 'undefined') {
      init();
    } else {
      const script = document.getElementById('echarts-script');
      if (script) script.addEventListener('load', init);
    }

    return () => {
      ro?.disconnect();
      chart?.dispose();
    };
  }, deps); // eslint-disable-line
};

// ─── Inject ECharts CDN once ─────────────────────────────────────────────────
const injectECharts = () => {
  if (document.getElementById('echarts-script')) return;
  const s = document.createElement('script');
  s.id = 'echarts-script';
  s.src = 'https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js';
  document.head.appendChild(s);
};

// ─── Palette & shared tooltip ─────────────────────────────────────────────────
const MULTI = ['#6366f1','#14b8a6','#f97316','#ec4899','#f59e0b','#06b6d4','#84cc16','#8b5cf6','#ef4444','#10b981'];

const mkTooltip = () => ({
  backgroundColor: '#1e293b',
  borderColor: 'transparent',
  textStyle: { color: '#f8fafc', fontSize: 11, fontWeight: 600 },
  extraCssText: 'border-radius:6px;box-shadow:0 8px 24px rgba(0,0,0,0.2);padding:8px 12px;',
  confine: true,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatVND = (v) => {
  if (!v) return '0';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}tr`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v.toLocaleString();
};

const trunc = (str, max) => str?.length > max ? str.slice(0, max) + '…' : (str || '');

// ─── Shared UI components ─────────────────────────────────────────────────────
const Card = ({ children, className = '', fill = false }) => (
  <div className={`bg-white dark:bg-zinc-900 border border-outline-variant/20 shadow-sm transition-colors ${fill ? 'h-full flex flex-col' : ''} ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ title, subtitle, right, compact = false, onExpand }) => (
  <div className={`flex sm:items-center justify-between gap-1 ${compact ? 'px-2.5 pt-1.5 pb-0' : 'px-4 pt-3 pb-0 md:px-5 md:pt-4'}`}>
    <div className="min-w-0 flex-1">
      <h2 className={`font-headline font-extrabold tracking-tight leading-tight ${compact ? 'text-[11px]' : 'text-sm md:text-lg'}`}>{title}</h2>
      {subtitle && <p className={`text-on-surface-variant leading-snug ${compact ? 'text-[8px] mt-0' : 'text-[10px] md:text-xs mt-0.5'}`}>{subtitle}</p>}
    </div>
    <div className="flex items-center gap-1 shrink-0">
      {right}
      {onExpand && (
        <button onClick={onExpand} title="Phóng to" className="w-5 h-5 flex items-center justify-center text-zinc-400 hover:text-primary hover:bg-primary/10 rounded transition-all cursor-pointer">
          <span className="material-symbols-outlined text-[14px]">open_in_full</span>
        </button>
      )}
    </div>
  </div>
);

const SearchInput = ({ value, onChange, placeholder = 'Tìm kiếm...', compact = false }) => (
  <div className="relative">
    <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
      className={`w-full bg-surface-container-lowest border-b-2 border-zinc-200 dark:border-zinc-700 focus:border-primary font-bold outline-none transition-all placeholder:font-normal text-on-surface ${compact ? 'h-6 pl-2 pr-6 text-[10px]' : 'h-8 pl-3 pr-8 text-xs'}`} />
    <span className={`material-symbols-outlined absolute text-zinc-400 pointer-events-none ${compact ? 'right-1.5 top-1 text-[12px]' : 'right-2 top-1.5 text-[16px]'}`}>search</span>
  </div>
);

const Pagination = ({ page, total, onChange, compact = false }) => {
  if (total <= 1) return null;
  const sz = compact ? 'w-5 h-5' : 'w-6 h-6';
  const fsz = compact ? 'text-[8px]' : 'text-[10px]';
  return (
    <div className={`flex justify-center items-center gap-0.5 ${compact ? 'mt-0.5 pt-0.5' : 'mt-2 pt-2'} border-t border-zinc-100 dark:border-zinc-800`}>
      <button onClick={() => onChange(0)} disabled={page === 0}
        className={`${sz} flex items-center justify-center ${fsz} font-black border border-outline-variant disabled:opacity-30 hover:bg-surface-container rounded-sm`}>«</button>
      <button onClick={() => onChange(Math.max(0, page - 1))} disabled={page === 0}
        className={`${sz} flex items-center justify-center border border-outline-variant disabled:opacity-30 hover:bg-surface-container rounded-sm`}>
        <span className={`material-symbols-outlined ${compact ? 'text-[10px]' : 'text-xs'}`}>chevron_left</span>
      </button>
      <span className={`${fsz} font-black text-zinc-500 dark:text-zinc-400 tracking-widest uppercase min-w-[36px] text-center`}>
        {page + 1}/{total}
      </span>
      <button onClick={() => onChange(Math.min(total - 1, page + 1))} disabled={page === total - 1}
        className={`${sz} flex items-center justify-center border border-outline-variant disabled:opacity-30 hover:bg-surface-container rounded-sm`}>
        <span className={`material-symbols-outlined ${compact ? 'text-[10px]' : 'text-xs'}`}>chevron_right</span>
      </button>
      <button onClick={() => onChange(total - 1)} disabled={page === total - 1}
        className={`${sz} flex items-center justify-center ${fsz} font-black border border-outline-variant disabled:opacity-30 hover:bg-surface-container rounded-sm`}>»</button>
    </div>
  );
};

const Empty = ({ msg = 'Không có dữ liệu.' }) => (
  <div className="flex flex-col items-center justify-center py-6 text-zinc-400">
    <span className="material-symbols-outlined text-2xl mb-1 opacity-40">search_off</span>
    <p className="text-xs italic">{msg}</p>
  </div>
);

// ─── Expand Modal (chart zoom overlay) ────────────────────────────────────────
const ExpandModal = ({ open, onClose, title, children }) => {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      {/* Modal */}
      <div
        className="relative bg-white dark:bg-zinc-900 border border-outline-variant/30 shadow-2xl w-[92vw] h-[88vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <h2 className="text-base font-headline font-extrabold tracking-tight text-on-surface">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-lg text-zinc-500">close</span>
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 min-h-0 p-4 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SKILLS — horizontal bar, 10 per page
// ═══════════════════════════════════════════════════════════════════════════════
const SkillsChart = ({ data, compact = false, onExpand }) => {
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const PAGE = compact ? 8 : 10;
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const filtered = data.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / PAGE);
  const slice = filtered.slice(page * PAGE, (page + 1) * PAGE).slice().reverse();

  const lm = isMobile ? 80 : (compact ? 100 : 120);

  useECharts(ref, () => slice.length === 0 ? null : ({
    tooltip: {
      ...mkTooltip(), trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (p) => `<b>${p[0].name}</b><br/>${p[0].value} jobs`,
    },
    grid: { left: lm, right: compact ? 24 : (isMobile ? 32 : 48), top: 4, bottom: 4, containLabel: false },
    xAxis: {
      type: 'value',
      axisLabel: { fontSize: compact ? 9 : (isMobile ? 9 : 10), color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: slice.map(s => compact ? trunc(s.name, 14) : (isMobile ? trunc(s.name, 10) : trunc(s.name, 18))),
      axisLabel: { fontSize: compact ? 9 : (isMobile ? 9 : 11), fontWeight: 600, color: '#334155', width: lm - 6, overflow: 'truncate' },
      axisLine: { show: false }, axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: slice.map((s, i) => {
        const globalRank = page * PAGE + (slice.length - 1 - i);
        const isHot = page === 0 && globalRank < 3;
        return {
          value: parseInt(s.count),
          itemStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: isHot
                ? [{ offset: 0, color: '#f97316' }, { offset: 1, color: '#fb923c' }]
                : [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#818cf8' }],
            },
            borderRadius: [0, 3, 3, 0],
          },
        };
      }),
      label: { show: !isMobile, position: 'right', formatter: '{c}', fontSize: compact ? 9 : 10, color: '#64748b', fontWeight: 700 },
      barMaxWidth: compact ? 14 : (isMobile ? 12 : 18),
    }],
  }), [JSON.stringify(slice), isMobile, compact]);

  const chartH = compact ? '100%' : Math.max(180, slice.length * (isMobile ? 22 : 26));

  return (
    <Card fill={compact}>
      <CardHeader compact={compact} onExpand={onExpand}
        title="Top Kỹ năng Phổ biến"
        subtitle={`${filtered.length} kỹ năng · ${PAGE}/trang`} />
      <div className={compact ? 'px-2 pt-0.5' : 'px-4 md:px-5 pt-2'}>
        <SearchInput compact={compact} value={search} onChange={v => { setSearch(v); setPage(0); }} placeholder="Tìm kỹ năng..." />
      </div>
      <div className={`px-1 md:px-2 py-1 ${compact ? 'flex-1 min-h-0' : ''}`}>
        {slice.length > 0
          ? <div ref={ref} style={{ width: '100%', height: chartH }} />
          : <Empty msg="Không tìm thấy kỹ năng phù hợp." />
        }
      </div>
      <div className={compact ? 'px-2 pb-1' : 'px-4 md:px-5 pb-3'}>
        <Pagination compact={compact} page={page} total={totalPages} onChange={setPage} />
        {!compact && page === 0 && search === '' && (
          <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-zinc-100">
            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 self-center mr-1">Hot:</span>
            {data.slice(0, 3).map((s, i) => (
              <span key={s.name} className={`px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide
                ${i === 0 ? 'bg-orange-100 text-orange-700' : 'bg-indigo-50 text-indigo-600'}`}>
                #{i + 1} {s.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. LOCATIONS — Pie / Donut chart
// ═══════════════════════════════════════════════════════════════════════════════
const LocationsChart = ({ data, totalJobs, compact = false, onExpand }) => {
  const ref = useRef(null);
  const isMobile = useIsMobile();

  const top = data.slice(0, 8);
  const rest = data.slice(8);
  const restCount = rest.reduce((sum, l) => sum + parseInt(l.count), 0);
  const pieData = [
    ...top.map((l, i) => ({
      name: l.name, value: parseInt(l.count),
      itemStyle: { color: MULTI[i % MULTI.length] },
    })),
    ...(restCount > 0 ? [{
      name: 'Khác', value: restCount,
      itemStyle: { color: '#cbd5e1' },
    }] : []),
  ];

  useECharts(ref, () => pieData.length === 0 ? null : ({
    tooltip: {
      ...mkTooltip(), trigger: 'item',
      formatter: (p) => {
        const pct = totalJobs > 0 ? ((p.value / totalJobs) * 100).toFixed(1) : 0;
        return `<b>${p.name}</b><br/>${p.value} jobs · ${pct}%`;
      },
    },
    legend: {
      orient: (isMobile || compact) ? 'horizontal' : 'vertical',
      [(isMobile || compact) ? 'bottom' : 'right']: (isMobile || compact) ? 0 : 12,
      top: (isMobile || compact) ? 'auto' : 'middle',
      textStyle: { fontSize: compact ? 8 : (isMobile ? 9 : 11), fontWeight: 600 },
      itemWidth: compact ? 8 : 10, itemHeight: compact ? 8 : 10,
    },
    series: [{
      type: 'pie',
      radius: compact ? ['30%', '55%'] : ['35%', '62%'],
      center: compact ? ['50%', '45%'] : (isMobile ? ['50%', '42%'] : ['35%', '50%']),
      data: pieData,
      label: {
        show: !isMobile && !compact,
        formatter: '{b}\n{d}%',
        fontSize: 10, fontWeight: 600, color: '#475569',
      },
      emphasis: {
        itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.14)' },
        label: { show: true, fontSize: compact ? 10 : 12, fontWeight: 700 },
      },
      animationType: 'scale', animationEasing: 'elasticOut',
    }],
  }), [JSON.stringify(pieData), isMobile, compact]);

  return (
    <Card fill={compact}>
      <CardHeader compact={compact} onExpand={onExpand}
        title="Địa điểm"
        subtitle={compact ? `${data.length} tỉnh/thành` : `${data.length} tỉnh/thành · top khu vực`}
      />
      <div className={`px-1 md:px-2 py-1 ${compact ? 'flex-1 min-h-0' : ''}`}>
        {pieData.length > 0
          ? <div ref={ref} style={{ width: '100%', height: compact ? '100%' : (isMobile ? 260 : 280) }} />
          : <Empty msg="Không có dữ liệu địa điểm." />
        }
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. TREND — area line
// ═══════════════════════════════════════════════════════════════════════════════
const TrendChart = ({ data, compact = false, onExpand }) => {
  const ref = useRef(null);
  const isMobile = useIsMobile();

  useECharts(ref, () => data.length === 0 ? null : ({
    tooltip: {
      ...mkTooltip(), trigger: 'axis',
      formatter: (p) => `<b>${p[0].axisValue}</b><br/>${p[0].value} tin đăng`,
    },
    grid: { left: 8, right: 8, top: 8, bottom: 6, containLabel: true },
    xAxis: {
      type: 'category', data: data.map(d => d.date), boundaryGap: false,
      axisLabel: {
        fontSize: compact ? 8 : (isMobile ? 8 : 10), color: '#94a3b8',
        rotate: (isMobile || compact) && data.length > 12 ? -45 : 0,
        interval: (isMobile || compact) ? Math.floor(data.length / 5) : 'auto',
      },
      axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: compact ? 8 : (isMobile ? 8 : 10), color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false },
    },
    series: [{
      type: 'line', smooth: true,
      data: data.map(d => d.count),
      lineStyle: { color: '#6366f1', width: compact ? 1.5 : 2 },
      itemStyle: { color: '#6366f1' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(99,102,241,0.22)' }, { offset: 1, color: 'rgba(99,102,241,0)' }] },
      },
      symbol: 'circle', symbolSize: compact ? 2 : (isMobile ? 2 : 4),
    }],
  }), [JSON.stringify(data), isMobile, compact]);

  if (!data.length) return null;

  return (
    <Card fill={compact}>
      <CardHeader compact={compact} onExpand={onExpand} title="Xu hướng Tuyển dụng" subtitle="Tin đăng theo thời gian" />
      <div className={`px-1 md:px-2 py-1 ${compact ? 'flex-1 min-h-0' : ''}`}>
        <div ref={ref} style={{ width: '100%', height: compact ? '100%' : (isMobile ? 160 : 200) }} />
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. ROLES — bar chart
// ═══════════════════════════════════════════════════════════════════════════════
const RolesChart = ({ data, compact = false, onExpand }) => {
  const ref = useRef(null);
  const isMobile = useIsMobile();

  useECharts(ref, () => {
    if (!data.length) return null;

    if (isMobile) {
      return {
        tooltip: { ...mkTooltip(), trigger: 'axis', axisPointer: { type: 'shadow' },
          formatter: (p) => `<b>${p[0].name}</b><br/>${p[0].value} jobs` },
        grid: { left: 88, right: 32, top: 4, bottom: 4, containLabel: false },
        xAxis: { type: 'value', axisLabel: { fontSize: 9, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false } },
        yAxis: {
          type: 'category',
          data: [...data].reverse().map(r => trunc(r.role, 11)),
          axisLabel: { fontSize: 9, fontWeight: 600, color: '#334155' },
          axisLine: { show: false }, axisTick: { show: false },
        },
        series: [{
          type: 'bar',
          data: [...data].reverse().map((r, i) => ({
            value: r.job_count,
            itemStyle: { color: MULTI[(data.length - 1 - i) % MULTI.length], borderRadius: [0, 3, 3, 0] },
          })),
          barMaxWidth: 14,
        }],
      };
    }

    return {
      tooltip: { ...mkTooltip(), trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (p) => `<b>${p[0].name}</b><br/>${p[0].value} jobs` },
      grid: { left: 8, right: 8, top: 16, bottom: 60, containLabel: true },
      xAxis: {
        type: 'category', data: data.map(r => r.role),
        axisLabel: { fontSize: 10, fontWeight: 600, rotate: -25, color: '#475569', interval: 0, width: 72, overflow: 'truncate' },
        axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false },
      },
      yAxis: { type: 'value', axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false } },
      series: [{
        type: 'bar',
        data: data.map((r, i) => ({
          value: r.job_count,
          itemStyle: {
            color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: MULTI[i % MULTI.length] }, { offset: 1, color: MULTI[i % MULTI.length] + '88' }] },
            borderRadius: [4, 4, 0, 0],
          },
        })),
        label: { show: true, position: 'top', formatter: '{c}', fontSize: 10, fontWeight: 700, color: '#334155' },
        barMaxWidth: 36,
      }],
    };
  }, [JSON.stringify(data), isMobile]);

  const h = compact ? '100%' : (isMobile ? Math.max(160, data.length * 24) : 280);

  return (
    <Card fill={compact}>
      <CardHeader compact={compact} onExpand={onExpand} title="Vai trò" subtitle="Tin tuyển dụng theo vai trò" />
      <div className={`px-1 md:px-2 py-1 ${compact ? 'flex-1 min-h-0' : ''}`}>
        {data.length > 0
          ? <div ref={ref} style={{ width: '100%', height: h }} />
          : <Empty msg="Không có dữ liệu vai trò." />
        }
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SALARY BY ROLE — grouped bar
// ═══════════════════════════════════════════════════════════════════════════════
const SalaryRoleChart = ({ data, compact = false, onExpand }) => {
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const items = data.filter(r => r.avg_min && r.avg_max);

  useECharts(ref, () => items.length === 0 ? null : ({
    tooltip: {
      ...mkTooltip(), trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const name = params[0].name;
        const min = params.find(p => p.seriesName === 'Min')?.value || 0;
        const max = params.find(p => p.seriesName === 'Max')?.value || 0;
        return `<b>${name}</b><br/>Min: ${formatVND(min)}<br/>Max: ${formatVND(max)}`;
      },
    },
    legend: { data: ['Min','Max'], top: 0, right: 4, textStyle: { fontSize: compact ? 9 : 10, fontWeight: 600 }, itemWidth: 10, itemHeight: 8 },
    grid: { left: 8, right: 8, top: 22, bottom: compact ? 40 : (isMobile ? 48 : 60), containLabel: true },
    xAxis: {
      type: 'category',
      data: items.map(r => (isMobile || compact) ? trunc(r.role, 8) : r.role),
      axisLabel: { fontSize: compact ? 8 : (isMobile ? 8 : 10), rotate: (isMobile || compact) ? -35 : -20, color: '#475569', interval: 0, fontWeight: 600, width: (isMobile || compact) ? 50 : 72, overflow: 'truncate' },
      axisTick: { show: false }, axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: compact ? 8 : (isMobile ? 8 : 10), color: '#94a3b8', formatter: v => formatVND(v) },
      splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false },
    },
    series: [
      { name: 'Min', type: 'bar', data: items.map(r => r.avg_min), itemStyle: { color: '#a5b4fc', borderRadius: [3,3,0,0] }, barMaxWidth: compact ? 16 : (isMobile ? 14 : 24) },
      { name: 'Max', type: 'bar', data: items.map(r => r.avg_max), itemStyle: { color: '#6366f1', borderRadius: [3,3,0,0] }, barMaxWidth: compact ? 16 : (isMobile ? 14 : 24) },
    ],
  }), [JSON.stringify(items), isMobile, compact]);

  if (!items.length) return null;

  return (
    <Card fill={compact}>
      <CardHeader compact={compact} onExpand={onExpand} title="Lương theo Vai trò" subtitle="Min–max trung bình" />
      <div className={`px-1 md:px-2 py-1 ${compact ? 'flex-1 min-h-0' : ''}`}>
        <div ref={ref} style={{ width: '100%', height: compact ? '100%' : (isMobile ? 200 : 250) }} />
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. SALARY BY LEVEL — horizontal grouped bar
// ═══════════════════════════════════════════════════════════════════════════════
const SalaryLevelChart = ({ data, compact = false, onExpand }) => {
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const items = Array.isArray(data) ? data.filter(r => r.avg_min && r.avg_max) : [];
  const lm = (isMobile || compact) ? 68 : 100;

  useECharts(ref, () => items.length === 0 ? null : ({
    tooltip: {
      ...mkTooltip(), trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const name = params[0].name;
        const min = params.find(p => p.seriesName === 'Min')?.value || 0;
        const max = params.find(p => p.seriesName === 'Max')?.value || 0;
        return `<b>${name}</b><br/>Min: ${formatVND(min)}<br/>Max: ${formatVND(max)}`;
      },
    },
    legend: { data: ['Min','Max'], top: 0, right: 4, textStyle: { fontSize: compact ? 9 : 10, fontWeight: 600 }, itemWidth: 10, itemHeight: 8 },
    grid: { left: lm, right: (isMobile || compact) ? 36 : 52, top: 22, bottom: 4, containLabel: false },
    yAxis: {
      type: 'category',
      data: [...items].reverse().map(r => (isMobile || compact) ? trunc(r.role, 9) : r.role),
      axisLabel: { fontSize: compact ? 9 : (isMobile ? 9 : 11), fontWeight: 600, color: '#334155' },
      axisLine: { show: false }, axisTick: { show: false },
    },
    xAxis: {
      type: 'value',
      axisLabel: { fontSize: compact ? 8 : (isMobile ? 8 : 10), color: '#94a3b8', formatter: v => formatVND(v) },
      splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false },
    },
    series: [
      { name: 'Min', type: 'bar', data: [...items].reverse().map(r => r.avg_min), itemStyle: { color: '#fcd34d', borderRadius: [0,3,3,0] }, barMaxWidth: compact ? 12 : (isMobile ? 10 : 16) },
      { name: 'Max', type: 'bar', data: [...items].reverse().map(r => r.avg_max), itemStyle: { color: '#f59e0b', borderRadius: [0,3,3,0] }, barMaxWidth: compact ? 12 : (isMobile ? 10 : 16) },
    ],
  }), [JSON.stringify(items), isMobile, compact]);

  return (
    <Card fill={compact}>
      <CardHeader compact={compact} onExpand={onExpand} title="Lương theo Cấp bậc" subtitle="Tính từ tin có số liệu" />
      <div className={`px-1 md:px-2 py-1 ${compact ? 'flex-1 min-h-0' : ''}`}>
        {items.length > 0
          ? <div ref={ref} style={{ width: '100%', height: compact ? '100%' : Math.max(isMobile ? 130 : 160, items.length * (isMobile ? 30 : 36)) }} />
          : <Empty msg="Không có dữ liệu lương." />
        }
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. EXPERIENCE — donut
// ═══════════════════════════════════════════════════════════════════════════════
const ExperienceChart = ({ data }) => {
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const items = Array.isArray(data) ? data : [];

  useECharts(ref, () => !items.length ? null : ({
    tooltip: { ...mkTooltip(), trigger: 'item', formatter: (p) => `<b>${p.name}</b><br/>${p.value} vị trí · ${p.percent.toFixed(1)}%` },
    legend: {
      orient: isMobile ? 'horizontal' : 'vertical',
      [isMobile ? 'bottom' : 'right']: isMobile ? 0 : 8,
      top: isMobile ? 'auto' : 'middle',
      textStyle: { fontSize: isMobile ? 9 : 11, fontWeight: 600 },
      itemWidth: 10, itemHeight: 10,
    },
    series: [{
      type: 'pie', radius: ['35%', '62%'],
      center: isMobile ? ['50%', '40%'] : ['35%', '50%'],
      data: items.map((l, i) => ({ name: l.level, value: l.job_count, itemStyle: { color: MULTI[i % MULTI.length] } })),
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.14)' } },
    }],
  }), [JSON.stringify(items), isMobile]);

  return (
    <Card>
      <CardHeader title="Phân tích Kinh nghiệm" subtitle="Số vị trí theo cấp bậc" />
      <div className="px-1 md:px-2 py-2">
        {items.length > 0
          ? <div ref={ref} style={{ width: '100%', height: isMobile ? 220 : 240 }} />
          : <Empty msg="Không có dữ liệu kinh nghiệm." />
        }
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 8. AI INSIGHTS — Groq analysis card
// ═══════════════════════════════════════════════════════════════════════════════
const AIInsightsCard = ({ filters, compact = false }) => {
  const { data: raw, isLoading, isFetching } = useAIInsights(filters);
  const insights = raw?.data?.insights || raw?.insights || [];

  return (
    <Card fill={compact} className="border-primary/30 bg-gradient-to-br from-indigo-50/60 dark:from-indigo-950/30 to-white dark:to-zinc-900">
      <CardHeader compact={compact}
        title={<span className="flex items-center gap-1">
          <span className={`material-symbols-outlined text-primary ${compact ? 'text-sm' : 'text-lg'}`}>auto_awesome</span>
          AI Phân tích
        </span>}
        subtitle="Groq AI đọc dữ liệu thực"
      />
      <div className={`${compact ? 'px-2 pb-2 pt-1 flex-1 min-h-0 overflow-y-auto dashboard-scroll' : 'px-4 md:px-5 pb-4 pt-2'}`}>
        {(isLoading || isFetching) ? (
          <div className="flex items-center gap-2 py-3">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className={`font-bold text-zinc-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>AI đang phân tích...</span>
          </div>
        ) : insights.length > 0 ? (
          <div className={`grid gap-1.5 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 gap-2'}`}>
            {insights.map((insight, i) => (
              <div key={i} className={`bg-white/80 dark:bg-zinc-800/80 border border-indigo-100 dark:border-indigo-900/50 leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium hover:shadow-sm transition-shadow ${compact ? 'px-2 py-1.5 text-[10px]' : 'px-3 py-2.5 text-xs'}`}>
                {insight}
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-zinc-400 italic py-2 ${compact ? 'text-[10px]' : 'text-xs'}`}>Không thể lấy phân tích AI.</p>
        )}
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// REUSABLE FILTER DROPDOWN WITH SEARCH
// ═══════════════════════════════════════════════════════════════════════════════
const FilterDropdown = ({ icon, label, items, selectedId, onChange, displayKey = 'name' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) { setOpen(false); setSearch(''); } };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = items.find(r => r.id === selectedId);
  const filtered = items.filter(r =>
    (r[displayKey] || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative" ref={dropRef}>
      <button
        onClick={() => { setOpen(!open); if (open) setSearch(''); }}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-zinc-800 border text-xs font-bold transition-all min-w-0 max-w-[180px]
          ${selectedId ? 'border-primary/40 bg-primary/5 text-primary shadow-sm' : 'border-outline-variant hover:border-primary text-zinc-700 dark:text-zinc-300'}`}
      >
        <span className="material-symbols-outlined text-sm shrink-0">{icon}</span>
        <span className="truncate">{selected ? selected[displayKey] : label}</span>
        <span className="material-symbols-outlined text-zinc-400 text-sm ml-auto shrink-0">{open ? 'expand_less' : 'expand_more'}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-zinc-800 border border-outline-variant shadow-xl z-50 overflow-hidden"
             style={{ animation: 'fadeIn 0.15s ease-out' }}>
          {/* Search input */}
          <div className="p-2 border-b border-zinc-100">
            <div className="relative">
              <input
                type="text"
                placeholder={`Tìm ${label.toLowerCase().replace('tất cả ', '')}...`}
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
                className="w-full bg-zinc-50 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 focus:border-primary focus:bg-white dark:focus:bg-zinc-700 h-7 pl-7 pr-2 text-xs font-medium outline-none transition-all rounded-sm placeholder:text-zinc-400 text-on-surface"
              />
              <span className="material-symbols-outlined absolute left-2 top-1.5 text-zinc-400 text-sm pointer-events-none">search</span>
            </div>
          </div>
          {/* Options list */}
          <div className="max-h-52 overflow-y-auto">
            <button
              onClick={() => { onChange(null); setOpen(false); setSearch(''); }}
              className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-surface-container transition-colors flex items-center gap-2
                ${!selectedId ? 'text-primary bg-primary/5' : 'text-zinc-700 dark:text-zinc-300'}`}
            >
              <span className="material-symbols-outlined text-sm">select_all</span>
              {label}
            </button>
            {filtered.length > 0 ? filtered.map(r => (
              <button
                key={r.id}
                onClick={() => { onChange(r.id); setOpen(false); setSearch(''); }}
                className={`w-full text-left px-3 py-2 text-xs font-bold hover:bg-surface-container transition-colors truncate
                  ${selectedId === r.id ? 'text-primary bg-primary/5' : 'text-zinc-700 dark:text-zinc-300'}`}
              >
                {r[displayKey]}
              </button>
            )) : (
              <div className="px-3 py-3 text-xs text-zinc-400 italic text-center">Không tìm thấy kết quả</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const AnalysisDashboard = () => {
  const isMobile = useIsMobile();
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [selectedSkillId, setSelectedSkillId] = useState(null);
  const [expandedChart, setExpandedChart] = useState(null);

  useEffect(() => { injectECharts(); }, []);

  // Fetch filter options
  const { data: rolesRaw } = useRoles();
  const { data: locationsRaw } = useLocations();
  const { data: levelsRaw } = useLevels();
  const { data: skillsRaw } = useSkills();

  const rolesList = rolesRaw?.data || rolesRaw || [];
  const locationsList = locationsRaw?.data || locationsRaw || [];
  const levelsList = levelsRaw?.data || levelsRaw || [];
  const skillsList = skillsRaw?.data || skillsRaw || [];

  // Build filters object
  const filters = {
    roleId: selectedRoleId,
    locationId: selectedLocationId,
    levelId: selectedLevelId,
    skillId: selectedSkillId,
  };

  // Fetch all analytics data in one request (multi-filtered)
  const { data: analyticsRaw, isFetching } = useFilteredAnalytics(filters);
  const analytics = analyticsRaw?.data || analyticsRaw || {};

  const totalJobs = analytics.totalJobs || 0;
  const activeCompanies = analytics.activeCompanies || 0;
  const skills = analytics.skills || [];
  const locations = analytics.locations || [];
  const trend = (analytics.trend || []).map(d => ({
    date: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    count: d.count,
  }));
  const roles = analytics.roles || [];
  const salaryByLevel = analytics.salaryByLevel || [];
  const levels = analytics.levels || [];

  const topSkill = skills[0];
  const topSalary = roles.reduce((best, r) => (r.avg_max && r.avg_max > (best?.avg_max || 0)) ? r : best, null);

  // Active filter badges data
  const activeFilters = [
    selectedRoleId && { key: 'role', label: rolesList.find(r => r.id === selectedRoleId)?.name, clear: () => setSelectedRoleId(null), color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    selectedLocationId && { key: 'location', label: locationsList.find(r => r.id === selectedLocationId)?.city, clear: () => setSelectedLocationId(null), color: 'bg-teal-50 text-teal-700 border-teal-200' },
    selectedLevelId && { key: 'level', label: levelsList.find(r => r.id === selectedLevelId)?.name, clear: () => setSelectedLevelId(null), color: 'bg-orange-50 text-orange-700 border-orange-200' },
    selectedSkillId && { key: 'skill', label: skillsList.find(r => r.id === selectedSkillId)?.name, clear: () => setSelectedSkillId(null), color: 'bg-pink-50 text-pink-700 border-pink-200' },
  ].filter(Boolean);

  const clearAllFilters = () => {
    setSelectedRoleId(null);
    setSelectedLocationId(null);
    setSelectedLevelId(null);
    setSelectedSkillId(null);
  };

  const kpis = [
    { label: 'Tổng việc làm',  value: totalJobs?.toLocaleString(),    icon: 'work',       accent: 'bg-indigo-50 text-indigo-600' },
    { label: 'Kỹ năng #1',     value: topSkill?.name || 'N/A',        icon: 'psychology',  accent: 'bg-teal-50 text-teal-600' },
    { label: 'Công ty tuyển',  value: activeCompanies,                 icon: 'apartment',   accent: 'bg-orange-50 text-orange-600' },
    { label: 'Lương TB cao',   value: topSalary ? formatVND(topSalary.avg_max) : 'N/A', icon: 'payments', accent: 'bg-pink-50 text-pink-600' },
  ];

  // ─── MOBILE LAYOUT (unchanged, scrollable) ──────────────────────────────────
  if (isMobile) {
    return (
      <div className="flex pt-14 md:pt-16 min-h-screen bg-surface">
        {isFetching && <LoadingOverlay message="Đang tải dữ liệu phân tích..." />}
        <main className="flex-1 px-3 py-3 max-w-screen-xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-3">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary mb-0.5 block">Bức tranh CNTT Việt Nam</span>
              <h1 className="text-xl font-headline font-extrabold tracking-tight text-on-surface">Phân tích Thị trường</h1>
            </div>
          </div>

          <div className="mb-3 p-2.5 bg-white dark:bg-zinc-900 border border-outline-variant/30 shadow-sm transition-colors">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="material-symbols-outlined text-primary text-sm">tune</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Bộ lọc</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <FilterDropdown icon="work_outline" label="Tất cả vai trò" items={rolesList} selectedId={selectedRoleId} onChange={setSelectedRoleId} displayKey="name" />
              <FilterDropdown icon="location_on" label="Tất cả địa điểm" items={locationsList.map(l => ({ ...l, name: l.city }))} selectedId={selectedLocationId} onChange={setSelectedLocationId} displayKey="name" />
              <FilterDropdown icon="trending_up" label="Tất cả cấp bậc" items={levelsList} selectedId={selectedLevelId} onChange={setSelectedLevelId} displayKey="name" />
              <FilterDropdown icon="psychology" label="Tất cả kỹ năng" items={skillsList} selectedId={selectedSkillId} onChange={setSelectedSkillId} displayKey="name" />
            </div>
          </div>

          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span className="material-symbols-outlined text-primary text-sm">filter_alt</span>
              {activeFilters.map(f => (
                <span key={f.key} className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] font-bold border rounded-sm ${f.color}`}>
                  {f.label}
                  <button onClick={f.clear} className="hover:opacity-60 transition-opacity ml-0.5">
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </span>
              ))}
              {activeFilters.length > 1 && (
                <button onClick={clearAllFilters} className="text-[10px] font-black uppercase tracking-wider text-zinc-500 hover:text-red-500 flex items-center gap-0.5 transition-colors ml-1">
                  <span className="material-symbols-outlined text-xs">delete_sweep</span> Xóa tất cả
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 mb-3">
            {kpis.map((k, i) => (
              <div key={i} className="bg-surface-container-lowest px-3 py-2.5 flex items-center gap-3 group relative transition-all hover:shadow-md overflow-hidden">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${k.accent}`}>
                  <span className="material-symbols-outlined text-base">{k.icon}</span>
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-on-surface-variant leading-tight truncate">{k.label}</div>
                  <div className="text-sm font-headline font-extrabold tracking-tighter leading-tight truncate">{k.value}</div>
                </div>
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
              </div>
            ))}
          </div>

          <div className="mb-3"><AIInsightsCard filters={filters} /></div>

          <div className="flex flex-col gap-3">
            <SkillsChart data={skills} />
            <LocationsChart data={locations} totalJobs={totalJobs} />
            {trend.length > 0 && <TrendChart data={trend} />}
            <RolesChart data={roles} />
            <SalaryRoleChart data={roles} />
            <SalaryLevelChart data={salaryByLevel} />
            <ExperienceChart data={levels} />
          </div>
          <div className="h-3" />
        </main>
      </div>
    );
  }

  // ─── DESKTOP LAYOUT — Power BI style, viewport-locked ─────────────────────
  return (
    <div className="pt-16 bg-surface dashboard-viewport flex flex-col">
      {isFetching && <LoadingOverlay message="Đang tải dữ liệu phân tích..." />}

      {/* Top bar: Title + Filters + KPIs */}
      <div className="px-3 pt-2 pb-1.5 shrink-0">
        {/* Row 1: Title + Filters inline */}
        <div className="flex items-center gap-4 mb-1.5">
          <h1 className="text-base font-headline font-extrabold tracking-tight text-on-surface whitespace-nowrap shrink-0">
            📊 Phân tích Thị trường
          </h1>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="material-symbols-outlined text-primary text-sm shrink-0">tune</span>
            <div className="flex flex-wrap gap-1.5">
              <FilterDropdown icon="work_outline" label="Vai trò" items={rolesList} selectedId={selectedRoleId} onChange={setSelectedRoleId} displayKey="name" />
              <FilterDropdown icon="location_on" label="Địa điểm" items={locationsList.map(l => ({ ...l, name: l.city }))} selectedId={selectedLocationId} onChange={setSelectedLocationId} displayKey="name" />
              <FilterDropdown icon="trending_up" label="Cấp bậc" items={levelsList} selectedId={selectedLevelId} onChange={setSelectedLevelId} displayKey="name" />
              <FilterDropdown icon="psychology" label="Kỹ năng" items={skillsList} selectedId={selectedSkillId} onChange={setSelectedSkillId} displayKey="name" />
            </div>
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-1 ml-2">
                {activeFilters.map(f => (
                  <span key={f.key} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-bold border rounded-sm ${f.color}`}>
                    {f.label}
                    <button onClick={f.clear} className="hover:opacity-60"><span className="material-symbols-outlined text-[10px]">close</span></button>
                  </span>
                ))}
                {activeFilters.length > 1 && (
                  <button onClick={clearAllFilters} className="text-[9px] font-black text-zinc-400 hover:text-red-500 ml-0.5">✕ All</button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: KPI mini cards */}
        <div className="grid grid-cols-4 gap-2">
          {kpis.map((k, i) => (
            <div key={i} className="bg-surface-container-lowest px-2.5 py-1.5 flex items-center gap-2 group relative overflow-hidden border border-outline-variant/10">
              <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${k.accent}`}>
                <span className="material-symbols-outlined text-sm">{k.icon}</span>
              </div>
              <div className="min-w-0">
                <div className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant leading-tight truncate">{k.label}</div>
                <div className="text-sm font-headline font-extrabold tracking-tighter leading-tight truncate">{k.value}</div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid — fills remaining viewport */}
      <div className="flex-1 min-h-0 px-2 pb-2 grid grid-cols-4 grid-rows-2 gap-1.5"
           style={{ gridTemplateColumns: '1fr 1fr 1fr 0.85fr' }}>
        {/* Row 1 */}
        <SkillsChart data={skills} compact onExpand={() => setExpandedChart('skills')} />
        <LocationsChart data={locations} totalJobs={totalJobs} compact onExpand={() => setExpandedChart('locations')} />
        <TrendChart data={trend} compact onExpand={() => setExpandedChart('trend')} />
        <div className="row-span-2">
          <AIInsightsCard filters={filters} compact />
        </div>

        {/* Row 2 */}
        <RolesChart data={roles} compact onExpand={() => setExpandedChart('roles')} />
        <SalaryRoleChart data={roles} compact onExpand={() => setExpandedChart('salaryRole')} />
        <SalaryLevelChart data={salaryByLevel} compact onExpand={() => setExpandedChart('salaryLevel')} />
      </div>

      {/* Expand Modals */}
      <ExpandModal open={expandedChart === 'skills'} onClose={() => setExpandedChart(null)} title="Top Kỹ năng Phổ biến">
        <SkillsChart data={skills} />
      </ExpandModal>
      <ExpandModal open={expandedChart === 'locations'} onClose={() => setExpandedChart(null)} title="Phân tích theo Địa điểm">
        <LocationsChart data={locations} totalJobs={totalJobs} />
      </ExpandModal>
      <ExpandModal open={expandedChart === 'trend'} onClose={() => setExpandedChart(null)} title="Xu hướng Tuyển dụng">
        <TrendChart data={trend} />
      </ExpandModal>
      <ExpandModal open={expandedChart === 'roles'} onClose={() => setExpandedChart(null)} title="Nhu cầu theo Vai trò">
        <RolesChart data={roles} />
      </ExpandModal>
      <ExpandModal open={expandedChart === 'salaryRole'} onClose={() => setExpandedChart(null)} title="Lương theo Vai trò">
        <SalaryRoleChart data={roles} />
      </ExpandModal>
      <ExpandModal open={expandedChart === 'salaryLevel'} onClose={() => setExpandedChart(null)} title="Lương theo Cấp bậc">
        <SalaryLevelChart data={salaryByLevel} />
      </ExpandModal>
    </div>
  );
};

export default AnalysisDashboard;