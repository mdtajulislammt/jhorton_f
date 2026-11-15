import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, helperText, id, ...props }, ref) => {
    const inputId = id || (props.name ? `input-${props.name}` : undefined);
    const helperId = helperText && inputId ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full">
        <input
          id={inputId}
          type={type}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={helperId}
          className={cn(
            'flex h-10 sm:h-11 w-full rounded-lg border bg-white dark:bg-card px-3.5 py-2 text-sm text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error
              ? 'border-danger focus-visible:ring-danger text-foreground'
              : 'border-border hover:border-owtlet-ink/40 dark:hover:border-owtlet-sage/40 focus-visible:ring-ring',
            className
          )}
          {...props}
        />
        {helperText && (
          <p
            id={helperId}
            className={cn(
              'mt-1.5 text-xs font-medium',
              error ? 'text-danger' : 'text-muted-foreground'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
