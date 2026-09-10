'use client';

import React from 'react';
import Link from 'next/link';
import { FileEdit, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function DoctorQuickActions() {
  return (
    <Card className="bg-white">
      <CardHeader className="pb-3">
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link href="/dashboard/doctor/sessions/new" className="block">
            <Button className="h-10 w-full gap-2 rounded-lg py-2.5 text-xs font-semibold">
              <Plus className="h-4 w-4" />
              Start New Session
            </Button>
          </Link>
          <Link href="/dashboard/doctor/patients" className="block">
            <Button
              variant="outline"
              className="h-10 w-full gap-2 rounded-lg py-2.5 text-xs font-medium"
            >
              <Search className="h-4 w-4" />
              Search Patients
            </Button>
          </Link>
          <Link href="/dashboard/doctor/summaries" className="block">
            <Button
              variant="outline"
              className="h-10 w-full gap-2 rounded-lg py-2.5 text-xs font-medium"
            >
              <FileEdit className="h-4 w-4" />
              Review Summaries
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
