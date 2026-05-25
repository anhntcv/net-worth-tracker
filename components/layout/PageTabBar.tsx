'use client';

import type { ElementType } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';

export type TabDef = {
  value: string;
  label: string;
  shortLabel?: string;
  icon?: ElementType;
};

const colsMap: Record<number, string> = {
  2: 'desktop:grid-cols-2',
  3: 'desktop:grid-cols-3',
  4: 'desktop:grid-cols-4',
  5: 'desktop:grid-cols-5',
  6: 'desktop:grid-cols-6',
};

interface PageTabBarProps {
  tabs: TabDef[];
  value: string;
  onValueChange: (v: string) => void;
  layoutId: string;
  className?: string;
}

export function PageTabBar({ tabs, value, onValueChange, layoutId, className }: PageTabBarProps) {
  const colsCls = colsMap[tabs.length] ?? '';
  return (
    <>
      <div className={cn('desktop:hidden mb-4', className)}>
        <div role="tablist" className="inline-flex w-full rounded-lg border bg-muted p-1 gap-0.5">
          {tabs.map(({ value: tv, label, shortLabel, icon: Icon }) => {
            const isActive = value === tv;
            return (
              <button
                key={tv}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onValueChange(tv)}
                className={cn(
                  'relative flex flex-1 items-center justify-center gap-1 rounded-md px-1.5 py-2 text-xs font-medium transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId={layoutId}
                    className="absolute inset-0 rounded-md bg-background shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                  />
                )}
                {Icon && <Icon className="relative z-10 h-3.5 w-3.5 shrink-0" />}
                <span className="relative z-10">{shortLabel ?? label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <TabsList className={cn('hidden desktop:grid w-full mb-4', colsCls)}>
        {tabs.map(({ value: tv, label, icon: Icon }) => (
          <TabsTrigger key={tv} value={tv} className="flex items-center gap-2">
            {Icon && <Icon className="h-4 w-4" />}
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </>
  );
}
