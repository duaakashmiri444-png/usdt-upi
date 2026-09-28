import React from 'react';
import { useApp } from '../context/AppContext';
import { Bell } from 'lucide-react';

export const NoticeBanner: React.FC = () => {
  const { supportConfig } = useApp();

  if (!supportConfig.isNoticeActive || !supportConfig.noticeBanner) return null;

  return (
    <div className="bg-emerald-950/40 border-b border-emerald-900/40 px-4 py-2 text-xs text-emerald-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden">
          <Bell className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <p className="truncate font-medium">{supportConfig.noticeBanner}</p>
        </div>
        <div className="shrink-0 text-[11px] text-emerald-400/80 font-mono hidden sm:block">
          {supportConfig.workingHours}
        </div>
      </div>
    </div>
  );
};
