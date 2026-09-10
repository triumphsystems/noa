'use client';

import * as React from 'react';
import { Tabs as TabsPrimitive } from '@base-ui/react/tabs';

import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

function TabsList({
  className,
  ...props
}: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'bg-soft-meadow border-deep-ink/8 inline-flex items-center gap-1 rounded-xl border p-1 text-xs select-none',
        className
      )}
      {...props}
    />
  );
}

function TabsTab({
  className,
  ...props
}: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      className={cn(
        'text-slate hover:text-deep-ink inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all outline-none disabled:pointer-events-none disabled:opacity-50 data-[selected]:border-deep-ink/8 data-[selected]:text-deep-ink data-[selected]:border data-[selected]:bg-white data-[selected]:font-semibold data-[selected]:shadow-2xs focus-visible:ring-2 focus-visible:ring-deep-ink/20',
        className
      )}
      {...props}
    />
  );
}

function TabsPanel({
  className,
  ...props
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn(
        'mt-3 focus-visible:ring-2 focus-visible:ring-deep-ink/20 focus-visible:outline-none',
        className
      )}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTab, TabsPanel };
