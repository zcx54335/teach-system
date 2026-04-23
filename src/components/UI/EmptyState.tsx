import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none transition-colors ${className}`}>
      <div className="w-20 h-20 rounded-full bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-gold-600 dark:text-gold-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-widest mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed mb-6">
          {description}
        </p>
      )}
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
};
