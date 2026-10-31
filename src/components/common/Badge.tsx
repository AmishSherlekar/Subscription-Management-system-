import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const normalized = status.toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['active', 'paid', 'converted', 'approved', 'completed'].includes(normalized)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['confirmed'].includes(normalized)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (['partially_paid', 'pending'].includes(normalized)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['paused', 'draft'].includes(normalized)) {
    styles = 'bg-yellow-50 text-yellow-800 border-yellow-200';
  } else if (['overdue', 'cancelled', 'expired', 'rejected', 'failed'].includes(normalized)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['closed', 'archived'].includes(normalized)) {
    styles = 'bg-slate-100 text-slate-600 border-slate-200';
  }

  const label = status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${styles} ${className}`}
    >
      {label}
    </span>
  );
};
