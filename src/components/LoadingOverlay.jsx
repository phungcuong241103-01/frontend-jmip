import React from 'react';

/**
 * LoadingOverlay — Dark semi-transparent overlay with spinner + message.
 * 
 * Usage:
 *   <LoadingOverlay />                         — full-screen overlay (default)
 *   <LoadingOverlay fullScreen={false} />       — relative to parent container
 *   <LoadingOverlay message="Custom text..." /> — custom message
 */
const LoadingOverlay = ({
  message = 'Đang tải dữ liệu...',
  fullScreen = true,
}) => {
  const base = fullScreen
    ? 'fixed inset-0 z-[9999]'
    : 'absolute inset-0 z-50 rounded-inherit';

  return (
    <div className={`${base} flex flex-col items-center justify-center bg-zinc-900/50 backdrop-blur-[2px]`}
         style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="flex flex-col items-center gap-3 px-6 py-5 bg-white/95 border border-zinc-200 shadow-2xl rounded-lg">
        <div className="relative w-9 h-9">
          <div className="absolute inset-0 border-[3px] border-zinc-200 rounded-full" />
          <div className="absolute inset-0 border-[3px] border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <span className="text-xs font-bold text-zinc-700 tracking-wide">{message}</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
