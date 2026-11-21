'use client';

import * as React from 'react';
import { Clock, Flame, AlertTriangle } from 'lucide-react';
import { CartHoldMetadata } from '@/types/api.generated';
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
      if (!hold?.expiresAt) return 0;
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
        className={`dark flex items-center justify-between gap-3 rounded-2xl bg-background px-4 py-3 text-foreground ${className}`}
        role="status"
        aria-label="Live show cart hold"
      >
        <div className="flex items-center gap-2">
          <Badge variant="live" className="animate-live-ring px-2 py-0.5 text-xs font-bold">
            <Flame className="mr-1 h-3.5 w-3.5" />
            LIVE SHOW HOLD
          </Badge>
          <span className="text-xs sm:text-sm font-medium text-muted-foreground">
            Held until 30 min after show ends
          </span>
        </div>
        {hold.showTitle && (
          <span className="hidden sm:inline-block text-xs font-semibold text-primary truncate max-w-[150px]">
            {hold.showTitle}
          </span>
        )}
      </div>
    );
  }

  const isUrgent = timeLeft !== null && timeLeft < 300; // < 5 minutes

  return (
    <div
      className={`flex items-center justify-between rounded-2xl px-4 py-3 transition-colors ${
        isUrgent ? 'bg-danger/10 text-danger' : 'bg-strain-hybrid-tint text-foreground'
      } ${className}`}
      role="timer"
      aria-label="Cart expiration countdown"
    >
      <div className="flex items-center gap-2">
        {isUrgent ? (
          <AlertTriangle className="h-4 w-4 text-danger motion-safe:animate-bounce" />
        ) : (
          <Clock className="h-4 w-4 text-foreground" />
        )}
        <span className="text-xs sm:text-sm font-medium">
          {isLiveShow
            ? 'Live show hold expires in:'
            : 'Cart held for inactivity:'}
        </span>
      </div>

      <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base font-bold tabular-nums">
        <span>{timeLeft !== null ? formatTimer(timeLeft) : '--:--'}</span>
      </div>
    </div>
  );
}
