'use client';

import { Suspense } from 'react';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { cachedFormatCurrencyEUR } from '@/lib/utils/formatters';
import { getLazyIcon } from '@/components/expenses/IconPickerPopover';
import { getExpenseDate } from '@/lib/utils/expenseHelpers';
import type { Expense, ExpenseType } from '@/types/expenses';

// Tailwind dot-color classes keyed by expense type.
// All entries use semantic token references to stay theme-aware across all 6 colour themes.
const TYPE_DOT_CLASS: Record<ExpenseType, string> = {
  income:   'bg-emerald-500 dark:bg-emerald-400',
  fixed:    'bg-[var(--chart-2)]',
  variable: 'bg-[var(--chart-4)]',
  debt:     'bg-[var(--chart-3)]',
  transfer: 'bg-[var(--chart-5)]',
};

export interface MobileExpenseRowProps {
  expense: Expense;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  isPendingDelete: boolean;
  isDemo: boolean;
  categoryIcon?: string;
  categoryColor?: string;
}

/**
 * Flat list row for mobile expense display (Trade Republic divide-y style).
 *
 * Interaction pattern:
 * - Tapping the row body toggles an inline action area (Modifica + Elimina).
 * - Elimina reuses the parent's 2-click arm pattern — isPendingDelete drives
 *   the visual "confirm" state; actual logic lives in the parent handler.
 */
export function MobileExpenseRow({
  expense,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  isPendingDelete,
  isDemo,
  categoryIcon,
  categoryColor,
}: MobileExpenseRowProps) {
  const date = getExpenseDate(expense.date);
  const isIncome = expense.type === 'income';
  const isTransfer = expense.type === 'transfer';

  const shortDate = format(date, 'd/M');

  const subtitle = [expense.categoryName, expense.subCategoryName || null, shortDate]
    .filter(Boolean)
    .join(' · ');

  const title = expense.notes?.trim() || expense.categoryName;

  const amountLabel = `${isIncome ? '+' : isTransfer ? '' : ''}${cachedFormatCurrencyEUR(Math.abs(expense.amount))}`;

  return (
    <div className="py-3">
      {/* Tappable row */}
      <button
        type="button"
        className="w-full flex items-center gap-3 text-left"
        onClick={() => onToggleExpand(expense.id)}
        aria-expanded={isExpanded}
      >
        {/* Category icon badge or type dot */}
        {(() => {
          const CatIcon = categoryIcon ? getLazyIcon(categoryIcon) : null;
          if (CatIcon) {
            return (
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: categoryColor ? `${categoryColor}20` : 'var(--muted)' }}
              >
                <Suspense fallback={<span className={cn('w-2 h-2 rounded-full', TYPE_DOT_CLASS[expense.type] ?? 'bg-muted-foreground')} />}>
                  <CatIcon className="w-3.5 h-3.5" style={{ color: categoryColor || 'var(--muted-foreground)' }} aria-hidden="true" />
                </Suspense>
              </div>
            );
          }
          return (
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: categoryColor ? `${categoryColor}20` : 'var(--muted)' }}
            >
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', TYPE_DOT_CLASS[expense.type] ?? 'bg-muted-foreground')} />
            </div>
          );
        })()}

        {/* Title + badges + subtitle */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[14px] font-medium text-foreground truncate">{title}</span>
            {expense.isInstallment && expense.installmentNumber && expense.installmentTotal && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                {expense.installmentNumber}/{expense.installmentTotal}
              </Badge>
            )}
            {expense.isRecurring && !expense.isInstallment && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 flex-shrink-0">
                Ric.
              </Badge>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground truncate mt-0.5">{subtitle}</p>
        </div>

        {/* Amount — emerald for income, destructive for expenses, muted for transfers */}
        <span
          className={cn(
            'text-[14px] font-bold font-mono tabular-nums flex-shrink-0',
            isIncome
              ? 'text-emerald-600 dark:text-emerald-400'
              : isTransfer
                ? 'text-muted-foreground'
                : 'text-destructive',
          )}
        >
          {amountLabel}
        </span>
      </button>

      {/* Inline action area — animated height 0 → auto on expand */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="actions"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="flex gap-2 mt-3 pl-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(expense)}
                disabled={isDemo}
                aria-label={isDemo ? 'Modifica — non disponibile in modalità demo' : 'Modifica voce'}
                className="flex-1 h-9"
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Modifica
              </Button>
              {/* Delete: first tap arms (destructive style), second tap confirms */}
              <Button
                variant={isPendingDelete ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => onDelete(expense)}
                disabled={isDemo}
                aria-label={isDemo ? 'Elimina — non disponibile in modalità demo' : 'Elimina voce'}
                className="flex-1 h-9"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                {isPendingDelete ? 'Conferma' : 'Elimina'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
