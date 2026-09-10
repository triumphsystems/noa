import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

interface AdminToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  specialties: string[];
  specialtyFilter: string;
  onSpecialtyChange: (s: string) => void;
  sortBy: 'newest' | 'oldest' | 'name';
  onSortChange: (sort: 'newest' | 'oldest' | 'name') => void;
  activeTab: 'pending' | 'verified' | 'rejected' | 'all';
  onTabChange: (tab: 'pending' | 'verified' | 'rejected' | 'all') => void;
  counts: {
    pending: number;
    verified: number;
    rejected: number;
    total: number;
  };
  filteredCount: number;
  onReset: () => void;
}

export function AdminToolbar({
  searchQuery,
  onSearchChange,
  specialties,
  specialtyFilter,
  onSpecialtyChange,
  sortBy,
  onSortChange,
  activeTab,
  onTabChange,
  counts,
  filteredCount,
  onReset,
}: AdminToolbarProps) {
  const tabs = [
    { id: 'pending', label: 'Pending', count: counts.pending },
    { id: 'verified', label: 'Verified', count: counts.verified },
    { id: 'rejected', label: 'Rejected', count: counts.rejected },
    { id: 'all', label: 'All', count: counts.total },
  ] as const;

  return (
    <div className="border-deep-ink/8 shadow-editorial space-y-3.5 rounded-2xl border bg-white p-4">
      <div className="flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center">
        {/* Search Input with Clear Button */}
        <div className="relative max-w-md flex-1">
          <Search className="text-slate absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, clinic, license #, or care code..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-deep-ink/10 bg-canvas focus:ring-deep-ink/20 text-deep-ink placeholder:text-slate/60 w-full rounded-xl border py-2 pr-9 pl-10 text-sm transition-all focus:bg-white focus:ring-2 focus:outline-none"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onSearchChange('')}
              className="text-slate hover:text-deep-ink absolute top-1/2 right-2.5 -translate-y-1/2"
              title="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {specialties.length > 0 && (
            <div className="w-36">
              <Select
                value={specialtyFilter}
                onChange={(e) => onSpecialtyChange(e.target.value)}
                aria-label="Filter by specialty"
              >
                <option value="all">All Specialties</option>
                {specialties.map((spec) => (
                  <option key={spec} value={spec}>
                    {spec}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <div className="w-40">
            <Select
              value={sortBy}
              onChange={(e) =>
                onSortChange(e.target.value as 'newest' | 'oldest' | 'name')
              }
              aria-label="Sort order"
            >
              <option value="newest">Newest Registered</option>
              <option value="oldest">Oldest Registered</option>
              <option value="name">Name (A-Z)</option>
            </Select>
          </div>

          {/* Segmented Status Tabs */}
          <div className="bg-soft-meadow border-deep-ink/8 flex w-full scrollbar-none gap-1 overflow-x-auto rounded-xl border p-1 sm:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-all',
                  activeTab === tab.id
                    ? 'text-deep-ink border-deep-ink/8 border bg-white font-semibold shadow-2xs'
                    : 'text-slate hover:text-deep-ink'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'py-0.2 rounded-full px-1.5 text-[10px]',
                    activeTab === tab.id
                      ? 'bg-soft-meadow text-deep-ink font-bold'
                      : 'bg-deep-ink/5 text-slate'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Summary Subtext */}
      <div className="text-slate border-deep-ink/6 flex items-center justify-between border-t pt-1 text-xs">
        <span>
          Showing <strong className="text-deep-ink">{filteredCount}</strong>{' '}
          {filteredCount === 1 ? 'clinician' : 'clinicians'}
          {searchQuery && ` matching "${searchQuery}"`}
          {activeTab !== 'all' && ` with status "${activeTab}"`}
        </span>
        {(searchQuery ||
          specialtyFilter !== 'all' ||
          activeTab !== 'all') && (
          <Button
            variant="link"
            size="xs"
            onClick={onReset}
            className="text-deep-ink font-semibold"
          >
            Reset filters
          </Button>
        )}
      </div>
    </div>
  );
}