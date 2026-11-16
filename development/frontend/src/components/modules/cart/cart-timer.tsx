'use client';

import * as React from 'react';
import { Clock, Flame, AlertTriangle } from 'lucide-react';
import { CartHoldMetadata } from '@/server/cart/types';
import { Badge } from '@/components/ui/badge';

interface CartTimerProps {
  hold?: CartHoldMetadata | null;
  onExpired?: () => void;
  className?: string;
}

export function CartTimer({ hold, onExpired, className = '' }: CartTimerProps) {
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!hold?.expiresAt) {
      setTimeLeft(null);
      return;
    }

    const calculateRemaining = () => {
      const expires = new Date(hold.expiresAt).getTime();
      const diff = Math.max(0, expires - Date.now());
      return Math.floor(diff / 1000);
    };

    setTimeLeft(calculateRemaining());

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpired) {
          onExpired();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hold?.expiresAt, onExpired]);

  if (!hold) return null;

  const isLiveShow = hold.reason === 'LIVE_SHOW';
  const isShowCurrentlyLive = isLiveShow && hold.showStatus === 'LIVE';

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isShowCurrentlyLive) {
    return (
      <div
        className={`flex items-center justify-between rounded-lg bg-owtlet-ink/90 border border-owtlet-mint/30 px-3.5 py-2.5 text-white ${className}`}
        role="status"
        aria-label="Live show cart hold"
      >
        <div className="flex items-center gap-2">
          <Badge variant="live" className="animate-pulse px-2 py-0.5 text-xs font-bold">
            <Flame className="mr-1 h-3.5 w-3.5" />
            LIVE SHOW HOLD
          </Badge>
          <span className="text-xs sm:text-sm font-medium text-owtlet-sage">
            Held until 30 min after show ends
          </span>
        </div>
        {hold.showTitle && (
          <span className="hidden sm:inline-block text-xs font-semibold text-owtlet-mint truncate max-w-[150px]">
            {hold.showTitle}
          </span>
        )}
      </div>
    );
  }

  const isUrgent = timeLeft !== null && timeLeft < 300; // < 5 minutes

  return (
    <div
      className={`flex items-center justify-between rounded-lg px-3.5 py-2.5 border transition-colors ${
        isUrgent
          ? 'bg-destructive/10 border-destructive/40 text-destructive'
          : 'bg-owtlet-mint/10 border-owtlet-mint/30 text-foreground'
      } ${className}`}
      role="timer"
      aria-label="Cart expiration countdown"
    >
      <div className="flex items-center gap-2">
        {isUrgent ? (
          <AlertTriangle className="h-4 w-4 animate-bounce text-destructive" />
        ) : (
          <Clock className="h-4 w-4 text-owtlet-ink" />
        )}
        <span className="text-xs sm:text-sm font-medium">
          {isLiveShow
            ? 'Live show hold expires in:'
            : 'Cart held for inactivity:'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold">
        <span>{timeLeft !== null ? formatTimer(timeLeft) : '--:--'}</span>
      </div>
    </div>
  );
}
