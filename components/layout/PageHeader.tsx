import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: React.ReactNode;
  label?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, label, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('pb-4 border-b border-border', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          {label && (
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">
              {label}
            </p>
          )}
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
          {description && <p className="mt-1 text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
