'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Loader2, Stethoscope, Building2 } from 'lucide-react';
import {
  searchDoctors,
  type SanitizedDoctorDirectoryItem,
} from '@/app/dashboard/patient/actions';

interface DoctorDirectorySearchProps {
  onConnect: (doctorId: string) => Promise<void>;
  isSubmitting: boolean;
}

export function DoctorDirectorySearch({
  onConnect,
  isSubmitting,
}: DoctorDirectorySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SanitizedDoctorDirectoryItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await searchDoctors(searchQuery.trim());
      if (res.success && res.data) {
        setSearchResults(res.data);
      } else {
        setSearchResults([]);
      }
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="text-slate absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by doctor name, specialty, or clinic..."
            className="pl-9"
          />
        </div>
        <Button
          type="submit"
          disabled={isSearching}
          variant="outline"
          className="border-deep-ink/15 shrink-0 cursor-pointer rounded-xl px-4 text-xs font-medium"
        >
          {isSearching ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            'Search'
          )}
        </Button>
      </form>

      <div className="divide-deep-ink/5 max-h-64 divide-y overflow-y-auto pr-1">
        {isSearching ? (
          <div className="text-slate py-8 text-center text-xs">
            Searching provider directory...
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-slate py-8 text-center text-xs">
            {hasSearched
              ? 'No doctors found matching your query.'
              : 'Enter a name or clinic to search providers.'}
          </div>
        ) : (
          searchResults.map((doc) => (
            <div
              key={doc.id}
              className="hover:bg-soft-meadow/20 flex items-center justify-between gap-3 rounded-lg px-2 py-3 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-deep-ink truncate text-xs font-semibold sm:text-sm">
                    Dr. {doc.name}
                  </h4>
                  {doc.careCode && (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px]"
                    >
                      {doc.careCode}
                    </Badge>
                  )}
                </div>
                <div className="text-slate mt-0.5 flex items-center gap-3 text-[11px]">
                  {doc.specialty && (
                    <span className="flex items-center gap-1">
                      <Stethoscope className="h-3 w-3" />
                      {doc.specialty}
                    </span>
                  )}
                  {doc.clinic && (
                    <span className="flex items-center gap-1 truncate">
                      <Building2 className="h-3 w-3" />
                      {doc.clinic}
                    </span>
                  )}
                </div>
              </div>

              <Button
                onClick={() => onConnect(doc.id)}
                disabled={isSubmitting}
                className="bg-deep-ink text-canvas hover:bg-deep-ink/90 h-auto shrink-0 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium shadow-2xs"
              >
                Connect
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
