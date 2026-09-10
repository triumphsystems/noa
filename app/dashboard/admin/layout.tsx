import * as React from 'react';
import { requireServerAuth } from '@/lib/auth/server';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireServerAuth(['admin']);

  return <div className="bg-canvas text-deep-ink min-h-screen">{children}</div>;
}
