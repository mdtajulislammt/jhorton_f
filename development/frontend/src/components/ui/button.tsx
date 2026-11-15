import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'accent';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-150 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none';

    const variantStyles = {
      // Mint bg, Ink text, Volt hover (Owtlet signature button)
      default:
        'bg-primary text-primary-foreground shadow-sm hover:bg-primary-hover active:bg-[#c9e846]',
      // Sage bg, Ink text
      secondary:
        'bg-secondary text-secondary-foreground shadow-sm hover:bg-[#a9c9c2] active:bg-[#97b8b1]',
      // Danger / Destructive
      destructive:
        'bg-danger text-white shadow-sm hover:bg-danger/90 active:bg-danger/80',
      // Subtle border
      outline:
        'border border-border bg-transparent text-foreground shadow-sm hover:bg-secondary/40 active:bg-secondary/60',
      // Ghost
      ghost:
        'hover:bg-secondary/30 hover:text-foreground active:bg-secondary/50',
      // Link
      link:
        'text-ink dark:text-primary underline-offset-4 hover:underline !p-0 !h-auto',
      // Owtlet Ember accent
      accent:
        'bg-accent text-accent-foreground shadow-sm hover:bg-accent/90 active:bg-accent/80',
    };

    const sizeStyles = {
      default: 'h-10 px-5 py-2 text-sm',
      sm: 'h-8 px-3.5 text-xs',
      lg: 'h-11 px-8 text-base min-h-[44px]',
      icon: 'h-10 w-10 min-h-[40px] min-w-[40px] p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
