'use client';

import * as React from 'react';
import { useToastStore, ToastType } from '@/stores/toast.store';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-owtlet-ink shrink-0" />,
  error: <AlertCircle className="h-5 w-5 text-destructive shrink-0" />,
  info: <Info className="h-5 w-5 text-owtlet-ink shrink-0" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning-foreground shrink-0" />,
};

const styleMap: Record<ToastType, string> = {
  success: 'bg-owtlet-mint border-owtlet-ink text-owtlet-ink shadow-lg',
  error: 'bg-destructive/10 border-destructive text-destructive shadow-lg backdrop-blur-md',
  info: 'bg-card border-owtlet-ink text-owtlet-ink shadow-lg',
  warning: 'bg-warning/20 border-warning text-warning-foreground shadow-lg',
};

export function Toaster() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border font-body text-sm transition-all duration-200 animate-in fade-in slide-in-from-bottom-2 ${
            styleMap[toast.type]
          }`}
        >
          {iconMap[toast.type]}
          <div className="flex-1 font-medium leading-snug">{toast.message}</div>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            aria-label="Close notification"
            className="p-1 rounded-md opacity-70 hover:opacity-100 transition-opacity active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

