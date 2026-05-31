'use client';

import { Suspense, useMemo } from 'react';
import { useChartColors } from '@/lib/hooks/useChartColors';
import { cachedFormatCurrencyEUR } from '@/lib/utils/formatters';
import { getLazyIcon } from '@/components/expenses/IconPickerPopover';
import type { ExpenseCategory } from '@/types/expenses';

export interface CategoryBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

// Module-level component required by the React Compiler — getLazyIcon calls React.lazy()
// which must never be called inside a render function or map callback.
function CategoryIconBadge({
  iconName,
  color,
  fallbackColor,
}: {
  iconName: string;
  color?: string;
  fallbackColor: string;
}) {
  const Icon = getLazyIcon(iconName);
  if (!Icon) {
    return (
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: color || fallbackColor }}
      />
    );
  }
  return (
    <div
      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: color ? `${color}20` : 'var(--muted)' }}
    >
      <Suspense
        fallback={
          <div className="w-2 h-2 rounded-full" style={{ background: fallbackColor }} />
        }
      >
        <Icon className="w-3 h-3" style={{ color: color || fallbackColor }} aria-hidden="true" />
      </Suspense>
    </div>
  );
}

interface Props {
  /** Category summary rows to render. */
  items: CategoryBreakdownItem[];
  /** Full category list used to resolve icon + color by name. */
  categories: ExpenseCategory[];
}

/**
 * Renders a list of category breakdown rows: icon/dot · name · % · amount · progress bar.
 * Shared between the dashboard Cashflow widget and the ExpenseTrackingTab hero card.
 */
export function CategoryBreakdownList({ items, categories }: Props) {
  const chartColors = useChartColors();

  // name → { icon?, color? } — resolved once per categories change.
  const metaByName = useMemo(
    () => new Map(categories.map(c => [c.name, { icon: c.icon, color: c.color }])),
    [categories]
  );

  return (
    <div className="space-y-3">
      {items.map((cat, i) => {
        const meta = metaByName.get(cat.category);
        // Use category color if set; otherwise cycle through theme chart colors.
        const color = meta?.color || chartColors[i % chartColors.length] || `var(--chart-${(i % 5) + 1})`;
        return (
          <div key={cat.category} className="space-y-1">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 min-w-0">
                {meta?.icon ? (
                  <CategoryIconBadge iconName={meta.icon} color={meta.color} fallbackColor={color} />
                ) : (
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                )}
                <span className="text-[13px] text-foreground truncate">{cat.category}</span>
              </div>
              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  {Math.round(cat.percentage)}%
                </span>
                <span className="text-[13px] font-mono tabular-nums text-foreground">
                  {cachedFormatCurrencyEUR(cat.amount, true)}
                </span>
              </div>
            </div>
            <div
              className="h-[3px] bg-muted rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.round(cat.percentage)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${cat.category}: ${Math.round(cat.percentage)}%`}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${cat.percentage}%`, background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
