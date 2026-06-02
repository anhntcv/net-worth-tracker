'use client';

import { useState } from 'react';
import { ChevronDown, ArrowLeftRight } from 'lucide-react';
import { cachedFormatCurrencyEUR } from '@/lib/utils/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  CategoryBreakdownList,
  type CategoryBreakdownItem,
} from '@/components/cashflow/CategoryBreakdownList';
import { CashflowKpiCarousel } from '@/components/cashflow/cashflow-kpi/CashflowKpiCarousel';
import type { ExpenseCategory } from '@/types/expenses';

// Coverage ratio → Italian health label.
export function coverageHealthLabel(ratio: number): string {
  if (ratio >= 2.0) return 'Salute ottima';
  if (ratio >= 1.3) return 'Salute buona';
  if (ratio >= 1.0) return 'In pareggio';
  return 'In deficit';
}

function getDeltaColor(delta: number | null | undefined, invert = false) {
  if (delta == null || delta === 0) return 'text-muted-foreground';
  const positive = invert ? delta < 0 : delta > 0;
  return positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive';
}

function getDeltaArrow(delta: number) {
  if (delta > 0) return '↑';
  if (delta < 0) return '↓';
  return '→';
}

export interface CashflowWidgetProps {
  /** Period label shown in the card header (e.g. "MAGGIO 2026"). */
  monthLabel: string;
  income: number;
  expenses: number;
  net: number;
  /** Income / expenses ratio; null when expenses === 0. */
  ratio: number | null;
  /** Month-over-month income delta (percentage). Null when no comparison is available. */
  incomeDelta?: number | null;
  /** Month-over-month expenses delta (percentage). Null when no comparison is available. */
  expensesDelta?: number | null;
  savingsRate: number;
  expenseCategories: CategoryBreakdownItem[];
  incomeCategories: CategoryBreakdownItem[];
  /** Full expense category list — used by CategoryBreakdownList for label + icon lookup. */
  categories: ExpenseCategory[];
  /** Optional internal transfers total shown as a separate row on desktop. */
  transfers?: number;
  className?: string;
}

export function CashflowWidget({
  monthLabel,
  income,
  expenses,
  net,
  ratio,
  incomeDelta,
  expensesDelta,
  savingsRate,
  expenseCategories,
  incomeCategories,
  categories,
  transfers,
  className,
}: Readonly<CashflowWidgetProps>) {
  const [catsExpanded, setCatsExpanded] = useState(false);

  return (
    <Card className={cn('py-0', className)}>
      <CardContent className="p-5">
        {/* Header eyebrow */}
        <p className="text-muted-foreground mb-3 text-[10px] font-semibold tracking-[0.1em] uppercase">
          Cashflow · {monthLabel}
        </p>

        {/* ── MOBILE only: Embla carousel ── */}
        <div className="tablet:hidden">
          <CashflowKpiCarousel
            className="-mx-5"
            income={income}
            expenses={expenses}
            net={net}
            ratio={ratio}
            incomeDelta={incomeDelta}
            expensesDelta={expensesDelta}
            savingsRate={savingsRate}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
            categories={categories}
          />
        </div>

        {/* ── TABLET / DESKTOP: 2×2 KPI grid ── */}
        <div className="tablet:grid hidden grid-cols-2 gap-px overflow-hidden rounded-xl border border-border">
          {/* Entrate */}
          <div className="bg-card p-3">
            <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
              Entrate
            </p>
            <p className="text-[18px] font-bold tabular-nums text-emerald-600 dark:text-emerald-400 leading-tight">
              {cachedFormatCurrencyEUR(income)}
            </p>
            {incomeDelta != null ? (
              <p className={cn('mt-0.5 text-[11px] font-medium leading-none', getDeltaColor(incomeDelta))}>
                {getDeltaArrow(incomeDelta)} {Math.abs(incomeDelta).toFixed(1)}% vs prec.
              </p>
            ) : (
              <p className="text-muted-foreground mt-0.5 text-[11px] leading-none opacity-50">vs mese prec.</p>
            )}
          </div>

          {/* Spese */}
          <div className="bg-card p-3">
            <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
              Spese
            </p>
            <p className="text-[18px] font-bold tabular-nums text-destructive leading-tight">
              {cachedFormatCurrencyEUR(expenses)}
            </p>
            {expensesDelta != null ? (
              <p className={cn('mt-0.5 text-[11px] font-medium leading-none', getDeltaColor(expensesDelta, true))}>
                {getDeltaArrow(expensesDelta)} {Math.abs(expensesDelta).toFixed(1)}% vs prec.
              </p>
            ) : (
              <p className="text-muted-foreground mt-0.5 text-[11px] leading-none opacity-50">vs mese prec.</p>
            )}
          </div>

          {/* Netto */}
          <div className="bg-card border-t border-border p-3">
            <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
              Netto
            </p>
            <p className={cn(
              'text-[18px] font-bold tabular-nums leading-tight',
              net > 0 ? 'text-emerald-600 dark:text-emerald-400' : net < 0 ? 'text-destructive' : 'text-muted-foreground'
            )}>
              {cachedFormatCurrencyEUR(net)}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px] leading-none">
              {savingsRate.toFixed(1)}% risparmio
            </p>
          </div>

          {/* Rapporto */}
          <div className="bg-card border-t border-border p-3">
            <p className="text-muted-foreground mb-1 text-[10px] font-semibold tracking-[0.08em] uppercase">
              Rapporto
            </p>
            {ratio != null ? (
              <>
                <p className="text-[18px] font-bold tabular-nums leading-tight">
                  ×{ratio.toFixed(1)}
                </p>
                <p className="text-muted-foreground mt-0.5 text-[11px] leading-none">
                  {coverageHealthLabel(ratio)}
                </p>
              </>
            ) : (
              <p className="text-muted-foreground text-[18px] font-bold leading-tight">—</p>
            )}
          </div>
        </div>

        {/* ── Shared section (tablet+): transfers + category breakdown ── */}
        <div className="tablet:block hidden">
          <div className="border-border mt-4 border-t" />

          {/* Transfers summary row */}
          {transfers !== undefined && transfers > 0 && (
            <div className="mt-3 flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.06em] uppercase">
                <ArrowLeftRight className="h-3 w-3" />
                Trasferimenti
              </span>
              <span className="text-muted-foreground text-[13px] font-medium tabular-nums">
                {cachedFormatCurrencyEUR(transfers)}
              </span>
            </div>
          )}

          {/* Toggle button — hidden on desktop, collapsible on tablet */}
          <button
            type="button"
            className="text-muted-foreground desktop:hidden mt-3 flex w-full items-center justify-between text-[11px] font-semibold tracking-[0.06em] uppercase"
            onClick={() => setCatsExpanded((v) => !v)}
            aria-expanded={catsExpanded}
          >
            <span>Voci per categorie</span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200 motion-reduce:transition-none',
                catsExpanded && 'rotate-180',
              )}
            />
          </button>
          <p className="text-muted-foreground desktop:block hidden mt-3 text-[11px] font-semibold tracking-[0.06em] uppercase">
            Voci per categorie
          </p>

          <div className={cn('mt-3 grid gap-y-4', !catsExpanded && 'desktop:block hidden')}>
            <div>
              <p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-[0.06em] uppercase">
                Spese per Categoria
              </p>
              <CategoryBreakdownList items={expenseCategories} categories={categories} />
            </div>
            <div>
              <p className="text-muted-foreground mb-3 text-[11px] font-semibold tracking-[0.06em] uppercase">
                Entrate per Categoria
              </p>
              <CategoryBreakdownList items={incomeCategories} categories={categories} />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
