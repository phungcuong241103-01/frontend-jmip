import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getStats, getJobs, getAnalyticsSalaryByRole,
  getAnalyticsLevels, getAnalyticsTrend, getAnalyticsRoles
} from '../services/api';

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
  confine: true, // keeps tooltip inside chart on mobile
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
const Card = ({ children }) => (
  <div className="bg-white border border-outline-variant/20 shadow-sm mb-4 md:mb-6">
    {children}
  </div>
);

const CardHeader = ({ title, subtitle, right }) => (
  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 px-4 pt-4 pb-0 md:px-6 md:pt-5">
    <div className="min-w-0">
      <h2 className="text-base md:text-2xl font-headline font-extrabold tracking-tight leading-tight">{title}</h2>
      {subtitle && <p className="text-[11px] md:text-sm text-on-surface-variant mt-0.5 leading-snug">{subtitle}</p>}
    </div>
    {right && <div className="shrink-0 mt-1 sm:mt-0">{right}</div>}
  </div>
);

const ViewToggle = ({ options, value, onChange }) => (
  <div className="flex border border-outline-variant overflow-hidden">
    {options.map(([v, icon, label]) => (
      <button key={v} onClick={() => onChange(v)}
        className={`flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide transition-colors
          ${value === v ? 'bg-primary text-white' : 'hover:bg-surface-container text-zinc-600'}`}>
        <span className="material-symbols-outlined text-[16px] leading-none">{icon}</span>
        <span className="hidden sm:inline">{label}</span>
      </button>
    ))}
  </div>
);

const SearchInput = ({ value, onChange, placeholder = 'Tìm kiếm...' }) => (
  <div className="relative">
    <input type="text" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)}
      className="w-full bg-surface-container-lowest border-b-2 border-zinc-200 focus:border-primary h-10 pl-3 pr-8 text-sm font-bold outline-none transition-all placeholder:font-normal" />
    <span className="material-symbols-outlined absolute right-2 top-2 text-zinc-400 text-[18px] pointer-events-none">search</span>
  </div>
);

const Pagination = ({ page, total, onChange }) => {
  if (total <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-1.5 mt-3 pt-3 border-t border-zinc-100">
      <button onClick={() => onChange(0)} disabled={page === 0}
        className="w-7 h-7 flex items-center justify-center text-[11px] font-black border border-outline-variant disabled:opacity-30 hover:bg-surface-container rounded-sm">«</button>
      <button onClick={() => onChange(Math.max(0, page - 1))} disabled={page === 0}
        className="w-7 h-7 flex items-center justify-center border border-outline-variant disabled:opacity-30 hover:bg-surface-container rounded-sm">
        <span className="material-symbols-outlined text-sm">chevron_left</span>
      </button>
      <span className="text-[11px] font-black text-zinc-500 tracking-widest uppercase min-w-[56px] text-center">
        {page + 1}/{total}
      </span>
      <button onClick={() => onChange(Math.min(total - 1, page + 1))} disabled={page === total - 1}
        className="w-7 h-7 flex items-center justify-center border border-outline-variant disabled:opacity-30 hover:bg-surface-container rounded-sm">
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
      <button onClick={() => onChange(total - 1)} disabled={page === total - 1}
        className="w-7 h-7 flex items-center justify-center text-[11px] font-black border border-outline-variant disabled:opacity-30 hover:bg-surface-container rounded-sm">»</button>
    </div>
  );
};

const Empty = ({ msg = 'Không có dữ liệu.' }) => (
  <div className="flex flex-col items-center justify-center py-10 text-zinc-400">
    <span className="material-symbols-outlined text-3xl mb-1 opacity-40">search_off</span>
    <p className="text-sm italic">{msg}</p>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SKILLS — horizontal bar, paginated
// ═══════════════════════════════════════════════════════════════════════════════
const SkillsChart = ({ data }) => {
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const PAGE = isMobile ? 15 : 20;
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');

  const filtered = data.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / PAGE);
  // reversed so highest rank appears at top of chart
  const slice = filtered.slice(page * PAGE, (page + 1) * PAGE).slice().reverse();

  const lm = isMobile ? 88 : 130; // left margin

  useECharts(ref, () => slice.length === 0 ? null : ({
    tooltip: {
      ...mkTooltip(), trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (p) => `<b>${p[0].name}</b><br/>${p[0].value} jobs`,
    },
    grid: { left: lm, right: isMobile ? 36 : 52, top: 6, bottom: 4, containLabel: false },
    xAxis: {
      type: 'value',
      axisLabel: { fontSize: isMobile ? 9 : 10, color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: slice.map(s => isMobile ? trunc(s.name, 11) : s.name),
      axisLabel: { fontSize: isMobile ? 10 : 11, fontWeight: 600, color: '#334155', width: lm - 6, overflow: 'truncate' },
      axisLine: { show: false }, axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: slice.map((s, i) => {
        // top-3 global = last 3 in reversed slice when on page 0
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
      label: { show: !isMobile, position: 'right', formatter: '{c}', fontSize: 10, color: '#64748b', fontWeight: 700 },
      barMaxWidth: isMobile ? 14 : 20,
    }],
  }), [JSON.stringify(slice), isMobile]);

  const chartH = Math.max(isMobile ? 220 : 280, slice.length * (isMobile ? 24 : 28));

  return (
    <Card>
      <CardHeader title="Top Kỹ năng Phổ biến" subtitle={`${filtered.length} kỹ năng · theo số tin tuyển dụng`} />
      <div className="px-4 md:px-6 pt-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(0); }} placeholder="Tìm kỹ năng..." />
      </div>
      <div className="px-1 md:px-3 py-2">
        {slice.length > 0
          ? <div ref={ref} style={{ width: '100%', height: chartH }} />
          : <Empty msg="Không tìm thấy kỹ năng phù hợp." />
        }
      </div>
      <div className="px-4 md:px-6 pb-4">
        <Pagination page={page} total={totalPages} onChange={setPage} />
        {page === 0 && search === '' && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-zinc-100">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 self-center mr-1">Hot:</span>
            {data.slice(0, isMobile ? 3 : 5).map((s, i) => (
              <span key={s.name} className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wide
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
// 2. LOCATIONS — bar / treemap toggle
// ═══════════════════════════════════════════════════════════════════════════════
const LocationsChart = ({ data, totalJobs }) => {
  const barRef = useRef(null);
  const treeRef = useRef(null);
  const isMobile = useIsMobile();
  const [view, setView] = useState('bar');
  const [search, setSearch] = useState('');

  const filtered = data.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));
  const lm = isMobile ? 78 : 110;

  useECharts(barRef, () => view !== 'bar' || filtered.length === 0 ? null : ({
    tooltip: {
      ...mkTooltip(), trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (p) => {
        const pct = totalJobs > 0 ? ((p[0].value / totalJobs) * 100).toFixed(1) : 0;
        return `<b>${p[0].name}</b><br/>${p[0].value} jobs <span style="opacity:.6">(${pct}%)</span>`;
      },
    },
    grid: { left: lm, right: isMobile ? 36 : 52, top: 6, bottom: 4, containLabel: false },
    xAxis: {
      type: 'value',
      axisLabel: { fontSize: isMobile ? 9 : 10, color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: [...filtered].reverse().map(l => isMobile ? trunc(l.name, 9) : l.name),
      axisLabel: { fontSize: isMobile ? 10 : 11, fontWeight: 600, color: '#334155', width: lm - 4, overflow: 'truncate' },
      axisLine: { show: false }, axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: [...filtered].reverse().map((l, i) => ({
        value: parseInt(l.count),
        itemStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: i >= filtered.length - 3
              ? [{ offset: 0, color: '#14b8a6' }, { offset: 1, color: '#2dd4bf' }]
              : [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#a5b4fc' }],
          }, borderRadius: [0, 3, 3, 0],
        },
      })),
      label: { show: !isMobile, position: 'right', formatter: '{c}', fontSize: 10, color: '#64748b', fontWeight: 700 },
      barMaxWidth: isMobile ? 13 : 20,
    }],
  }), [JSON.stringify(filtered), view, isMobile]);

  useECharts(treeRef, () => view !== 'treemap' || filtered.length === 0 ? null : ({
    tooltip: {
      ...mkTooltip(),
      formatter: (p) => {
        const pct = totalJobs > 0 ? ((p.value / totalJobs) * 100).toFixed(1) : 0;
        return `<b>${p.name}</b><br/>${p.value} jobs · ${pct}%`;
      },
    },
    series: [{
      type: 'treemap',
      data: filtered.map((l, i) => ({
        name: l.name, value: parseInt(l.count),
        itemStyle: { color: MULTI[i % MULTI.length], borderColor: '#fff', borderWidth: 2 },
      })),
      label: {
        show: true,
        formatter: (p) => isMobile ? p.name : `${p.name}\n${p.value}`,
        fontSize: isMobile ? 9 : 11, fontWeight: 700, color: '#fff',
      },
      breadcrumb: { show: false }, roam: false, nodeClick: false,
      width: '100%', height: '100%',
    }],
  }), [JSON.stringify(filtered), view, isMobile]);

  const barH = Math.max(isMobile ? 180 : 280, filtered.length * (isMobile ? 22 : 26));

  return (
    <Card>
      <CardHeader
        title="Phân tích theo Địa điểm"
        subtitle={`${filtered.length} tỉnh/thành · top khu vực tuyển dụng`}
        right={<ViewToggle options={[['bar','bar_chart','Cột'],['treemap','grid_view','Map']]} value={view} onChange={setView} />}
      />
      <div className="px-4 md:px-6 pt-3">
        <SearchInput value={search} onChange={v => setSearch(v)} placeholder="Tìm địa điểm..." />
      </div>
      <div className="px-1 md:px-3 py-2">
        {filtered.length > 0 ? (
          <div style={{ position: 'relative', width: '100%', height: view === 'treemap' ? (isMobile ? 260 : 360) : barH }}>
            <div ref={barRef} style={{ width: '100%', height: '100%', display: view === 'bar' ? 'block' : 'none' }} />
            <div ref={treeRef} style={{ width: '100%', height: '100%', display: view === 'treemap' ? 'block' : 'none' }} />
          </div>
        ) : <Empty msg="Không tìm thấy địa điểm phù hợp." />}
      </div>
      <div className="h-2" />
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. TREND — area line
// ═══════════════════════════════════════════════════════════════════════════════
const TrendChart = ({ data }) => {
  const ref = useRef(null);
  const isMobile = useIsMobile();

  useECharts(ref, () => data.length === 0 ? null : ({
    tooltip: {
      ...mkTooltip(), trigger: 'axis',
      formatter: (p) => `<b>${p[0].axisValue}</b><br/>${p[0].value} tin đăng`,
    },
    grid: { left: 8, right: 8, top: 10, bottom: 6, containLabel: true },
    xAxis: {
      type: 'category', data: data.map(d => d.date), boundaryGap: false,
      axisLabel: {
        fontSize: isMobile ? 9 : 10, color: '#94a3b8',
        rotate: isMobile && data.length > 12 ? -45 : 0,
        interval: isMobile ? Math.floor(data.length / 5) : 'auto',
      },
      axisLine: { lineStyle: { color: '#e2e8f0' } }, axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: isMobile ? 9 : 10, color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false },
    },
    series: [{
      type: 'line', smooth: true,
      data: data.map(d => d.count),
      lineStyle: { color: '#6366f1', width: 2.5 },
      itemStyle: { color: '#6366f1' },
      areaStyle: {
        color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [{ offset: 0, color: 'rgba(99,102,241,0.22)' }, { offset: 1, color: 'rgba(99,102,241,0)' }] },
      },
      symbol: 'circle', symbolSize: isMobile ? 3 : 5,
      emphasis: { itemStyle: { symbolSize: 8, borderWidth: 3, borderColor: '#fff', shadowBlur: 8, shadowColor: '#6366f1' } },
    }],
  }), [JSON.stringify(data), isMobile]);

  if (!data.length) return null;

  return (
    <Card>
      <CardHeader title="Xu hướng Tuyển dụng" subtitle="Số lượng tin đăng theo thời gian" />
      <div className="px-1 md:px-3 py-3">
        <div ref={ref} style={{ width: '100%', height: isMobile ? 190 : 250 }} />
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. ROLES — column bar (desktop) / horizontal bar (mobile) / radar
// ═══════════════════════════════════════════════════════════════════════════════
const RolesChart = ({ data }) => {
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const [view, setView] = useState('bar');

  useECharts(ref, () => {
    if (!data.length) return null;

    if (view === 'radar') {
      const maxCount = Math.max(...data.map(r => r.job_count), 1);
      return {
        tooltip: { ...mkTooltip(), trigger: 'item' },
        radar: {
          indicator: data.map(r => ({ name: isMobile ? trunc(r.role, 9) : r.role, max: maxCount })),
          splitArea: { areaStyle: { color: ['#f8faff', '#f1f5ff'] } },
          axisName: { fontSize: isMobile ? 9 : 10, fontWeight: 700, color: '#475569' },
          splitLine: { lineStyle: { color: '#e2e8f0' } },
          radius: isMobile ? '55%' : '65%',
        },
        series: [{
          type: 'radar',
          data: [{ value: data.map(r => r.job_count), name: 'Số việc làm',
            areaStyle: { color: 'rgba(99,102,241,0.18)' },
            lineStyle: { color: '#6366f1', width: 2 }, itemStyle: { color: '#6366f1' } }],
        }],
      };
    }

    if (isMobile) {
      // horizontal bar on mobile — avoids rotated labels
      return {
        tooltip: { ...mkTooltip(), trigger: 'axis', axisPointer: { type: 'shadow' },
          formatter: (p) => `<b>${p[0].name}</b><br/>${p[0].value} jobs` },
        grid: { left: 96, right: 36, top: 6, bottom: 4, containLabel: false },
        xAxis: { type: 'value', axisLabel: { fontSize: 9, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false } },
        yAxis: {
          type: 'category',
          data: [...data].reverse().map(r => trunc(r.role, 12)),
          axisLabel: { fontSize: 10, fontWeight: 600, color: '#334155' },
          axisLine: { show: false }, axisTick: { show: false },
        },
        series: [{
          type: 'bar',
          data: [...data].reverse().map((r, i) => ({
            value: r.job_count,
            itemStyle: { color: MULTI[(data.length - 1 - i) % MULTI.length], borderRadius: [0, 3, 3, 0] },
          })),
          barMaxWidth: 16,
        }],
      };
    }

    // desktop vertical bar
    return {
      tooltip: { ...mkTooltip(), trigger: 'axis', axisPointer: { type: 'shadow' },
        formatter: (p) => `<b>${p[0].name}</b><br/>${p[0].value} jobs` },
      grid: { left: 12, right: 12, top: 20, bottom: 72, containLabel: true },
      xAxis: {
        type: 'category', data: data.map(r => r.role),
        axisLabel: { fontSize: 10, fontWeight: 600, rotate: -30, color: '#475569', interval: 0, width: 80, overflow: 'truncate' },
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
        label: { show: true, position: 'top', formatter: '{c}', fontSize: 11, fontWeight: 700, color: '#334155' },
        barMaxWidth: 44,
      }],
    };
  }, [JSON.stringify(data), view, isMobile]);

  const h = isMobile
    ? (view === 'radar' ? 240 : Math.max(180, data.length * 26))
    : (view === 'radar' ? 340 : 340);

  return (
    <Card>
      <CardHeader
        title="Nhu cầu Việc làm theo Vai trò"
        subtitle="Số tin tuyển dụng theo từng vai trò công nghệ"
        right={<ViewToggle options={[['bar','bar_chart','Cột'],['radar','radar','Radar']]} value={view} onChange={setView} />}
      />
      <div className="px-1 md:px-3 py-3">
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
const SalaryRoleChart = ({ data }) => {
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
    legend: { data: ['Min','Max'], top: 2, right: 4, textStyle: { fontSize: 10, fontWeight: 600 }, itemWidth: 10, itemHeight: 8 },
    grid: { left: 8, right: 8, top: 30, bottom: isMobile ? 56 : 72, containLabel: true },
    xAxis: {
      type: 'category',
      data: items.map(r => isMobile ? trunc(r.role, 9) : r.role),
      axisLabel: { fontSize: isMobile ? 9 : 10, rotate: isMobile ? -40 : -25, color: '#475569', interval: 0, fontWeight: 600, width: isMobile ? 56 : 80, overflow: 'truncate' },
      axisTick: { show: false }, axisLine: { lineStyle: { color: '#e2e8f0' } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: isMobile ? 9 : 10, color: '#94a3b8', formatter: v => formatVND(v) },
      splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false },
    },
    series: [
      { name: 'Min', type: 'bar', data: items.map(r => r.avg_min), itemStyle: { color: '#a5b4fc', borderRadius: [3,3,0,0] }, barMaxWidth: isMobile ? 18 : 30 },
      { name: 'Max', type: 'bar', data: items.map(r => r.avg_max), itemStyle: { color: '#6366f1', borderRadius: [3,3,0,0] }, barMaxWidth: isMobile ? 18 : 30 },
    ],
  }), [JSON.stringify(items), isMobile]);

  if (!items.length) return null;

  return (
    <Card>
      <CardHeader title="Phân tích Lương theo Vai trò" subtitle="Mức lương min–max theo vai trò (tin có số liệu)" />
      <div className="px-1 md:px-3 py-3">
        <div ref={ref} style={{ width: '100%', height: isMobile ? 240 : 300 }} />
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. SALARY BY LEVEL — horizontal grouped bar
// ═══════════════════════════════════════════════════════════════════════════════
const SalaryLevelChart = ({ data }) => {
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const items = Array.isArray(data) ? data.filter(r => r.avg_min && r.avg_max) : [];
  const lm = isMobile ? 76 : 118;

  useECharts(ref, () => items.length === 0 ? null : ({
    tooltip: {
      ...mkTooltip(), trigger: 'axis', axisPointer: { type: 'shadow' },
      formatter: (params) => {
        const name = params[0].name;
        const min = params.find(p => p.seriesName === 'Min')?.value || 0;
        const max = params.find(p => p.seriesName === 'Max')?.value || 0;
        const jobs = items.find(r => r.role === name)?.job_count || '';
        return `<b>${name}</b><br/>Min: ${formatVND(min)}<br/>Max: ${formatVND(max)}<br/><span style="opacity:.6">${jobs} jobs</span>`;
      },
    },
    legend: { data: ['Min','Max'], top: 0, right: 4, textStyle: { fontSize: 10, fontWeight: 600 }, itemWidth: 10, itemHeight: 8 },
    grid: { left: lm, right: isMobile ? 44 : 60, top: 24, bottom: 4, containLabel: false },
    yAxis: {
      type: 'category',
      data: [...items].reverse().map(r => isMobile ? trunc(r.role, 10) : r.role),
      axisLabel: { fontSize: isMobile ? 10 : 11, fontWeight: 600, color: '#334155' },
      axisLine: { show: false }, axisTick: { show: false },
    },
    xAxis: {
      type: 'value',
      axisLabel: { fontSize: isMobile ? 9 : 10, color: '#94a3b8', formatter: v => formatVND(v) },
      splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false },
    },
    series: [
      { name: 'Min', type: 'bar', data: [...items].reverse().map(r => r.avg_min), itemStyle: { color: '#fcd34d', borderRadius: [0,3,3,0] }, barMaxWidth: isMobile ? 12 : 18 },
      { name: 'Max', type: 'bar', data: [...items].reverse().map(r => r.avg_max), itemStyle: { color: '#f59e0b', borderRadius: [0,3,3,0] }, barMaxWidth: isMobile ? 12 : 18 },
    ],
  }), [JSON.stringify(items), isMobile]);

  return (
    <Card>
      <CardHeader title="Lương trung bình theo Cấp bậc" subtitle="Bỏ qua tin thỏa thuận, tính từ tin có số liệu" />
      <div className="px-1 md:px-3 py-3">
        {items.length > 0
          ? <div ref={ref} style={{ width: '100%', height: Math.max(isMobile ? 150 : 190, items.length * (isMobile ? 34 : 42)) }} />
          : <Empty msg="Không có dữ liệu lương." />
        }
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. EXPERIENCE — donut / bar toggle
// ═══════════════════════════════════════════════════════════════════════════════
const ExperienceChart = ({ data }) => {
  const donutRef = useRef(null);
  const barRef = useRef(null);
  const isMobile = useIsMobile();
  const [view, setView] = useState('donut');
  const items = Array.isArray(data) ? data : [];
  const lm = isMobile ? 84 : 110;

  useECharts(donutRef, () => view !== 'donut' || !items.length ? null : ({
    tooltip: { ...mkTooltip(), trigger: 'item', formatter: (p) => `<b>${p.name}</b><br/>${p.value} vị trí · ${p.percent.toFixed(1)}%` },
    legend: {
      orient: isMobile ? 'horizontal' : 'vertical',
      [isMobile ? 'bottom' : 'right']: isMobile ? 0 : 8,
      top: isMobile ? 'auto' : 'middle',
      textStyle: { fontSize: isMobile ? 10 : 11, fontWeight: 600 },
      itemWidth: 10, itemHeight: 10,
    },
    series: [{
      type: 'pie', radius: ['38%', '65%'],
      center: isMobile ? ['50%', '40%'] : ['35%', '50%'],
      data: items.map((l, i) => ({ name: l.level, value: l.job_count, itemStyle: { color: MULTI[i % MULTI.length] } })),
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.14)' } },
    }],
  }), [JSON.stringify(items), view, isMobile]);

  useECharts(barRef, () => view !== 'bar' || !items.length ? null : ({
    tooltip: { ...mkTooltip(), trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: (p) => `<b>${p[0].name}</b><br/>${p[0].value} vị trí` },
    grid: { left: lm, right: isMobile ? 52 : 64, top: 6, bottom: 4, containLabel: false },
    xAxis: { type: 'value', axisLabel: { fontSize: 9, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } }, axisLine: { show: false } },
    yAxis: {
      type: 'category', data: [...items].reverse().map(l => l.level),
      axisLabel: { fontSize: isMobile ? 10 : 11, fontWeight: 600, color: '#334155' },
      axisLine: { show: false }, axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: [...items].reverse().map((l, i) => ({
        value: l.job_count,
        itemStyle: { color: MULTI[(items.length - 1 - i) % MULTI.length], borderRadius: [0,3,3,0] },
      })),
      label: { show: true, position: 'right', formatter: (p) => `${p.value} vị trí`, fontSize: isMobile ? 9 : 10, color: '#64748b', fontWeight: 700 },
      barMaxWidth: isMobile ? 14 : 20,
    }],
  }), [JSON.stringify(items), view, isMobile]);

  return (
    <Card>
      <CardHeader
        title="Phân tích Kinh nghiệm"
        subtitle="Số lượng vị trí theo từng cấp bậc"
        right={<ViewToggle options={[['donut','donut_large','Donut'],['bar','bar_chart','Cột']]} value={view} onChange={setView} />}
      />
      <div className="px-1 md:px-3 py-3">
        {items.length > 0 ? (
          <div style={{ position: 'relative', width: '100%', height: isMobile ? 260 : 290 }}>
            <div ref={donutRef} style={{ width:'100%', height:'100%', display: view === 'donut' ? 'block' : 'none' }} />
            <div ref={barRef} style={{ width:'100%', height:'100%', display: view === 'bar' ? 'block' : 'none' }} />
          </div>
        ) : <Empty msg="Không có dữ liệu kinh nghiệm." />}
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const AnalysisDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [salaryByRole, setSalaryByRole] = useState([]);
  const [levelStats, setLevelStats] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [roleStats, setRoleStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    injectECharts();
    const fetchData = async () => {
      try {
        const [statsData, jobsData, salaryData, levelsData, trendRes, rolesRes] = await Promise.all([
          getStats(),
          getJobs({ limit: 4 }),
          getAnalyticsSalaryByRole().catch(err => { console.error(err); return { data: [] }; }),
          getAnalyticsLevels().catch(err => { console.error(err); return { data: [] }; }),
          getAnalyticsTrend().catch(err => { console.error(err); return { data: [] }; }),
          getAnalyticsRoles().catch(err => { console.error(err); return { data: [] }; }),
        ]);
        setStats(statsData);
        setRecentJobs(jobsData.jobs || []);
        setSalaryByRole(salaryData?.data || salaryData || []);
        setLevelStats(levelsData?.data || levelsData || []);
        setTrendData((trendRes?.data || trendRes || []).map(d => ({
          date: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
          count: d.count,
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
    return (
      <div className="pt-20 flex flex-col items-center justify-center gap-3 text-gray-500 min-h-screen">
        <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="font-bold text-sm">Đang tải dữ liệu phân tích...</p>
      </div>
    );
  }

  const topSalaryRole = Array.isArray(salaryByRole) && salaryByRole.length > 0 ? salaryByRole[0] : null;

  const kpis = [
    { label: 'Tổng việc làm',  value: stats.totalJobs?.toLocaleString(),            sub: stats.growthRate,                      icon: 'work'       },
    { label: 'Kỹ năng #1',     value: stats.popularSkills?.[0]?.name || 'N/A',      sub: `${stats.popularSkills?.[0]?.count || 0} jobs`, icon: 'psychology' },
    { label: 'Công ty tuyển',  value: stats.activeCompanies,                         sub: 'Đang tuyển dụng',                     icon: 'apartment'  },
    { label: 'Lương TB cao',   value: topSalaryRole ? formatVND(topSalaryRole.avg_max) : 'N/A', sub: topSalaryRole?.role || '—', icon: 'payments'   },
  ];

  return (
    <div className="flex pt-14 md:pt-16 min-h-screen bg-surface">
      <main className="flex-1 px-3 py-4 md:px-8 md:py-8 max-w-screen-xl mx-auto w-full">

        {/* Header */}
        <div className="mb-4 md:mb-8">
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary mb-1 block">
            Bức tranh CNTT Toàn cầu
          </span>
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-headline font-extrabold tracking-tight text-on-surface">
            Bảng điều khiển<br className="sm:hidden" /> Phân tích
          </h1>
        </div>

        {/* KPI — 2 col mobile, 4 col desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
          {kpis.map((k, i) => (
            <div key={i} className="bg-surface-container-lowest px-3 py-3 md:p-5 flex flex-col justify-between h-20 md:h-28 group relative transition-all hover:shadow-md overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-on-surface-variant leading-tight pr-1 line-clamp-2">
                  {k.label}
                </span>
                <span className="material-symbols-outlined text-primary text-base md:text-xl shrink-0">{k.icon}</span>
              </div>
              <div>
                <div className="text-base md:text-2xl font-headline font-extrabold tracking-tighter leading-tight truncate">{k.value}</div>
                <div className="text-[9px] md:text-[10px] text-tertiary font-bold mt-0.5 truncate">{k.sub}</div>
              </div>
              <div className="absolute bottom-0 left-0 w-1 h-0 group-hover:h-full bg-primary transition-all duration-300" />
            </div>
          ))}
        </div>

        {/* Charts */}
        <SkillsChart data={stats.popularSkills || []} />
        <LocationsChart data={stats.locationStats || []} totalJobs={stats.totalJobs || 1} />
        {trendData.length > 0 && <TrendChart data={trendData} />}
        <RolesChart data={roleStats} />
        <SalaryRoleChart data={roleStats} />
        <SalaryLevelChart data={salaryByRole} />
        <ExperienceChart data={levelStats} />

        {/* Recent Jobs */}
        <section className="mt-2 mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base md:text-xl font-headline font-extrabold tracking-tight text-on-surface">
              Việc làm mới nhất
            </h2>
            <button onClick={() => navigate('/find-job')}
              className="text-[11px] font-bold text-primary uppercase tracking-widest border-b border-primary pb-0.5 hover:opacity-80 shrink-0">
              Xem thêm →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {recentJobs.map((job, i) => (
              <div key={i}
                onClick={() => job.url ? window.open(job.url, '_blank') : navigate('/find-job')}
                className="bg-surface-container-lowest p-3 md:p-5 border border-outline-variant/10 flex flex-col gap-2 md:gap-3 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99] touch-manipulation">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm md:text-base leading-snug line-clamp-2">{job.title}</h4>
                    <p className="text-[11px] md:text-xs text-on-surface-variant font-medium mt-0.5 truncate">
                      {job.company_name} · {job.city}
                    </p>
                  </div>
                  <span className="shrink-0 bg-secondary-container text-on-secondary-container text-[9px] px-1.5 py-0.5 font-black uppercase">MỚI</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {job.skills?.slice(0, isMobile ? 2 : 3).map(tag => (
                    <span key={tag} className="bg-surface-container-low px-1.5 py-0.5 text-[9px] font-bold uppercase">{tag}</span>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm font-bold">
                    {job.salary_min != null
                      ? `${formatVND(job.salary_min)}${job.salary_max ? ' – ' + formatVND(job.salary_max) : ''}`
                      : 'Thỏa thuận'}
                  </span>
                  <div className="flex items-center gap-2">
                    {job.url && !isMobile && (
                      <a href={job.url} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-zinc-500 hover:text-primary uppercase tracking-widest">
                        <span className="material-symbols-outlined text-xs">link</span>
                        {(() => { try { return new URL(job.url).hostname.replace('www.', ''); } catch { return 'Nguồn'; } })()}
                      </a>
                    )}
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Chi tiết</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Safe area bottom for mobile */}
        <div className="h-4 md:h-0" />
      </main>
    </div>
  );
};

export default AnalysisDashboard;