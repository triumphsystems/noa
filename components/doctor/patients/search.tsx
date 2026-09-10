'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PatientsSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  totalCount: number;
  withConditionsCount: number;
}

export function PatientsSearch({
  searchTerm,
  onSearchChange,
  totalCount,
  withConditionsCount,
}: PatientsSearchProps) {
  return (
    <div className="space-y-3">
      {/* Search Input */}
      <Card className="flex items-center gap-3 p-2 px-4">
        <Search className="text-slate h-5 w-5 shrink-0" />
        <input
          type="text"
          placeholder="Search patients by name or email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="text-deep-ink placeholder-slate w-full bg-transparent py-2 text-base focus:outline-none sm:text-sm"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => onSearchChange('')}
            className="text-slate hover:text-deep-ink"
          >
            Clear
          </Button>
        )}
      </Card>

      {/* Patient Stats Badges */}
      <div className="flex flex-wrap gap-2.5 sm:gap-3">
        <Badge variant="secondary" className="px-3 py-1.5 text-xs font-medium sm:px-4">
          Total Patients: {totalCount}
        </Badge>
        <Badge variant="success" className="px-3 py-1.5 text-xs font-medium sm:px-4">
          With Conditions: {withConditionsCount}
        </Badge>
      </div>
    </div>
  );
}
