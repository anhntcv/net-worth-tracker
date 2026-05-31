'use client';

import { Suspense, useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { cachedFormatCurrencyEUR } from '@/lib/utils/formatters';
import { getItalyDate } from '@/lib/utils/dateHelpers';
import { getExpenseDate } from '@/lib/utils/expenseHelpers';
import { type Period, periodToRange } from '@/lib/utils/period';
import type { Expense, ExpenseCategory, ExpenseType } from '@/types/expenses';
import type { MultiSelectGroup } from '@/components/ui/multi-select';
import { MobileFiltersDrawer } from '@/components/cashflow/MobileFiltersDrawer';
import { CategoryBreakdownList, type CategoryBreakdownItem } from '@/components/cashflow/CategoryBreakdownList';
import { coverageHealthLabel } from '@/components/cashflow/CashflowHeroCard';
import { MobileExpenseRow, TYPE_DOT_CLASS } from '@/components/cashflow/MobileExpenseRow';
import { getLazyIcon } from '@/components/expenses/IconPickerPopover';

// ─── Shadow tokens ─────────────────────────────────────────────────────────────

// 3D embossed look for the KPI carousel chips.
const CHIP_SHADOW =
  'shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_16px_rgba(0,0,0,0.08),0_12px_28px_rgba(0,0,0,0.05)]' +
  ' dark:shadow-[0_1px_3px_rgba(0,0,0,0.30),0_4px_16px_rgba(0,0,0,0.28),0_12px_28px_rgba(0,0,0,0.20)]';



// ─── Italian type labels ───────────────────────────────────────────────────────

const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  income:   'Entrata',
  fixed:    'Spesa fissa',
  variable: 'Spesa variabile',
  debt:     'Debito',
  transfer: 'Trasferimento',
};

// ─── Transaction Detail Drawer ─────────────────────────────────────────────────

interface TransactionDetailDrawerProps {
  expense: Expense | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  isDemo: boolean;
  categoryMetaMap: Map<string, { icon?: string; color?: string }>;
}

function TransactionDetailDrawer({
  expense,
  onOpenChange,
  onEdit,
  onDelete,
  isDemo,
  categoryMetaMap,
}: Readonly<TransactionDetailDrawerProps>) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!expense) return <Drawer open={false} onOpenChange={onOpenChange}><DrawerContent /></Drawer>;

  const isIncome = expense.type === 'income';
  const isTransfer = expense.type === 'transfer';
  const date = getExpenseDate(expense.date);
  const catMeta = categoryMetaMap.get(expense.categoryId);
  const CatIcon = catMeta?.icon ? getLazyIcon(catMeta.icon) : null;

  const amountLabel = `${isIncome ? '+' : isTransfer ? '' : ''}${cachedFormatCurrencyEUR(Math.abs(expense.amount))}`;

  const details: { label: string; value: string }[] = [
    { label: 'Data', value: format(date, 'd MMMM yyyy', { locale: it }) },
    { label: 'Tipo', value: EXPENSE_TYPE_LABELS[expense.type] },
    { label: 'Categoria', value: expense.categoryName },
  ];

  if (expense.subCategoryName) {
    details.push({ label: 'Sottocategoria', value: expense.subCategoryName });
  }
  if (expense.notes?.trim()) {
    details.push({ label: 'Note', value: expense.notes.trim() });
  }
  if (expense.costCenterName) {
    details.push({ label: 'Centro di costo', value: expense.costCenterName });
  }
  if (expense.isInstallment && expense.installmentNumber && expense.installmentTotal) {
    details.push({
      label: 'Rata',
      value: `${expense.installmentNumber} di ${expense.installmentTotal}${
        expense.installmentTotalAmount
          ? ` (totale ${cachedFormatCurrencyEUR(Math.abs(expense.installmentTotalAmount))})`
          : ''
      }`,
    });
  }
  if (expense.isRecurring && expense.recurringDay) {
    details.push({ label: 'Ricorrenza', value: `Ogni mese, il giorno ${expense.recurringDay}` });
  }
  if (expense.link) {
    details.push({ label: 'Link', value: expense.link });
  }

  return (
    <Drawer open onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        {/* Header: icon + title + amount */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            {CatIcon ? (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: catMeta?.color ? `${catMeta.color}20` : 'var(--muted)' }}
              >
                <Suspense fallback={null}>
                  <CatIcon className="w-4.5 h-4.5" style={{ color: catMeta?.color || 'var(--muted-foreground)' }} aria-hidden="true" />
                </Suspense>
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: catMeta?.color ? `${catMeta.color}20` : 'var(--muted)' }}
              >
                <span className={cn('w-2.5 h-2.5 rounded-full', TYPE_DOT_CLASS[expense.type] ?? 'bg-muted-foreground')} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-lg font-semibold text-foreground truncate">
                {expense.notes?.trim() || expense.categoryName}
              </DrawerTitle>
              <DrawerDescription className="text-sm text-muted-foreground mt-0.5">
                {format(date, 'd MMM yyyy', { locale: it })}
              </DrawerDescription>
            </div>
          </div>
          <p
            className={cn(
              'text-2xl font-bold font-mono tabular-nums mt-4',
              isIncome
                ? 'text-emerald-600 dark:text-emerald-400'
                : isTransfer
                  ? 'text-foreground'
                  : 'text-destructive',
            )}
          >
            {amountLabel}
          </p>
        </div>

        {/* Details list */}
        <div className="px-6 pb-4">
          <div className="rounded-xl bg-muted/40 divide-y divide-border/40">
            {details.map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4 px-4 py-3">
                <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
                <span className="text-sm font-medium text-foreground text-right min-w-0 break-words">
                  {label === 'Link' ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 break-all">
                      {value.length > 40 ? `${value.slice(0, 40)}...` : value}
                    </a>
                  ) : value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-8 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => onEdit(expense)}
            disabled={isDemo}
            aria-label={isDemo ? 'Modifica — non disponibile in modalità demo' : 'Modifica voce'}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Modifica
          </Button>
          <Button
            variant="outline"
            className="flex-1 h-11"
            onClick={() => setConfirmDelete(true)}
            disabled={isDemo}
            aria-label={isDemo ? 'Elimina — non disponibile in modalità demo' : 'Elimina voce'}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Elimina
          </Button>
        </div>
      </DrawerContent>

      {/* Delete confirmation sub-drawer */}
      <Drawer open={confirmDelete} onOpenChange={setConfirmDelete} nested>
        <DrawerContent>
          <div className="px-6 pt-6 pb-8 text-center">
            <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <DrawerTitle className="text-lg font-semibold">Eliminare questa voce?</DrawerTitle>
            <DrawerDescription className="text-sm text-muted-foreground mt-1">
              {expense.notes?.trim() || expense.categoryName} &middot; {cachedFormatCurrencyEUR(Math.abs(expense.amount))}
            </DrawerDescription>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 h-11"
                onClick={() => setConfirmDelete(false)}
              >
                Annulla
              </Button>
              <Button
                variant="destructive"
                className="flex-1 h-11"
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete(expense);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Elimina
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </Drawer>
  );
}

// ─── Local option types (structural match with MobileFiltersDrawer internals) ──

interface SubCategoryOption {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
}

interface AccountOption {
  id: string;
  name: string;
}

type MobileSortKey = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc' | 'category-asc';

// ─── Props ─────────────────────────────────────────────────────────────────────

export interface CashflowTrackingMobileProps {
  // ── Filters (passed through to MobileFiltersDrawer) ──────────────────────────
  period: Period;
  onPeriodChange: (period: Period) => void;
  availableYears: number[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  categoryMultiSelectOptions: MultiSelectGroup[];
  multiSelectValue: string[];
  onCategoryChange: (values: string[]) => void;
  soloSelectedCategory: ExpenseCategory | null;
  subCategoryOptions: SubCategoryOption[];
  selectedSubCategoryId: string;
  onSubCategoryChange: (v: string) => void;
  accountOptions: AccountOption[];
  selectedAccountId: string;
  onAccountChange: (v: string) => void;
  activeFilterCount: number;
  onReset: () => void;

  // ── Hero KPIs ─────────────────────────────────────────────────────────────────
  income: number;
  expenses: number;
  net: number;
  /** Income / expenses coverage ratio; null when expenses === 0. */
  ratio: number | null;
  /** Month-over-month income delta (percentage). */
  incomeDelta?: number | null;
  /** Month-over-month expenses delta (percentage). */
  expensesDelta?: number | null;
  savingsRate: number;
  expenseCategories: CategoryBreakdownItem[];
  incomeCategories: CategoryBreakdownItem[];
  categories: ExpenseCategory[];
  transfers?: number;

  // ── Transaction list ──────────────────────────────────────────────────────────
  /** Full sorted list (not yet sliced). Component handles slicing internally. */
  transactions: Expense[];
  /** Total count before slicing, used for load-more display. */
  totalCount: number;
  showCount: number;
  onLoadMore: () => void;
  mobileSortKey: MobileSortKey;
  onSortChange: (key: MobileSortKey) => void;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  pendingDeleteId: string | null;
  isDemo: boolean;
  hasActiveFilters: boolean;
  onAddExpense: () => void;
  /** Map of categoryId → { icon?, color? } for row icon badges. */
  categoryMetaMap: Map<string, { icon?: string; color?: string }>;

  className?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function CashflowTrackingMobile({
  // Filters
  period,
  onPeriodChange,
  availableYears,
  searchQuery,
  onSearchChange,
  categoryMultiSelectOptions,
  multiSelectValue,
  onCategoryChange,
  soloSelectedCategory,
  subCategoryOptions,
  selectedSubCategoryId,
  onSubCategoryChange,
  accountOptions,
  selectedAccountId,
  onAccountChange,
  activeFilterCount,
  onReset,
  // KPIs
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
  // Transactions
  transactions,
  totalCount,
  showCount,
  onLoadMore,
  mobileSortKey,
  onSortChange,
  onEdit,
  onDelete,
  pendingDeleteId,
  isDemo,
  hasActiveFilters,
  onAddExpense,
  categoryMetaMap,
  className,
}: Readonly<CashflowTrackingMobileProps>) {
  const [catDrawerOpen, setCatDrawerOpen] = useState(false);
  const [catView, setCatView] = useState<'expense' | 'income'>('expense');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // ── Derived values ────────────────────────────────────────────────────────────

  const ratioLabel = ratio !== null ? coverageHealthLabel(ratio) : null;
  const ratioDisplay = ratio !== null ? `${ratio.toFixed(2)}×` : '—';

  // Slice visible transactions for the list.
  const sliced = useMemo(() => transactions.slice(0, showCount), [transactions, showCount]);

  // Group sliced transactions by day when sorting by date; otherwise render flat.
  const dateGroups = useMemo(() => {
    const isDateSort = mobileSortKey === 'date-desc' || mobileSortKey === 'date-asc';
    if (!isDateSort) {
      return [{ label: null as string | null, items: sliced }];
    }

    const todayDate = getItalyDate(new Date());
    const yesterdayDate = subDays(todayDate, 1);
    const todayStr = format(todayDate, 'yyyy-MM-dd');
    const yesterdayStr = format(yesterdayDate, 'yyyy-MM-dd');

    const groupMap = new Map<string, Expense[]>();
    for (const expense of sliced) {
      const key = format(getExpenseDate(expense.date), 'yyyy-MM-dd');
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(expense);
    }

    return Array.from(groupMap.entries()).map(([key, items]) => {
      let label: string;
      if (key === todayStr) {
        label = 'Oggi';
      } else if (key === yesterdayStr) {
        label = 'Ieri';
      } else {
        const [y, m, d] = key.split('-').map(Number);
        label = format(new Date(y, m - 1, d), 'EEE d MMM', { locale: it });
      }
      return { label, items };
    });
  }, [sliced, mobileSortKey]);

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
    <div className={cn('pt-3 space-y-3', className)}>

      {/* ── 1. Page title + count + add button ───────────────────────────── */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Le tue spese</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
            {totalCount} risultati
          </p>
        </div>
        <Button
          size="sm"
          onClick={onAddExpense}
          disabled={isDemo}
          aria-label={isDemo ? 'Aggiungi — non disponibile in modalità demo' : 'Aggiungi voce'}
          title={isDemo ? 'Non disponibile in modalità demo' : undefined}
          className="flex-shrink-0 h-9"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Aggiungi
        </Button>
      </div>

      {/* ── 2. Filter bar: [spacer] [periodo] [filtri] [sort] ──────────────── */}
      <MobileFiltersDrawer
        period={period}
        onPeriodChange={onPeriodChange}
        availableYears={availableYears}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        categoryMultiSelectOptions={categoryMultiSelectOptions}
        multiSelectValue={multiSelectValue}
        onCategoryChange={onCategoryChange}
        soloSelectedCategory={soloSelectedCategory}
        subCategoryOptions={subCategoryOptions}
        selectedSubCategoryId={selectedSubCategoryId}
        onSubCategoryChange={onSubCategoryChange}
        accountOptions={accountOptions}
        selectedAccountId={selectedAccountId}
        onAccountChange={onAccountChange}
        activeFilterCount={activeFilterCount}
        onReset={onReset}
        mobileSortKey={mobileSortKey}
        onSortChange={v => onSortChange(v as MobileSortKey)}
        sortOptions={[
          { value: 'date-desc',     label: 'Più recente',     shortLabel: 'Recente' },
          { value: 'date-asc',      label: 'Meno recente',    shortLabel: 'Meno rec.' },
          { value: 'amount-desc',   label: 'Importo maggiore', shortLabel: '€ decr.' },
          { value: 'amount-asc',    label: 'Importo minore',  shortLabel: '€ cresc.' },
          { value: 'category-asc',  label: 'Categoria A→Z',  shortLabel: 'Cat. A→Z' },
        ]}
      />

      {/* ── 3. KPI carousel — naked chips with 3D shadow, no outer Card ────── */}
      {/*       Negative margin lets chips bleed to the page edge on small screens */}
      <div className="-mx-4 sm:-mx-6">
        <div
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-8 sm:px-10 pt-2 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="list"
          aria-label="Riepilogo cashflow"
        >
          {/* Entrate */}
          <div
            role="listitem"
            className={cn('snap-start shrink-0 w-40 bg-card rounded-2xl p-4 ring-1 ring-border/20 ml-2', CHIP_SHADOW)}
          >
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Entrate</p>
            <p className="text-[21px] font-bold font-mono tabular-nums mt-1.5 leading-none text-emerald-600 dark:text-emerald-400">
              {cachedFormatCurrencyEUR(income)}
            </p>
            {incomeDelta !== null && incomeDelta !== undefined ? (
              <p className={cn('text-[11px] font-medium mt-1.5 leading-none', incomeDelta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
                {incomeDelta >= 0 ? '↑' : '↓'} {Math.abs(incomeDelta).toFixed(1)}% vs mese prec.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-none opacity-50">vs mese prec.</p>
            )}
          </div>

          {/* Spese */}
          <div
            role="listitem"
            className={cn('snap-start shrink-0 w-40 bg-card rounded-2xl p-4 ring-1 ring-border/20', CHIP_SHADOW)}
          >
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Spese</p>
            <p className="text-[21px] font-bold font-mono tabular-nums mt-1.5 leading-none text-destructive">
              {cachedFormatCurrencyEUR(Math.abs(expenses))}
            </p>
            {expensesDelta !== null && expensesDelta !== undefined ? (
              <p className={cn('text-[11px] font-medium mt-1.5 leading-none', expensesDelta <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
                {expensesDelta >= 0 ? '↑' : '↓'} {Math.abs(expensesDelta).toFixed(1)}% vs mese prec.
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-none opacity-50">vs mese prec.</p>
            )}
          </div>

          {/* Risparmio Netto */}
          <div
            role="listitem"
            className={cn('snap-start shrink-0 w-40 bg-card rounded-2xl p-4 ring-1 ring-border/20', CHIP_SHADOW)}
          >
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Risparmio Netto</p>
            <p className={cn(
              'text-[21px] font-bold font-mono tabular-nums mt-1.5 leading-none',
              net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive',
            )}>
              {net >= 0 ? '+' : ''}{cachedFormatCurrencyEUR(net)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-none">
              Tasso {savingsRate.toFixed(1)}%
            </p>
          </div>

          {/* Rapporto */}
          <div
            role="listitem"
            className={cn('snap-start shrink-0 w-40 bg-card rounded-2xl p-4 ring-1 ring-border/20', CHIP_SHADOW)}
          >
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Rapporto</p>
            <p className={cn(
              'text-[21px] font-bold font-mono tabular-nums mt-1.5 leading-none',
              ratio !== null && ratio >= 1
                ? 'text-emerald-600 dark:text-emerald-400'
                : ratio !== null
                  ? 'text-destructive'
                  : 'text-foreground',
            )}>
              {ratioDisplay}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-none">
              {ratioLabel ?? 'Nessun dato'}
            </p>
          </div>

          {/* Categorie — opens drawer */}
          <button
            type="button"
            role="listitem"
            onClick={() => setCatDrawerOpen(true)}
            className={cn(
              'snap-start shrink-0 w-40 bg-card rounded-2xl p-4 ring-1 ring-border/20 text-left',
              'active:scale-[0.97] transition-transform duration-100',
              CHIP_SHADOW,
            )}
            aria-label="Apri dettaglio categorie"
          >
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Categorie</p>
            <p className="text-[21px] font-bold tabular-nums mt-1.5 leading-none text-foreground">
              {expenseCategories.length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-none">Vedi dettaglio →</p>
          </button>
        </div>
      </div>

      {/* ── 4. Transaction list ─────────────────────────────────────────────── */}
      {transactions.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Nessuna voce trovata</p>
          <p className="text-sm text-muted-foreground mt-2">
            {hasActiveFilters
              ? 'Nessun risultato per i filtri applicati. Prova ad azzerare i filtri.'
              : 'Usa il pulsante Aggiungi per inserire la prima voce'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {dateGroups.map((group, idx) => (
            <div key={group.label ?? idx}>
              {/* Date group header */}
              {group.label !== null && (
                <p className="text-[11px] font-medium text-muted-foreground/60 uppercase tracking-widest pl-1 mb-2">
                  {group.label}
                </p>
              )}

              {/* Grouped card — all rows for this date in a single container */}
              <div className="bg-card rounded-2xl overflow-hidden ring-1 ring-border/10">
                <div className="divide-y divide-border/40">
                  {group.items.map(expense => {
                    const catMeta = categoryMetaMap.get(expense.categoryId);
                    return (
                      <div key={expense.id} className="px-2">
                        <MobileExpenseRow
                          expense={expense}
                          onSelect={setSelectedExpense}
                          categoryIcon={catMeta?.icon}
                          categoryColor={catMeta?.color}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Load more */}
          {showCount < totalCount && (
            <div className="pt-2 text-center">
              <Button variant="outline" size="sm" onClick={onLoadMore}>
                Carica altri {Math.min(20, totalCount - showCount)}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                {showCount} di {totalCount} voci
              </p>
            </div>
          )}
        </div>
      )}
    </div>

    {/* ── Transaction detail drawer ─────────────────────────────────── */}
    <TransactionDetailDrawer
      expense={selectedExpense}
      onOpenChange={open => { if (!open) setSelectedExpense(null); }}
      onEdit={expense => { setSelectedExpense(null); onEdit(expense); }}
      onDelete={expense => { setSelectedExpense(null); onDelete(expense); }}
      isDemo={isDemo}
      categoryMetaMap={categoryMetaMap}
    />

    {/* ── Categories drawer — outside space-y-5 to avoid phantom gap ─── */}
    <Drawer open={catDrawerOpen} onOpenChange={setCatDrawerOpen}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>
            Categorie · {format(periodToRange(period).from, 'MMM yyyy', { locale: it })}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Breakdown delle categorie per il periodo selezionato
          </DrawerDescription>
        </DrawerHeader>

        {/* Spese / Entrate toggle */}
        <div className="flex gap-1 mx-4 mb-3 bg-muted rounded-lg p-1" role="tablist" aria-label="Tipo di voci">
          <button
            type="button"
            role="tab"
            aria-selected={catView === 'expense'}
            onClick={() => setCatView('expense')}
            className={cn(
              'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
              catView === 'expense'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Spese
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={catView === 'income'}
            onClick={() => setCatView('income')}
            className={cn(
              'flex-1 rounded-md py-1.5 text-sm font-medium transition-colors',
              catView === 'income'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Entrate
          </button>
        </div>

        <div className="overflow-y-auto px-4 pb-8">
          <CategoryBreakdownList
            items={catView === 'expense' ? expenseCategories : incomeCategories}
            categories={categories}
          />
        </div>
      </DrawerContent>
    </Drawer>
    </>
  );
}
