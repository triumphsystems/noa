'use client';

import React from 'react';

interface SummariesFilterProps {
  filterStatus: 'all' | 'completed' | 'active';
  onFilterChange: (status: 'all' | 'completed' | 'active') => void;
}

export function SummariesFilter({
  filterStatus,
  onFilterChange,
}: SummariesFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {(['all', 'completed', 'active'] as const).map((status) => (
        <button
          key={status}
          onClick={() => onFilterChange(status)}
          className={`shrink-0 cursor-pointer rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors sm:px-5 ${
            filterStatus === status
              ? 'bg-hi-yellow text-deep-ink shadow-2xs'
              : 'bg-soft-meadow text-deep-ink/80 hover:bg-soft-meadow/80'
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  );
}
